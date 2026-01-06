<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\DocumentController;



// Auth routes

Route::post('/login', [UserController::class, 'login']);
Route::post('/register', [UserController::class, 'register']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {


    Route::post('/change-password', [UserController::class, 'changePassword']);
    // Logged-in user profile
    Route::get('/profile', [UserController::class, 'profile']);

    //  Users management
    Route::get('/users', [UserController::class, 'users']);
    Route::get('/users/{id}', [UserController::class, 'profile']);
    Route::put('/users/{id}', [UserController::class, 'updateUser']);
    Route::delete('/users/{id}', [UserController::class, 'deleteUser']);

    // --- Role CRUD Routes ---
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::get('/roles/{role}', [RoleController::class, 'show']);
    Route::put('/roles/{role}', [RoleController::class, 'update']);
    Route::delete('/roles/{role}', [RoleController::class, 'destroy']);

    // --- Soft Delete Extensions ---
    Route::get('/roles/trash', [RoleController::class, 'trashed']);
    Route::patch('/roles/restore/{id}', [RoleController::class, 'restore']);



    // Custom routes
    Route::get('customers/trash', [CustomerController::class, 'trash']);
    Route::post('customers/{id}/restore', [CustomerController::class, 'restore']);

    // Standard CRUD
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

    //Documents
    // Trash & Restore
    Route::get('property-docs/trash', [PropertyDocumentController::class, 'trash']); // ?property_id=1
    Route::post('property-docs/{id}/restore', [PropertyDocumentController::class, 'restore']);

    // Standard CRUD
    Route::get('property-docs', [PropertyDocumentController::class, 'index']); // ?property_id=1
    Route::post('property-docs', [PropertyDocumentController::class, 'store']);
    Route::delete('property-docs/{id}', [PropertyDocumentController::class, 'destroy']);

    Route::get('properties', [PropertyController::class, 'index']);
    Route::post('properties', [PropertyController::class, 'store']);
    Route::get('properties/{id}', [PropertyController::class, 'show']);
    Route::put('properties/{id}', [PropertyController::class, 'update']);
    Route::delete('properties/{id}', [PropertyController::class, 'destroy']);
});
