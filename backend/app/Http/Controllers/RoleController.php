<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{

   public function index(Request $request)
{
    $query = Role::query()
        ->where('is_deleted', 0);
        // ->where('id', '!=', 0); // Super Admin ko exclude kiya

    // Search
    if ($request->filled('search')) {
        $query->where('role_name', 'LIKE', '%' . $request->search . '%');
    }

    // Status filter
    if ($request->status && $request->status !== 'All') {
        $query->where('status', $request->status === 'Active');
    }

    // Pagination
    $perPage = $request->get('per_page', 10);
    $roles = $query->latest()->paginate($perPage);

    return response()->json($roles);
}


    public function store(Request $request)
    {
        $validated = $request->validate([
            'role_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles')->where(fn($query) => $query->where('is_deleted', 0)),
            ],
            'status' => 'required|boolean',
        ]);

        $validated['user_id'] = Auth::id();
        $role = Role::create($validated);

        return response()->json(['message' => 'Role created successfully.', 'data' => $role], 201);
    }

    public function show(Role $role)
    {
        // ID 1 ko show bhi nahi hone dena hai
        if ($role->is_deleted || $role->id == 1) {
            return response()->json(['message' => 'Role not found.'], 404);
        }
        return response()->json(['data' => $role]);
    }

    public function update(Request $request, Role $role)
    {
        // === SECURITY CHECK ===
        if ($role->id == 1) {
            if (Auth::id() != 0) {
                return response()->json(['message' => 'You do not have permission to update the Super Admin role.'], 403);
            }
        }
        // === END SECURITY CHECK ===

        if ($role->is_deleted) {
            return response()->json(['message' => 'Cannot update a deleted role.'], 400);
        }

        $validated = $request->validate([
            'role_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles')->ignore($role->id)->where(fn($query) => $query->where('is_deleted', 0)),
            ],
            'status' => 'required|boolean',
        ]);

        $role->update($validated);

        return response()->json(['message' => 'Role updated successfully.', 'data' => $role->fresh()]);
    }

    public function destroy(Role $role)
    {
        // === SECURITY CHECK ===
        if ($role->id == 0) {
            return response()->json(['message' => 'The Super Admin role cannot be deleted.'], 403);
        }
        // === END SECURITY CHECK ===

        if ($role->is_deleted) {
            return response()->json(['message' => 'Role already deleted.'], 400);
        }

        $role->update([
            'is_deleted' => true,
            'status' => false,
        ]);

        return response()->json(['message' => 'Role moved to trash.']);
    }

    public function restore($id)
    {
        if ($id == 1) {
             return response()->json(['message' => 'This action is not applicable.'], 400);
        }

        $role = Role::findOrFail($id);

        if (!$role->is_deleted) {
            return response()->json(['message' => 'Role is already active.'], 400);
        }

        $role->update([
            'is_deleted' => false,
            'status' => true,
        ]);

        return response()->json(['message' => 'Role restored successfully.']);
    }

    public function trashed()
    {
        $roles = Role::where('is_deleted', true)->latest()->get();
        return response()->json(['data' => $roles]);
    }
}