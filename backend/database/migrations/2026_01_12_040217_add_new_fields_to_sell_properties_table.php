<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sell_properties', function (Blueprint $table) {
            $table->string('plot_number')->nullable()->after('customer_id');
            $table->string('khata_number')->nullable()->after('plot_number');
            $table->decimal('area_dismil', 10, 2)->nullable()->after('khata_number');
            $table->decimal('per_dismil_amount', 15, 2)->nullable()->after('area_dismil');
            $table->integer('period_years')->nullable()->after('pending_amount');
            $table->decimal('amount_per_month', 15, 2)->nullable()->after('period_years');
            $table->string('payment_mode')->nullable()->after('amount_per_month');
            $table->string('payment_receipt')->nullable()->after('payment_mode');
        });
    }

    public function down()
    {
        Schema::table('sell_properties', function (Blueprint $table) {
            $table->dropColumn(['plot_number', 'khata_number', 'area_dismil', 'per_dismil_amount', 'period_years', 'amount_per_month', 'payment_mode', 'payment_receipt']);
        });
    }
};