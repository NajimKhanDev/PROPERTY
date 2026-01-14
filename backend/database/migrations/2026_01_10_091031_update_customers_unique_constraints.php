<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('customers', function (Blueprint $table) {
            // Drop existing unique constraints
            $table->dropUnique('customers_phone_unique');
            $table->dropUnique('customers_pan_number_unique');
            $table->dropUnique('customers_aadhar_number_unique');
            
            // Add composite unique constraints that include is_deleted
            $table->unique(['phone', 'is_deleted']);
            $table->unique(['pan_number', 'is_deleted']);
            $table->unique(['aadhar_number', 'is_deleted']);
        });
    }

    public function down()
    {
        Schema::table('customers', function (Blueprint $table) {
            // Drop composite unique constraints
            $table->dropUnique(['phone', 'is_deleted']);
            $table->dropUnique(['pan_number', 'is_deleted']);
            $table->dropUnique(['aadhar_number', 'is_deleted']);
            
            // Restore original unique constraints
            $table->unique('phone');
            $table->unique('pan_number');
            $table->unique('aadhar_number');
        });
    }
};