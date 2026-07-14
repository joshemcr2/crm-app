<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeadResource;
use App\Models\Pipeline;
use App\Services\WorkflowEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function __construct(
        private WorkflowEngineService $workflowEngine,
    ) {}

    /**
     * Endpoint público (firmado con HMAC) que recibe leads de un formulario
     * web externo o de una integración de terceros y crea el registro
     * automáticamente en la primera etapa del pipeline por defecto.
     */
    public function captureLead(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'value' => ['nullable', 'numeric'],
            'source' => ['nullable', 'string'],
        ]);

        $pipeline = Pipeline::where('is_default', true)->firstOrFail();
        $firstStage = $pipeline->stages()->orderBy('order')->firstOrFail();

        $lead = $this->workflowEngine->createLeadFromExternalTrigger(
            payload: $payload,
            pipelineId: $pipeline->id,
            defaultStageId: $firstStage->id,
        );

        return response()->json([
            'message' => 'Lead capturado correctamente.',
            'data' => new LeadResource($lead),
        ], 201);
    }
}
