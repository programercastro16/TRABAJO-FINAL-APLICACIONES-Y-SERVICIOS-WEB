<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cotizacion extends Model
{
    use HasFactory;

    protected $table = 'cotizaciones';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'validez_dias' => 'integer',
        'porcentaje_administracion' => 'float',
        'porcentaje_imprevistos' => 'float',
        'porcentaje_gastos_generales' => 'float',
        'porcentaje_honorarios' => 'float',
        'porcentaje_aiu_global' => 'float',
        'aplica_iva' => 'boolean',
        'porcentaje_iva' => 'float',
        'partidas' => 'array',
    ];

    public function toFrontendArray(): array
    {
        return [
            'id' => (string) $this->id,
            'codigo' => (string) $this->codigo,
            'cliente' => (string) ($this->cliente ?? ''),
            'telefono' => (string) ($this->telefono ?? ''),
            'email' => (string) ($this->email ?? ''),
            'proyecto' => (string) ($this->proyecto ?? ''),
            'ubicacion' => (string) ($this->ubicacion ?? ''),
            'fecha' => (string) ($this->fecha ?? date('Y-m-d')),
            'validezDias' => (int) ($this->validez_dias ?? 15),
            'moneda' => (string) ($this->moneda ?? '$'),
            'modoCalculo' => (string) ($this->modo_calculo ?? 'DESGLOSADO'),
            'porcentajeAdministracion' => (float) ($this->porcentaje_administracion ?? 8),
            'porcentajeImprevistos' => (float) ($this->porcentaje_imprevistos ?? 5),
            'porcentajeGastosGenerales' => (float) ($this->porcentaje_gastos_generales ?? 8),
            'porcentajeHonorarios' => (float) ($this->porcentaje_honorarios ?? 15),
            'porcentajeAiuGlobal' => (float) ($this->porcentaje_aiu_global ?? 28),
            'aplicaIva' => (bool) $this->aplica_iva,
            'porcentajeIva' => (float) ($this->porcentaje_iva ?? 19),
            'partidas' => is_array($this->partidas) ? $this->partidas : (json_decode($this->partidas, true) ?: []),
            'notas' => (string) ($this->notas ?? ''),
            'estado' => (string) ($this->estado ?? 'BORRADOR'),
            'creadoEn' => $this->created_at ? $this->created_at->toISOString() : date('c'),
            'actualizadoEn' => $this->updated_at ? $this->updated_at->toISOString() : date('c'),
        ];
    }
}
