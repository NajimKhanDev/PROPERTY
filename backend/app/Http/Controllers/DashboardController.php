<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\SellProperty;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // Fetch dashboard statistics
    public function getDashboardData()
    {
        // 1. CASH FLOW STATS
        // Sum total transactions
        $txnStats = DB::table('transactions')
                      ->select(
                          DB::raw("SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) as cash_in"),
                          DB::raw("SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) as cash_out")
                      )
                      ->where('is_deleted', 0)
                      ->first();

        $totalCashIn  = $txnStats->cash_in;
        $totalCashOut = $txnStats->cash_out;
        $netCashHand  = $totalCashIn - $totalCashOut;

        // 2. INVENTORY STATUS
        // Count stock items
        $totalStock = Property::where('transaction_type', 'PURCHASE')->where('is_deleted', 0)->count();
        $totalSoldUnits = SellProperty::where('is_deleted', 0)->count();
        $fullySoldProperties = Property::where('status', 'SOLD')->where('is_deleted', 0)->count();
        $partiallySoldProperties = Property::where('status', 'BOOKED')->where('is_deleted', 0)->count();
        
        // Calculate available stock: properties with remaining unsold area
        $availableStock = Property::where('transaction_type', 'PURCHASE')
            ->where('is_deleted', 0)
            ->whereRaw('area_dismil > COALESCE((SELECT SUM(area_dismil) FROM sell_properties WHERE property_id = properties.id AND is_deleted = 0), 0)')
            ->count();

        // 3. PROFIT ANALYSIS
        // Calculate total revenue from all sales
        $revenueGenerated = SellProperty::where('is_deleted', 0)->sum('total_sale_amount');

        // Calculate proportional cost of sold goods
        $costOfSoldGoods = SellProperty::join('properties', 'sell_properties.property_id', '=', 'properties.id')
                                       ->where('sell_properties.is_deleted', 0)
                                       ->selectRaw('SUM((sell_properties.area_dismil / properties.area_dismil) * properties.total_amount) as proportional_cost')
                                       ->value('proportional_cost') ?? 0;

        $grossProfit = $revenueGenerated - $costOfSoldGoods;
        
        // Calculate profit margin
        $margin = ($costOfSoldGoods > 0) ? round(($grossProfit / $costOfSoldGoods) * 100, 2) : 0;

        // 4. MARKET DUES
        // Sum pending receivables
        $marketReceivables = SellProperty::where('is_deleted', 0)->sum('pending_amount');

        // Sum pending payables
        $marketPayables = Property::where('transaction_type', 'PURCHASE')
                                  ->where('is_deleted', 0)
                                  ->sum('due_amount');

        // 5. RECENT ACTIVITIES
        // Fetch recent sales
        $recentSales = SellProperty::with(['property:id,title', 'buyer:id,name'])
            ->where('is_deleted', 0)
            ->latest('sale_date')
            ->limit(5)
            ->get()
            ->map(function($sale) {
                return [
                    'id'       => $sale->id,
                    'title'    => $sale->property->title ?? 'N/A',
                    'party'    => $sale->buyer->name ?? 'N/A',
                    'amount'   => $sale->total_sale_amount,
                    'date'     => $sale->sale_date
                ];
            });

        // Fetch recent purchases
        $recentPurchases = Property::with('seller:id,name')
            ->where('transaction_type', 'PURCHASE')
            ->where('is_deleted', 0)
            ->latest('date')
            ->limit(5)
            ->get()
            ->map(function($prop) {
                return [
                    'id'       => $prop->id,
                    'title'    => $prop->title,
                    'party'    => $prop->seller->name ?? 'N/A',
                    'amount'   => $prop->total_amount,
                    'status'   => $prop->status,
                    'date'     => $prop->date
                ];
            });

        // Return JSON response
        return response()->json([
            'status' => true,
            'data' => [
                'cash_book' => [
                    'label'         => 'Real Cash Flow',
                    'total_received'=> $totalCashIn,
                    'total_paid'    => $totalCashOut,
                    'cash_in_hand'  => $netCashHand,
                    'status'        => ($netCashHand >= 0) ? 'POSITIVE' : 'NEGATIVE'
                ],
                'inventory' => [
                    'total_properties'      => $totalStock,
                    'fully_sold'           => $fullySoldProperties,
                    'partially_sold'       => $partiallySoldProperties,
                    'available'            => $availableStock,
                    'total_sale_deals'     => $totalSoldUnits
                ],
                'profitability' => [
                    'total_sales_value' => $revenueGenerated,
                    'purchase_cost_sold'=> $costOfSoldGoods,
                    'gross_profit'      => $grossProfit,
                    'profit_margin'     => $margin . '%'
                ],
                'outstanding' => [
                    'receivables' => $marketReceivables,
                    'payables'    => $marketPayables,
                    'net_market_pos' => $marketReceivables - $marketPayables
                ],
                'recent_activity' => [
                    'sales'     => $recentSales,
                    'purchases' => $recentPurchases
                ]
            ]
        ]);
    }
}