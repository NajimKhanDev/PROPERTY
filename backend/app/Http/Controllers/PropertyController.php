<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function index(Request $request)
    {
        // Fetch Active
        $query = Property::where('is_deleted', 0)->latest('date');

        // Filter Type
        if ($request->has('type') && !empty($request->type)) {
            $query->where('transaction_type', $request->type);
        }

        // Search Data
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('party_name', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('invoice_no', 'like', "%{$search}%");
            });
        }

        // Paginate Results
        $properties = $query->paginate(10);

        return view('properties.index', compact('properties'));
    }

    public function create()
    {
        return view('properties.create');
    }

    public function store(Request $request)
    {
        // 1. Validation (Strict check)
        $validatedData = $request->validate([
            // Mandatory Fields
            'transaction_type' => 'required|in:PURCHASE,SELL',
            'party_name'       => 'required|string|max:255',
            'title'            => 'required|string|max:255',
            'category'         => 'required|in:LAND,FLAT,HOUSE,COMMERCIAL,AGRICULTURE',
            'quantity'         => 'required|integer|min:1',
            'rate'             => 'required|numeric|min:0',
            
            // Nullable Fields (Agar aaye to thik, nahi to null)
            'date'                => 'nullable|date',
            'invoice_no'          => 'nullable|string|max:100',
            'party_phone'         => 'nullable|string|max:20',
            'address'             => 'nullable|string',
            'gst_percentage'      => 'nullable|integer|min:0|max:100',
            'other_expenses'      => 'nullable|numeric|min:0',
            'paid_amount'         => 'nullable|numeric|min:0',
            
            // Category Specific (Sab nullable)
            'area_dismil'         => 'nullable|numeric',
            'plot_number'         => 'nullable|string',
            'khata_number'        => 'nullable|string',
            'house_number'        => 'nullable|string',
            'floor_number'        => 'nullable|integer',
            'bhk'                 => 'nullable|integer',
            'super_built_up_area' => 'nullable|numeric',
            'status'              => 'nullable|in:AVAILABLE,SOLD'
        ]);

        // 2. Calculations (Auto Math)
        // Agar value nahi aayi to default 1 ya 0 le lenge
        $quantity      = $request->input('quantity', 1);
        $rate          = $request->input('rate', 0);
        $baseAmount    = $quantity * $rate;

        // GST Calc
        $gstPercent    = $request->input('gst_percentage', 0); // Default 0 agar khali ho
        $gstAmount     = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;

        // Total Calc
        $otherExpenses = $request->input('other_expenses', 0); // Default 0
        $totalAmount   = $baseAmount + $gstAmount + $otherExpenses;

        // Due Amount Calc
        $paidAmount    = $request->input('paid_amount', 0); // Default 0
        $dueAmount     = $totalAmount - $paidAmount;

        // 3. Prepare Data for Save
        // Hum $request->all() le rahe hain taaki sare extra fields (bhk, plot etc) aa jayein
        $data = $request->all();

        // Calculated values ko override/set kar rahe hain
        $data['base_amount']  = $baseAmount;
        $data['gst_amount']   = $gstAmount;
        $data['total_amount'] = $totalAmount;
        $data['due_amount']   = $dueAmount;
        $data['is_deleted']   = 0;

        // Date handle karna: Agar user ne date nahi di, to Aaj ki date
        if (!$request->filled('date')) {
            $data['date'] = now();
        }

        // 4. Create Record
        Property::create($data);

        return redirect()->route('properties.index')
            ->with('success', 'Property/Transaction added successfully.');
    }

    public function show($id)
    {
       
        $property = Property::with('documents') 
                    ->where('id', $id)
                    ->where('is_deleted', 0)
                    ->firstOrFail();

        

        return view('properties.show', compact('property'));
    }
    public function edit($id)
    {
        // Find Active
        $property = Property::where('id', $id)->where('is_deleted', 0)->firstOrFail();
        return view('properties.edit', compact('property'));
    }

  public function update(Request $request, $id)
    {
        // 1. Find Record
        $property = Property::where('id', $id)->where('is_deleted', 0)->firstOrFail();

        // 2. Validation (Same as store)
        $validatedData = $request->validate([
            'transaction_type' => 'required|in:PURCHASE,SELL',
            'party_name'       => 'required|string|max:255',
            'title'            => 'required|string|max:255',
            'category'         => 'required|in:LAND,FLAT,HOUSE,COMMERCIAL,AGRICULTURE',
            'quantity'         => 'required|integer|min:1',
            'rate'             => 'required|numeric|min:0',
            
            'date'                => 'nullable|date',
            'invoice_no'          => 'nullable|string',
            'party_phone'         => 'nullable|string',
            'address'             => 'nullable|string',
            'gst_percentage'      => 'nullable|integer|min:0',
            'other_expenses'      => 'nullable|numeric|min:0',
            'paid_amount'         => 'nullable|numeric|min:0',
            
            'area_dismil'         => 'nullable|numeric',
            'plot_number'         => 'nullable|string',
            'khata_number'        => 'nullable|string',
            'house_number'        => 'nullable|string',
            'floor_number'        => 'nullable|integer',
            'bhk'                 => 'nullable|integer',
            'super_built_up_area' => 'nullable|numeric',
            'status'              => 'nullable|in:AVAILABLE,SOLD'
        ]);

        // 3. Re-Calculations (Zaroori hai kyunki rate/qty change ho sakta hai)
        $quantity      = $request->input('quantity', 1);
        $rate          = $request->input('rate', 0);
        $baseAmount    = $quantity * $rate;

        $gstPercent    = $request->input('gst_percentage', 0);
        $gstAmount     = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;

        $otherExpenses = $request->input('other_expenses', 0);
        $totalAmount   = $baseAmount + $gstAmount + $otherExpenses;

        $paidAmount    = $request->input('paid_amount', 0);
        $dueAmount     = $totalAmount - $paidAmount;

        // 4. Prepare Update Data
        $data = $request->all();

        // Update calculated fields
        $data['base_amount']  = $baseAmount;
        $data['gst_amount']   = $gstAmount;
        $data['total_amount'] = $totalAmount;
        $data['due_amount']   = $dueAmount;

        
        
        // 5. Save Changes
        $property->update($data);

        return redirect()->route('properties.index')
            ->with('success', 'Property details updated successfully.');
    }

    public function destroy($id)
    {
        // Find Record
        $property = Property::findOrFail($id);

        // Soft Delete
        $property->update(['is_deleted' => 1]);

        return redirect()->route('properties.index')
            ->with('warning', 'Moved to Trash.');
    }

    public function trash()
    {
        // Fetch Trash
        $properties = Property::where('is_deleted', 1)->latest()->paginate(10);
        return view('properties.trash', compact('properties'));
    }

    public function restore($id)
    {
        // Find Record
        $property = Property::findOrFail($id);
        
        // Restore Item
        $property->update(['is_deleted' => 0]);

        return redirect()->route('properties.index')
            ->with('success', 'Item restored.');
    }

    public function forceDelete($id)
    {
        // Find Record
        $property = Property::findOrFail($id);
        
        // Hard Delete
        $property->delete();

        return redirect()->route('properties.trash')
            ->with('error', 'Permanently deleted.');
    }
}