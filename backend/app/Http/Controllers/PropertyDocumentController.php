<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PropertyDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class PropertyDocumentController extends Controller
{
    // List active docs
    public function index(Request $request)
    {
        if (!$request->property_id) {
            return response()->json(['status' => false, 'message' => 'Property ID missing'], 400);
        }

        // Active scope applied automatically
        $docs = PropertyDocument::where('property_id', $request->property_id)->latest()->get();
        $docs->append('doc_file_url');

        return response()->json(['status' => true, 'data' => $docs]);
    }

    // Upload new doc
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'doc_name'    => 'required|string',
            'file'        => 'required|file|max:10240',
        ]);

        if ($validator->fails()) return response()->json(['status' => false, 'errors' => $validator->errors()], 422);

        try {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs("uploads/properties/{$request->property_id}", $filename, 'public');

            $doc = PropertyDocument::create([
                'property_id' => $request->property_id,
                'doc_name'    => $request->doc_name,
                'doc_file'    => $path,
                'is_deleted'  => 0
            ]);

            return response()->json(['status' => true, 'message' => 'File uploaded', 'data' => $doc], 201);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Soft delete (Move to Trash)
    public function destroy($id)
    {
        $doc = PropertyDocument::find($id);
        if (!$doc) return response()->json(['status' => false, 'message' => 'Not found'], 404);

        // Set deleted flag
        $doc->update(['is_deleted' => 1]);

        return response()->json(['status' => true, 'message' => 'Moved to trash']);
    }

    // Restore from Trash
    public function restore($id)
    {
        // Ignore scope to find deleted
        $doc = PropertyDocument::withoutGlobalScopes()
                               ->where('id', $id)
                               ->where('is_deleted', 1)
                               ->first();

        if (!$doc) return response()->json(['status' => false, 'message' => 'Not in trash'], 404);

        // Reset flag
        $doc->update(['is_deleted' => 0]);

        return response()->json(['status' => true, 'message' => 'Restored successfully']);
    }

    // View Trash (Deleted Docs)
    public function trash(Request $request)
    {
        if (!$request->property_id) {
            return response()->json(['status' => false, 'message' => 'Property ID missing'], 400);
        }

        // Fetch only deleted
        $docs = PropertyDocument::withoutGlobalScopes()
                                ->where('property_id', $request->property_id)
                                ->where('is_deleted', 1)
                                ->latest()
                                ->get();
        
        $docs->append('doc_file_url');

        return response()->json(['status' => true, 'data' => $docs]);
    }
}