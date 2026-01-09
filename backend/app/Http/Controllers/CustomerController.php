<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    // Fetch active customers
    public function index()
    {
        try {
            // Get non-deleted records
            $customers = Customer::where('is_deleted', 0)->latest()->paginate(10);
            return response()->json(['status' => true, 'data' => $customers]);
        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Create new customer
    public function store(Request $request)
    {
        // Define unique scope
        $uniqueRule = Rule::unique('customers')->where(fn ($q) => $q->where('is_deleted', 0));

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|digits:10', // Duplicates allowed
            'type' => 'required|in:SELLER,BUYER,BOTH',
            'email' => ['nullable', 'email', $uniqueRule],
            
            // Validate distinct IDs
            'pan_number' => [
                'required', 'string', 'alpha_num', 
                'different:aadhar_number', 
                $uniqueRule
            ], 
            'aadhar_number' => [
                'required', 'numeric', 'digits:12', 
                'different:pan_number', 
                $uniqueRule
            ],
            
            'pan_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
            'aadhar_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
        ], [
            'pan_number.unique' => 'PAN already registered.',
            'aadhar_number.unique' => 'Aadhar already registered.',
            'pan_number.different' => 'PAN matches Aadhar.',
            'aadhar_number.different' => 'Aadhar matches PAN.',
        ]);

        if ($validator->fails()) return response()->json(['status' => false, 'errors' => $validator->errors()], 422);

        try {
            // Create customer record
            $customer = Customer::create([
                'name' => $request->name,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'type' => $request->type,
                'pan_number' => $request->pan_number,
                'aadhar_number' => $request->aadhar_number,
                'created_by' => Auth::id() ?? 1,
                'is_deleted' => 0
            ]);

            // Handle file uploads
            $panPath = null;
            $aadharPath = null;

            if ($request->hasFile('pan_file_path')) {
                $file = $request->file('pan_file_path');
                $name = $customer->id . '_pan_' . time() . '.' . $file->getClientOriginalExtension();
                $panPath = $file->storeAs('uploads/customers', $name, 'public');
            }

            if ($request->hasFile('aadhar_file_path')) {
                $file = $request->file('aadhar_file_path');
                $name = $customer->id . '_aadhar_' . time() . '.' . $file->getClientOriginalExtension();
                $aadharPath = $file->storeAs('uploads/customers', $name, 'public');
            }

            $customer->update([
                'pan_file_path' => $panPath,
                'aadhar_file_path' => $aadharPath
            ]);

            return response()->json(['status' => true, 'message' => 'Created successfully', 'data' => $customer], 201);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

  // Show single customer with Full History
    public function show($id)
    {
        // 1. Find Customer
        $customer = Customer::where('id', $id)
                            ->where('is_deleted', 0)
                            ->first();

        if (!$customer) {
            return response()->json(['status' => false, 'message' => 'Not found'], 404);
        }

        // 2. Load Relationships (History)
        // A. Purchases: Jo unhone humse khareeda (via SellProperty table)
        $purchases = \App\Models\SellProperty::with('property:id,title,category')
                        ->where('customer_id', $id)
                        ->where('is_deleted', 0)
                        ->latest('sale_date')
                        ->get()
                        ->map(function($deal) {
                            return [
                                'deal_id'     => $deal->id,
                                'property'    => $deal->property->title ?? 'N/A',
                                'category'    => $deal->property->category ?? 'N/A',
                                'invoice_no'  => $deal->invoice_no,
                                'date'        => $deal->sale_date,
                                'amount'      => $deal->total_sale_amount,
                                'paid'        => $deal->received_amount,
                                'due'         => $deal->pending_amount,
                                'status'      => ($deal->pending_amount <= 0) ? 'CLEARED' : 'PENDING'
                            ];
                        });

        // B. Supplies: Jo unhone humein becha (via Property/Inventory table)
        $supplies = \App\Models\Property::where('seller_id', $id)
                        ->where('transaction_type', 'PURCHASE')
                        ->where('is_deleted', 0)
                        ->latest('date')
                        ->get()
                        ->map(function($prop) {
                            return [
                                'property_id' => $prop->id,
                                'title'       => $prop->title,
                                'category'    => $prop->category,
                                'date'        => $prop->date,
                                'cost'        => $prop->total_amount,
                                'paid_by_us'  => $prop->paid_amount,
                                'we_owe'      => $prop->due_amount, // Humare upar udhaari
                                'status'      => ($prop->due_amount <= 0) ? 'CLEARED' : 'PAYABLE'
                            ];
                        });

        // 3. Financial Summary (Optional but helpful)
        $totalBought = $purchases->sum('amount');
        $totalSold   = $supplies->sum('cost');

        return response()->json([
            'status' => true,
            'data'   => [
                'profile' => $customer,
                'summary' => [
                    'total_purchased_from_us' => $totalBought,
                    'total_sold_to_us'        => $totalSold,
                ],
                'history' => [
                    'purchases_list' => $purchases, // List of what he bought
                    'supplies_list'  => $supplies   // List of what he sold to us
                ]
            ]
        ]);
    }

    // Update customer details
    public function update(Request $request, $id)
    {
        $customer = Customer::where('id', $id)->where('is_deleted', 0)->first();
        if (!$customer) return response()->json(['status' => false, 'message' => 'Not found'], 404);

        // Ignore current record
        $uniqueRule = Rule::unique('customers')->ignore($customer->id)->where(fn ($q) => $q->where('is_deleted', 0));

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string',
            'phone' => 'sometimes|numeric|digits:10', // Duplicates allowed
            'type' => 'sometimes|in:SELLER,BUYER,BOTH',
            'email' => ['nullable', 'email', $uniqueRule],
            
            // Validate distinct IDs
            'pan_number' => [
                'sometimes', 'string', 'alpha_num', 
                'different:aadhar_number', 
                $uniqueRule
            ],
            'aadhar_number' => [
                'sometimes', 'numeric', 'digits:12', 
                'different:pan_number', 
                $uniqueRule
            ],
            
            'pan_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
            'aadhar_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
        ], [
            'pan_number.unique' => 'PAN already taken.',
            'aadhar_number.unique' => 'Aadhar already taken.',
            'pan_number.different' => 'PAN matches Aadhar.',
            'aadhar_number.different' => 'Aadhar matches PAN.',
        ]);

        if ($validator->fails()) return response()->json(['status' => false, 'errors' => $validator->errors()], 422);

        try {
            // Handle file replacements
            if ($request->hasFile('pan_file_path')) {
                if ($customer->pan_file_path && Storage::disk('public')->exists($customer->pan_file_path)) {
                    Storage::disk('public')->delete($customer->pan_file_path);
                }
                $file = $request->file('pan_file_path');
                $name = $customer->id . '_pan_' . time() . '.' . $file->getClientOriginalExtension();
                $customer->pan_file_path = $file->storeAs('uploads/customers', $name, 'public');
            }

            if ($request->hasFile('aadhar_file_path')) {
                if ($customer->aadhar_file_path && Storage::disk('public')->exists($customer->aadhar_file_path)) {
                    Storage::disk('public')->delete($customer->aadhar_file_path);
                }
                $file = $request->file('aadhar_file_path');
                $name = $customer->id . '_aadhar_' . time() . '.' . $file->getClientOriginalExtension();
                $customer->aadhar_file_path = $file->storeAs('uploads/customers', $name, 'public');
            }

            $data = $request->except(['pan_file_path', 'aadhar_file_path', '_method']);
            
            $customer->fill($data);
            $customer->save();

            return response()->json(['status' => true, 'message' => 'Updated successfully', 'data' => $customer]);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Soft delete customer
    public function destroy($id)
    {
        $customer = Customer::find($id);
        if (!$customer) return response()->json(['status' => false, 'message' => 'Not found'], 404);

        $customer->update(['is_deleted' => 1]);
        return response()->json(['status' => true, 'message' => 'Deleted Successfully']);
    }

    // Restore deleted customer
    public function restore($id)
    {
        // Find in trash
        $customer = Customer::where('id', $id)->where('is_deleted', 1)->first();

        if (!$customer) {
            return response()->json(['status' => false, 'message' => 'Not found/trashed'], 404);
        }

        $customer->update(['is_deleted' => 0]);
        
        return response()->json(['status' => true, 'message' => 'Restored successfully']);
    }

    // List trashed customers
    public function trash()
    {
        // Fetch deleted records
        $data = Customer::where('is_deleted', 1)->latest()->paginate(10);
        return response()->json(['status' => true, 'data' => $data]);
    }
}