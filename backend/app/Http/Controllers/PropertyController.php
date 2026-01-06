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
    // List properties
    public function index(Request $request)
    {
        // Eager load relationships
        $query = Property::with(['seller:id,name,phone', 'buyer:id,name,phone'])
                         ->where('is_deleted', 0)
                         ->latest('date');

        // Filter by Transaction Type
        if ($request->filled('type')) {
            $query->where('transaction_type', $request->type);
        }

        // Global Search
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

    // Create property (Inventory/Direct Entry)
    public function store(Request $request)
    {
        $request->validate([
            'transaction_type' => 'required|in:PURCHASE,SELL',
            'seller_id'        => 'required_if:transaction_type,PURCHASE|nullable|exists:customers,id',
            'buyer_id'         => 'required_if:transaction_type,SELL|nullable|exists:customers,id',
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
            // Financial Calculations
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

            // 1. Create Property
            $property = Property::create([
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
                'other_expenses'   => $other,
                'total_amount'     => $total,
                'paid_amount'      => $paid,
                'due_amount'       => $due,
                'status'           => ($request->transaction_type == 'SELL' && $due <= 0) ? 'SOLD' : 'AVAILABLE',
                'is_deleted'       => 0
            ]);

            // 2. Create Initial Transaction (UPDATED LOGIC)
            if ($paid > 0) {
                // Determine Type: 
                // PURCHASE = DEBIT (Expense/Cost)
                // SELL = CREDIT (Income)
                $txnType = ($request->transaction_type === 'SELL') ? 'CREDIT' : 'DEBIT';

                Transaction::create([
                    'property_id'      => $property->id,
                    'sell_property_id' => null, // IMP: Direct entry has no Deal ID
                    'type'             => $txnType,
                    'amount'           => $paid,
                    'payment_date'     => $request->input('payment_date', $date),
                    'payment_mode'     => $request->input('payment_mode', 'CASH'),
                    'reference_no'     => $request->invoice_no ?? 'TXN-' . time(),
                    'remarks'          => 'Initial entry payment',
                    'is_deleted'       => 0
                ]);
            }

            // 3. Upload Documents
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

            DB::commit();
            return response()->json([
                'message' => 'Property created successfully',
                'data'    => $property->load(['seller', 'buyer', 'documents'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // Show Property
    public function show($id)
    {
        $property = Property::with(['documents', 'seller', 'buyer'])
                            ->where('id', $id)
                            ->where('is_deleted', 0)
                            ->firstOrFail();

        return response()->json($property);
    }

    // Update Property (Only details, not payments)
    public function update(Request $request, $id)
    {
        $property = Property::where('id', $id)->where('is_deleted', 0)->firstOrFail();

        $request->validate([
             'customer_id' => 'nullable|exists:customers,id',
             'documents'   => 'nullable|array'
        ]);

        DB::beginTransaction();
        try {
            // Update Parties
            if ($request->filled('customer_id')) {
                if ($property->transaction_type === 'PURCHASE') {
                    $property->seller_id = $request->customer_id;
                    $property->buyer_id = null;
                } else {
                    $property->buyer_id = $request->customer_id;
                    $property->seller_id = null;
                }
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

            // Update Data
            $data = $request->except(['_token', 'documents', 'paid_amount', 'customer_id']);
            $data['base_amount']  = $baseAmount;
            $data['gst_amount']   = $gstAmount;
            $data['total_amount'] = $total;
            $data['due_amount']   = $due;

            $property->update($data);

            // Upload New Docs
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

            DB::commit();
            return response()->json(['message' => 'Updated successfully', 'data' => $property->load(['seller', 'buyer'])]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // Soft Delete
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $property = Property::findOrFail($id);
            
            // Delete Property
            $property->update(['is_deleted' => 1]);
            
            // Delete Transactions (Cascading Soft Delete)
            Transaction::where('property_id', $property->id)
                       ->update(['is_deleted' => 1]);

            DB::commit();
            return response()->json(['message' => 'Moved to trash']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // Trash List
    public function trash()
    {
        $properties = Property::where('is_deleted', 1)->latest()->paginate(10);
        return response()->json($properties);
    }

    // Restore
    public function restore($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_deleted' => 0]);
        
        Transaction::where('property_id', $property->id)
                   ->update(['is_deleted' => 0]);

        return response()->json(['message' => 'Restored successfully']);
    }

    // Permanent Delete
    public function forceDelete($id)
    {
        $property = Property::findOrFail($id);
        $property->delete(); 
        return response()->json(['message' => 'Permanently deleted']);
    }
}