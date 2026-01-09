<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\SellProperty;
use App\Models\Transaction;
use App\Models\PropertyDocument; // Import Document Model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage; 

class SellPropertyController extends Controller
{
    // List sales
    public function index(Request $request)
    {
        $query = SellProperty::with(['property', 'buyer:id,name,phone', 'transactions'])
                             ->where('is_deleted', 0)
                             ->latest('sale_date');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('buyer', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('property', fn($sq) => $sq->where('title', 'like', "%{$search}%"))
                  ->orWhere('invoice_no', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(10));
    }

    // Create sale (Strict Validation Added)
    public function store(Request $request)
    {
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
            // 1. Fetch Property
            $property = Property::findOrFail($request->property_id);

            // CHECK 1: Is it already sold?
            if ($property->status !== 'AVAILABLE') {
                return response()->json(['message' => 'Property is already SOLD or BOOKED.'], 400);
            }

            // CHECK 2: (NEW RULE) Is Purchase Completed?
            // Agar humne Vendor ko paisa nahi diya, to hum bech nahi sakte
            if ($property->due_amount > 0) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Cannot sell this property. Purchase payment to Vendor is incomplete.',
                    'vendor_due' => $property->due_amount
                ], 400);
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

            // Create Sale Record
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
                'remarks'           => $request->remarks,
                'is_deleted'        => 0
            ]);

            // Save Document (Using New Table)
            if ($request->hasFile('document')) {
                $file = $request->file('document');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs("uploads/properties/{$property->id}/sales/{$sale->id}", $filename, 'public');

                PropertyDocument::create([
                    'property_id'      => $property->id,
                    'sell_property_id' => $sale->id,
                    'doc_name'         => 'Sale Agreement',
                    'doc_file'         => $path,
                    'is_deleted'       => 0
                ]);
            }

            // Update inventory status
            $status = ($pending <= 0) ? 'SOLD' : 'BOOKED';
            $property->update([
                'status'   => $status,
                'buyer_id' => $request->customer_id
            ]);

            // Record Transaction (Income)
            if ($paid > 0) {
                Transaction::create([
                    'property_id'      => $property->id,
                    'sell_property_id' => $sale->id,
                    'type'             => 'CREDIT',
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
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // Show details
    public function show($id)
    {
        $sale = SellProperty::with([
            'property.customer', 
            'buyer',
            'documents', // New Relation
            'transactions' => fn($q) => $q->where('is_deleted', 0)->latest()
        ])
        ->where('id', $id) // Fix: Search by Sale ID, not Property ID usually (or keep Logic if routed by prop_id)
        ->where('is_deleted', 0)
        ->first();

        if (!$sale) {
            // Fallback: Try searching by property_id if ID match fails
            $sale = SellProperty::with(['property.customer', 'buyer', 'documents', 'transactions'])
                ->where('property_id', $id)->where('is_deleted', 0)->first();
        }

        if (!$sale) return response()->json(['message' => 'Not found'], 404);

        return response()->json(['status' => true, 'data' => $sale]);
    }

    // Update sale
    public function update(Request $request, $id)
    {
        $sale = SellProperty::with('property')->where('id', $id)->where('is_deleted', 0)->firstOrFail();

        $request->validate([
            'customer_id'    => 'required|exists:customers,id',
            'sale_rate'      => 'required|numeric|min:1',
            'document'       => 'nullable|file|mimes:pdf,jpg,png|max:5120'
        ]);

        DB::beginTransaction();
        try {
            $quantity = $sale->property->quantity ?? 1;

            // Recalculate
            $baseAmount = $request->sale_rate * $quantity;
            $gstPercent = $request->gst_percentage ?? $sale->gst_percentage;
            $gstAmount  = ($baseAmount * $gstPercent) / 100;
            $other      = $request->other_charges ?? $sale->other_charges;
            $discount   = $request->discount ?? $sale->discount_amount;

            $newTotal   = ($baseAmount + $gstAmount + $other) - $discount;
            $newPending = $newTotal - $sale->received_amount;

            $sale->update([
                'customer_id'       => $request->customer_id,
                'sale_rate'         => $request->sale_rate,
                'sale_base_amount'  => $baseAmount,
                'gst_amount'        => $gstAmount,
                'total_sale_amount' => $newTotal,
                'pending_amount'    => $newPending,
                'remarks'           => $request->remarks ?? $sale->remarks
            ]);

            // Add New Document
            if ($request->hasFile('document')) {
                $file = $request->file('document');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs("uploads/properties/{$sale->property_id}/sales/{$sale->id}", $filename, 'public');

                PropertyDocument::create([
                    'property_id'      => $sale->property_id,
                    'sell_property_id' => $sale->id,
                    'doc_name'         => 'Updated Sale Doc',
                    'doc_file'         => $path,
                    'is_deleted'       => 0
                ]);
            }

            // Update status
            $status = ($newPending <= 0) ? 'SOLD' : 'BOOKED';
            $sale->property()->update(['status' => $status, 'buyer_id' => $request->customer_id]);

            DB::commit();
            return response()->json(['message' => 'Sale updated', 'data' => $sale]);

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
            $sale->update(['is_deleted' => 1]);

            // Revert inventory
            $sale->property()->update(['status' => 'AVAILABLE', 'buyer_id' => null]);

            // Remove transactions & docs
            Transaction::where('sell_property_id', $sale->id)->update(['is_deleted' => 1]);
            PropertyDocument::where('sell_property_id', $sale->id)->update(['is_deleted' => 1]);

            DB::commit();
            return response()->json(['message' => 'Sale cancelled']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}