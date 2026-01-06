<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * 1. DASHBOARD STATS (One-Shot Summary)
     */
    public function getDashboardStats(Request $request)
    {
        // Date filters prepare karo
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Base Queries (Reusable)
        $propQuery = Property::where('is_deleted', 0);
        $txnQuery  = Transaction::where('is_deleted', 0);

        if ($startDate && $endDate) {
            $propQuery->whereBetween('date', [$startDate, $endDate]);
            $txnQuery->whereBetween('payment_date', [$startDate, $endDate]);
        }

        // --- SQL AGGREGATES (Fast Calculations) ---
        
        // 1. Inventory Counts
        $totalProperties = (clone $propQuery)->count();
        $totalSold       = (clone $propQuery)->where('transaction_type', 'SELL')->count();
        $totalPurchased  = (clone $propQuery)->where('transaction_type', 'PURCHASE')->count();

        // 2. Paper Money (Deal Value)
        $totalDealSellValue = (clone $propQuery)->where('transaction_type', 'SELL')->sum('total_amount');
        $totalDealBuyValue  = (clone $propQuery)->where('transaction_type', 'PURCHASE')->sum('total_amount');

        // 3. Real Cash 
 
        $cashStats = DB::table('transactions')
            ->join('properties', 'transactions.property_id', '=', 'properties.id')
            ->select(
                DB::raw("SUM(CASE WHEN properties.transaction_type = 'SELL' THEN transactions.amount ELSE 0 END) as total_in"),
                DB::raw("SUM(CASE WHEN properties.transaction_type = 'PURCHASE' THEN transactions.amount ELSE 0 END) as total_out")
            )
            ->where('transactions.is_deleted', 0)
            ->where('properties.is_deleted', 0);

        if ($startDate && $endDate) {
            $cashStats->whereBetween('transactions.payment_date', [$startDate, $endDate]);
        }

        $cashData = $cashStats->first();

        return response()->json([
            'status' => true,
            'period' => ($startDate) ? "$startDate to $endDate" : "All Time",
            'data' => [
                'inventory' => [
                    'total' => $totalProperties,
                    'purchased' => $totalPurchased,
                    'sold' => $totalSold,
                    'available' => $totalPurchased - $totalSold
                ],
                'deal_value' => [
                    'sales_volume' => $totalDealSellValue,
                    'purchase_cost' => $totalDealBuyValue, 
                    'expected_profit' => $totalDealSellValue - $totalDealBuyValue
                ],
                'cash_flow' => [
                    'received' => (float) $cashData->total_in,  
                    'paid'     => (float) $cashData->total_out, 
                    'net_balance' => (float) ($cashData->total_in - $cashData->total_out)
                ]
            ]
        ]);
    }

    /**
     * 2. DAYBOOK (Daily Transaction Register)
     */
    public function getDaybook(Request $request)
    {
        $query = Transaction::with(['property' => function($q) {
            $q->select('id', 'title', 'transaction_type', 'party_name'); 
        }])
        ->where('is_deleted', 0);

        // Date Filter
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('payment_date', [$request->start_date, $request->end_date]);
        }

        // Sorting
        $query->orderBy('payment_date', 'desc')->orderBy('id', 'desc');

        // Pagination (Very Important for Speed)
        $transactions = $query->paginate($request->input('per_page', 20));

        // Format Data properly for Frontend
        $formattedData = collect($transactions->items())->map(function ($txn) {
      
            $isCredit = $txn->property && $txn->property->transaction_type === 'SELL';
            
            return [
                'id' => $txn->id,
                'date' => $txn->payment_date->format('d-M-Y'),
                'property_title' => $txn->property->title ?? 'N/A',
                'party_name' => $txn->property->party_name ?? 'N/A',
                'type' => $isCredit ? 'CREDIT (IN)' : 'DEBIT (OUT)',
                'amount' => $txn->amount,
                'mode' => $txn->payment_mode,
                'remarks' => $txn->remarks
            ];
        });

        return response()->json([
            'status' => true,
            'pagination' => [
                'total' => $transactions->total(),
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
            ],
            'data' => $formattedData
        ]);
    }

    /**
     * 3. OUTSTANDING DUES (Recovery List)

     */
    public function getDuesReport(Request $request)
    {
        $query = Property::select('id', 'title', 'party_name', 'party_phone', 'total_amount', 'paid_amount', 'due_amount', 'date')
            ->where('transaction_type', 'SELL') 
            ->where('due_amount', '>', 0)   
            ->where('is_deleted', 0);

        if ($request->filled('search')) {
            $query->where('party_name', 'like', '%' . $request->search . '%');
        }

        $defaulters = $query->orderBy('due_amount', 'desc')->paginate(20);

        return response()->json([
            'status' => true,
            'total_pending_amount' => $query->sum('due_amount'), 
            'data' => $defaulters
        ]);
    }

    /**
     * 4. PROFIT & LOSS (Detailed)
     */
    public function getSoldPropertiesPnL(Request $request)
    {
     
        
        $query = Property::where('transaction_type', 'SELL')
                         ->where('is_deleted', 0);

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        $soldProperties = $query->orderBy('date', 'desc')->get();

       

        $reportData = $soldProperties->map(function ($prop) {
          
            return [
                'property' => $prop->title,
                'sold_to' => $prop->party_name,
                'sale_price' => $prop->total_amount,
                'received_so_far' => $prop->paid_amount,
                'pending' => $prop->due_amount,
                'deal_date' => $prop->date->format('d-M-Y')
            ];
        });

        return response()->json([
            'status' => true,
            'total_sales_value' => $soldProperties->sum('total_amount'),
            'total_cash_collected' => $soldProperties->sum('paid_amount'),
            'data' => $reportData
        ]);
    }

    /**
     * 5. MONTHLY GRAPH DATA (For Charts)
     */
    public function getMonthlyTrend()
    {
        // Last 12 Months Cash IN vs OUT
        $trend = DB::table('transactions')
            ->join('properties', 'transactions.property_id', '=', 'properties.id')
            ->select(
                DB::raw("DATE_FORMAT(transactions.payment_date, '%Y-%m') as month"),
                DB::raw("SUM(CASE WHEN properties.transaction_type = 'SELL' THEN transactions.amount ELSE 0 END) as cash_in"),
                DB::raw("SUM(CASE WHEN properties.transaction_type = 'PURCHASE' THEN transactions.amount ELSE 0 END) as cash_out")
            )
            ->where('transactions.is_deleted', 0)
            ->where('transactions.payment_date', '>=', Carbon::now()->subMonths(12)) // Last 12 months
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $trend
        ]);
    }
}