<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Configuracion;

class ConfiguracionController extends Controller
{
    /**
     * Get company & system settings
     */
    public function show()
    {
        $config = Configuracion::first();
        if (!$config) {
            $config = Configuracion::create([
                'id' => 1,
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
            ]);
        }

        return response()->json($config->toFrontendArray());
    }

    /**
     * Update settings
     */
    public function update(Request $request)
    {
        $config = Configuracion::first();
        if (!$config) {
            $config = new Configuracion(['id' => 1]);
        }

        $data = $request->all();

        $config->fill([
            'nombre_empresa' => $data['nombreEmpresa'] ?? $config->nombre_empresa,
            'eslogan' => $data['eslogan'] ?? $config->eslogan,
            'arquitecto' => $data['arquitecto'] ?? $config->arquitecto,
            'especialidad' => $data['especialidad'] ?? $config->especialidad,
            'cedula_profesional' => $data['cedulaProfesional'] ?? $config->cedula_profesional,
            'telefono' => $data['telefono'] ?? $config->telefono,
            'email' => $data['email'] ?? $config->email,
            'direccion' => $data['direccion'] ?? $config->direccion,
            'sitio_web' => $data['sitioWeb'] ?? $config->sitio_web,
            'moneda_simbolo' => $data['monedaSimbolo'] ?? $config->moneda_simbolo,
            'modo_calculo_default' => $data['modoCalculoDefault'] ?? $config->modo_calculo_default,
            'porcentaje_administracion_default' => $data['porcentajeAdministracionDefault'] ?? $config->porcentaje_administracion_default,
            'porcentaje_imprevistos_default' => $data['porcentajeImprevistosDefault'] ?? $config->porcentaje_imprevistos_default,
            'porcentaje_gastos_generales_default' => $data['porcentajeGastosGeneralesDefault'] ?? $config->porcentaje_gastos_generales_default,
            'porcentaje_honorarios_default' => $data['porcentajeHonorariosDefault'] ?? $config->porcentaje_honorarios_default,
            'porcentaje_aiu_global_default' => $data['porcentajeAiuGlobalDefault'] ?? $config->porcentaje_aiu_global_default,
            'porcentaje_iva_default' => $data['porcentajeIvaDefault'] ?? $config->porcentaje_iva_default,
        ]);

        $config->save();

        return response()->json([
            'success' => true,
            'config' => $config->toFrontendArray()
        ]);
    }
}
