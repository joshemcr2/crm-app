<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MoveLeadRequest;
use App\Http\Resources\LeadResource;
use App\Http\Resources\StageResource;
use App\Models\Lead;
use App\Models\Pipeline;
use App\Services\KanbanBoardService;
use Illuminate\Http\JsonResponse;

class KanbanController extends Controller
{
    public function __construct(
        private KanbanBoardService $board,
    ) {}

    /**
     * GET /api/pipelines/{pipeline}/board
     * Devuelve las columnas (stages) con sus leads ya ordenados, listo para pintar el Kanban.
     */
    public function show(Pipeline $pipeline): JsonResponse
    {
        $stages = $pipeline->stages()
            ->with(['leads.assignee'])
            ->get();

        return response()->json([
            'data' => StageResource::collection($stages),
        ]);
    }

    /**
     * PATCH /api/leads/{lead}/move
     * Body: { "stage_id": 4, "position": 2 }
     * Se llama en el evento onDragEnd del frontend.
     */
    public function move(MoveLeadRequest $request, Lead $lead): JsonResponse
    {
        $updated = $this->board->moveLead(
            lead: $lead,
            newStageId: $request->integer('stage_id'),
            newPosition: $request->integer('position'),
        );

        return response()->json([
            'message' => 'Lead actualizado correctamente.',
            'data' => new LeadResource($updated),
        ]);
    }
}
