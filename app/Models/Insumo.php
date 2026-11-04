<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Insumo extends Model
{
    use HasFactory;

    protected $table = 'insumos';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'precio_unitario' => 'float',
    ];

    public function toFrontendArray(): array
    {
        return [
            'id' => (string) $this->id,
            'codigo' => (string) ($this->codigo ?? ''),
            'descripcion' => (string) $this->descripcion,
            'categoria' => (string) $this->categoria,
            'unidad' => (string) $this->unidad,
            'precioUnitario' => (float) $this->precio_unitario,
            'fechaActualizacion' => (string) ($this->fecha_actualizacion ?? $this->updated_at?->format('Y-m-d') ?? date('Y-m-d')),
        ];
    }
}
