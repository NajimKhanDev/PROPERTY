<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Transaction; // Zaroori hai
use App\Models\Document;    // Zaroori hai
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // Transaction safety ke liye
use Illuminate\Support\Facades\Storage;

class PropertyController extends Controller
{
    // GET: List all active properties
    public function index(Request $request)
    {
        $query = Property::where('is_deleted', 0)->latest('date');

        if ($request->filled('type')) {
            $query->where('transaction_type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('party_name', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('invoice_no', 'like', "%{$search}%");
            });
        }

        $properties = $query->paginate(10);
        return response()->json($properties);
    }

    // POST: Create Property + Initial Transaction + Documents
    public function store(Request $request)
    {
        // 1. Validation
        $validated = $request->validate([
            'transaction_type' => 'required|in:PURCHASE,SELL',
            'party_name'       => 'required|string|max:255',
            'title'            => 'required|string|max:255',
            'category'         => 'required|in:LAND,FLAT,HOUSE,COMMERCIAL,AGRICULTURE',
            'quantity'         => 'required|integer|min:1',
            'rate'             => 'required|numeric|min:0',
            
            // Payment Info
            'paid_amount'      => 'nullable|numeric|min:0',
            'payment_mode'     => 'nullable|string', // CASH, CHEQUE, ONLINE
            'payment_date'     => 'nullable|date',

            // Documents
            'documents'        => 'nullable|array',
            'documents.*'      => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:10240'
        ]);

        // Transaction Start 
        DB::beginTransaction();

        try {
            // --- A. Calculations ---
            $quantity      = $request->input('quantity', 1);
            $rate          = $request->input('rate', 0);
            $baseAmount    = $quantity * $rate;
            
            $gstPercent    = $request->input('gst_percentage', 0);
            $gstAmount     = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;
            
            $otherExpenses = $request->input('other_expenses', 0);
            $totalAmount   = $baseAmount + $gstAmount + $otherExpenses;
            
            $paidAmount    = $request->input('paid_amount', 0);
            $dueAmount     = $totalAmount - $paidAmount;

            // Date Selection
            $date = $request->filled('date') ? $request->date : now();

            // --- B. Create Property ---
            $data = $request->except(['_token', 'documents', 'payment_mode', 'payment_date']); 
            $data['date']         = $date;
            $data['base_amount']  = $baseAmount;
            $data['gst_amount']   = $gstAmount;
            $data['total_amount'] = $totalAmount;
            $data['paid_amount']  = $paidAmount;
            $data['due_amount']   = $dueAmount;
            $data['is_deleted']   = 0;

            $property = Property::create($data);

            // --- C. Create Initial Transaction (Logic Added Here) --- 
            
            if ($paidAmount > 0) {
                Transaction::create([
                    'property_id'  => $property->id,
                    'amount'       => $paidAmount,
                    'payment_date' => $request->input('payment_date', $date),
                    'payment_mode' => $request->input('payment_mode', 'CASH'), // Default Cash
                    'reference_no' => $request->input('invoice_no'),  
                    'remarks'      => 'Initial Booking / Down Payment',
                    'is_deleted'   => 0
                ]);
            }

            // --- D. Upload Documents ---
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
                    $filePath = $file->storeAs('documents', $filename, 'public');

                    Document::create([
                        'property_id' => $property->id,
                        'doc_name'    => $file->getClientOriginalName(),
                        'doc_file'    => $filePath,
                        'is_deleted'  => 0
                    ]);
                }
            }

            // Sab sahi hai to Save karo
            DB::commit();

            return response()->json([
                'message' => 'Property created successfully with transaction.', 
                'data' => $property->load(['documents']) // Response me docs bhi dikhega
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // GET: Show single property
    public function show($id)
    {
        $property = Property::with('documents')
                    ->where('id', $id)
                    ->where('is_deleted', 0)
                    ->firstOrFail();

        return response()->json($property);
    }

    // PUT/PATCH: Update property
    public function update(Request $request, $id)
    {
        $property = Property::where('id', $id)->where('is_deleted', 0)->firstOrFail();

        // Note: Update me hum direct paid_amount update nahi karte, 
        // uske liye naya transaction add karna chahiye via TransactionController.
        // Lekin agar aapko basic details update karni hain:

        $request->validate([
             'documents'   => 'nullable|array',
             'documents.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:10240'
        ]);

        DB::beginTransaction();

        try {
            // Calculations for update
            $quantity      = $request->input('quantity', $property->quantity);
            $rate          = $request->input('rate', $property->rate);
            $baseAmount    = $quantity * $rate;

            $gstPercent    = $request->input('gst_percentage', $property->gst_percentage ?? 0);
            $gstAmount     = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;

            $otherExpenses = $request->input('other_expenses', $property->other_expenses ?? 0);
            $totalAmount   = $baseAmount + $gstAmount + $otherExpenses;

            // Paid amount purana hi rahega, wo transactions se manage hoga
            $paidAmount    = $property->paid_amount; 
            $dueAmount     = $totalAmount - $paidAmount;

            // Update Data
            $data = $request->except(['_token', 'documents', 'paid_amount']); // paid_amount ignore kiya
            $data['base_amount']  = $baseAmount;
            $data['gst_amount']   = $gstAmount;
            $data['total_amount'] = $totalAmount;
            $data['due_amount']   = $dueAmount;

            $property->update($data);

            // Add NEW Documents in Update
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
                    $filePath = $file->storeAs('documents', $filename, 'public');

                    Document::create([
                        'property_id' => $property->id,
                        'doc_name'    => $file->getClientOriginalName(),
                        'doc_file'    => $filePath,
                        'is_deleted'  => 0
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Updated successfully', 'data' => $property->load('documents')]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

  // DELETE: Soft Delete (Trash)
    public function destroy($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_deleted' => 1]);

        return response()->json(['message' => 'Moved to trash']);
    }

    // GET: View Trash
    public function trash()
    {
        $properties = Property::where('is_deleted', 1)->latest()->paginate(10);
        return response()->json($properties);
    }

    // PATCH: Restore
    public function restore($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_deleted' => 0]);

        return response()->json(['message' => 'Restored successfully']);
    }

    // DELETE: Force Delete
    public function forceDelete($id)
    {
        $property = Property::findOrFail($id);
        $property->delete(); 

        return response()->json(['message' => 'Permanently deleted']);
    }
}