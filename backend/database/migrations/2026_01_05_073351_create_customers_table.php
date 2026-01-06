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


public function up()
{
    Schema::create('customers', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('phone')->unique(); 
        $table->string('email')->nullable();
        $table->text('address')->nullable();
        
        // --- PAN Details ---
        $table->string('pan_number')->nullable()->unique();
        $table->string('pan_file_path')->nullable(); 

        // --- Aadhaar Details ---
        $table->string('aadhar_number')->nullable()->unique();
        $table->string('aadhar_file_path')->nullable();
        
        $table->enum('type', ['SELLER', 'BUYER', 'BOTH'])->default('BUYER');
        $table->boolean('is_deleted')->default(0)->comment('0: Active, 1: Deleted');
        // Audit Trail
        $table->foreignId('created_by')->nullable()->constrained('users'); 
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
        Schema::dropIfExists('customers');
    }
};
