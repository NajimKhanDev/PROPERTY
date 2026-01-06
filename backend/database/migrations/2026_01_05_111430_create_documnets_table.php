<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('property_documents', function (Blueprint $table) {
            $table->id();

            // Link to Property
            $table->foreignId('property_id')->constrained('properties')->onDelete('cascade');

            $table->string('doc_name'); // e.g. "Registry Paper"
            $table->string('doc_file'); // File Path
           $table->boolean('is_deleted')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('documents');
    }
};