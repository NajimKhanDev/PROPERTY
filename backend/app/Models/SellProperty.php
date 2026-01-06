<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    protected $guarded = ['id']; 

    // Relationships
    
    // 1. Seller 
    public function seller() {
        return $this->belongsTo(Customer::class, 'seller_id');
    }

    // 2. Sale Info 
    public function sale() {
        return $this->hasOne(SellProperty::class, 'property_id');
    }

    // 3. Transactions 
    public function transactions() {
        return $this->morphMany(Transaction::class, 'model');
    }
}