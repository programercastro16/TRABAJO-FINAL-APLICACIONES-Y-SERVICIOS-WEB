<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    use HasFactory;

    protected $table = 'configuraciones';

    protected $guarded = [];

    protected $casts = [
        'porcentaje_administracion_default' => 'float',
        'porcentaje_imprevistos_default' => 'float',
        'porcentaje_gastos_generales_default' => 'float',
        'porcentaje_honorarios_default' => 'float',
        'porcentaje_aiu_global_default' => 'float',
        'porcentaje_iva_default' => 'float',
    ];

    /**
     * Helper to transform attributes to match TypeScript ConfiguracionEmpresa interface
     */
    public function toFrontendArray(): array
    {
        return [
            'nombreEmpresa' => $this->nombre_empresa ?? 'conobras',
            'eslogan' => $this->eslogan ?? 'Construcción + Arquitectura',
            'arquitecto' => $this->arquitecto ?? 'Arquitecto - Constructor John Fabio Giraldo',
            'especialidad' => $this->especialidad ?? 'Especialista en Gerencia de la Construcción',
            'cedulaProfesional' => $this->cedula_profesional ?? '',
            'telefono' => $this->telefono ?? '3128710555',
            'email' => $this->email ?? 'gerencia@conobrasfg.com',
            'direccion' => $this->direccion ?? '@conobras',
            'sitioWeb' => $this->sitio_web ?? 'instagram.com/conobras',
            'monedaSimbolo' => $this->moneda_simbolo ?? '$',
            'modoCalculoDefault' => $this->modo_calculo_default ?? 'DESGLOSADO',
            'porcentajeAdministracionDefault' => (float) ($this->porcentaje_administracion_default ?? 8),
            'porcentajeImprevistosDefault' => (float) ($this->porcentaje_imprevistos_default ?? 5),
            'porcentajeGastosGeneralesDefault' => (float) ($this->porcentaje_gastos_generales_default ?? 8),
            'porcentajeHonorariosDefault' => (float) ($this->porcentaje_honorarios_default ?? 15),
            'porcentajeAiuGlobalDefault' => (float) ($this->porcentaje_aiu_global_default ?? 28),
            'porcentajeIvaDefault' => (float) ($this->porcentaje_iva_default ?? 19),
        ];
    }
}
