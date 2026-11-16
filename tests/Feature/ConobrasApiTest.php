<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ConobrasApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Authenticate a test user for protected API routes.
     */
    private function authenticateUser(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);
    }

    public function test_home_blade_loads(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertSee('conobras quote');
    }

    public function test_api_config(): void
    {
        $this->authenticateUser();

        $response = $this->getJson('/api/config');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'nombreEmpresa',
            'arquitecto',
            'monedaSimbolo'
        ]);
    }

    public function test_api_materials(): void
    {
        $this->authenticateUser();

        $response = $this->getJson('/api/materials');

        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    public function test_api_quote_lifecycle(): void
    {
        $this->authenticateUser();

        // 1. Create Quote
        $quoteData = [
            'id' => 'test-cot-101',
            'codigo' => 'CNB-2026-TEST',
            'cliente' => 'Cliente de Prueba Laravel',
            'proyecto' => 'Proyecto Residencial Laravel',
            'fecha' => date('Y-m-d'),
            'validezDias' => 15,
            'moneda' => '$',
            'modoCalculo' => 'DESGLOSADO',
            'porcentajeAdministracion' => 8,
            'porcentajeImprevistos' => 5,
            'porcentajeGastosGenerales' => 8,
            'porcentajeHonorarios' => 15,
            'porcentajeAiuGlobal' => 28,
            'aplicaIva' => false,
            'porcentajeIva' => 19,
            'partidas' => [
                [
                    'id' => 'part-1',
                    'titulo' => '1. PRELIMINARES',
                    'items' => [
                        [
                            'id' => 'it-1',
                            'descripcion' => 'Concepto de prueba',
                            'categoria' => 'MATERIAL',
                            'unidad' => 'm2',
                            'cantidad' => 10,
                            'precioUnitario' => 100
                        ]
                    ]
                ]
            ],
            'notas' => 'Notas de prueba',
            'estado' => 'BORRADOR'
        ];

        $resSave = $this->postJson('/api/quotes', $quoteData);
        $resSave->assertStatus(200);

        // 2. Read Quote
        $resGet = $this->getJson('/api/quotes/test-cot-101');

        $resGet->assertStatus(200);

        $this->assertEquals(
            'Cliente de Prueba Laravel',
            $resGet->json('cliente')
        );

        // 3. Duplicate Quote
        $resDup = $this->postJson('/api/quotes/test-cot-101/duplicate');
        $resDup->assertStatus(200);

        // 4. Delete Quote
        $resDel = $this->deleteJson('/api/quotes/test-cot-101');
        $resDel->assertStatus(200);
    }
}
