<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
   // migration: create_sell_properties_table
public function up()
{
    Schema::create('sell_properties', function (Blueprint $table) {
        $table->id();

        // 1. Link to Inventory (Kaunsa flat/plot becha?)
        $table->foreignId('property_id')->constrained('properties')->onDelete('cascade');
        
        // 2. Link to Customer (Kisko becha?)
        $table->foreignId('customer_id')->constrained('customers'); // Buyer

        // 3. Sale Details
        $table->string('invoice_no')->nullable();
        $table->date('sale_date');
        
        // 4. Financials (Calculations)
        $table->decimal('sale_rate', 15, 2); // Kis rate pe deal hui
        $table->decimal('sale_base_amount', 15, 2); // Qty * Rate
        
        $table->integer('gst_percentage')->default(0);
        $table->decimal('gst_amount', 15, 2)->default(0);
        
        $table->decimal('other_charges', 15, 2)->default(0); // Extra charge
        $table->decimal('discount_amount', 15, 2)->default(0); // Discount

        $table->decimal('total_sale_amount', 15, 2); // Final Amount jo lena hai

        // 5. Payment Tracking for this Sale
        $table->decimal('received_amount', 15, 2)->default(0); // Kitna mil gaya
        $table->decimal('pending_amount', 15, 2)->default(0);  // Kitna bacha hai

        $table->text('remarks')->nullable();
        $table->boolean('is_deleted')->default(0);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('sell_properties');
    }
};
