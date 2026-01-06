<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory;

    // Mass assignable fields
    protected $fillable = [
        'seller_id',       
        'buyer_id',         
        'date',
        'transaction_type', 
        'invoice_no',
        'title',
        'category',
        'address',
        'quantity',
        'rate',
        'base_amount',      
        'gst_percentage',
        'gst_amount',       
        'other_expenses',
        'total_amount',     
        'paid_amount',
        'due_amount',       
        'area_dismil',
        'plot_number',
        'khata_number',
        'house_number',
        'floor_number',
        'bhk',
        'super_built_up_area',
        'status',
        'is_deleted',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
        'date' => 'date',
        'quantity' => 'integer',
        'rate' => 'decimal:2',
        'base_amount' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
    ];

    // --- RELATIONSHIPS ---

    // 1. Seller Relation
    public function seller()
    {
        return $this->belongsTo(Customer::class, 'seller_id');
    }

    // 2. Buyer Relation 
    public function buyer()
    {
        return $this->belongsTo(Customer::class, 'buyer_id');
    }

    // 3. Documents 
    public function documents()
    {
        return $this->hasMany(PropertyDocument::class, 'property_id');
    }
    
    // 4. Transactions
    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'property_id');
    }

    // --- HELPER SCOPES ---

    public function scopePurchases($query)
    {
        return $query->where('transaction_type', 'PURCHASE');
    }

    public function scopeSales($query)
    {
        return $query->where('transaction_type', 'SELL');
    }
}