<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emi extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
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

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}