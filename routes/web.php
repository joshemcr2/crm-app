<?php

use Illuminate\Support\Facades\Route;

// Sanctum necesita esta ruta para emitir la cookie CSRF antes del login (SPA)
// La expone automáticamente el paquete al usar ->statefulApi(), no requiere código aquí.

// Ruta explícita para la raíz "/" (el catch-all de abajo NO la cubre,
// porque {any} exige al menos un segmento después de la barra).
Route::get('/', fn () => view('app'))->name('spa.home');

// Catch-all: cualquier otra ruta que no sea /api/* o /storage/* la resuelve
// React (o React Router, si lo agregas) en el cliente.
Route::get('/{any}', fn () => view('app'))
    ->where('any', '^(?!api|storage).*$')
    ->name('spa');
