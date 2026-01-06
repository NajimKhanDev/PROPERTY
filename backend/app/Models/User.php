<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    const UPDATED_AT = null;

    protected $fillable = [
        'role_id',
        'name',
        'email',
        'password',
        'status',
        'is_deleted',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_deleted' => 'boolean',
    ];

    /**
     *  Scope for active (non-deleted, non-superadmin) users
     */
    public function scopeActive($query)
    {
        return $query->where('is_deleted', false)
                     ->where('role_id', '!=', 1);
    }

    /**
     *  Relation: User belongs to Role
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     *  Relation: User belongs to Customer
     * (each user is linked to one customer)
     */
  

    /**
     *  Optional: Check if user is admin or super admin
     */
    public function isAdmin(): bool
    {
        return in_array($this->role_id, [1, 2]);
    }

    /**
     *  Optional: Check if user is customer type (role = user)
     */
    public function isCustomer(): bool
    {
        return $this->role && strtolower($this->role->role_name) === 'user';
    }
}
