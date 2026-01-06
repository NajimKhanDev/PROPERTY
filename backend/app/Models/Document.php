<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'doc_name',
        'doc_file',
        'is_deleted'
    ];

    // Relationship: Document belongs to a Property
    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}