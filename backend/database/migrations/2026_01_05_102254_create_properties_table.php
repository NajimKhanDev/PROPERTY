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
            
            //Seller and Buyer
            $table->foreignId('seller_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->foreignId('buyer_id')->nullable()->constrained('customers')->onDelete('set null');

            // Transaction Info
            $table->date('date')->useCurrent(); 
            $table->enum('transaction_type', ['PURCHASE', 'SELL']); 
            $table->string('invoice_no')->nullable();

            // Property Details
            $table->string('title'); 
            $table->enum('category', ['LAND', 'FLAT', 'HOUSE', 'COMMERCIAL', 'AGRICULTURE']);
            $table->text('address')->nullable();

            // Calculation Fields
            $table->integer('quantity')->default(1); 
            $table->decimal('rate', 15, 2); 
            $table->decimal('base_amount', 15, 2); 
            $table->integer('gst_percentage')->default(0); 
            $table->decimal('gst_amount', 15, 2)->default(0); 
            $table->decimal('other_expenses', 15, 2)->default(0); 
            $table->decimal('total_amount', 15, 2); 
            $table->decimal('paid_amount', 15, 2)->default(0); 
            $table->decimal('due_amount', 15, 2)->default(0); 

            // Extra Fields
            $table->decimal('area_dismil', 10, 2)->nullable();
            $table->string('plot_number')->nullable();
            $table->string('khata_number')->nullable();
            $table->string('house_number')->nullable();
            $table->integer('floor_number')->nullable();
            $table->integer('bhk')->nullable(); 
            $table->decimal('super_built_up_area', 10, 2)->nullable(); 

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