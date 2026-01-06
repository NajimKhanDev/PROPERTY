<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Display a listing of roles with filtering.
     */
    public function index(Request $request)
    {
        $query = Role::query()->where('is_deleted', 0);

        if ($request->filled('search')) {
            $query->where('role_name', 'LIKE', '%' . $request->search . '%');
        }

        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('status', $request->status === 'Active');
        }

        $roles = $query->latest()->paginate($request->get('per_page', 10));

        return response()->json($roles);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'role_name' => [
                'required', 'string', 'max:255',
                Rule::unique('roles')->where(fn($q) => $q->where('is_deleted', 0))
            ],
            'permissions' => 'nullable|array', // Handles JSON permissions
            'status'      => 'required|boolean',
        ]);

        $validated['user_id'] = Auth::id();

        $role = Role::create($validated);

        return response()->json(['message' => 'Role created successfully.', 'data' => $role], 201);
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role)
    {
        if ($role->is_deleted || $role->id == 1) {
            return response()->json(['message' => 'Role not found or restricted.'], 404);
        }

        return response()->json(['data' => $role]);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, Role $role)
    {
        // Restrict Super Admin updates
        if ($role->id == 1 && Auth::id() != 0) {
            return response()->json(['message' => 'Unauthorized action on Super Admin.'], 403);
        }

        if ($role->is_deleted) {
            return response()->json(['message' => 'Cannot update a deleted role.'], 400);
        }

        $validated = $request->validate([
            'role_name' => [
                'required', 'string', 'max:255',
                Rule::unique('roles')->ignore($role->id)->where(fn($q) => $q->where('is_deleted', 0))
            ],
            'permissions' => 'nullable|array',
            'status'      => 'required|boolean',
        ]);

        $role->update($validated);

        return response()->json(['message' => 'Role updated successfully.', 'data' => $role->fresh()]);
    }

    /**
     * Remove the specified role (Soft Delete).
     */
    public function destroy(Role $role)
    {
        if ($role->id == 1) {
            return response()->json(['message' => 'Super Admin role cannot be deleted.'], 403);
        }

        if ($role->is_deleted) {
            return response()->json(['message' => 'Role is already deleted.'], 400);
        }

        $role->update(['is_deleted' => true, 'status' => false]);

        return response()->json(['message' => 'Role moved to trash.']);
    }

    /**
     * Restore a soft-deleted role.
     */
    public function restore($id)
    {
        if ($id == 1) {
             return response()->json(['message' => 'Action not applicable.'], 400);
        }

        $role = Role::findOrFail($id);

        if (!$role->is_deleted) {
            return response()->json(['message' => 'Role is already active.'], 400);
        }

        $role->update(['is_deleted' => false, 'status' => true]);

        return response()->json(['message' => 'Role restored successfully.']);
    }

    /**
     * List trashed roles.
     */
    public function trashed()
    {
        $roles = Role::where('is_deleted', true)->latest()->get();
        return response()->json(['data' => $roles]);
    }
}