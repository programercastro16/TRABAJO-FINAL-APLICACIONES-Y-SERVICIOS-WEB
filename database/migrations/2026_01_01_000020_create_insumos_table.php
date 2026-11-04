<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insumos', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('codigo')->nullable();
            $table->text('descripcion');
            $table->string('categoria'); // 'TODO_COSTO' | 'MATERIAL' | 'MANO_DE_OBRA' | 'EQUIPO' | 'SUBCONTRATO'
            $table->string('unidad');
            $table->decimal('precio_unitario', 12, 2)->default(0);
            $table->string('fecha_actualizacion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insumos');
    }
};
