<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Transaction;
use App\Models\PropertyDocument;
use App\Models\Emi;
use App\Models\SellProperty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PropertyController extends Controller
{
    // List properties with filters
    public function index(Request $request)
    {
        // 1. Base Query
        $query = Property::with(['seller:id,name,phone', 'buyer:id,name,phone'])
                         ->where('is_deleted', 0);

        // 2. Filter: Transaction Type
        if ($request->filled('transaction_type')) {
            $query->where('transaction_type', $request->transaction_type);
        }

        // 3. Filter: Status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // 4. Filter: Category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // 5. Filter: Date Range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        // 6. Global Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('invoice_no', 'like', "%{$search}%")
                  ->orWhereHas('seller', fn($s) => $s->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('buyer', fn($b) => $b->where('name', 'like', "%{$search}%"));
            });
        }

        // 7. Sort and Paginate
        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_order', 'desc'));
        
        return response()->json($query->paginate($request->input('per_page', 10)));
    }

    // Create Inventory (PURCHASE ONLY)
    public function store(Request $request)
    {
        $request->validate([
            'transaction_type' => 'required|in:PURCHASE',
            'seller_id'        => 'required|exists:customers,id',
            'title'            => 'required|string|max:255',
            'category'         => 'required|in:LAND,FLAT,HOUSE,COMMERCIAL,AGRICULTURE',
            'address'          => 'nullable|string',
            'plot_number'      => 'nullable|string',
            'khata_number'     => 'nullable|string',
            'area_dismil'      => 'nullable|numeric|min:0',
            'per_dismil_amount' => 'nullable|numeric|min:0',
            'total_amount'     => 'required|numeric|min:0',
            'paid_amount'      => 'nullable|numeric|min:0',
            'due_amount'       => 'nullable|numeric|min:0',
            'period_years'     => 'nullable|integer|min:1',
            'amount_per_month' => 'nullable|numeric|min:0',
            'payment_mode'     => 'nullable|string',
            'payment_receipt'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'transaction_no'   => 'nullable|string'
        ]);

        DB::beginTransaction();

        try {
            $data = $request->except(['payment_receipt']);
            $data['date'] = $request->filled('date') ? $request->date : now();
            $data['is_deleted'] = 0;
            $data['status'] = 'AVAILABLE';
            
            // Set default values for required fields
            $data['rate'] = $request->per_dismil_amount ?? 0;
            $data['quantity'] = 1;
            $data['base_amount'] = ($data['area_dismil'] ?? 0) * ($data['per_dismil_amount'] ?? 0);
            $data['gst_percentage'] = 0;
            $data['gst_amount'] = 0;
            $data['other_expenses'] = 0;

            // Handle payment receipt upload
            if ($request->hasFile('payment_receipt')) {
                $file = $request->file('payment_receipt');
                $filename = time() . '_receipt_' . $file->getClientOriginalName();
                $data['payment_receipt'] = $file->storeAs('uploads/receipts', $filename, 'public');
            }

            $property = Property::create($data);

            // Create initial transaction if paid amount > 0
            if ($request->filled('paid_amount') && $request->paid_amount > 0) {
                $transactionData = [
                    'property_id'      => $property->id,
                    'sell_property_id' => null,
                    'type'             => 'DEBIT',
                    'amount'           => $request->paid_amount,
                    'payment_date'     => $request->filled('payment_date') ? $request->payment_date : $data['date'],
                    'payment_mode'     => $request->payment_mode ?? 'CASH',
                    'reference_no'     => 'PROP-' . $property->id . '-' . time(),
                    'transaction_no'   => $request->transaction_no,
                    'remarks'          => 'Initial property purchase payment',
                    'is_deleted'       => 0
                ];

                if ($request->hasFile('payment_receipt')) {
                    $file = $request->file('payment_receipt');
                    $filename = time() . '_payment_receipt_' . $file->getClientOriginalName();
                    $transactionData['payment_receipt'] = $file->storeAs('uploads/payment_receipts', $filename, 'public');
                }

                Transaction::create($transactionData);
            }

            // Create EMI schedule if period_years is provided
            if ($request->filled('period_years') && $request->period_years > 0 && $request->filled('amount_per_month')) {
                $totalMonths = $request->period_years * 12;
                $emiAmount = $request->amount_per_month;
                $startDate = $request->filled('payment_date') ? Carbon::parse($request->payment_date) : Carbon::parse($data['date']);
                
                for ($i = 1; $i <= $totalMonths; $i++) {
                    $dueDate = $startDate->copy()->addMonths($i);
                    
                    Emi::create([
                        'property_id' => $property->id,
                        'emi_number' => $i,
                        'emi_amount' => $emiAmount,
                        'due_date' => $dueDate,
                        'status' => 'PENDING',
                        'is_deleted' => 0
                    ]);
                }
            }

            DB::commit();
            return response()->json([
                'status' => true,
                'message' => 'Property created successfully',
                'data' => $property->load(['seller', 'emis'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Show Property Details
    public function show($id)
    {
        $property = Property::with([
            'documents', 
            'seller:id,name,phone,email'
        ])
        ->where('id', $id)
        ->where('is_deleted', 0)
        ->firstOrFail();

        // Get all buyers who purchased from this property
        $buyers = SellProperty::with('buyer:id,name,phone,email')
            ->where('property_id', $id)
            ->where('is_deleted', 0)
            ->get()
            ->map(function($sale) {
                return [
                    'sale_id' => $sale->id,
                    'buyer' => $sale->buyer,
                    'area_dismil' => $sale->area_dismil,
                    'per_dismil_amount' => $sale->per_dismil_amount,
                    'total_sale_amount' => $sale->total_sale_amount,
                    'received_amount' => $sale->received_amount,
                    'pending_amount' => $sale->pending_amount,
                    'sale_date' => $sale->sale_date,
                    'status' => $sale->pending_amount <= 0 ? 'FULLY_PAID' : 'PENDING'
                ];
            });

        $response = $property->toArray();
        $response['buyers'] = $buyers;
        $response['total_buyers'] = $buyers->count();
        $response['total_sold_area'] = $buyers->sum('area_dismil');
        $response['remaining_area'] = $property->area_dismil - $buyers->sum('area_dismil');

        return response()->json($response);
    }

    // Update Property Details
    public function update(Request $request, $id)
    {
        $property = Property::where('id', $id)->where('is_deleted', 0)->firstOrFail();

        // Validate Update
        $request->validate([
             'seller_id' => 'nullable|exists:customers,id', // Only update seller
             'documents' => 'nullable|array'
        ]);

        DB::beginTransaction();
        try {
            // Update Vendor if needed
            if ($request->filled('seller_id')) {
                $property->seller_id = $request->seller_id;
            }

            // Recalculate Financials
            $quantity   = $request->input('quantity', $property->quantity);
            $rate       = $request->input('rate', $property->rate);
            $baseAmount = $quantity * $rate;

            $gstPercent = $request->input('gst_percentage', $property->gst_percentage ?? 0);
            $gstAmount  = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;
            $other      = $request->input('other_expenses', $property->other_expenses ?? 0);
            $total      = $baseAmount + $gstAmount + $other;

            $paid       = $property->paid_amount; 
            $due        = $total - $paid;

            // Update Fields
            $data = $request->except(['_token', 'documents', 'paid_amount', 'buyer_id']);
            $data['base_amount']  = $baseAmount;
            $data['gst_amount']   = $gstAmount;
            $data['total_amount'] = $total;
            $data['due_amount']   = $due;

            $property->update($data);

            // Upload New Documents
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                    $filePath = $file->storeAs("uploads/properties/{$property->id}", $filename, 'public');

                    PropertyDocument::create([
                        'property_id' => $property->id,
                        'doc_name'    => $file->getClientOriginalName(),
                        'doc_file'    => $filePath,
                        'is_deleted'  => 0
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Updated successfully', 'data' => $property->load('seller')]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // Soft Delete Property
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $property = Property::findOrFail($id);
            
            // Cannot delete if Sold
            if($property->status === 'SOLD' || $property->status === 'BOOKED') {
                 return response()->json(['message' => 'Cannot delete sold property'], 400);
            }

            $property->update(['is_deleted' => 1]);
            
            // Delete related transactions
            Transaction::where('property_id', $property->id)->update(['is_deleted' => 1]);

            DB::commit();
            return response()->json(['message' => 'Moved to trash']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // View Trash
    public function trash()
    {
        $properties = Property::where('is_deleted', 1)->latest()->paginate(10);
        return response()->json($properties);
    }

    // Restore Property
    public function restore($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_deleted' => 0]);
        
        Transaction::where('property_id', $property->id)->update(['is_deleted' => 0]);

        return response()->json(['message' => 'Restored successfully']);
    }

    // Force Delete
    public function forceDelete($id)
    {
        $property = Property::findOrFail($id);
        $property->delete(); 
        return response()->json(['message' => 'Permanently deleted']);
    }
    // List Fully Paid Inventory (Ready to Sell)
    public function getReadyToSellProperties(Request $request)
{
    try {
        $query = Property::where('transaction_type', 'PURCHASE')
            ->whereIn('status', ['AVAILABLE', 'BOOKED'])
            ->where('is_deleted', 0);

        // Optional Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $properties = $query->latest('date')->get();

        return response()->json([
            'status' => true,
            'message' => 'Fetched ready-to-sell inventory',
            'data' => $properties
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}

    // Get 360-Degree Property View
  // Get 360-Degree Property View (Split Ledger)
    public function getCompletePropertyDetails($id)
    {
        // 1. Fetch Data
        $property = Property::with([
            'seller:id,name,phone,email', 
            'documents',
            // Fetch ALL transactions linked to this property
            'transactions' => function($q) { 
                $q->where('is_deleted', 0)->latest('payment_date');
            },
            'sell_deal' => function($q) { 
                $q->with(['buyer:id,name,phone,email', 'documents'])
                  ->where('is_deleted', 0);
            }
        ])
        ->where('id', $id)
        ->where('is_deleted', 0)
        ->firstOrFail();

        // 2. Separate Transactions
        // Logic: 
        // - Purchase Txn: Jisme sell_property_id NULL hai (Vendor ko diya)
        // - Sale Txn: Jisme sell_property_id Available hai (Customer se aaya)
        
        $purchaseTxns = $property->transactions->filter(function($t) {
            return $t->sell_property_id == null; 
        })->values();

        $saleTxns = $property->transactions->filter(function($t) {
            return $t->sell_property_id != null;
        })->values();

        // 3. Calculations
        $purchaseCost = $property->total_amount;
        $saleRevenue  = $property->sell_deal->total_sale_amount ?? 0;
        $isSold       = ($property->status !== 'AVAILABLE');
        $profit       = $isSold ? ($saleRevenue - $purchaseCost) : 0;

        // 4. Response Structure
        $data = [
            'status' => true,
            'overview' => [
                'id'       => $property->id,
                'title'    => $property->title,
                'category' => $property->category,
                'status'   => $property->status,
                'added_on' => $property->date,
            ],
            'financials' => [
                'purchase_cost' => $purchaseCost,
                'sale_revenue'  => $isSold ? $saleRevenue : 'Not Sold',
                'net_profit'    => $isSold ? $profit : 'N/A',
                'vendor_due'    => $property->due_amount,
                'customer_due'  => $property->sell_deal->pending_amount ?? 0
            ],
            'parties' => [
                'vendor' => $property->seller ?? null,
                'buyer'  => $property->sell_deal->buyer ?? null
            ],
            'documents' => [
                'inventory_docs' => $property->documents,
                'sale_docs'      => $property->sell_deal->documents ?? []
            ],
            // SPLIT LEDGER
            'ledger' => [
                'purchase_history' => $purchaseTxns, // Paisa Gaya (Out)
                'sale_history'     => $saleTxns      // Paisa Aaya (In)
            ]
        ];

        return response()->json($data);
    }
}