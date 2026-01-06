<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    // GET: List all active properties
    public function index(Request $request)
    {
        $query = Property::where('is_deleted', 0)->latest('date');

        if ($request->filled('type')) {
            $query->where('transaction_type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('party_name', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('invoice_no', 'like', "%{$search}%");
            });
        }

        $properties = $query->paginate(10);

        return response()->json($properties);
    }

    // POST: Create a new property
    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_type' => 'required|in:PURCHASE,SELL',
            'party_name'       => 'required|string|max:255',
            'title'            => 'required|string|max:255',
            'category'         => 'required|in:LAND,FLAT,HOUSE,COMMERCIAL,AGRICULTURE',
            'quantity'         => 'required|integer|min:1',
            'rate'             => 'required|numeric|min:0',
        ]);

        // Calculations
        $quantity      = $request->input('quantity', 1);
        $rate          = $request->input('rate', 0);
        $baseAmount    = $quantity * $rate;
        
        $gstPercent    = $request->input('gst_percentage', 0);
        $gstAmount     = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;
        
        $otherExpenses = $request->input('other_expenses', 0);
        $totalAmount   = $baseAmount + $gstAmount + $otherExpenses;
        
        $paidAmount    = $request->input('paid_amount', 0);
        $dueAmount     = $totalAmount - $paidAmount;

        // Prepare Data
        $data = $request->except(['_token']); 
        $data['base_amount']  = $baseAmount;
        $data['gst_amount']   = $gstAmount;
        $data['total_amount'] = $totalAmount;
        $data['due_amount']   = $dueAmount;
        $data['is_deleted']   = 0;

        if (!$request->filled('date')) {
            $data['date'] = now();
        }

        $property = Property::create($data);

        return response()->json(['message' => 'Created successfully', 'data' => $property], 201);
    }

    // GET: Show single property
    public function show($id)
    {
        $property = Property::with('documents')
                    ->where('id', $id)
                    ->where('is_deleted', 0)
                    ->firstOrFail();

        return response()->json($property);
    }

    // PUT/PATCH: Update property
    public function update(Request $request, $id)
    {
        $property = Property::where('id', $id)->where('is_deleted', 0)->firstOrFail();

        // Calculations for update
        $quantity      = $request->input('quantity', $property->quantity);
        $rate          = $request->input('rate', $property->rate);
        $baseAmount    = $quantity * $rate;

        $gstPercent    = $request->input('gst_percentage', $property->gst_percentage ?? 0);
        $gstAmount     = ($gstPercent > 0) ? ($baseAmount * ($gstPercent / 100)) : 0;

        $otherExpenses = $request->input('other_expenses', $property->other_expenses ?? 0);
        $totalAmount   = $baseAmount + $gstAmount + $otherExpenses;

        $paidAmount    = $request->input('paid_amount', $property->paid_amount ?? 0);
        $dueAmount     = $totalAmount - $paidAmount;

        // Update Data
        $data = $request->except(['_token']);
        $data['base_amount']  = $baseAmount;
        $data['gst_amount']   = $gstAmount;
        $data['total_amount'] = $totalAmount;
        $data['due_amount']   = $dueAmount;

        $property->update($data);

        return response()->json(['message' => 'Updated successfully', 'data' => $property]);
    }

    // DELETE: Soft Delete (Trash)
    public function destroy($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_deleted' => 1]);

        return response()->json(['message' => 'Moved to trash']);
    }

    // GET: View Trash
    public function trash()
    {
        $properties = Property::where('is_deleted', 1)->latest()->paginate(10);
        return response()->json($properties);
    }

    // PATCH: Restore
    public function restore($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_deleted' => 0]);

        return response()->json(['message' => 'Restored successfully']);
    }

    // DELETE: Force Delete
    public function forceDelete($id)
    {
        $property = Property::findOrFail($id);
        $property->delete(); 

        return response()->json(['message' => 'Permanently deleted']);
    }
}