<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            
            // Link to Property
        $table->foreignId('property_id')->constrained('properties')->onDelete('restrict');
            // Specific Deal Link (Only for Sales transactions)
       $table->unsignedBigInteger('sell_property_id')->nullable();
$table->foreign('sell_property_id')->references('id')->on('sell_properties')->onDelete('cascade');
            // Payment Info
            $table->decimal('amount', 15, 2); // Amount Paid
            $table->date('payment_date');
            $table->enum('type', ['CREDIT', 'DEBIT']);
            // Details
            $table->string('payment_mode')->default('CASH'); // CASH, ONLINE, CHEQUE
            $table->string('reference_no')->nullable();      // UTR No, Cheque No
            $table->text('remarks')->nullable();             // e.g., "2nd Installment"
            
            $table->boolean('is_deleted')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transactions');
    }
};