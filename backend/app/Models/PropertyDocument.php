<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class PropertyDocument extends Model
{
    use HasFactory;

    protected $fillable = ['property_id', 'doc_name', 'doc_file', 'is_deleted'];

    // Global Scope: Hide deleted
    protected static function booted()
    {
        static::addGlobalScope('active', fn (Builder $builder) => $builder->where('is_deleted', 0));
    }

    // Link back to property
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    // Auto get URL
    public function getDocFileUrlAttribute()
    {
        return url('storage/' . $this->doc_file);
    }
}