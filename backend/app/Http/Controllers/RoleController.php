<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * List roles with filters
     */
   public function index(Request $request)
    {
        // Hide Super Admin
        $query = Role::query()
                     ->where('is_deleted', 0)
                     ->where('id', '!=', 1);

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
     * Create new role
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'role_name' => [
                'required', 'string', 'max:255',
                Rule::unique('roles')->where(fn($q) => $q->where('is_deleted', 0))
            ],
            'permissions' => 'nullable|array', // Accepts JSON permissions
            'status'      => 'required|boolean',
        ]);

        $validated['user_id'] = Auth::id();

        $role = Role::create($validated);

        return response()->json(['message' => 'Role created successfully.', 'data' => $role], 201);
    }

    /**
     * Show single role
     */
   // Show role
    public function show(Role $role)
    {
        // Hide Super Admin
        if ($role->id == 1 || $role->is_deleted) {
            return response()->json(['message' => 'Role not found.'], 404);
        }

        return response()->json(['data' => $role]);
    }
    /**
     * Update existing role
     */
    public function update(Request $request, Role $role)
    {
        // REMOVED: The Super Admin unauthorized check block

        if ($role->is_deleted) {
            return response()->json(['message' => 'Cannot update deleted role.'], 400);
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
     * Soft delete role
     */
    public function destroy(Role $role)
    {
        // Safety: Keep restriction here to prevent accidental system lockout
        if ($role->id == 1) {
            return response()->json(['message' => 'Cannot delete Super Admin.'], 403);
        }

        if ($role->is_deleted) {
            return response()->json(['message' => 'Already deleted.'], 400);
        }

        $role->update(['is_deleted' => true, 'status' => false]);

        return response()->json(['message' => 'Role moved to trash.']);
    }

    /**
     * Restore deleted role
     */
    public function restore($id)
    {
        $role = Role::findOrFail($id);

        if (!$role->is_deleted) {
            return response()->json(['message' => 'Role is already active.'], 400);
        }

        $role->update(['is_deleted' => false, 'status' => true]);

        return response()->json(['message' => 'Role restored successfully.']);
    }

    /**
     * List trashed roles
     */
    public function trashed()
    {
        $roles = Role::where('is_deleted', true)->latest()->get();
        return response()->json(['data' => $roles]);
    }
}