<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuraciones', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_empresa')->default('conobras');
            $table->string('eslogan')->default('Construcción + Arquitectura');
            $table->string('arquitecto')->default('Arquitecto - Constructor John Fabio Giraldo');
            $table->string('especialidad')->nullable()->default('Especialista en Gerencia de la Construcción');
            $table->string('cedula_profesional')->nullable();
            $table->string('telefono')->default('3128710555');
            $table->string('email')->default('gerencia@conobrasfg.com');
            $table->string('direccion')->default('@conobras');
            $table->string('sitio_web')->nullable()->default('instagram.com/conobras');
            $table->string('moneda_simbolo')->default('$');
            $table->string('modo_calculo_default')->default('DESGLOSADO');
            $table->decimal('porcentaje_administracion_default', 6, 2)->default(8.00);
            $table->decimal('porcentaje_imprevistos_default', 6, 2)->default(5.00);
            $table->decimal('porcentaje_gastos_generales_default', 6, 2)->default(8.00);
            $table->decimal('porcentaje_honorarios_default', 6, 2)->default(15.00);
            $table->decimal('porcentaje_aiu_global_default', 6, 2)->default(28.00);
            $table->decimal('porcentaje_iva_default', 6, 2)->default(19.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuraciones');
    }
};
