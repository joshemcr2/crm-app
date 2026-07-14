<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use App\Services\WorkflowEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function __construct(
        private WorkflowEngineService $workflowEngine,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $leads = Lead::query()
            ->with(['stage', 'assignee'])
            ->when($request->filled('search'), fn ($q) => $q->where(function ($query) use ($request) {
                $term = $request->string('search');
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('company', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%");
            }))
            ->when($request->filled('pipeline_id'), fn ($q) => $q->where('pipeline_id', $request->integer('pipeline_id')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($leads);
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = Lead::create([
            ...$request->validated(),
            'position' => Lead::where('stage_id', $request->integer('stage_id'))->count(),
            'last_activity_at' => now(),
        ]);

        $this->workflowEngine->fire('lead.created', $lead, ['source' => $lead->source]);

        return response()->json([
            'message' => 'Lead creado correctamente.',
            'data' => new LeadResource($lead->load(['stage', 'assignee'])),
        ], 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        return response()->json([
            'data' => new LeadResource($lead->load(['stage', 'assignee', 'interactions.user'])),
        ]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        $lead->update([...$request->validated(), 'last_activity_at' => now()]);

        return response()->json([
            'message' => 'Lead actualizado correctamente.',
            'data' => new LeadResource($lead->fresh(['stage', 'assignee'])),
        ]);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete(); // soft delete

        return response()->json(['message' => 'Lead eliminado correctamente.']);
    }
}
