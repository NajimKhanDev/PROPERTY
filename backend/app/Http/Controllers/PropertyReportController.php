<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Transaction;
use App\Models\SellProperty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PropertyReportController extends Controller
{
    /**
     * REPORT 1: ALL PROPERTIES MASTER SHEET
     * Shows: Property | Purchase Cost | Sale Price | Profit | Status
     */
    public function getAllPropertiesReport(Request $request)
    {
        // 1. Base Query with Relations
        $query = Property::with([
            'seller:id,name,phone',        // Who sold it to us
            'sell_deals.buyer:id,name,phone' // Who bought it from us (multiple buyers)
        ])->where('is_deleted', 0);

        // 2. Filter: Search (Title, Invoice, Party Name)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('invoice_no', 'like', "%{$search}%")
                  ->orWhereHas('seller', fn($s) => $s->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('sell_deals.buyer', fn($b) => $b->where('name', 'like', "%{$search}%"));
            });
        }

        // 3. Filter: Status (AVAILABLE / SOLD / BOOKED)
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // 4. Filter: Category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // 5. Filter: Profitability (Show only Profitable deals)
        // Note: This is complex in SQL, handled better in frontend, but here is basic logic
        
        $query->latest('date');

        // Pagination
        $properties = $query->paginate(15);

        // Formatting Data
        $data = collect($properties->items())->map(function($p) {
            
            $purchaseCost = $p->total_amount;
            $totalSalePrice = $p->sell_deals->sum('total_sale_amount');
            $totalReceived = $p->sell_deals->sum('received_amount');
            $totalPending = $p->sell_deals->sum('pending_amount');
            $soldArea = $p->sell_deals->sum('area_dismil');
            $remainingArea = $p->area_dismil - $soldArea;
            $isSold = ($p->status === 'SOLD');
            $isPartialSold = ($p->status === 'BOOKED');

            // Calculate proportional cost for sold area
            $proportionalCost = ($soldArea > 0 && $p->area_dismil > 0) ? 
                ($purchaseCost * ($soldArea / $p->area_dismil)) : 0;

            // Calculate Profit
            $profit = ($isSold || $isPartialSold) ? ($totalSalePrice - $proportionalCost) : 0;
            $margin = (($isSold || $isPartialSold) && $proportionalCost > 0) ? 
                round(($profit/$proportionalCost)*100, 1) : 0;

            // Get buyer names
            $buyerNames = $p->sell_deals->pluck('buyer.name')->filter()->implode(', ');

            return [
                'id'             => $p->id,
                'title'          => $p->title,
                'category'       => $p->category,
                'status'         => $p->status,
                'invoice'        => $p->invoice_no,
                
                // Inventory Side
                'purchased_from' => $p->seller->name ?? 'N/A',
                'purchase_date'  => $p->date,
                'cost_price'     => $purchaseCost,
                'vendor_due'     => $p->due_amount,

                // Area Details
                'total_area'     => $p->area_dismil,
                'sold_area'      => $soldArea,
                'remaining_area' => $remainingArea,

                // Sale Side
                'sold_to'        => $buyerNames ?: 'Unsold',
                'total_buyers'   => $p->sell_deals->count(),
                'total_sale_price' => ($isSold || $isPartialSold) ? $totalSalePrice : '-',
                'total_received' => $totalReceived,
                'total_pending'  => $totalPending,

                // Analysis
                'profit_loss'    => ($isSold || $isPartialSold) ? $profit : '-',
                'margin_pct'     => ($isSold || $isPartialSold) ? $margin.'%' : '-'
            ];
        });

        return response()->json([
            'status' => true,
            'pagination' => [
                'total' => $properties->total(),
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage()
            ],
            'data' => $data
        ]);
    }

    /**
     * REPORT 2: SPECIFIC PROPERTY (Detailed File)
     * 360 View: Acquisition -> Holding -> Disposition -> Ledger
     */
    public function getSpecificPropertyReport($id)
    {
        // 1. Fetch Property with Deep Relations
        $property = Property::with([
            'seller',               // Vendor
            'documents',            // Inventory Docs
            'transactions' => function($q) { // All money flow
                $q->where('is_deleted', 0)->latest('payment_date');
            },
            'sell_deal' => function($q) { // Sale Contract
                $q->with('buyer', 'documents')->where('is_deleted', 0);
            }
        ])
        ->where('id', $id)
        ->firstOrFail();

        // 2. Calculate Financial Summary
        $cost    = $property->total_amount;
        $soldFor = $property->sell_deal->total_sale_amount ?? 0;
        $isSold  = ($property->status !== 'AVAILABLE');
        
        $profit  = $isSold ? ($soldFor - $cost) : 0;

        

        return response()->json([
            'status' => true,
            'profile' => [
                'id'       => $property->id,
                'title'    => $property->title,
                'category' => $property->category,
                'status'   => $property->status,
                'address'  => $property->address,
                'area'     => $property->area_dismil . ' Dismil',
                'plot_no'  => $property->plot_number
            ],
            'financial_analysis' => [
                'purchase_cost' => $cost,
                'sale_revenue'  => $isSold ? $soldFor : 'Not Sold Yet',
                'net_profit'    => $isSold ? $profit : 0,
                'roi_percent'   => ($isSold && $cost > 0) ? round(($profit/$cost)*100, 2).'%' : '0%'
            ],
            'acquisition_details' => [ // Buying Logic
                'vendor_name'   => $property->seller->name ?? 'N/A',
                'purchase_date' => $property->date,
                'invoice_no'    => $property->invoice_no,
                'total_cost'    => $property->total_amount,
                'paid_to_vendor'=> $property->paid_amount,
                'liability_due' => $property->due_amount
            ],
            'disposition_details' => $property->sell_deal ? [ // Selling Logic
                'buyer_name'      => $property->sell_deal->buyer->name,
                'sale_date'       => $property->sell_deal->sale_date,
                'sale_invoice'    => $property->sell_deal->invoice_no,
                'sale_price'      => $property->sell_deal->total_sale_amount,
                'collected'       => $property->sell_deal->received_amount,
                'recoverable_due' => $property->sell_deal->pending_amount
            ] : null,
            'documents' => [
                'inventory_docs' => $property->documents, // Papers we got when buying
                'sale_docs'      => $property->sell_deal->documents ?? [] // Papers created when selling
            ],
            'ledger_history' => $property->transactions->map(function($t) {
                return [
                    'date'   => $t->payment_date,
                    'type'   => $t->type, // CREDIT (IN) / DEBIT (OUT)
                    'amount' => $t->amount,
                    'mode'   => $t->payment_mode,
                    'info'   => $t->remarks
                ];
            })
        ]);
    }
}