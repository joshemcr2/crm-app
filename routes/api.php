<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InteractionController;
use App\Http\Controllers\Api\KanbanController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Support\Facades\Route;

// --- Autenticación (Laravel Sanctum - SPA) ---
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // --- Leads y Clientes (CRUD + historial) ---
    Route::apiResource('leads', LeadController::class);
    Route::get('/leads/{lead}/interactions', [InteractionController::class, 'index']);
    Route::post('/leads/{lead}/interactions', [InteractionController::class, 'store']);

    // --- Tablero Kanban ---
    Route::get('/pipelines/{pipeline}/board', [KanbanController::class, 'show']);
    Route::patch('/leads/{lead}/move', [KanbanController::class, 'move']);
});

// --- Webhook público para triggers externos (formulario web / integraciones) ---
// Protegido por firma HMAC en el header X-CRM-Signature, no por sesión.
Route::post('/webhooks/lead-capture', [WebhookController::class, 'captureLead'])
    ->middleware('verify.webhook.signature');
