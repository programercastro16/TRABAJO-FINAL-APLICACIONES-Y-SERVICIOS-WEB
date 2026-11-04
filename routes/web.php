<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Conobras Costing
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('app');
});

// Fallback to the SPA view for any other non-API web route
Route::fallback(function () {
    return view('app');
});
