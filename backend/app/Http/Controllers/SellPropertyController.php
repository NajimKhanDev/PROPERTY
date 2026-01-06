<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\SellProperty;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage; // Added for files

class SellPropertyController extends Controller
{
    // List Sales
    public function index(Request $request)
    {
        // Fetch Data
        $query = SellProperty::with(['property', 'buyer:id,name,phone'])
                             ->where('is_deleted', 0)
                             ->latest('sale_date');

        // Apply Search
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

    // Create Sale
    public function store(Request $request)
    {
        // Validate Input
        $request->validate([
            'property_id'    => 'required|exists:properties,id',
            'customer_id'    => 'required|exists:customers,id',
            'sale_rate'      => 'required|numeric|min:1',
            'gst_percentage' => 'nullable|integer|min:0',
            'paid_amount'    => 'nullable|numeric|min:0',
            'document'       => 'nullable|file|mimes:pdf,jpg,png|max:5120' // 5MB Max
        ]);

        DB::beginTransaction();
        try {
            // Check Availability
            $property = Property::findOrFail($request->property_id);
            if ($property->status === 'SOLD') {
                return response()->json(['message' => 'Already sold!'], 400);
            }

            // Handle File
            $docPath = null;
            if ($request->hasFile('document')) {
                $docPath = $request->file('document')->store('sale_docs', 'public');
            }

            // Calculate Totals
            $quantity   = $property->quantity;
            $baseAmount = $request->sale_rate * $quantity;
            
            $gstPercent = $request->gst_percentage ?? 0;
            $gstAmount  = ($baseAmount * $gstPercent) / 100;
            
            $otherCharges = $request->other_charges ?? 0;
            $discount     = $request->discount ?? 0;

            $totalSaleVal = ($baseAmount + $gstAmount + $otherCharges) - $discount;
            $initialPay   = $request->paid_amount ?? 0;

            // Save Sale
            $sale = SellProperty::create([
                'property_id'       => $property->id,
                'customer_id'       => $request->customer_id,
                'sale_date'         => $request->sale_date ?? now(),
                'invoice_no'        => $request->invoice_no,
                'sale_rate'         => $request->sale_rate,
                'sale_base_amount'  => $baseAmount,
                'gst_percentage'    => $gstPercent,
                'gst_amount'        => $gstAmount,
                'other_charges'     => $otherCharges,
                'discount_amount'   => $discount,
                'total_sale_amount' => $totalSaleVal,
                'received_amount'   => $initialPay,
                'pending_amount'    => $totalSaleVal - $initialPay,
                'document_file'     => $docPath, // Save Path
                'is_deleted'        => 0
            ]);

            // Update Inventory
            $property->update(['status' => 'SOLD']);

            // Record Payment
            if ($initialPay > 0) {
                Transaction::create([
                    'property_id'  => $property->id,
                    'type'         => 'CREDIT',
                    'amount'       => $initialPay,
                    'payment_date' => $request->sale_date ?? now(),
                    'payment_mode' => $request->payment_mode ?? 'CASH',
                    'remarks'      => 'Initial Payment (Sale)'
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Sold successfully.', 'data' => $sale]);

        } catch (\Exception $e) {
            DB::rollBack();
            // Cleanup File
            if (isset($docPath)) Storage::disk('public')->delete($docPath);
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // Show Details
    public function show($id)
    {
        $sale = SellProperty::with(['property', 'buyer'])
                            ->where('id', $id)
                            ->where('is_deleted', 0)
                            ->firstOrFail();

        // Append File URL
        if ($sale->document_file) {
            $sale->document_url = Storage::url($sale->document_file);
        }

        return response()->json($sale);
    }

    // Update Sale
    public function update(Request $request, $id)
    {
        $sale = SellProperty::with('property')->where('id', $id)->where('is_deleted', 0)->firstOrFail();

        // Validate Input
        $request->validate([
            'customer_id'    => 'required|exists:customers,id',
            'sale_rate'      => 'required|numeric|min:1',
            'gst_percentage' => 'nullable|integer|min:0',
            'document'       => 'nullable|file|mimes:pdf,jpg,png|max:5120'
        ]);

        DB::beginTransaction();
        try {
            // Get Quantity
            $quantity = $sale->property->quantity;

            // Recalculate Totals
            $baseAmount = $request->sale_rate * $quantity;
            $gstPercent = $request->gst_percentage ?? 0;
            $gstAmount  = ($baseAmount * $gstPercent) / 100;
            
            $otherCharges = $request->other_charges ?? 0;
            $discount     = $request->discount ?? 0;

            $newTotalSaleVal = ($baseAmount + $gstAmount + $otherCharges) - $discount;
            $newPending      = $newTotalSaleVal - $sale->received_amount;

            // Handle File Update
            $docPath = $sale->document_file;
            if ($request->hasFile('document')) {
                // Delete Old
                if ($sale->document_file) {
                    Storage::disk('public')->delete($sale->document_file);
                }
                // Store New
                $docPath = $request->file('document')->store('sale_docs', 'public');
            }

            // Update Record
            $sale->update([
                'customer_id'       => $request->customer_id,
                'sale_date'         => $request->sale_date ?? $sale->sale_date,
                'invoice_no'        => $request->invoice_no ?? $sale->invoice_no,
                'sale_rate'         => $request->sale_rate,
                'sale_base_amount'  => $baseAmount,
                'gst_percentage'    => $gstPercent,
                'gst_amount'        => $gstAmount,
                'other_charges'     => $otherCharges,
                'discount_amount'   => $discount,
                'total_sale_amount' => $newTotalSaleVal,
                'pending_amount'    => $newPending,
                'document_file'     => $docPath
            ]);

            DB::commit();
            return response()->json(['message' => 'Updated successfully.', 'data' => $sale]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // Delete Sale
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $sale = SellProperty::findOrFail($id);

            // Soft Delete
            $sale->update(['is_deleted' => 1]);

            // Revert Inventory
            $sale->property()->update(['status' => 'AVAILABLE']);

            // Note: We keep file for audit (Soft Delete)

            DB::commit();
            return response()->json(['message' => 'Sale cancelled.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}