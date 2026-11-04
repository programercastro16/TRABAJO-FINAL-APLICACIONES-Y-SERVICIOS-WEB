<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cotizaciones', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('codigo');
            $table->string('cliente')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('proyecto')->nullable();
            $table->string('ubicacion')->nullable();
            $table->date('fecha')->nullable();
            $table->integer('validez_dias')->default(15);
            $table->string('moneda')->default('$');
            $table->string('modo_calculo')->default('DESGLOSADO');
            $table->decimal('porcentaje_administracion', 6, 2)->default(8.00);
            $table->decimal('porcentaje_imprevistos', 6, 2)->default(5.00);
            $table->decimal('porcentaje_gastos_generales', 6, 2)->default(8.00);
            $table->decimal('porcentaje_honorarios', 6, 2)->default(15.00);
            $table->decimal('porcentaje_aiu_global', 6, 2)->default(28.00);
            $table->boolean('aplica_iva')->default(false);
            $table->decimal('porcentaje_iva', 6, 2)->default(19.00);
            $table->json('partidas')->nullable();
            $table->text('notas')->nullable();
            $table->string('estado')->default('BORRADOR');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cotizaciones');
    }
};
