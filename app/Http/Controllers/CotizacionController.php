<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cotizacion;

class CotizacionController extends Controller
{
    /**
     * List all quotes
     */
    public function index()
    {
        $quotes = Cotizacion::orderBy('created_at', 'desc')->get();
        return response()->json($quotes->map->toFrontendArray());
    }

    /**
     * Store or update a quote
     */
    public function store(Request $request)
    {
        $data = $request->all();

        $id = $data['id'] ?? ('cot-' . round(microtime(true) * 1000));
        
        $quote = Cotizacion::updateOrCreate(
            ['id' => $id],
            [
                'codigo' => $data['codigo'] ?? ('CNB-' . date('Y') . '-001'),
                'cliente' => $data['cliente'] ?? '',
                'telefono' => $data['telefono'] ?? '',
                'email' => $data['email'] ?? '',
                'proyecto' => $data['proyecto'] ?? '',
                'ubicacion' => $data['ubicacion'] ?? '',
                'fecha' => $data['fecha'] ?? date('Y-m-d'),
                'validez_dias' => $data['validezDias'] ?? 15,
                'moneda' => $data['moneda'] ?? '$',
                'modo_calculo' => $data['modoCalculo'] ?? 'DESGLOSADO',
                'porcentaje_administracion' => $data['porcentajeAdministracion'] ?? 8,
                'porcentaje_imprevistos' => $data['porcentajeImprevistos'] ?? 5,
                'porcentaje_gastos_generales' => $data['porcentajeGastosGenerales'] ?? 8,
                'porcentaje_honorarios' => $data['porcentajeHonorarios'] ?? 15,
                'porcentaje_aiu_global' => $data['porcentajeAiuGlobal'] ?? 28,
                'aplica_iva' => (bool) ($data['aplicaIva'] ?? false),
                'porcentaje_iva' => $data['porcentajeIva'] ?? 19,
                'partidas' => $data['partidas'] ?? [],
                'notas' => $data['notas'] ?? '',
                'estado' => $data['estado'] ?? 'BORRADOR',
            ]
        );

        return response()->json([
            'success' => true,
            'quote' => $quote->toFrontendArray()
        ]);
    }

    /**
     * Display a specific quote
     */
    public function show($id)
    {
        $quote = Cotizacion::find($id);
        if (!$quote) {
            return response()->json(['message' => 'Cotización no encontrada'], 404);
        }
        return response()->json($quote->toFrontendArray());
    }

    /**
     * Update a specific quote
     */
    public function update(Request $request, $id)
    {
        $quote = Cotizacion::find($id);
        if (!$quote) {
            return response()->json(['message' => 'Cotización no encontrada'], 404);
        }

        $data = $request->all();
        $quote->update([
            'codigo' => $data['codigo'] ?? $quote->codigo,
            'cliente' => $data['cliente'] ?? $quote->cliente,
            'telefono' => $data['telefono'] ?? $quote->telefono,
            'email' => $data['email'] ?? $quote->email,
            'proyecto' => $data['proyecto'] ?? $quote->proyecto,
            'ubicacion' => $data['ubicacion'] ?? $quote->ubicacion,
            'fecha' => $data['fecha'] ?? $quote->fecha,
            'validez_dias' => $data['validezDias'] ?? $quote->validez_dias,
            'moneda' => $data['moneda'] ?? $quote->moneda,
            'modo_calculo' => $data['modoCalculo'] ?? $quote->modo_calculo,
            'porcentaje_administracion' => $data['porcentajeAdministracion'] ?? $quote->porcentaje_administracion,
            'porcentaje_imprevistos' => $data['porcentajeImprevistos'] ?? $quote->porcentaje_imprevistos,
            'porcentaje_gastos_generales' => $data['porcentajeGastosGenerales'] ?? $quote->porcentaje_gastos_generales,
            'porcentaje_honorarios' => $data['porcentajeHonorarios'] ?? $quote->porcentaje_honorarios,
            'porcentaje_aiu_global' => $data['porcentajeAiuGlobal'] ?? $quote->porcentaje_aiu_global,
            'aplica_iva' => isset($data['aplicaIva']) ? (bool) $data['aplicaIva'] : $quote->aplica_iva,
            'porcentaje_iva' => $data['porcentajeIva'] ?? $quote->porcentaje_iva,
            'partidas' => $data['partidas'] ?? $quote->partidas,
            'notas' => $data['notas'] ?? $quote->notas,
            'estado' => $data['estado'] ?? $quote->estado,
        ]);

        return response()->json([
            'success' => true,
            'quote' => $quote->toFrontendArray()
        ]);
    }

    /**
     * Delete a quote
     */
    public function destroy($id)
    {
        $quote = Cotizacion::find($id);
        if ($quote) {
            $quote->delete();
        }
        return response()->json(['success' => true]);
    }

    /**
     * Duplicate a quote
     */
    public function duplicate($id)
    {
        $quote = Cotizacion::find($id);
        if (!$quote) {
            return response()->json(['message' => 'Cotización no encontrada'], 404);
        }

        $newId = 'cot-' . round(microtime(true) * 1000);
        $count = Cotizacion::count() + 1;
        $year = date('Y');
        $newCode = "CNB-{$year}-" . str_pad($count, 3, '0', STR_PAD_LEFT);

        $cloned = $quote->replicate();
        $cloned->id = $newId;
        $cloned->codigo = $newCode;
        $cloned->estado = 'BORRADOR';
        $cloned->cliente = $quote->cliente . ' (Copia)';
        $cloned->save();

        return response()->json([
            'success' => true,
            'quote' => $cloned->toFrontendArray()
        ]);
    }
}
