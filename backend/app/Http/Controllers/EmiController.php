<?php

namespace App\Http\Controllers;

use App\Models\Emi;
use App\Models\SellEmi;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class EmiController extends Controller
{
    public function index(Request $request)
    {
        $query = Emi::with('property:id,title')->where('is_deleted', 0);
        
        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        return response()->json([
            'status' => true,
            'data' => $query->orderBy('due_date')->get()
        ]);
    }

    public function payEmi(Request $request, $id)
    {
        $request->validate([
            'paid_amount' => 'required|numeric|min:0',
            'payment_mode' => 'nullable|string',
            'transaction_no' => 'nullable|string',
            'payment_receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240'
        ]);

        $emi = Emi::where('id', $id)->where('is_deleted', 0)->firstOrFail();

        DB::beginTransaction();
        try {
            // Create Transaction Record
            $transactionData = [
                'property_id' => $emi->property_id,
                'sell_property_id' => null,
                'type' => 'DEBIT',
                'amount' => $request->paid_amount,
                'payment_date' => now(),
                'payment_mode' => $request->payment_mode ?? 'CASH',
                'reference_no' => 'EMI-' . $emi->id . '-' . time(),
                'transaction_no' => $request->transaction_no,
                'remarks' => 'EMI #' . $emi->emi_number . ' payment',
                'is_deleted' => 0
            ];

            if ($request->hasFile('payment_receipt')) {
                $file = $request->file('payment_receipt');
                $filename = time() . '_emi_receipt_' . $file->getClientOriginalName();
                $transactionData['payment_receipt'] = $file->storeAs('uploads/emi_receipts', $filename, 'public');
            }

            $transaction = Transaction::create($transactionData);

            // Update EMI Record
            $data = [
                'paid_amount' => $emi->paid_amount + $request->paid_amount,
                'paid_date' => now(),
                'payment_mode' => $request->payment_mode,
                'transaction_no' => $request->transaction_no,
                'status' => ($emi->paid_amount + $request->paid_amount) >= $emi->emi_amount ? 'PAID' : 'PENDING'
            ];

            if ($request->hasFile('payment_receipt')) {
                $file = $request->file('payment_receipt');
                $filename = time() . '_emi_receipt_' . $file->getClientOriginalName();
                $data['payment_receipt'] = $file->storeAs('uploads/emi_receipts', $filename, 'public');
            }

            $emi->update($data);

            // Update Property Amounts
            $property = $emi->property;
            $property->increment('paid_amount', $request->paid_amount);
            $property->decrement('due_amount', $request->paid_amount);

            DB::commit();
            return response()->json([
                'status' => true,
                'message' => 'EMI payment recorded successfully',
                'data' => [
                    'emi' => $emi->fresh(),
                    'transaction' => $transaction
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function sellEmisIndex(Request $request)
    {
        $query = SellEmi::with('sellProperty.property:id,title')->where('is_deleted', 0);
        
        if ($request->filled('sell_property_id')) {
            $query->where('sell_property_id', $request->sell_property_id);
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        return response()->json([
            'status' => true,
            'data' => $query->orderBy('due_date')->get()
        ]);
    }

    public function paySellEmi(Request $request, $id)
    {
        $request->validate([
            'paid_amount' => 'required|numeric|min:0',
            'payment_mode' => 'nullable|string',
            'transaction_no' => 'nullable|string',
            'payment_receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240'
        ]);

        $emi = SellEmi::where('id', $id)->where('is_deleted', 0)->firstOrFail();

        DB::beginTransaction();
        try {
            // Create Transaction Record
            $transactionData = [
                'property_id' => $emi->sellProperty->property_id,
                'sell_property_id' => $emi->sell_property_id,
                'type' => 'CREDIT',
                'amount' => $request->paid_amount,
                'payment_date' => now(),
                'payment_mode' => $request->payment_mode ?? 'CASH',
                'reference_no' => 'SELL-EMI-' . $emi->id . '-' . time(),
                'transaction_no' => $request->transaction_no,
                'remarks' => 'Sell EMI #' . $emi->emi_number . ' payment',
                'is_deleted' => 0
            ];

            if ($request->hasFile('payment_receipt')) {
                $file = $request->file('payment_receipt');
                $filename = time() . '_sell_emi_receipt_' . $file->getClientOriginalName();
                $transactionData['payment_receipt'] = $file->storeAs('uploads/sell_emi_receipts', $filename, 'public');
            }

            $transaction = Transaction::create($transactionData);

            // Update EMI Record
            $data = [
                'paid_amount' => $emi->paid_amount + $request->paid_amount,
                'paid_date' => now(),
                'payment_mode' => $request->payment_mode,
                'transaction_no' => $request->transaction_no,
                'status' => ($emi->paid_amount + $request->paid_amount) >= $emi->emi_amount ? 'PAID' : 'PENDING'
            ];

            if ($request->hasFile('payment_receipt')) {
                $file = $request->file('payment_receipt');
                $filename = time() . '_sell_emi_receipt_' . $file->getClientOriginalName();
                $data['payment_receipt'] = $file->storeAs('uploads/sell_emi_receipts', $filename, 'public');
            }

            $emi->update($data);

            // Update SellProperty Amounts
            $sellProperty = $emi->sellProperty;
            $sellProperty->increment('received_amount', $request->paid_amount);
            $sellProperty->decrement('pending_amount', $request->paid_amount);

            DB::commit();
            return response()->json([
                'status' => true,
                'message' => 'Sell EMI payment recorded successfully',
                'data' => [
                    'emi' => $emi->fresh(),
                    'transaction' => $transaction
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }
}