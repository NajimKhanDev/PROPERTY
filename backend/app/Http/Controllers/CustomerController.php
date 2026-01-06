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
    // Fetch customers
    public function index()
    {
        try {
            $customers = Customer::latest()->paginate(10);
            return response()->json(['status' => true, 'data' => $customers]);
        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Create customer
    public function store(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|digits:10', // No unique check
            'type' => 'required|in:SELLER,BUYER,BOTH',
            'email' => [
                'nullable', 
                'email', 
                // Unique if active
                Rule::unique('customers')->where(fn ($q) => $q->where('is_deleted', 0))
            ],
            'pan_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
            'aadhar_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
        ]);

        if ($validator->fails()) return response()->json(['status' => false, 'errors' => $validator->errors()], 422);

        try {
            // Create record
            $customer = Customer::create([
                'name' => $request->name,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'type' => $request->type,
                'pan_number' => $request->pan_number,
                'aadhar_number' => $request->aadhar_number,
                'created_by' => Auth::id(), 
                'is_deleted' => 0
            ]);

            // Handle files
            $panPath = null;
            $aadharPath = null;

            // Upload PAN
            if ($request->hasFile('pan_file_path')) {
                $file = $request->file('pan_file_path');
                $name = $customer->id . '_pan_' . time() . '.' . $file->getClientOriginalExtension();
                $panPath = $file->storeAs('uploads/customers', $name, 'public');
            }

            // Upload Aadhaar
            if ($request->hasFile('aadhar_file_path')) {
                $file = $request->file('aadhar_file_path');
                $name = $customer->id . '_aadhar_' . time() . '.' . $file->getClientOriginalExtension();
                $aadharPath = $file->storeAs('uploads/customers', $name, 'public');
            }

            // Update paths
            $customer->update([
                'pan_file_path' => $panPath,
                'aadhar_file_path' => $aadharPath
            ]);

            return response()->json(['status' => true, 'message' => 'Created successfully', 'data' => $customer], 201);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Show customer
    public function show($id)
    {
        $customer = Customer::find($id);
        if (!$customer) return response()->json(['status' => false, 'message' => 'Not found'], 404);
        
        $customer->append(['pan_file_path', 'aadhar_file_path']);
        return response()->json(['status' => true, 'data' => $customer]);
    }

    // Update customer
    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);
        if (!$customer) return response()->json(['status' => false, 'message' => 'Not found'], 404);

        // Validate updates
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string',
            'phone' => 'sometimes|numeric|digits:10', // No unique check
            'email' => [
                'nullable', 
                'email', 
                // Ignore self, check active
                Rule::unique('customers')->ignore($customer->id)->where(fn ($q) => $q->where('is_deleted', 0))
            ],
            'pan_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
            'aadhar_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
        ]);

        if ($validator->fails()) return response()->json(['status' => false, 'errors' => $validator->errors()], 422);

        try {
            // Replace PAN
            if ($request->hasFile('pan_file_path')) {
                // Delete old
                if ($customer->pan_file_path && Storage::disk('public')->exists($customer->pan_file_path)) {
                    Storage::disk('public')->delete($customer->pan_file_path);
                }
                // Upload new
                $file = $request->file('pan_file_path');
                $name = $customer->id . '_pan_' . time() . '.' . $file->getClientOriginalExtension();
                $customer->pan_file_path = $file->storeAs('uploads/customers', $name, 'public');
            }

            // Replace Aadhaar
            if ($request->hasFile('aadhar_file_path')) {
                // Delete old
                if ($customer->aadhar_file_path && Storage::disk('public')->exists($customer->aadhar_file_path)) {
                    Storage::disk('public')->delete($customer->aadhar_file_path);
                }
                // Upload new
                $file = $request->file('aadhar_file_path');
                $name = $customer->id . '_aadhar_' . time() . '.' . $file->getClientOriginalExtension();
                $customer->aadhar_file_path = $file->storeAs('uploads/customers', $name, 'public');
            }

            // Update text
            $customer->update($request->except(['pan_file_path', 'aadhar_file_path', '_method']));
            $customer->save(); // Force save

            return response()->json(['status' => true, 'message' => 'Updated successfully', 'data' => $customer]);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Soft delete
    public function destroy($id)
    {
        $customer = Customer::find($id);
        if (!$customer) return response()->json(['status' => false, 'message' => 'Not found'], 404);

        $customer->update(['is_deleted' => 1]);
        return response()->json(['status' => true, 'message' => 'Deleted Successfully']);
    }

    // Restore customer

    public function restore($id)
    {
    
        $customer = Customer::withoutGlobalScopes()
                            ->where('id', $id)
                            ->where('is_deleted', 1)
                            ->first();

        if (!$customer) {
            return response()->json(['status' => false, 'message' => 'Not in trash (or ID not found)'], 404);
        }

        $customer->update(['is_deleted' => 0]);
        
        return response()->json(['status' => true, 'message' => 'Restored successfully']);
    }
    // List trash
    public function trash()
    {
        $data = Customer::withoutGlobalScope('active')->where('is_deleted', 1)->latest()->paginate(10);
        return response()->json(['status' => true, 'data' => $data]);
    }
}