<?php

namespace App\Services;

use App\Jobs\DispatchWorkflowActions;
use App\Models\Lead;
use App\Models\Workflow;

class WorkflowEngineService
{
    /**
     * Punto de entrada único para disparar workflows desde cualquier evento del CRM.
     *
     * @param string $event  Ej: "lead.created", "lead.stage_changed"
     * @param Lead   $lead
     * @param array  $context  Datos extra, ej: ['stage_slug' => 'ganado', 'previous_stage_slug' => 'negociacion']
     */
    public function fire(string $event, Lead $lead, array $context = []): void
    {
        $workflows = Workflow::query()
            ->where('trigger_event', $event)
            ->where('is_active', true)
            ->get();

        foreach ($workflows as $workflow) {
            if ($this->conditionsMatch($workflow->conditions ?? [], $context)) {
                // Se despacha a la cola para no bloquear la petición HTTP (drag & drop instantáneo)
                DispatchWorkflowActions::dispatch($workflow, $lead);
            }
        }
    }

    /**
     * Crea un Lead a partir de un trigger externo (formulario web / API) y
     * dispara automáticamente el workflow "lead.created".
     */
    public function createLeadFromExternalTrigger(array $payload, int $pipelineId, int $defaultStageId): Lead
    {
        $lead = Lead::create([
            'pipeline_id' => $pipelineId,
            'stage_id'    => $defaultStageId,
            'name'        => $payload['name'],
            'company'     => $payload['company'] ?? null,
            'email'       => $payload['email'] ?? null,
            'phone'       => $payload['phone'] ?? null,
            'value'       => $payload['value'] ?? 0,
            'source'      => $payload['source'] ?? 'api',
            'meta'        => $payload,
            'last_activity_at' => now(),
        ]);

        $this->fire('lead.created', $lead, ['source' => $lead->source]);

        return $lead;
    }

    private function conditionsMatch(array $conditions, array $context): bool
    {
        foreach ($conditions as $key => $value) {
            if (($context[$key] ?? null) !== $value) {
                return false;
            }
        }
        return true;
    }
}
