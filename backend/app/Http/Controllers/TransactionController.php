<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 400);
        }

        try {
            $transactions = Transaction::where('property_id', $request->property_id)
                ->where('is_deleted', 0)
                ->latest('payment_date')
                ->get();

            $property = Property::find($request->property_id);

            return response()->json([
                'status' => true,
                'message' => 'Transactions fetched successfully.',
                'summary' => [
                    'total_deal_value' => $property->total_amount,
                    'total_paid'       => $property->paid_amount,
                    'remaining_due'    => $property->due_amount,
                    'payment_status'   => ($property->due_amount <= 0) ? 'FULLY PAID' : 'PENDING'
                ],
                'data' => $transactions
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id'  => 'required|exists:properties,id',
            'amount'       => 'required|numeric|gt:0',
            'payment_date' => 'required|date',
            'payment_mode' => 'required|in:CASH,ONLINE,CHEQUE,UPI,DD',
            'reference_no' => 'nullable|string|max:100',
            'remarks'      => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            $property = Property::where('id', $request->property_id)->lockForUpdate()->first();

            if ($property->due_amount <= 0) {
                return response()->json([
                    'status' => false,
                    'message' => 'Transaction Rejected: This property is already fully paid.'
                ], 400);
            }

            if ($request->amount > ($property->due_amount + 0.01)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Transaction Rejected: You cannot pay more than the Due Amount.',
                    'current_due_amount' => $property->due_amount
                ], 400);
            }

            $transaction = Transaction::create([
                'property_id'  => $request->property_id,
                'amount'       => $request->amount,
                'payment_date' => $request->payment_date,
                'payment_mode' => $request->payment_mode,
                'reference_no' => $request->reference_no,
                'remarks'      => $request->remarks,
                'is_deleted'   => 0
            ]);

            $newPaidAmount = $property->paid_amount + $request->amount;
            $newDueAmount  = $property->total_amount - $newPaidAmount;

            if ($newDueAmount < 0) $newDueAmount = 0;

            $property->update([
                'paid_amount' => $newPaidAmount,
                'due_amount'  => $newDueAmount
            ]);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Payment recorded successfully.',
                'new_balances' => [
                    'paid' => $newPaidAmount,
                    'due'  => $newDueAmount
                ],
                'data' => $transaction
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $transaction = Transaction::where('id', $id)->where('is_deleted', 0)->first();

        if (!$transaction) {
            return response()->json(['status' => false, 'message' => 'Transaction not found.'], 404);
        }

        return response()->json(['status' => true, 'data' => $transaction], 200);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'amount'       => 'required|numeric|gt:0',
            'payment_date' => 'required|date',
            'payment_mode' => 'required|in:CASH,ONLINE,CHEQUE,UPI,DD',
            'reference_no' => 'nullable|string',
            'remarks'      => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            $transaction = Transaction::where('id', $id)->where('is_deleted', 0)->firstOrFail();
            $property = Property::where('id', $transaction->property_id)->lockForUpdate()->first();

            $tempPaid = $property->paid_amount - $transaction->amount;
            $tempDue  = $property->total_amount - $tempPaid;

            if ($request->amount > ($tempDue + 0.01)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Update Rejected: New amount exceeds the total pending balance.'
                ], 400);
            }

            $finalPaid = $tempPaid + $request->amount;
            $finalDue  = $property->total_amount - $finalPaid;

            $property->update([
                'paid_amount' => $finalPaid,
                'due_amount'  => $finalDue
            ]);

            $transaction->update([
                'amount'       => $request->amount,
                'payment_date' => $request->payment_date,
                'payment_mode' => $request->payment_mode,
                'reference_no' => $request->reference_no,
                'remarks'      => $request->remarks,
            ]);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Transaction updated successfully.',
                'data' => $transaction
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            $transaction = Transaction::where('id', $id)->where('is_deleted', 0)->first();

            if (!$transaction) {
                return response()->json(['status' => false, 'message' => 'Transaction not found.'], 404);
            }

            $property = Property::where('id', $transaction->property_id)->lockForUpdate()->first();

            $newPaidAmount = $property->paid_amount - $transaction->amount;
            $newDueAmount  = $property->total_amount - $newPaidAmount;

            if ($newPaidAmount < 0) $newPaidAmount = 0;

            $property->update([
                'paid_amount' => $newPaidAmount,
                'due_amount'  => $newDueAmount
            ]);

            $transaction->update(['is_deleted' => 1]);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Transaction deleted. Amount reverted.',
                'current_due' => $newDueAmount
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}