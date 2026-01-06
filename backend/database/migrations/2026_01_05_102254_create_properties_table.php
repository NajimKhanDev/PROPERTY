<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();

            // 1. Transaction Info (Label for Purchase vs Sell)
            $table->date('date')->useCurrent(); 
            // YAHAN hai wo label jo aapne manga tha
            $table->enum('transaction_type', ['PURCHASE', 'SELL'])->default('PURCHASE'); 
            $table->string('invoice_no')->nullable();

            
            $table->foreignId('customer_id')
                  ->constrained('customers')
                  ->onDelete('cascade'); 

            // 3. Property / Item Details
            $table->string('title'); 
            $table->enum('category', ['LAND', 'FLAT', 'HOUSE', 'COMMERCIAL', 'AGRICULTURE']);
            $table->text('address')->nullable();

            // 4. Rate & Amount Logic
            $table->integer('quantity')->default(1); 
            $table->decimal('rate', 15, 2); 
            $table->decimal('base_amount', 15, 2); 

            // Tax Details
            $table->integer('gst_percentage')->default(0); 
            $table->decimal('gst_amount', 15, 2)->default(0); 

            // Extra Expenses
            $table->decimal('other_expenses', 15, 2)->default(0); 

            // Final Total
            $table->decimal('total_amount', 15, 2); 

            // 5. Payment Status
            $table->decimal('paid_amount', 15, 2)->default(0); 
            $table->decimal('due_amount', 15, 2)->default(0); 

            // 6. Category Specific (Nullable)
            $table->decimal('area_dismil', 10, 2)->nullable();
            $table->string('plot_number')->nullable();
            $table->string('khata_number')->nullable();
            
            $table->string('house_number')->nullable();
            $table->integer('floor_number')->nullable();
            $table->integer('bhk')->nullable(); 
            $table->decimal('super_built_up_area', 10, 2)->nullable(); 

            // Status
            $table->enum('status', ['AVAILABLE', 'SOLD'])->default('AVAILABLE');
            $table->boolean('is_deleted')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('properties');
    }
};