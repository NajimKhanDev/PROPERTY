<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Transaction;
use App\Models\SellProperty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * 1. DASHBOARD STATS (Summary)
     */
    public function getDashboardStats(Request $request)
    {
        // 1. Date filters
        $start = $request->start_date;
        $end   = $request->end_date;

        // 2. Inventory Counts (Stock)
        $inventory = Property::where('transaction_type', 'PURCHASE')->where('is_deleted', 0);
        
        if ($start && $end) $inventory->whereBetween('date', [$start, $end]);
        
        $totalStock = (clone $inventory)->count();
        $soldStock  = (clone $inventory)->where('status', '!=', 'AVAILABLE')->count();
        
        // 3. Deal Values (Paper Money)
        // Purchase Cost
        $totalCost = (clone $inventory)->sum('total_amount');
        
        // Sales Value (From SellProperty)
        $salesQuery = SellProperty::where('is_deleted', 0);
        if ($start && $end) $salesQuery->whereBetween('sale_date', [$start, $end]);
        $totalSalesVal = $salesQuery->sum('total_sale_amount');

        // 4. REAL CASH FLOW (From Transactions)
        $cashQuery = DB::table('transactions')->where('is_deleted', 0);

        if ($start && $end) $cashQuery->whereBetween('payment_date', [$start, $end]);

        $cashStats = $cashQuery->select(
            DB::raw("SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) as total_in"),
            DB::raw("SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) as total_out")
        )->first();

        return response()->json([
            'status' => true,
            'period' => ($start) ? "$start to $end" : "All Time",
            'data' => [
                'inventory' => [
                    'total_plots' => $totalStock,
                    'sold_plots'  => $soldStock,
                    'available'   => $totalStock - $soldStock
                ],
                'value' => [
                    'purchase_cost' => $totalCost,      // Paisa jo lagna tha
                    'sales_value'   => $totalSalesVal,  // Paisa jo aana tha
                    'paper_profit'  => $totalSalesVal - ($soldStock > 0 ? ($totalCost / $totalStock * $soldStock) : 0) // Approx profit
                ],
                'cash_flow' => [
                    'received'    => (float) $cashStats->total_in,  // Jeb me aaya
                    'paid'        => (float) $cashStats->total_out, // Jeb se gaya
                    'net_balance' => (float) ($cashStats->total_in - $cashStats->total_out)
                ]
            ]
        ]);
    }

    /**
     * 2. DAYBOOK (Daily Register)
     */
    public function getDaybook(Request $request)
    {
        // Fetch transactions with links
        $query = Transaction::with([
            'property:id,title', 
            'sale_deal.buyer:id,name' // Load buyer via sale deal
        ])
        ->where('is_deleted', 0);

        // Apply filters
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('payment_date', [$request->start_date, $request->end_date]);
        }

        // Sorting
        $query->orderBy('payment_date', 'desc')->orderBy('id', 'desc');

        // Pagination
        $transactions = $query->paginate($request->input('per_page', 20));

        // Format data
        $formatted = collect($transactions->items())->map(function ($txn) {
            
            // Logic to find Party Name
            $party = "N/A";
            if ($txn->type === 'CREDIT' && $txn->sale_deal) {
                $party = $txn->sale_deal->buyer->name ?? 'Customer';
            } elseif ($txn->type === 'DEBIT') {
                // For Debit, we can load seller from property (Vendor)
                // You can add 'property.seller' in with() above if needed
                $party = "Vendor / Landlord"; 
            }

            return [
                'id'           => $txn->id,
                'date'         => $txn->payment_date->format('d-M-Y'),
                'property'     => $txn->property->title ?? 'N/A',
                'party'        => $party,
                'type'         => $txn->type, // CREDIT or DEBIT
                'amount'       => $txn->amount,
                'mode'         => $txn->payment_mode,
                'reference'    => $txn->reference_no,
                'remarks'      => $txn->remarks,
                'color'        => ($txn->type === 'CREDIT') ? 'text-green-600' : 'text-red-600'
            ];
        });

        return response()->json([
            'status' => true,
            'pagination' => [
                'total' => $transactions->total(),
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
            ],
            'data' => $formatted
        ]);
    }

    /**
     * 3. OUTSTANDING DUES (Recovery List)
     * Focus: Kisse paisa lena baaki hai? (Customers)
     */
    public function getDuesReport(Request $request)
    {
        // Target: SellProperty where pending > 0
        $query = SellProperty::with(['buyer:id,name,phone', 'property:id,title'])
            ->select('id', 'customer_id', 'property_id', 'total_sale_amount', 'received_amount', 'pending_amount', 'sale_date')
            ->where('pending_amount', '>', 0)
            ->where('is_deleted', 0);

        // Search logic
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('buyer', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $totalPending = (clone $query)->sum('pending_amount');
        $defaulters = $query->orderBy('pending_amount', 'desc')->paginate(20);

        return response()->json([
            'status' => true,
            'total_recoverable' => $totalPending,
            'data' => $defaulters
        ]);
    }

    /**
     * 4. PROFIT & LOSS (Real Deal Analysis)
     */
    public function getProfitLoss(Request $request)
    {
        // Get all Sales
        $query = SellProperty::with(['property']) // Need property to get Cost Price
                             ->where('is_deleted', 0);

        if ($request->filled('start_date')) {
            $query->whereBetween('sale_date', [$request->start_date, $request->end_date]);
        }

        $sales = $query->latest('sale_date')->get();

        $report = $sales->map(function ($deal) {
            // Cost Price (Purchase Rate)
            $costPrice = $deal->property->total_amount ?? 0; // Inventory Cost
            
            // Selling Price
            $salePrice = $deal->total_sale_amount;

            // Profit
            $profit = $salePrice - $costPrice;
            $margin = ($costPrice > 0) ? round(($profit / $costPrice) * 100, 2) : 100;

            return [
                'deal_id'     => $deal->invoice_no,
                'property'    => $deal->property->title ?? 'N/A',
                'sale_date'   => $deal->sale_date,
                'cost_price'  => $costPrice,
                'sale_price'  => $salePrice,
                'profit'      => $profit,
                'margin_per'  => $margin . '%',
                'status'      => ($profit >= 0) ? 'PROFIT' : 'LOSS'
            ];
        });

        return response()->json([
            'status' => true,
            'total_profit' => $report->sum('profit'),
            'data' => $report
        ]);
    }

    /**
     * 5. MONTHLY TREND (Graph Data)
     */
    public function getMonthlyTrend()
    {
        // Group by Month using Type
        $trend = DB::table('transactions')
            ->select(
                DB::raw("DATE_FORMAT(payment_date, '%Y-%m') as month"),
                DB::raw("SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) as income"),
                DB::raw("SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) as expense")
            )
            ->where('is_deleted', 0)
            ->where('payment_date', '>=', Carbon::now()->subMonths(12))
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $trend
        ]);
    }
}