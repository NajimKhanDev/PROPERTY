<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Property;
use App\Models\SellProperty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TransactionController extends Controller
{
    // List transactions
    public function index(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 400);
        }

        // Fetch data
        $transactions = Transaction::with('sale_deal:id,invoice_no,customer_id')
            ->where('property_id', $request->property_id)
            ->where('is_deleted', 0)
            ->latest('payment_date')
            ->get();

        // Calculate summary
        $totalCredit = $transactions->where('type', 'CREDIT')->sum('amount');
        $totalDebit  = $transactions->where('type', 'DEBIT')->sum('amount');

        return response()->json([
            'status'  => true,
            'summary' => [
                'total_income'  => $totalCredit,
                'total_expense' => $totalDebit
            ],
            'data'    => $transactions
        ]);
    }

    // Create transaction
    public function store(Request $request)
    {
        // Validate inputs
        $validator = Validator::make($request->all(), [
            'property_id'      => 'required|exists:properties,id',
            'sell_property_id' => 'nullable|exists:sell_properties,id',
            'amount'           => 'required|numeric|gt:0',
            'payment_date'     => 'required|date',
            'payment_mode'     => 'required|in:CASH,ONLINE,CHEQUE,UPI,DD',
            'reference_no'     => 'nullable|string|max:100',
            'remarks'          => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // CASE 1: SALE INCOME (CREDIT)
            if ($request->filled('sell_property_id')) {
                $deal = SellProperty::where('id', $request->sell_property_id)->lockForUpdate()->first();
                
                // Check limits
                if ($request->amount > ($deal->pending_amount + 0.01)) {
                     return response()->json(['status' => false, 'message' => 'Exceeds pending balance'], 400);
                }

                // Create credit
                $transaction = Transaction::create(array_merge($request->all(), [
                    'type'       => 'CREDIT', 
                    'is_deleted' => 0
                ]));

                // Update sale
                $deal->update([
                    'received_amount' => $deal->received_amount + $request->amount,
                    'pending_amount'  => $deal->total_sale_amount - ($deal->received_amount + $request->amount)
                ]);
                
                // Update status
                $deal->property()->update(['status' => ($deal->fresh()->pending_amount <= 0) ? 'SOLD' : 'BOOKED']);
                
                $msg = "Payment received successfully";
            } 
            
            // CASE 2: PURCHASE EXPENSE (DEBIT)
            else {
                $property = Property::where('id', $request->property_id)->lockForUpdate()->first();
                
                // Check limits
                if ($request->amount > ($property->due_amount + 0.01)) {
                    return response()->json(['status' => false, 'message' => 'Exceeds vendor due'], 400);
                }

                // Create debit
                $transaction = Transaction::create(array_merge($request->all(), [
                    'type'             => 'DEBIT', 
                    'sell_property_id' => null, 
                    'is_deleted'       => 0
                ]));

                // Update inventory
                $property->update([
                    'paid_amount' => $property->paid_amount + $request->amount,
                    'due_amount'  => $property->total_amount - ($property->paid_amount + $request->amount)
                ]);
                
                $msg = "Payment paid successfully";
            }

            DB::commit();
            return response()->json(['status' => true, 'message' => $msg, 'data' => $transaction], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Show single
    public function show($id)
    {
        $transaction = Transaction::with('sale_deal')->where('id', $id)->where('is_deleted', 0)->first();

        if (!$transaction) {
            return response()->json(['status' => false, 'message' => 'Not found'], 404);
        }

        return response()->json(['status' => true, 'data' => $transaction]);
    }
   
   /**
     * SPECIAL FUNCTION: Get History for a Specific Sold Property
     * Filters by 'sell_property_id' to get only INCOME (CREDIT) transactions.
     */
    public function getTransactionsBySaleId($id)
    {
        // 1. Fetch the Deal details (using SellProperty Model)
        $saleDeal = SellProperty::with(['buyer:id,name,phone', 'property:id,title'])
                        ->where('id', $id)
                        ->where('is_deleted', 0)
                        ->first();

        if (!$saleDeal) {
            return response()->json(['status' => false, 'message' => 'Sale Deal not found'], 404);
        }

        // 2. Fetch Transactions linked STRICTLY to this Deal
        $transactions = Transaction::where('sell_property_id', $id)
                            ->where('type', 'CREDIT') // Ensure we only get Money In
                            ->where('is_deleted', 0)
                            ->latest('payment_date')
                            ->get();

        

        // 3. Return JSON with Summary + List
        return response()->json([
            'status' => true,
            'deal_summary' => [
                'sale_id'        => $saleDeal->id,
                'invoice_no'     => $saleDeal->invoice_no,
                'property_title' => $saleDeal->property->title ?? 'N/A',
                'buyer_name'     => $saleDeal->buyer->name ?? 'N/A',
                'buyer_phone'    => $saleDeal->buyer->phone ?? 'N/A',
                
                // Financials (Directly from SellProperty table columns)
                'total_sale_val' => $saleDeal->total_sale_amount,
                'received_total' => $saleDeal->received_amount,
                'pending_due'    => $saleDeal->pending_amount,
                
                // Calculated Status
                'status'         => ($saleDeal->pending_amount <= 1) ? 'FULLY PAID' : 'PENDING'
            ],
            'transactions' => $transactions
        ]);
    }
    // Update transaction
    public function update(Request $request, $id)
    {
        // Validate inputs
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
            $txn = Transaction::where('id', $id)->where('is_deleted', 0)->lockForUpdate()->firstOrFail();

            // REVERT OLD EFFECT
            if ($txn->type === 'CREDIT' && $txn->sell_property_id) {
                $deal = SellProperty::find($txn->sell_property_id);
                $deal->decrement('received_amount', $txn->amount);
                $deal->increment('pending_amount', $txn->amount);
            } elseif ($txn->type === 'DEBIT') {
                $prop = Property::find($txn->property_id);
                $prop->decrement('paid_amount', $txn->amount);
                $prop->increment('due_amount', $txn->amount);
            }

            // APPLY NEW EFFECT
            if ($txn->type === 'CREDIT' && $txn->sell_property_id) {
                $deal = $deal->fresh(); // Reload
                if ($request->amount > ($deal->pending_amount + $txn->amount)) { // Check limit
                     throw new \Exception("New amount exceeds sale pending balance");
                }
                $deal->increment('received_amount', $request->amount);
                $deal->decrement('pending_amount', $request->amount);
                
                // Update status
                $deal->property()->update(['status' => ($deal->pending_amount <= 0) ? 'SOLD' : 'BOOKED']);

            } elseif ($txn->type === 'DEBIT') {
                $prop = $prop->fresh(); // Reload
                if ($request->amount > ($prop->due_amount + $txn->amount)) { // Check limit
                    throw new \Exception("New amount exceeds vendor due balance");
                }
                $prop->increment('paid_amount', $request->amount);
                $prop->decrement('due_amount', $request->amount);
            }

            // Update record
            $txn->update($request->only(['amount', 'payment_date', 'payment_mode', 'reference_no', 'remarks']));

            DB::commit();
            return response()->json(['status' => true, 'message' => 'Updated successfully', 'data' => $txn]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Delete transaction
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $txn = Transaction::where('id', $id)->where('is_deleted', 0)->lockForUpdate()->firstOrFail();

            // Revert balances
            if ($txn->type === 'CREDIT' && $txn->sell_property_id) {
                // Revert Sale
                $deal = SellProperty::find($txn->sell_property_id);
                $deal->decrement('received_amount', $txn->amount);
                $deal->increment('pending_amount', $txn->amount);
                // Revert Status
                $deal->property()->update(['status' => 'BOOKED']); 
            } 
            elseif ($txn->type === 'DEBIT') {
                // Revert Inventory
                $prop = Property::find($txn->property_id);
                $prop->decrement('paid_amount', $txn->amount);
                $prop->increment('due_amount', $txn->amount);
            }

            // Soft delete
            $txn->update(['is_deleted' => 1]);

            DB::commit();
            return response()->json(['status' => true, 'message' => 'Transaction reversed']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }
}