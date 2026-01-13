<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('emis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->onDelete('cascade');
            $table->integer('emi_number');
            $table->decimal('emi_amount', 15, 2);
            $table->date('due_date');
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->enum('status', ['PENDING', 'PAID', 'OVERDUE'])->default('PENDING');
            $table->date('paid_date')->nullable();
            $table->string('payment_mode')->nullable();
            $table->string('payment_receipt')->nullable();
            $table->boolean('is_deleted')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('emis');
    }
};