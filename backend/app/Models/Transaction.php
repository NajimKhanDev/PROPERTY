<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'amount',
        'payment_date',
        'payment_mode',
        'reference_no',
        'remarks',
        'is_deleted'
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount'       => 'decimal:2',
        'is_deleted'   => 'boolean'
    ];

    // Relationship: Transaction belongs to a Property
    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}