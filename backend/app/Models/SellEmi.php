<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellEmi extends Model
{
    use HasFactory;

    protected $fillable = [
        'sell_property_id',
        'emi_number',
        'emi_amount',
        'due_date',
        'paid_amount',
        'status',
        'paid_date',
        'payment_mode',
        'transaction_no',
        'payment_receipt',
        'is_deleted'
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_date' => 'date',
        'emi_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'is_deleted' => 'boolean'
    ];

    public function sellProperty()
    {
        return $this->belongsTo(SellProperty::class);
    }
}