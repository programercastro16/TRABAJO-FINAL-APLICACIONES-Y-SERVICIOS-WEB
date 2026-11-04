<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Configuracion;

class ConfiguracionSeeder extends Seeder
{
    public function run(): void
    {
        Configuracion::firstOrCreate(
            ['id' => 1],
            [
                'nombre_empresa' => 'conobras',
                'eslogan' => 'Construcción + Arquitectura',
                'arquitecto' => 'Arquitecto - Constructor John Fabio Giraldo',
                'especialidad' => 'Especialista en Gerencia de la Construcción',
                'cedula_profesional' => '',
                'telefono' => '3128710555',
                'email' => 'gerencia@conobrasfg.com',
                'direccion' => '@conobras',
                'sitio_web' => 'instagram.com/conobras',
                'moneda_simbolo' => '$',
                'modo_calculo_default' => 'DESGLOSADO',
                'porcentaje_administracion_default' => 8.00,
                'porcentaje_imprevistos_default' => 5.00,
                'porcentaje_gastos_generales_default' => 8.00,
                'porcentaje_honorarios_default' => 15.00,
                'porcentaje_aiu_global_default' => 28.00,
                'porcentaje_iva_default' => 19.00,
            ]
        );
    }
}
