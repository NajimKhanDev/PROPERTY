<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    private $superAdminRoleId = 1; 

    // Register User
    public function register(Request $request)
    {
        $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => [
                'required', 'email', 'max:255',
                Rule::unique('users')->where(fn($q) => $q->where('is_deleted', false))
            ],
            'role_id' => 'required|integer',
        ]);

        if ($request->role_id == $this->superAdminRoleId) {
            return response()->json(['message' => 'Cannot register Super Admin.'], 403);
        }

        $password = $request->password ?? "user@12345#";

        $user = User::create([
            'name'       => $request->name,
            'email'      => strtolower(trim($request->email)),
            'role_id'    => $request->role_id,
            'password'   => Hash::make($password),
            'status'     => $request->status ?? 1,
            'is_deleted' => false,
        ]);

        // Load Role Relationship
        $user->load('role');

        return response()->json([
            'message'  => 'User registered successfully!',
            'user'     => $user,
            'password' => $request->password ? null : $password
        ], 201);
    }

    // Login User
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Load Role with User
        $user = User::with('role')
            ->where('email', strtolower(trim($request->email)))
            ->where('is_deleted', false)
            ->where('status', 1)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.']
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful!',
            'token'   => $token,
            'user'    => $user
        ]);
    }

    // Profile (Current User)
    public function profile(Request $request)
    {
        $user = $request->user()->load('role');
        return response()->json($user);
    }

    // Show Single User (Admin View)
    public function show($id)
    {
        $user = User::with('role')->find($id);

        if (!$user || $user->is_deleted) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Hide Super Admin
        if ($user->id == 1 || $user->role_id == $this->superAdminRoleId) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        return response()->json($user);
    }

    // List Users (With Role Details)
    public function users(Request $request)
    {
        // 1. Eager Load 'role'
        $query = User::with('role')
            ->where('is_deleted', false)
            ->where('status', 1)
            ->where('id', '!=', 1) 
            ->where('role_id', '!=', $this->superAdminRoleId);

        // 2. Search
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // 3. Status Filter
        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('status', $request->status === 'Active' ? 1 : 0);
        }

        // 4. Role Filter
        if ($request->filled('role') && $request->role !== 'All') {
            $query->whereHas('role', function ($q) use ($request) {
                $q->where('role_name', $request->role);
            });
        }

        $perPage = (int) ($request->query('per_page', 10));

        return response()->json(
            $query->orderByDesc('id')->paginate($perPage)
        );
    }

    // Update User
    public function updateUser(Request $request, $id)
    {
        $userToUpdate = User::findOrFail($id);
        
        if ($userToUpdate->id == 1 || $userToUpdate->role_id == $this->superAdminRoleId) {
            return response()->json(['message' => 'Action unauthorized on Super Admin.'], 403);
        }

        if ($userToUpdate->is_deleted) {
            return response()->json(['message' => 'Cannot update deleted user.'], 400);
        }

        $request->merge(['email' => strtolower(trim($request->email))]);

        $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => [
                'sometimes', 'required', 'email', 'max:255',
                Rule::unique('users')->ignore($userToUpdate->id)->where(fn($q) => $q->where('is_deleted', false))
            ],
            'password' => 'nullable|string|min:6',
            'role_id'  => 'sometimes|required|integer',
            'status'   => 'nullable|boolean',
        ]);

        if ($request->role_id == $this->superAdminRoleId) {
            return response()->json(['message' => 'Cannot assign Super Admin role.'], 403);
        }

        $data = $request->only(['name', 'email', 'role_id', 'status']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $userToUpdate->update($data);
        
        // Return updated user with Role
        return response()->json([
            'message' => 'User updated successfully',
            'user'    => $userToUpdate->fresh()->load('role')
        ]);
    }

    // Change Password
    public function changePassword(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'old_password' => 'nullable|string',
            'new_password' => 'required|string|min:8|confirmed',
            'id'           => 'nullable|exists:users,id',
        ]);

        if ($request->has('id') && $request->id != $user->id) {
            if ($request->id == 1) return response()->json(['message' => 'Cannot change Super Admin password.'], 403);
            if ($user->role_id != $this->superAdminRoleId) return response()->json(['message' => 'Unauthorized action.'], 403);

            $targetUser = User::findOrFail($request->id);
            $targetUser->update(['password' => Hash::make($request->new_password)]);

            return response()->json(['message' => "Password changed for {$targetUser->name}."]);
        }

        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json(['message' => 'Old password incorrect'], 400);
        }

        $user->update(['password' => Hash::make($request->new_password)]);
        return response()->json(['message' => 'Password changed successfully']);
    }

    // Delete User
    public function deleteUser($id)
    {
        $userToDelete = User::findOrFail($id);
        $authedUser = Auth::user();

        if ($userToDelete->id == 1 || $userToDelete->role_id == $this->superAdminRoleId) {
            return response()->json(['message' => 'Cannot delete Super Admin.'], 403);
        }

        if ($userToDelete->id == $authedUser->id) {
            return response()->json(['message' => 'Cannot delete own account.'], 400);
        }

        if ($userToDelete->is_deleted) {
            return response()->json(['message' => 'User already deleted.'], 400);
        }

        $userToDelete->update(['is_deleted' => true, 'status' => 0]);
        return response()->json(['message' => 'User moved to trash.']);
    }

    // Restore User
    public function restoreUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->id == 1) return response()->json(['message' => 'Action unauthorized.'], 403);

        if (!$user->is_deleted) {
            return response()->json(['message' => 'User is active.'], 400);
        }

        $user->update(['is_deleted' => false, 'status' => 1]);
        return response()->json(['message' => 'User restored successfully.']);
    }

    // Trashed Users List
    public function trashedUsers()
    {
        $users = User::where('is_deleted', true)
                     ->where('id', '!=', 1)
                     ->with('role') // Eager load role here too
                     ->orderByDesc('id')
                     ->get();

        return response()->json($users);
    }
}