<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory;

    // Saare fields jo mass assignable hain (Migration ke hisab se)
    protected $fillable = [
        'date',
        'transaction_type', // PURCHASE or SELL
        'invoice_no',
        'party_name',
        'party_phone',
        'title',
        'category',
        'address',
        'quantity',
        'rate',
        'base_amount',      // Auto-calculated
        'gst_percentage',
        'gst_amount',       // Auto-calculated
        'other_expenses',
        'total_amount',     // Auto-calculated
        'paid_amount',
        'due_amount',       // Auto-calculated
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

    // Data types ko sahi format me rakhne ke liye
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

    // --- HELPER SCOPES (Filtering ke liye) ---

    // Jab sirf Purchase dekhna ho: Property::purchases()->get();
    public function scopePurchases($query)
    {
        return $query->where('transaction_type', 'PURCHASE');
    }

    // Jab sirf Sell dekhna ho: Property::sales()->get();
    public function scopeSales($query)
    {
        return $query->where('transaction_type', 'SELL');
    }
    // In App\Models\Property.php

public function documents()
{
    
    // jisme 'property_id' column hai.
    return $this->hasMany(Document::class, 'property_id');
}

    // Jab sirf available properties dekhni ho
    public function scopeAvailable($query)
    {
        return $query->where('status', 'AVAILABLE');
    }
}