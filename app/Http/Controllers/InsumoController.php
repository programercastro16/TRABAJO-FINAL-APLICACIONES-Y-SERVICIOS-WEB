<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Insumo;

class InsumoController extends Controller
{
    /**
     * List all materials/supplies
     */
    public function index()
    {
        $insumos = Insumo::orderBy('descripcion', 'asc')->get();
        return response()->json($insumos->map->toFrontendArray());
    }

    /**
     * Store or update an insumo
     */
    public function store(Request $request)
    {
        $data = $request->all();
        $id = $data['id'] ?? ('ins-' . round(microtime(true) * 1000));

        $insumo = Insumo::updateOrCreate(
            ['id' => $id],
            [
                'codigo' => $data['codigo'] ?? null,
                'descripcion' => $data['descripcion'] ?? 'Nuevo Concepto',
                'categoria' => $data['categoria'] ?? 'MATERIAL',
                'unidad' => $data['unidad'] ?? 'm2',
                'precio_unitario' => $data['precioUnitario'] ?? 0,
                'fecha_actualizacion' => $data['fechaActualizacion'] ?? date('Y-m-d'),
            ]
        );

        return response()->json([
            'success' => true,
            'material' => $insumo->toFrontendArray()
        ]);
    }

    /**
     * Update an insumo
     */
    public function update(Request $request, $id)
    {
        $insumo = Insumo::find($id);
        if (!$insumo) {
            return response()->json(['message' => 'Insumo no encontrado'], 404);
        }

        $data = $request->all();
        $insumo->update([
            'codigo' => $data['codigo'] ?? $insumo->codigo,
            'descripcion' => $data['descripcion'] ?? $insumo->descripcion,
            'categoria' => $data['categoria'] ?? $insumo->categoria,
            'unidad' => $data['unidad'] ?? $insumo->unidad,
            'precio_unitario' => $data['precioUnitario'] ?? $insumo->precio_unitario,
            'fecha_actualizacion' => date('Y-m-d'),
        ]);

        return response()->json([
            'success' => true,
            'material' => $insumo->toFrontendArray()
        ]);
    }

    /**
     * Delete an insumo
     */
    public function destroy($id)
    {
        $insumo = Insumo::find($id);
        if ($insumo) {
            $insumo->delete();
        }
        return response()->json(['success' => true]);
    }
}
