<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sell_emis', function (Blueprint $table) {
            $table->string('transaction_no')->nullable()->after('payment_mode');
        });
    }

    public function down()
    {
        Schema::table('sell_emis', function (Blueprint $table) {
            $table->dropColumn('transaction_no');
        });
    }
};