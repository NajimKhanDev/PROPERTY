<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\SellProperty;
use App\Models\Transaction;
use App\Models\PropertyDocument;
use App\Models\SellEmi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon; 

class SellPropertyController extends Controller
{
    // List sales
    public function index(Request $request)
    {
        $query = SellProperty::with(['property', 'buyer:id,name,phone', 'transactions'])
                             ->where('is_deleted', 0)
                             ->latest('created_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('buyer', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('property', fn($sq) => $sq->where('title', 'like', "%{$search}%"))
                  ->orWhere('invoice_no', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(10));
    }

    // Create sale (Strict Validation Added)
    public function store(Request $request)
    {
        $request->validate([
            'property_id'        => 'required|exists:properties,id',
            'customer_id'        => 'required|exists:customers,id',
            'plot_number'        => 'nullable|string',
            'khata_number'       => 'nullable|string',
            'area_dismil'        => 'nullable|numeric|min:0',
            'per_dismil_amount'  => 'nullable|numeric|min:0',
            'total_amount'       => 'required|numeric|min:0',
            'paid_amount'        => 'nullable|numeric|min:0',
            'due_amount'         => 'nullable|numeric|min:0',
            'period_years'       => 'nullable|integer|min:1',
            'amount_per_month'   => 'nullable|numeric|min:0',
            'payment_mode'       => 'nullable|string',
            'payment_receipt'    => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'transaction_no'     => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $property = Property::findOrFail($request->property_id);

            if ($property->status !== 'AVAILABLE') {
                return response()->json(['message' => 'Property is already SOLD or BOOKED.'], 400);
            }

            $data = $request->except(['payment_receipt']);
            $data['sale_date'] = now();
            $data['invoice_no'] = 'SELL-' . time();
            $data['sale_rate'] = $request->per_dismil_amount ?? 0;
            $data['sale_base_amount'] = ($request->area_dismil ?? 0) * ($request->per_dismil_amount ?? 0);
            $data['gst_percentage'] = 0;
            $data['gst_amount'] = 0;
            $data['other_charges'] = 0;
            $data['discount_amount'] = 0;
            $data['total_sale_amount'] = $request->total_amount;
            $data['received_amount'] = $request->paid_amount ?? 0;
            $data['pending_amount'] = $request->due_amount ?? 0;
            $data['is_deleted'] = 0;

            if ($request->hasFile('payment_receipt')) {
                $file = $request->file('payment_receipt');
                $filename = time() . '_sell_receipt_' . $file->getClientOriginalName();
                $data['payment_receipt'] = $file->storeAs('uploads/sell_receipts', $filename, 'public');
            }

            $sale = SellProperty::create($data);

            // Create initial transaction if paid amount > 0
            if ($request->filled('paid_amount') && $request->paid_amount > 0) {
                $transactionData = [
                    'property_id'      => $property->id,
                    'sell_property_id' => $sale->id,
                    'type'             => 'CREDIT',
                    'amount'           => $request->paid_amount,
                    'payment_date'     => now(),
                    'payment_mode'     => $request->payment_mode ?? 'CASH',
                    'reference_no'     => 'SELL-' . $sale->id . '-' . time(),
                    'transaction_no'   => $request->transaction_no,
                    'remarks'          => 'Initial sale payment received',
                    'is_deleted'       => 0
                ];

                if ($request->hasFile('payment_receipt')) {
                    $file = $request->file('payment_receipt');
                    $filename = time() . '_sell_payment_receipt_' . $file->getClientOriginalName();
                    $transactionData['payment_receipt'] = $file->storeAs('uploads/sell_payment_receipts', $filename, 'public');
                }

                Transaction::create($transactionData);
            }

            $status = ($data['pending_amount'] <= 0) ? 'SOLD' : 'BOOKED';
            $property->update([
                'status'   => $status,
                'buyer_id' => $request->customer_id
            ]);

            // Create EMI schedule if period_years is provided
            if ($request->filled('period_years') && $request->period_years > 0 && $request->filled('amount_per_month')) {
                $totalMonths = $request->period_years * 12;
                $emiAmount = $request->amount_per_month;
                $startDate = Carbon::now();
                
                for ($i = 1; $i <= $totalMonths; $i++) {
                    $dueDate = $startDate->copy()->addMonths($i);
                    
                    SellEmi::create([
                        'sell_property_id' => $sale->id,
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
                'message' => 'Sale created successfully',
                'data' => $sale->load(['property', 'buyer', 'emis'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Show details
    public function show($id)
    {
        $sale = SellProperty::with([
            'property:id,title,category,area_dismil,address,plot_number,khata_number',
            'property.seller:id,name,phone,email',
            'buyer:id,name,phone,email',
            'documents',
            'transactions' => fn($q) => $q->where('is_deleted', 0)->latest('payment_date'),
            'emis' => fn($q) => $q->where('is_deleted', 0)->orderBy('emi_number')
        ])
        ->where('id', $id)
        ->where('is_deleted', 0)
        ->first();

        if (!$sale) {
            return response()->json(['message' => 'Sell property not found'], 404);
        }

        $response = $sale->toArray();
        $response['payment_summary'] = [
            'total_amount' => $sale->total_sale_amount,
            'received_amount' => $sale->received_amount,
            'pending_amount' => $sale->pending_amount,
            'payment_status' => $sale->pending_amount <= 0 ? 'FULLY_PAID' : 'PENDING'
        ];
        $response['emi_summary'] = [
            'total_emis' => $sale->emis->count(),
            'paid_emis' => $sale->emis->where('status', 'PAID')->count(),
            'pending_emis' => $sale->emis->where('status', 'PENDING')->count()
        ];

        return response()->json($response);
    }

    // Update sale
    public function update(Request $request, $id)
    {
        $sale = SellProperty::with('property')->where('id', $id)->where('is_deleted', 0)->firstOrFail();

        $request->validate([
            'customer_id'    => 'required|exists:customers,id',
            'sale_rate'      => 'required|numeric|min:1',
            'document'       => 'nullable|file|mimes:pdf,jpg,png|max:5120'
        ]);

        DB::beginTransaction();
        try {
            $quantity = $sale->property->quantity ?? 1;

            // Recalculate
            $baseAmount = $request->sale_rate * $quantity;
            $gstPercent = $request->gst_percentage ?? $sale->gst_percentage;
            $gstAmount  = ($baseAmount * $gstPercent) / 100;
            $other      = $request->other_charges ?? $sale->other_charges;
            $discount   = $request->discount ?? $sale->discount_amount;

            $newTotal   = ($baseAmount + $gstAmount + $other) - $discount;
            $newPending = $newTotal - $sale->received_amount;

            $sale->update([
                'customer_id'       => $request->customer_id,
                'sale_rate'         => $request->sale_rate,
                'sale_base_amount'  => $baseAmount,
                'gst_amount'        => $gstAmount,
                'total_sale_amount' => $newTotal,
                'pending_amount'    => $newPending,
                'remarks'           => $request->remarks ?? $sale->remarks
            ]);

            // Add New Document
            if ($request->hasFile('document')) {
                $file = $request->file('document');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs("uploads/properties/{$sale->property_id}/sales/{$sale->id}", $filename, 'public');

                PropertyDocument::create([
                    'property_id'      => $sale->property_id,
                    'sell_property_id' => $sale->id,
                    'doc_name'         => 'Updated Sale Doc',
                    'doc_file'         => $path,
                    'is_deleted'       => 0
                ]);
            }

            // Update status
            $status = ($newPending <= 0) ? 'SOLD' : 'BOOKED';
            $sale->property()->update(['status' => $status, 'buyer_id' => $request->customer_id]);

            DB::commit();
            return response()->json(['message' => 'Sale updated', 'data' => $sale]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // Delete sale
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $sale = SellProperty::findOrFail($id);
            $sale->update(['is_deleted' => 1]);

            // Revert inventory
            $sale->property()->update(['status' => 'AVAILABLE', 'buyer_id' => null]);

            // Remove transactions & docs
            Transaction::where('sell_property_id', $sale->id)->update(['is_deleted' => 1]);
            PropertyDocument::where('sell_property_id', $sale->id)->update(['is_deleted' => 1]);

            DB::commit();
            return response()->json(['message' => 'Sale cancelled']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}