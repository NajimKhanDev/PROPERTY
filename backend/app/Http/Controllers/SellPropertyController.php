<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\SellProperty;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage; 

class SellPropertyController extends Controller
{
    // List sales
    public function index(Request $request)
    {
        // Fetch data
        $query = SellProperty::with(['property', 'buyer:id,name,phone', 'transactions'])
                             ->where('is_deleted', 0)
                             ->latest('sale_date');

        // Apply search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('buyer', function($subQ) use ($search) {
                    $subQ->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('property', function($subQ) use ($search) {
                    $subQ->where('title', 'like', "%{$search}%");
                })
                ->orWhere('invoice_no', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(10));
    }

    // Create sale
    public function store(Request $request)
    {
        // Validate input
        $request->validate([
            'property_id'    => 'required|exists:properties,id',
            'customer_id'    => 'required|exists:customers,id',
            'sale_rate'      => 'required|numeric|min:1',
            'gst_percentage' => 'nullable|integer|min:0',
            'paid_amount'    => 'nullable|numeric|min:0',
            'document'       => 'nullable|file|mimes:pdf,jpg,png|max:5120'
        ]);

        DB::beginTransaction();
        try {
            // Check availability
            $property = Property::findOrFail($request->property_id);
            if ($property->status === 'SOLD') {
                return response()->json(['message' => 'Property already sold'], 400);
            }

            // Upload file
            $docPath = null;
            if ($request->hasFile('document')) {
                $docPath = $request->file('document')->store('sale_docs', 'public');
            }

            // Calculate financials
            $quantity   = $property->quantity ?? 1;
            $baseAmount = $request->sale_rate * $quantity;
            $gstPercent = $request->gst_percentage ?? 0;
            $gstAmount  = ($baseAmount * $gstPercent) / 100;
            $other      = $request->other_charges ?? 0;
            $discount   = $request->discount ?? 0;

            $totalVal   = ($baseAmount + $gstAmount + $other) - $discount;
            $paid       = $request->paid_amount ?? 0;
            $pending    = $totalVal - $paid;

            // Create record
            $sale = SellProperty::create([
                'property_id'       => $property->id,
                'customer_id'       => $request->customer_id,
                'sale_date'         => $request->sale_date ?? now(),
                'invoice_no'        => $request->invoice_no ?? 'INV-' . time(),
                'sale_rate'         => $request->sale_rate,
                'sale_base_amount'  => $baseAmount,
                'gst_percentage'    => $gstPercent,
                'gst_amount'        => $gstAmount,
                'other_charges'     => $other,
                'discount_amount'   => $discount,
                'total_sale_amount' => $totalVal,
                'received_amount'   => $paid,
                'pending_amount'    => $pending,
                'document_file'     => $docPath,
                'remarks'           => $request->remarks,
                'is_deleted'        => 0
            ]);

            // Update inventory
            $status = ($pending <= 0) ? 'SOLD' : 'BOOKED';
            $property->update([
                'status'   => $status,
                'buyer_id' => $request->customer_id
            ]);

            // Record income
            if ($paid > 0) {
                Transaction::create([
                    'property_id'      => $property->id,
                    'sell_property_id' => $sale->id, // LINK TO THIS DEAL
                    'type'             => 'CREDIT',  // Money in
                    'amount'           => $paid,
                    'payment_date'     => $request->sale_date ?? now(),
                    'payment_mode'     => $request->payment_mode ?? 'CASH',
                    'reference_no'     => $request->reference_no ?? 'TXN-' . rand(100,999),
                    'remarks'          => 'Initial sale payment',
                    'is_deleted'       => 0
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Sale created successfully', 'data' => $sale]);

        } catch (\Exception $e) {
            DB::rollBack();
            if (isset($docPath)) Storage::disk('public')->delete($docPath);
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // Show details
    public function show($id)
    {
        $sale = SellProperty::with(['property', 'buyer', 'transactions'])
                            ->where('id', $id)
                            ->where('is_deleted', 0)
                            ->firstOrFail();

        // Append url
        if ($sale->document_file) {
            $sale->document_url = Storage::url($sale->document_file);
        }

        return response()->json($sale);
    }

    // Update sale
    public function update(Request $request, $id)
    {
        $sale = SellProperty::with('property')->where('id', $id)->where('is_deleted', 0)->firstOrFail();

        // Validate input
        $request->validate([
            'customer_id'    => 'required|exists:customers,id',
            'sale_rate'      => 'required|numeric|min:1',
            'gst_percentage' => 'nullable|integer|min:0',
            'document'       => 'nullable|file|mimes:pdf,jpg,png|max:5120'
        ]);

        DB::beginTransaction();
        try {
            $quantity = $sale->property->quantity ?? 1;

            // Recalculate financials
            $baseAmount = $request->sale_rate * $quantity;
            $gstPercent = $request->gst_percentage ?? 0;
            $gstAmount  = ($baseAmount * $gstPercent) / 100;
            $other      = $request->other_charges ?? 0;
            $discount   = $request->discount ?? 0;

            $newTotal   = ($baseAmount + $gstAmount + $other) - $discount;
            $newPending = $newTotal - $sale->received_amount;

            // Update file
            $docPath = $sale->document_file;
            if ($request->hasFile('document')) {
                if ($sale->document_file) Storage::disk('public')->delete($sale->document_file);
                $docPath = $request->file('document')->store('sale_docs', 'public');
            }

            // Update record
            $sale->update([
                'customer_id'       => $request->customer_id,
                'sale_date'         => $request->sale_date ?? $sale->sale_date,
                'invoice_no'        => $request->invoice_no ?? $sale->invoice_no,
                'sale_rate'         => $request->sale_rate,
                'sale_base_amount'  => $baseAmount,
                'gst_percentage'    => $gstPercent,
                'gst_amount'        => $gstAmount,
                'other_charges'     => $other,
                'discount_amount'   => $discount,
                'total_sale_amount' => $newTotal,
                'pending_amount'    => $newPending,
                'document_file'     => $docPath,
                'remarks'           => $request->remarks ?? $sale->remarks
            ]);

            // Update status
            $status = ($newPending <= 0) ? 'SOLD' : 'BOOKED';
            $sale->property()->update(['status' => $status, 'buyer_id' => $request->customer_id]);

            DB::commit();
            return response()->json(['message' => 'Sale updated successfully', 'data' => $sale]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // Delete sale
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $sale = SellProperty::findOrFail($id);

            // Soft delete
            $sale->update(['is_deleted' => 1]);

            // Revert inventory
            $sale->property()->update([
                'status'   => 'AVAILABLE',
                'buyer_id' => null
            ]);

            // Remove transactions
            // Strict check: only transactions linked to THIS sale deal
            Transaction::where('sell_property_id', $sale->id)
                       ->update(['is_deleted' => 1]);

            DB::commit();
            return response()->json(['message' => 'Sale cancelled successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}