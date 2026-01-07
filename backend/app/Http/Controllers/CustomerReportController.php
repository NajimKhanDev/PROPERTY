<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\SellProperty;
use App\Models\Property;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerReportController extends Controller
{
    /**
     * REPORT 1: ALL CUSTOMERS SUMMARY (Paginated List)
     * Shows: Name | Total Bought (₹) | Total Sold (₹) | Net Balance
     */
   /**
     * REPORT 1: ALL CUSTOMERS (With Property Details)
     */
    public function getAllCustomersReport(Request $request)
    {
        // 1. Base Query with Sums & Details
        $query = Customer::withSum(['purchases' => function($q) {
                $q->where('is_deleted', 0);
            }], 'total_sale_amount')
            ->withSum(['purchases' => function($q) {
                $q->where('is_deleted', 0);
            }], 'pending_amount')
            ->withSum(['supplies' => function($q) {
                $q->where('is_deleted', 0)->where('transaction_type', 'PURCHASE');
            }], 'total_amount')
            ->withSum(['supplies' => function($q) {
                $q->where('is_deleted', 0)->where('transaction_type', 'PURCHASE');
            }], 'due_amount')
            // FETCH DETAILS (Eager Loading)
            ->with([
                'purchases' => function($q) {
                    $q->select('id', 'customer_id', 'property_id', 'invoice_no', 'sale_date')
                      ->where('is_deleted', 0)
                      ->with('property:id,title'); // Get Property Name
                },
                'supplies' => function($q) {
                    $q->select('id', 'seller_id', 'title', 'invoice_no', 'date')
                      ->where('is_deleted', 0)
                      ->where('transaction_type', 'PURCHASE');
                }
            ])
            ->where('is_deleted', 0);

        // 2. Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // 3. Type Filter
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // 4. Sort & Paginate
        $query->orderBy('created_at', 'desc');
        $customers = $query->paginate(15);

        

        // 5. Format Data
        $data = collect($customers->items())->map(function($c) {
            return [
                'id'           => $c->id,
                'name'         => $c->name,
                'phone'        => $c->phone,
                'type'         => $c->type,
                
                // Stats
                'total_bought' => $c->purchases_sum_total_sale_amount ?? 0,
                'total_sold'   => $c->supplies_sum_total_amount ?? 0,
                'recoverable'  => $c->purchases_sum_pending_amount ?? 0,
                'payable'      => $c->supplies_sum_due_amount ?? 0,

                // --- NEW: Item Details ---
                'purchased_items' => $c->purchases->map(function($p) {
                    return [
                        'invoice'  => $p->invoice_no,
                        'property' => $p->property->title ?? 'N/A',
                        'date'     => $p->sale_date
                    ];
                }),

                'sold_items' => $c->supplies->map(function($s) {
                    return [
                        'invoice'  => $s->invoice_no,
                        'property' => $s->title,
                        'date'     => $s->date
                    ];
                }),
            ];
        });

        return response()->json([
            'status' => true,
            'pagination' => [
                'total' => $customers->total(),
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage()
            ],
            'data' => $data
        ]);
    }

    /**
     * REPORT 2: SPECIFIC CUSTOMER DETAILS (360 View)
     * Inputs: customer_id, filters(start_date, end_date)
     */
    public function getSpecificCustomerReport(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        
        $start = $request->start_date;
        $end   = $request->end_date;

        // --- SECTION A: BUYING HISTORY (Humse kya khareeda) ---
        $purchases = SellProperty::with('property:id,title')
            ->where('customer_id', $id)
            ->where('is_deleted', 0);
            
        if($start && $end) $purchases->whereBetween('sale_date', [$start, $end]);
        
        $purchaseData = $purchases->get();
        $totalBought  = $purchaseData->sum('total_sale_amount');
        $totalPaid    = $purchaseData->sum('received_amount');
        $totalDue     = $purchaseData->sum('pending_amount');

        // --- SECTION B: SELLING HISTORY (Humein kya becha) ---
        $supplies = Property::where('seller_id', $id)
            ->where('transaction_type', 'PURCHASE')
            ->where('is_deleted', 0);

        if($start && $end) $supplies->whereBetween('date', [$start, $end]);

        $supplyData = $supplies->get();
        $totalSold  = $supplyData->sum('total_amount');
        $wePaid     = $supplyData->sum('paid_amount');
        $weOwe      = $supplyData->sum('due_amount');

        // --- SECTION C: LEDGER (Transaction History) ---
        // Get all Money IN (Credit) and Money OUT (Debit) linked to this person
        $ledger = Transaction::where('is_deleted', 0)
            ->where(function($q) use ($id) {
                // Money IN from this customer (via Sale Deal)
                $q->whereHas('sale_deal', fn($s) => $s->where('customer_id', $id))
                // OR Money OUT to this customer (via Inventory)
                  ->orWhereHas('property', fn($p) => $p->where('seller_id', $id));
            });

        if($start && $end) $ledger->whereBetween('payment_date', [$start, $end]);

        return response()->json([
            'status' => true,
            'customer_profile' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'contact' => $customer->phone,
                'address' => $customer->address
            ],
            'financial_summary' => [
                'as_buyer' => [
                    'total_purchase_val' => $totalBought,
                    'paid_to_us' => $totalPaid,
                    'balance_due' => $totalDue // RED FLAG (Recovery)
                ],
                'as_seller' => [
                    'total_supply_val' => $totalSold,
                    'received_from_us' => $wePaid,
                    'balance_payable' => $weOwe // LIABILITY
                ],
                'net_position' => ($totalDue - $weOwe) // Positive = He pays us, Negative = We pay him
            ],
            'history' => [
                'items_bought' => $purchaseData->map(function($i){
                    return ['date' => $i->sale_date, 'property' => $i->property->title, 'amount' => $i->total_sale_amount, 'status' => $i->pending_amount > 0 ? 'DUE' : 'PAID'];
                }),
                'items_sold' => $supplyData->map(function($i){
                    return ['date' => $i->date, 'property' => $i->title, 'amount' => $i->total_amount, 'status' => $i->due_amount > 0 ? 'UNPAID' : 'PAID'];
                })
            ],
            'recent_transactions' => $ledger->latest('payment_date')->limit(10)->get()
        ]);
    }
}