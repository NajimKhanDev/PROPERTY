<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'role_name',
        'status',
        'permissions',
        'user_id',
        'is_deleted',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_deleted' => 'boolean',
        'permissions' => 'array',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_deleted', false);
    }
    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }
}