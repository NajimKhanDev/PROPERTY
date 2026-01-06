<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            

            // Role
            $table->unsignedBigInteger('role_id');            

            $table->string('name');
            $table->string('email');
            $table->string('password');

  
            $table->tinyInteger('status')->default(1);
            $table->boolean('is_deleted')->default(false);

            // Timestamps
       $table->timestamps();

            // Constraints
            $table->unique(['email', 'is_deleted']);

           
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
        });

        Schema::dropIfExists('users');
    }
};
