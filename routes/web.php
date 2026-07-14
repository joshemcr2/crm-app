<?php

use Illuminate\Support\Facades\Route;

// Sanctum necesita esta ruta para emitir la cookie CSRF antes del login (SPA)
// La expone automáticamente el paquete al usar ->statefulApi(), no requiere código aquí.

// Función helper local para retornar la vista app sin caché en el navegador
$renderSpa = function () {
    return response()
        ->view('app')
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        ->header('Pragma', 'no-cache')
        ->header('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');
};

// Ruta explícita para la raíz "/"
Route::get('/', $renderSpa)->name('spa.home');

// Catch-all para que React maneje el resto de las rutas
Route::get('/{any}', $renderSpa)
    ->where('any', '^(?!api|storage).*$')
    ->name('spa');