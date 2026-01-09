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
    // Super Admin ID constant
    private $superAdminRoleId = 1; 

    // Register new user
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

        // Prevent creating Super Admin
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

        $user->load('role');

        return response()->json([
            'message'  => 'User registered successfully!',
            'user'     => $user,
            'password' => $request->password ? null : $password
        ], 201);
    }

    // Login user
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', strtolower(trim($request->email)))
            ->where('is_deleted', false)
            ->where('status', 1)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.']
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('role');

        return response()->json([
            'message' => 'Login successful!',
            'token'   => $token,
            'user'    => $user
        ]);
    }

    // Get current profile
    public function profile(Request $request)
    {
        $user = $request->user()->load('role');
        return response()->json($user);
    }

    // List users (Hide Super Admin)
    public function users(Request $request)
    {
        // 1. Base Query
        $query = User::with('role')
            ->where('is_deleted', false)
            ->where('status', 1)
            // HIDE SUPER ADMIN (ID 1 and Role 1)
            ->where('id', '!=', 1) 
            ->where('role_id', '!=', $this->superAdminRoleId);

        // 2. Search Filter
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

    // Update user details
    public function updateUser(Request $request, $id)
    {
        $userToUpdate = User::findOrFail($id);
        
        // PROTECT SUPER ADMIN
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

        // Prevent assigning Super Admin role
        if ($request->role_id == $this->superAdminRoleId) {
            return response()->json(['message' => 'Cannot assign Super Admin role.'], 403);
        }

        $data = $request->only(['name', 'email', 'role_id', 'status']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $userToUpdate->update($data);
        return response()->json([
            'message' => 'User updated successfully',
            'user'    => $userToUpdate->fresh()->load('role')
        ]);
    }

    // Change password
    public function changePassword(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'old_password' => 'nullable|string',
            'new_password' => 'required|string|min:8|confirmed',
            'id'           => 'nullable|exists:users,id',
        ]);

        // Admin changing other's password
        if ($request->has('id') && $request->id != $user->id) {
            
            // Protect Super Admin Target
            if ($request->id == 1) {
                return response()->json(['message' => 'Cannot change Super Admin password.'], 403);
            }

            // Only Super Admin can do this
            if ($user->role_id != $this->superAdminRoleId) {
                return response()->json(['message' => 'Unauthorized action.'], 403);
            }

            $targetUser = User::findOrFail($request->id);
            $targetUser->update(['password' => Hash::make($request->new_password)]);

            return response()->json(['message' => "Password changed for {$targetUser->name}."]);
        }

        // Self change
        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json(['message' => 'Old password incorrect'], 400);
        }

        $user->update(['password' => Hash::make($request->new_password)]);
        return response()->json(['message' => 'Password changed successfully']);
    }

    // Soft delete user
    public function deleteUser($id)
    {
        $userToDelete = User::findOrFail($id);
        $authedUser = Auth::user();

        // Protect Super Admin
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

    // Restore user
    public function restoreUser($id)
    {
        $user = User::findOrFail($id);

        // Protect Super Admin (Just in case)
        if ($user->id == 1) {
             return response()->json(['message' => 'Action unauthorized.'], 403);
        }

        if (!$user->is_deleted) {
            return response()->json(['message' => 'User is active.'], 400);
        }

        $user->update(['is_deleted' => false, 'status' => 1]);
        return response()->json(['message' => 'User restored successfully.']);
    }

    // List trashed users
    public function trashedUsers()
    {
        // Hide Super Admin from trash
        $users = User::where('is_deleted', true)
                     ->where('id', '!=', 1)
                     ->with('role')
                     ->orderByDesc('id')
                     ->get();

        return response()->json($users);
    }
}