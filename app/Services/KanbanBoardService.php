<?php

namespace App\Services;

use App\Jobs\NotifyWonDeal;
use App\Models\Interaction;
use App\Models\Lead;
use App\Models\Stage;
use Illuminate\Support\Facades\DB;

class KanbanBoardService
{
    public function __construct(
        private WorkflowEngineService $workflowEngine,
    ) {}

    /**
     * Mueve un Lead a una nueva columna/posición y dispara los efectos secundarios
     * (registro de historial, workflows automáticos, notificaciones si es "Ganado").
     */
    public function moveLead(Lead $lead, int $newStageId, int $newPosition): Lead
    {
        return DB::transaction(function () use ($lead, $newStageId, $newPosition) {
            $previousStage = $lead->stage;
            $newStage = Stage::findOrFail($newStageId);
            $stageChanged = $previousStage->id !== $newStage->id;

            // 1. Reindexar la columna de origen (cierra el hueco dejado por la tarjeta)
            if ($stageChanged) {
                Lead::where('stage_id', $previousStage->id)
                    ->where('position', '>', $lead->position)
                    ->decrement('position');
            }

            // 2. Abrir espacio en la columna de destino
            Lead::where('stage_id', $newStage->id)
                ->where('position', '>=', $newPosition)
                ->when($stageChanged, fn ($q) => $q, fn ($q) => $q->where('id', '!=', $lead->id))
                ->increment('position');

            // 3. Actualizar el lead
            $lead->update([
                'stage_id' => $newStage->id,
                'position' => $newPosition,
                'last_activity_at' => now(),
            ]);

            // 4. Historial de interacción
            if ($stageChanged) {
                Interaction::create([
                    'lead_id' => $lead->id,
                    'type' => 'stage_change',
                    'title' => "Movido de \"{$previousStage->name}\" a \"{$newStage->name}\"",
                ]);

                // 5. Automatizaciones genéricas configuradas por el usuario
                $this->workflowEngine->fire('lead.stage_changed', $lead, [
                    'stage_slug' => $newStage->slug,
                    'previous_stage_slug' => $previousStage->slug,
                ]);

                // 6. Regla explícita del negocio: al llegar a "Ganado" se notifica
                //    de forma asíncrona por email (Mailgun) y WhatsApp (Twilio).
                if ($newStage->type === 'won') {
                    NotifyWonDeal::dispatch($lead);
                }
            }

            return $lead->fresh(['stage', 'assignee']);
        });
    }
}
