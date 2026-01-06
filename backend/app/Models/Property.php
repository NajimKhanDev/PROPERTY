<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory;

    // Mass assignable fields
    protected $fillable = [
        'customer_id',      // NEW: Linked to Customers table
        'date',
        'transaction_type', // PURCHASE (Seller) or SELL (Buyer)
        'invoice_no',
        // 'party_name',    <-- REMOVED
        // 'party_phone',   <-- REMOVED
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

    // Data types formatting
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

    // 1. Property belongs to a Customer (Buyer or Seller)
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // 2. Property has many Documents
    public function documents()
    {
        return $this->hasMany(Document::class, 'property_id');
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

    public function scopeAvailable($query)
    {
        return $query->where('status', 'AVAILABLE');
    }
}