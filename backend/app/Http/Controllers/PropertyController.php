<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Transaction;
use App\Models\PropertyDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PropertyController extends Controller
{
    /**
     * GET: List all properties with pagination and filters.
     * Loads Seller or Buyer details based on relationship.
     */
    public function index(Request $request)
    {
        // Step 1: Eager Load relationships to avoid N+1 query problem.
        // We fetch only id, name, and phone to keep the query light.
        $query = Property::with(['seller:id,name,phone', 'buyer:id,name,phone'])
                         ->where('is_deleted', 0)
                         ->latest('date');

        // Step 2: Filter by Transaction Type (PURCHASE or SELL)
        if ($request->filled('type')) {
            $query->where('transaction_type', $request->type);
        }

        // Step 3: Global Search Logic
        // Searches in Property Title, Invoice No, Seller Name, OR Buyer Name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('seller', function($subQ) use ($search){
                    $subQ->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('buyer', function($subQ) use ($search){
                    $subQ->where('name', 'like', "%{$search}%");
                })
                ->orWhere('title', 'like', "%{$search}%")
                ->orWhere('invoice_no', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(10));
    }

    /**
     * POST: Create a new Property Deal.
     * Automatically assigns Seller/Buyer ID and creates the first transaction.
     */
  public function store(Request $request)
    {
        // 1. Validate Inputs
        $validated = $request->validate([
            'transaction_type' => 'required|in:PURCHASE,SELL',
            
            // Conditional Validation: Purchase hai to Seller chahiye, Sell hai to Buyer
            'seller_id'        => 'required_if:transaction_type,PURCHASE|nullable|exists:customers,id',
            'buyer_id'         => 'required_if:transaction_type,SELL|nullable|exists:customers,id',

            'title'            => 'required|string|max:255',
            'category'         => 'required|in:LAND,FLAT,HOUSE,COMMERCIAL,AGRICULTURE',
            'quantity'         => 'required|integer|min:1',
            'rate'             => 'required|numeric|min:0',
            
            // Optional Fields
            'invoice_no'       => 'nullable|string|max:50',
            'paid_amount'      => 'nullable|numeric|min:0',
            'payment_mode'     => 'nullable|string',
            'payment_date'     => 'nullable|date',
            'documents'        => 'nullable|array',
            'documents.*'      => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:10240'
        ]);

        DB::beginTransaction(); // Start Transaction

        try {
            // 2. Calculate Financials
            $quantity      = $request->input('quantity', 1);
            $rate          = $request->input('rate', 0);
            $baseAmount    = $quantity * $rate;
            
            $gstPercent    = $request->input('gst_percentage', 0);
            $gstAmount     = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;
            
            $otherExpenses = $request->input('other_expenses', 0);
            $totalAmount   = $baseAmount + $gstAmount + $otherExpenses;
            
            $paidAmount    = $request->input('paid_amount', 0);
            $dueAmount     = $totalAmount - $paidAmount;

            $date = $request->filled('date') ? $request->date : now();

            // 3. Create Property
            $property = Property::create([
                // Direct Assignment (Jo request me aaya wahi jayega)
                'seller_id'        => $request->seller_id, 
                'buyer_id'         => $request->buyer_id,
                
                'transaction_type' => $request->transaction_type,
                'title'            => $request->title,
                'category'         => $request->category,
                'date'             => $date,
                'invoice_no'       => $request->invoice_no,
                'quantity'         => $quantity,
                'rate'             => $rate,
                'base_amount'      => $baseAmount,
                'gst_percentage'   => $gstPercent,
                'gst_amount'       => $gstAmount,
                'other_expenses'   => $otherExpenses,
                'total_amount'     => $totalAmount,
                'paid_amount'      => $paidAmount,
                'due_amount'       => $dueAmount,
                'is_deleted'       => 0
            ]);

            // 4. Initial Payment
            if ($paidAmount > 0) {
                Transaction::create([
                    'property_id'  => $property->id,
                    'amount'       => $paidAmount,
                    'payment_date' => $request->input('payment_date', $date),
                    'payment_mode' => $request->input('payment_mode', 'CASH'),
                    'reference_no' => $request->invoice_no,
                    'remarks'      => 'Initial Booking/Payment',
                    'is_deleted'   => 0
                ]);
            }

            // 5. Upload Documents
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                    $filePath = $file->storeAs('documents', $filename, 'public');

                    PropertyDocument::create([
                        'property_id' => $property->id,
                        'doc_name'    => $file->getClientOriginalName(),
                        'doc_file'    => $filePath,
                        'is_deleted'  => 0
                    ]);
                }
            }

            DB::commit(); // Save All

            return response()->json([
                'message' => 'Property created successfully.',
                'data'    => $property->load(['seller', 'buyer', 'documents'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack(); // Revert Changes
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET: Show single property details.
     */
    public function show($id)
    {
        $property = Property::with(['documents', 'seller', 'buyer'])
                    ->where('id', $id)
                    ->where('is_deleted', 0)
                    ->firstOrFail();

        return response()->json($property);
    }

    /**
     * PUT: Update Property Details.
     * Handles ID swapping if transaction type or customer changes.
     */
    public function update(Request $request, $id)
    {
        $property = Property::where('id', $id)->where('is_deleted', 0)->firstOrFail();

        $request->validate([
             'customer_id' => 'nullable|exists:customers,id',
             'documents'   => 'nullable|array'
        ]);

        DB::beginTransaction();

        try {
            // Step 1: Update Party Logic (If customer is changed)
            if ($request->filled('customer_id')) {
                if ($property->transaction_type === 'PURCHASE') {
                    $property->seller_id = $request->customer_id;
                    $property->buyer_id = null;
                } else {
                    $property->buyer_id = $request->customer_id;
                    $property->seller_id = null;
                }
            }

            // Step 2: Recalculate Financials
            $quantity      = $request->input('quantity', $property->quantity);
            $rate          = $request->input('rate', $property->rate);
            $baseAmount    = $quantity * $rate;

            $gstPercent    = $request->input('gst_percentage', $property->gst_percentage ?? 0);
            $gstAmount     = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;

            $otherExpenses = $request->input('other_expenses', $property->other_expenses ?? 0);
            $totalAmount   = $baseAmount + $gstAmount + $otherExpenses;

            // Maintain existing paid amount logic (Updates happen via Transaction Controller)
            $paidAmount    = $property->paid_amount; 
            $dueAmount     = $totalAmount - $paidAmount;

            // Step 3: Update Record
            $data = $request->except(['_token', 'documents', 'paid_amount', 'customer_id']);
            $data['base_amount']  = $baseAmount;
            $data['gst_amount']   = $gstAmount;
            $data['total_amount'] = $totalAmount;
            $data['due_amount']   = $dueAmount;

            $property->update($data);

            // Step 4: Add New Documents (Append mode)
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
                    $filePath = $file->storeAs('documents', $filename, 'public');

                    PropertyDocument::create([
                        'property_id' => $property->id,
                        'doc_name'    => $file->getClientOriginalName(),
                        'doc_file'    => $filePath,
                        'is_deleted'  => 0
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Updated successfully', 'data' => $property->load(['seller', 'buyer', 'documents'])]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // Standard Delete/Trash/Restore methods remain same...
    public function destroy($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_deleted' => 1]);
        return response()->json(['message' => 'Moved to trash']);
    }

    public function trash()
    {
        $properties = Property::where('is_deleted', 1)->latest()->paginate(10);
        return response()->json($properties);
    }

    public function restore($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_deleted' => 0]);
        return response()->json(['message' => 'Restored successfully']);
    }

    public function forceDelete($id)
    {
        $property = Property::findOrFail($id);
        $property->delete(); 
        return response()->json(['message' => 'Permanently deleted']);
    }
}