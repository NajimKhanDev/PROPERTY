<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'phone', 'email', 'address',
        'pan_number', 'pan_file_path',
        'aadhar_number', 'aadhar_file_path',
        'type', 'created_by', 
        'is_deleted'
    ];



    protected static function booted()
    {
        static::addGlobalScope('not_deleted', function (Builder $builder) {
            $builder->where('is_deleted', 0);
        });
    }

    // --- ACCESSORS for File URLs ---
    public function getPanFileUrlAttribute()
    {
        return $this->pan_file_path ? url('storage/' . $this->pan_file_path) : null;
    }

    public function getAadharFileUrlAttribute()
    {
        return $this->aadhar_file_path ? url('storage/' . $this->aadhar_file_path) : null;
    }
    public function purchases()
    {
        return $this->hasMany(SellProperty::class, 'customer_id');
    }

    // 2. Properties Sold by Customer (He is Vendor)
    public function supplies()
    {
        return $this->hasMany(Property::class, 'seller_id');
    }
}