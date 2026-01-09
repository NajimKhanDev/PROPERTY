<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class PropertyDocument extends Model
{
    use HasFactory;

    protected $fillable = ['property_id', 'sell_property_id', 'doc_name', 'doc_file', 'is_deleted'];

    // Active scope
    protected static function booted()
    {
        static::addGlobalScope('active', fn (Builder $builder) => $builder->where('is_deleted', 0));
    }

    // Inventory relation
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    // Sale relation
    public function sale_deal()
    {
        return $this->belongsTo(SellProperty::class, 'sell_property_id');
    }

    // File URL
    public function getDocFileUrlAttribute()
    {
        return url('storage/' . $this->doc_file);
    }
}