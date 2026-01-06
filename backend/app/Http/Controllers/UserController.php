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
    private $superAdminRoleId = 0;
    private $superAdminEmpId = 0;
    

    // =======================
    // REGISTER
    // =======================
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
            $exists = User::where('role_id', $this->superAdminRoleId)
                          ->where('is_deleted', false)
                          ->exists();

            if ($exists) {
                return response()->json(['message' => 'A Super Admin already exists.'], 403);
            }
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

    // =======================
    // LOGIN
    // =======================
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

    // =======================
    // PROFILE
    // =======================
    public function profile(Request $request)
    {
        $user = $request->user()->load('role');
        return response()->json($user);
    }

    // =======================
    // FILTERED USERS (BACKEND FILTER + PAGINATION)
    // =======================
  public function users(Request $request)
{
    $query = User::with('role')
        ->where('is_deleted', false)
        ->where('status', 1) //  inactive users exclude
        ->where('role_id', '!=', $this->superAdminRoleId);

    // Search filter
    if ($request->filled('search')) {
        $search = $request->query('search');
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    // Status filter (frontend se aaye tabhi)
    if ($request->filled('status') && $request->status !== 'All') {
        $query->where('status', $request->status === 'Active' ? 1 : 0);
    }

    // Role filter
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



    // =======================
    // UPDATE USER
    // =======================
    public function updateUser(Request $request, $id)
    {
        $userToUpdate = User::findOrFail($id);
        $authedUser = Auth::user();

        if ($userToUpdate->role_id == $this->superAdminRoleId && $authedUser->role_id != $this->superAdminRoleId) {
            return response()->json(['message' => 'You do not have permission to update the Super Admin.'], 403);
        }

        if ($userToUpdate->is_deleted) {
            return response()->json(['message' => 'Cannot update a deleted user.'], 400);
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

        if ($request->role_id == $this->superAdminRoleId && $authedUser->role_id != $this->superAdminRoleId) {
            return response()->json(['message' => 'You cannot assign Super Admin role.'], 403);
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

    // =======================
    // CHANGE PASSWORD
    // =======================
    public function changePassword(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'old_password' => 'nullable|string',
            'new_password' => 'required|string|min:8|confirmed',
            'id'           => 'nullable|exists:users,id',
        ]);

        // Super Admin can change others' password
        if ($request->has('id') && $request->id != $user->id) {
            if ($user->role_id != $this->superAdminRoleId) {
                return response()->json(['message' => 'Unauthorized action.'], 403);
            }

            $targetUser = User::findOrFail($request->id);
            $targetUser->update(['password' => Hash::make($request->new_password)]);

            return response()->json([
                'message' => "Password changed successfully for user {$targetUser->name}."
            ]);
        }

        // Regular user password change
        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json(['message' => 'Old password is incorrect'], 400);
        }

        $user->update(['password' => Hash::make($request->new_password)]);
        return response()->json(['message' => 'Password changed successfully']);
    }

    // =======================
    // DELETE (SOFT DELETE)
    // =======================
    public function deleteUser($id)
    {
        $userToDelete = User::findOrFail($id);
        $authedUser = Auth::user();

        if ($userToDelete->id == $authedUser->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 400);
        }

        if ($userToDelete->role_id == $this->superAdminRoleId) {
            return response()->json(['message' => 'Cannot delete Super Admin account.'], 403);
        }

        if ($userToDelete->is_deleted) {
            return response()->json(['message' => 'User already deleted.'], 400);
        }

        $userToDelete->update(['is_deleted' => true, 'status' => 0]);
        return response()->json(['message' => 'User moved to trash.']);
    }

    // =======================
    // RESTORE USER
    // =======================
    public function restoreUser($id)
    {
        $user = User::findOrFail($id);

        if (!$user->is_deleted) {
            return response()->json(['message' => 'User is already active.'], 400);
        }

        $user->update(['is_deleted' => false, 'status' => 1]);
        return response()->json(['message' => 'User restored successfully.']);
    }

    // =======================
    // TRASHED USERS
    // =======================
    public function trashedUsers()
    {
        $users = User::where('is_deleted', true)
                     ->with('role')
                     ->orderByDesc('id')
                     ->get();

        return response()->json($users);
    }
}
