<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SellProperty extends Model
{
    use HasFactory;

    // Guard id
    protected $guarded = ['id']; 

    // Relationships

    // 1. Linked Property (Inventory)
    public function property() {
        return $this->belongsTo(Property::class, 'property_id');
    }

    // 2. Buyer (Customer)
    public function buyer() {
        // Table has customer_id
        return $this->belongsTo(Customer::class, 'customer_id');
    }
    public function transactions() {
        // Logic: Transactions table mein 'property_id' match karo 
        // Lekin sirf wo jo 'CREDIT' hain (Income)
        return $this->hasMany(Transaction::class, 'property_id', 'property_id')
                    ->where('type', 'CREDIT')
                    ->orderBy('payment_date', 'desc');
    }
    public function documents() {
        // Documents linked via 'sell_property_id' in 'property_documents' table
        return $this->hasMany(PropertyDocument::class, 'sell_property_id');
    }
    
    public function emis() {
        return $this->hasMany(SellEmi::class, 'sell_property_id');
    }
}