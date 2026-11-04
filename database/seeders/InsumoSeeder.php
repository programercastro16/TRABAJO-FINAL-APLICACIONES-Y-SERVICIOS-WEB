<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Insumo;

class InsumoSeeder extends Seeder
{
    public function run(): void
    {
        $insumos = [
            // MATERIALES
            [
                'id' => 'mat-001',
                'codigo' => 'MAT-CEM-01',
                'descripcion' => 'Cemento Gris Portland CPC 30R (Saco 50 kg)',
                'categoria' => 'MATERIAL',
                'unidad' => 'saco',
                'precio_unitario' => 245.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'mat-002',
                'codigo' => 'MAT-VAR-03',
                'descripcion' => 'Varilla Corrugada #3 (3/8") Grado 42',
                'categoria' => 'MATERIAL',
                'unidad' => 'tramo',
                'precio_unitario' => 168.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'mat-003',
                'codigo' => 'MAT-VAR-04',
                'descripcion' => 'Varilla Corrugada #4 (1/2") Grado 42',
                'categoria' => 'MATERIAL',
                'unidad' => 'tramo',
                'precio_unitario' => 295.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'mat-004',
                'codigo' => 'MAT-ARE-01',
                'descripcion' => 'Arena gruesa de mina triturada',
                'categoria' => 'MATERIAL',
                'unidad' => 'm3',
                'precio_unitario' => 480.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'mat-005',
                'codigo' => 'MAT-GRA-01',
                'descripcion' => 'Grava triturada 3/4" de mina',
                'categoria' => 'MATERIAL',
                'unidad' => 'm3',
                'precio_unitario' => 520.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'mat-006',
                'codigo' => 'MAT-CONC-250',
                'descripcion' => 'Concreto Premezclado f\'c=250 kg/cm2 t.m.a 3/4" bombeable',
                'categoria' => 'MATERIAL',
                'unidad' => 'm3',
                'precio_unitario' => 2850.00,
                'fecha_actualizacion' => '2026-09-15'
            ],
            [
                'id' => 'mat-007',
                'codigo' => 'MAT-TAB-ROJO',
                'descripcion' => 'Tabique rojo recocido artesanal 7x14x28 cm',
                'categoria' => 'MATERIAL',
                'unidad' => 'millar',
                'precio_unitario' => 4200.00,
                'fecha_actualizacion' => '2026-09-10'
            ],
            [
                'id' => 'mat-008',
                'codigo' => 'MAT-PORC-MAR',
                'descripcion' => 'Porcelanato rectificado importado 60x120 cm Calacatta Gold',
                'categoria' => 'MATERIAL',
                'unidad' => 'm2',
                'precio_unitario' => 780.00,
                'fecha_actualizacion' => '2026-09-20'
            ],
            [
                'id' => 'mat-009',
                'codigo' => 'MAT-YESO-01',
                'descripcion' => 'Yeso supremo para acabados interiores (Bulto 40 kg)',
                'categoria' => 'MATERIAL',
                'unidad' => 'bulto',
                'precio_unitario' => 125.00,
                'fecha_actualizacion' => '2026-09-05'
            ],
            [
                'id' => 'mat-010',
                'codigo' => 'MAT-PINT-VIN',
                'descripcion' => 'Pintura Vinil-Acrílica satinada lavable alta gama (Cubeta 19L)',
                'categoria' => 'MATERIAL',
                'unidad' => 'cubeta',
                'precio_unitario' => 2650.00,
                'fecha_actualizacion' => '2026-09-18'
            ],

            // MANO DE OBRA
            [
                'id' => 'mo-001',
                'codigo' => 'MO-CUAD-01',
                'descripcion' => 'Cuadrilla #1 (1 Oficial Albañil + 1 Peón)',
                'categoria' => 'MANO_DE_OBRA',
                'unidad' => 'jornal',
                'precio_unitario' => 1150.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'mo-002',
                'codigo' => 'MO-CUAD-02',
                'descripcion' => 'Cuadrilla #2 (1 Oficial Fierrero + 1 Ayudante)',
                'categoria' => 'MANO_DE_OBRA',
                'unidad' => 'jornal',
                'precio_unitario' => 1200.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'mo-003',
                'codigo' => 'MO-CUAD-03',
                'descripcion' => 'Cuadrilla #3 (1 Oficial Yesero / Tablarroquero + 1 Ayudante)',
                'categoria' => 'MANO_DE_OBRA',
                'unidad' => 'jornal',
                'precio_unitario' => 1250.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'mo-004',
                'codigo' => 'MO-CUAD-04',
                'descripcion' => 'Cuadrilla #4 (1 Oficial Electricista especialista)',
                'categoria' => 'MANO_DE_OBRA',
                'unidad' => 'jornal',
                'precio_unitario' => 950.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'mo-005',
                'codigo' => 'MO-PEON-01',
                'descripcion' => 'Peón general de apoyo y acarreos',
                'categoria' => 'MANO_DE_OBRA',
                'unidad' => 'jornal',
                'precio_unitario' => 450.00,
                'fecha_actualizacion' => '2026-09-01'
            ],

            // EQUIPOS Y MAQUINARIA
            [
                'id' => 'eq-001',
                'codigo' => 'EQ-REV-01',
                'descripcion' => 'Revolvedora de concreto 1 saco con motor a gasolina 9HP',
                'categoria' => 'EQUIPO',
                'unidad' => 'semana',
                'precio_unitario' => 2200.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'eq-002',
                'codigo' => 'EQ-AND-01',
                'descripcion' => 'Andamio tubular estándar marco y tijera (renta semanal)',
                'categoria' => 'EQUIPO',
                'unidad' => 'semana',
                'precio_unitario' => 180.00,
                'fecha_actualizacion' => '2026-09-01'
            ],
            [
                'id' => 'eq-003',
                'codigo' => 'EQ-RET-VOLT',
                'descripcion' => 'Camión de volteo 7m3 para desalojo de escombros a tiro oficial',
                'categoria' => 'EQUIPO',
                'unidad' => 'viaje',
                'precio_unitario' => 1450.00,
                'fecha_actualizacion' => '2026-09-12'
            ],

            // SUBCONTRATOS
            [
                'id' => 'sub-001',
                'codigo' => 'SUB-CANC-ALUM',
                'descripcion' => 'Cancelería de aluminio línea Eurovent serie 70 con cristal templado 6mm',
                'categoria' => 'SUBCONTRATO',
                'unidad' => 'm2',
                'precio_unitario' => 3400.00,
                'fecha_actualizacion' => '2026-09-15'
            ],
            [
                'id' => 'sub-002',
                'codigo' => 'SUB-CARP-CLOSET',
                'descripcion' => 'Carpintería fina en madera de nogal y chapa natural según diseño arquitectónico',
                'categoria' => 'SUBCONTRATO',
                'unidad' => 'ml',
                'precio_unitario' => 6800.00,
                'fecha_actualizacion' => '2026-09-20'
            ],
        ];

        foreach ($insumos as $insumo) {
            Insumo::updateOrCreate(['id' => $insumo['id']], $insumo);
        }
    }
}
