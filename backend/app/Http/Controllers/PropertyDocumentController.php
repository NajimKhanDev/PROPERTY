<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PropertyDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class PropertyDocumentController extends Controller
{
    // List documents
    public function index(Request $request)
    {
        // 1. Sale documents
        if ($request->filled('sell_property_id')) {
            $docs = PropertyDocument::where('sell_property_id', $request->sell_property_id)
                                    ->latest()->get();
        } 
        // 2. Inventory documents
        elseif ($request->filled('property_id')) {
            $docs = PropertyDocument::where('property_id', $request->property_id)
                                    ->whereNull('sell_property_id') // Strict check
                                    ->latest()->get();
        } 
        else {
            return response()->json(['status' => false, 'message' => 'ID missing'], 400);
        }

        $docs->append('doc_file_url');
        return response()->json(['status' => true, 'data' => $docs]);
    }

    // Upload document
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id'      => 'required|exists:properties,id',
            'sell_property_id' => 'nullable|exists:sell_properties,id',
            'doc_name'         => 'required|string',
            'file'             => 'required|file|max:10240',
        ]);

        if ($validator->fails()) return response()->json(['status' => false, 'errors' => $validator->errors()], 422);

        try {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            
            // Set path
            $folder = "uploads/properties/{$request->property_id}";
            
            // Separate sales
            if($request->sell_property_id) {
                $folder .= "/sales/{$request->sell_property_id}";
            }

            $path = $file->storeAs($folder, $filename, 'public');

            // Save record
            $doc = PropertyDocument::create([
                'property_id'      => $request->property_id,
                'sell_property_id' => $request->sell_property_id,
                'doc_name'         => $request->doc_name,
                'doc_file'         => $path,
                'is_deleted'       => 0
            ]);

            return response()->json(['status' => true, 'message' => 'File uploaded', 'data' => $doc], 201);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Soft delete
    public function destroy($id)
    {
        $doc = PropertyDocument::find($id);
        if (!$doc) return response()->json(['status' => false, 'message' => 'Not found'], 404);

        $doc->update(['is_deleted' => 1]);
        return response()->json(['status' => true, 'message' => 'Moved trash']);
    }

    // Restore document
    public function restore($id)
    {
        $doc = PropertyDocument::withoutGlobalScopes()
                               ->where('id', $id)
                               ->where('is_deleted', 1)
                               ->first();

        if (!$doc) return response()->json(['status' => false, 'message' => 'Not found'], 404);

        $doc->update(['is_deleted' => 0]);
        return response()->json(['status' => true, 'message' => 'Restored successfully']);
    }

    // View trash
    public function trash(Request $request)
    {
        $query = PropertyDocument::withoutGlobalScopes()->where('is_deleted', 1);

        // Filter trash
        if ($request->filled('sell_property_id')) {
            $query->where('sell_property_id', $request->sell_property_id);
        } elseif ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id)
                  ->whereNull('sell_property_id');
        } else {
            return response()->json(['status' => false, 'message' => 'ID missing'], 400);
        }

        $docs = $query->latest()->get();
        $docs->append('doc_file_url');

        return response()->json(['status' => true, 'data' => $docs]);
    }
}