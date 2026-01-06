<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    // Document Upload karne ka function
    public function store(Request $request)
    {
        // 1. Validation
        $request->validate([
            'property_id' => 'required|exists:properties,id',
            'doc_name'    => 'required|string|max:255',
            'doc_file'    => 'required|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120', // Max 5MB
        ]);

        // 2. File Handling
        if ($request->hasFile('doc_file')) {
            $file = $request->file('doc_file');
            
            // Filename generate karna (e.g., 123456789_registry.pdf)
            $filename = time() . '_' . $file->getClientOriginalName();
            
            // File ko 'public/documents' folder me save karna
            // Note: Command 'php artisan storage:link' run karna mat bhulna
            $filePath = $file->storeAs('documents', $filename, 'public');

            // 3. Database Entry
            Document::create([
                'property_id' => $request->property_id,
                'doc_name'    => $request->doc_name,
                'doc_file'    => $filePath, // Path save hoga (e.g., documents/filename.pdf)
                'is_deleted'  => 0
            ]);

            return back()->with('success', 'Document uploaded successfully.');
        }

        return back()->with('error', 'File upload failed.');
    }

    // Document Delete karne ka function (Soft Delete)
    public function destroy($id)
    {
        $document = Document::findOrFail($id);

        // Sirf flag change kar rahe hain (File server pe rahegi safe side ke liye)
        $document->update(['is_deleted' => 1]);

        return back()->with('warning', 'Document deleted.');
    }
    
    // Agar future me Permanent Delete chahiye (File bhi udaani hai)
    public function forceDelete($id)
    {
        $document = Document::findOrFail($id);
        
        // 1. File delete from storage
        if(Storage::disk('public')->exists($document->doc_file)){
            Storage::disk('public')->delete($document->doc_file);
        }

        // 2. Record delete from DB
        $document->delete();

        return back()->with('error', 'Document permanently deleted.');
    }
}