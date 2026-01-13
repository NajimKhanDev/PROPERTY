<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'sell_property_id',
        'type',             
        'amount',
        'payment_date',
        'payment_mode',
        'reference_no',
        'transaction_no',
        'payment_receipt',
        'remarks',
        'is_deleted'
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount'       => 'decimal:2',
        'is_deleted'   => 'boolean'
    ];

    // Parent Inventory
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    // New: Specific Sale Deal Link
    public function sale_deal()
    {
        return $this->belongsTo(SellProperty::class, 'sell_property_id');
    }
}