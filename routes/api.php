<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CotizacionController;
use App\Http\Controllers\InsumoController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes - Conobras Costing Pro
|--------------------------------------------------------------------------
*/

// Authentication & Profile / Autenticación y Perfil
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// Quotes / Cotizaciones
Route::get('/quotes', [CotizacionController::class, 'index']);
Route::post('/quotes', [CotizacionController::class, 'store']);
Route::get('/quotes/{id}', [CotizacionController::class, 'show']);
Route::put('/quotes/{id}', [CotizacionController::class, 'update']);
Route::delete('/quotes/{id}', [CotizacionController::class, 'destroy']);
Route::post('/quotes/{id}/duplicate', [CotizacionController::class, 'duplicate']);

// Materials / Insumos
Route::get('/materials', [InsumoController::class, 'index']);
Route::post('/materials', [InsumoController::class, 'store']);
Route::put('/materials/{id}', [InsumoController::class, 'update']);
Route::delete('/materials/{id}', [InsumoController::class, 'destroy']);

// Company Settings / Configuración
Route::get('/config', [ConfiguracionController::class, 'show']);
Route::post('/config', [ConfiguracionController::class, 'update']);
