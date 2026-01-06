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
            // FIX: Sirf active customers laye (jo deleted nahi hai)
            $customers = Customer::where('is_deleted', 0)->latest()->paginate(10);
            return response()->json(['status' => true, 'data' => $customers]);
        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Create customer
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|digits:10',
            'type' => 'required|in:SELLER,BUYER,BOTH',
            'email' => [
                'nullable', 
                'email', 
                Rule::unique('customers')->where(fn ($q) => $q->where('is_deleted', 0))
            ],
            'pan_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
            'aadhar_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
        ]);

        if ($validator->fails()) return response()->json(['status' => false, 'errors' => $validator->errors()], 422);

        try {
            $customer = Customer::create([
                'name' => $request->name,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'type' => $request->type,
                'pan_number' => $request->pan_number,
                'aadhar_number' => $request->aadhar_number,
                'created_by' => Auth::id() ?? 1, // Fallback to 1 if testing without login
                'is_deleted' => 0
            ]);

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

    // Show customer
    public function show($id)
    {
        // FIX: Check is_deleted = 0
        $customer = Customer::where('id', $id)->where('is_deleted', 0)->first();
        
        if (!$customer) return response()->json(['status' => false, 'message' => 'Not found'], 404);
        
        // FIX: Remove $customer->append(...) to avoid "undefined method" error
        // Agar full URL chahiye to yahan manually add kar sakte hain:
        // $customer->pan_url = $customer->pan_file_path ? asset('storage/'.$customer->pan_file_path) : null;

        return response()->json(['status' => true, 'data' => $customer]);
    }

    // Update customer
    public function update(Request $request, $id)
    {
        $customer = Customer::where('id', $id)->where('is_deleted', 0)->first();
        if (!$customer) return response()->json(['status' => false, 'message' => 'Not found'], 404);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string',
            'phone' => 'sometimes|numeric|digits:10',
            'email' => [
                'nullable', 
                'email', 
                Rule::unique('customers')->ignore($customer->id)->where(fn ($q) => $q->where('is_deleted', 0))
            ],
            'pan_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
            'aadhar_file_path' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
        ]);

        if ($validator->fails()) return response()->json(['status' => false, 'errors' => $validator->errors()], 422);

        try {
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

            // Explicitly exclude file inputs from mass update
            $data = $request->except(['pan_file_path', 'aadhar_file_path', '_method']);
            
            // Only update fields that are present in request
            $customer->fill($data);
            $customer->save();

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
        // FIX: Simple where query instead of global scope magic
        $customer = Customer::where('id', $id)->where('is_deleted', 1)->first();

        if (!$customer) {
            return response()->json(['status' => false, 'message' => 'Not in trash (or ID not found)'], 404);
        }

        $customer->update(['is_deleted' => 0]);
        
        return response()->json(['status' => true, 'message' => 'Restored successfully']);
    }

    // List trash
    public function trash()
    {
        // FIX: Simple where query
        $data = Customer::where('is_deleted', 1)->latest()->paginate(10);
        return response()->json(['status' => true, 'data' => $data]);
    }
}