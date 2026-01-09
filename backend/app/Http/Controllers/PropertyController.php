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
    // List properties with filters
    public function index(Request $request)
    {
        // 1. Base Query
        $query = Property::with(['seller:id,name,phone', 'buyer:id,name,phone'])
                         ->where('is_deleted', 0);

        // 2. Filter: Transaction Type
        if ($request->filled('transaction_type')) {
            $query->where('transaction_type', $request->transaction_type);
        }

        // 3. Filter: Status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // 4. Filter: Category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // 5. Filter: Date Range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        // 6. Global Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('invoice_no', 'like', "%{$search}%")
                  ->orWhereHas('seller', fn($s) => $s->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('buyer', fn($b) => $b->where('name', 'like', "%{$search}%"));
            });
        }

        // 7. Sort and Paginate
        $query->orderBy($request->input('sort_by', 'date'), $request->input('sort_order', 'desc'));
        
        return response()->json($query->paginate($request->input('per_page', 10)));
    }

    // Create Inventory (PURCHASE ONLY)
    public function store(Request $request)
    {
        // Validate Purchase Input
        $request->validate([
            'transaction_type' => 'required|in:PURCHASE', // Strict: Purchase only
            'seller_id'        => 'required|exists:customers,id', // Vendor required
            'title'            => 'required|string|max:255',
            'category'         => 'required|in:LAND,FLAT,HOUSE,COMMERCIAL,AGRICULTURE',
            'quantity'         => 'required|integer|min:1',
            'rate'             => 'required|numeric|min:0',
            'invoice_no'       => 'nullable|string|max:50',
            'paid_amount'      => 'nullable|numeric|min:0',
            'documents'        => 'nullable|array',
            'documents.*'      => 'file|mimes:jpg,jpeg,png,pdf|max:10240'
        ]);

        DB::beginTransaction();

        try {
            // Calculate Financials
            $quantity   = $request->input('quantity', 1);
            $rate       = $request->input('rate', 0);
            $baseAmount = $quantity * $rate;
            
            $gstPercent = $request->input('gst_percentage', 0);
            $gstAmount  = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;
            
            $other      = $request->input('other_expenses', 0);
            $total      = $baseAmount + $gstAmount + $other;
            
            $paid       = $request->input('paid_amount', 0);
            $due        = $total - $paid;
            $date       = $request->filled('date') ? $request->date : now();

            // 1. Create Property (Inventory)
            $property = Property::create([
                'seller_id'        => $request->seller_id, 
                'buyer_id'         => null, // No buyer yet
                'transaction_type' => 'PURCHASE', // Always Purchase
                'title'            => $request->title,
                'category'         => $request->category,
                'date'             => $date,
                'invoice_no'       => $request->invoice_no,
                'quantity'         => $quantity,
                'rate'             => $rate,
                'base_amount'      => $baseAmount,
                'gst_percentage'   => $gstPercent,
                'gst_amount'       => $gstAmount,
                'other_expenses'   => $other,
                'total_amount'     => $total,
                'paid_amount'      => $paid,
                'due_amount'       => $due,
                'status'           => 'AVAILABLE', // Always Available initially
                'is_deleted'       => 0
            ]);

            // 2. Create Debit Transaction (Expense)
            if ($paid > 0) {
                Transaction::create([
                    'property_id'      => $property->id,
                    'sell_property_id' => null, 
                    'type'             => 'DEBIT', // Money Out
                    'amount'           => $paid,
                    'payment_date'     => $request->input('payment_date', $date),
                    'payment_mode'     => $request->input('payment_mode', 'CASH'),
                    'reference_no'     => $request->invoice_no ?? 'TXN-' . time(),
                    'remarks'          => 'Initial purchase payment',
                    'is_deleted'       => 0
                ]);
            }

            // 3. Upload Documents
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                    $filePath = $file->storeAs("uploads/properties/{$property->id}", $filename, 'public');

                    PropertyDocument::create([
                        'property_id' => $property->id,
                        'doc_name'    => $file->getClientOriginalName(),
                        'doc_file'    => $filePath,
                        'is_deleted'  => 0
                    ]);
                }
            }

            DB::commit();
            return response()->json([
                'message' => 'Inventory created successfully',
                'data'    => $property->load(['seller', 'documents'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // Show Property Details
    public function show($id)
    {
        $property = Property::with(['documents', 'seller', 'buyer'])
                            ->where('id', $id)
                            ->where('is_deleted', 0)
                            ->firstOrFail();

        return response()->json($property);
    }

    // Update Property Details
    public function update(Request $request, $id)
    {
        $property = Property::where('id', $id)->where('is_deleted', 0)->firstOrFail();

        // Validate Update
        $request->validate([
             'seller_id' => 'nullable|exists:customers,id', // Only update seller
             'documents' => 'nullable|array'
        ]);

        DB::beginTransaction();
        try {
            // Update Vendor if needed
            if ($request->filled('seller_id')) {
                $property->seller_id = $request->seller_id;
            }

            // Recalculate Financials
            $quantity   = $request->input('quantity', $property->quantity);
            $rate       = $request->input('rate', $property->rate);
            $baseAmount = $quantity * $rate;

            $gstPercent = $request->input('gst_percentage', $property->gst_percentage ?? 0);
            $gstAmount  = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;
            $other      = $request->input('other_expenses', $property->other_expenses ?? 0);
            $total      = $baseAmount + $gstAmount + $other;

            $paid       = $property->paid_amount; 
            $due        = $total - $paid;

            // Update Fields
            $data = $request->except(['_token', 'documents', 'paid_amount', 'buyer_id']);
            $data['base_amount']  = $baseAmount;
            $data['gst_amount']   = $gstAmount;
            $data['total_amount'] = $total;
            $data['due_amount']   = $due;

            $property->update($data);

            // Upload New Documents
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                    $filePath = $file->storeAs("uploads/properties/{$property->id}", $filename, 'public');

                    PropertyDocument::create([
                        'property_id' => $property->id,
                        'doc_name'    => $file->getClientOriginalName(),
                        'doc_file'    => $filePath,
                        'is_deleted'  => 0
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Updated successfully', 'data' => $property->load('seller')]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // Soft Delete Property
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $property = Property::findOrFail($id);
            
            // Cannot delete if Sold
            if($property->status === 'SOLD' || $property->status === 'BOOKED') {
                 return response()->json(['message' => 'Cannot delete sold property'], 400);
            }

            $property->update(['is_deleted' => 1]);
            
            // Delete related transactions
            Transaction::where('property_id', $property->id)->update(['is_deleted' => 1]);

            DB::commit();
            return response()->json(['message' => 'Moved to trash']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // View Trash
    public function trash()
    {
        $properties = Property::where('is_deleted', 1)->latest()->paginate(10);
        return response()->json($properties);
    }

    // Restore Property
    public function restore($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_deleted' => 0]);
        
        Transaction::where('property_id', $property->id)->update(['is_deleted' => 0]);

        return response()->json(['message' => 'Restored successfully']);
    }

    // Force Delete
    public function forceDelete($id)
    {
        $property = Property::findOrFail($id);
        $property->delete(); 
        return response()->json(['message' => 'Permanently deleted']);
    }
}