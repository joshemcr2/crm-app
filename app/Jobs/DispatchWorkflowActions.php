<?php

namespace App\Jobs;

use App\Models\Interaction;
use App\Models\Lead;
use App\Models\Workflow;
use App\Services\CrmIntegrationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DispatchWorkflowActions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public Workflow $workflow,
        public Lead $lead,
    ) {}

    public function handle(CrmIntegrationService $integrations): void
    {
        foreach ($this->workflow->actions as $action) {
            match ($action['type']) {
                'send_email'    => $integrations->sendEmail($this->lead, $action['template'] ?? 'default'),
                'send_whatsapp' => $integrations->sendWhatsapp($this->lead, $action['template'] ?? 'default'),
                'create_task'   => $this->createTask($action),
                default         => null,
            };
        }

        \App\Models\WorkflowLog::create([
            'workflow_id' => $this->workflow->id,
            'lead_id'     => $this->lead->id,
            'status'      => 'success',
            'message'     => "Acciones ejecutadas para el trigger '{$this->workflow->trigger_event}'",
        ]);
    }

    private function createTask(array $action): void
    {
        Interaction::create([
            'lead_id'     => $this->lead->id,
            'type'        => 'task',
            'title'       => $action['title'] ?? 'Dar seguimiento al lead',
            'description' => $action['description'] ?? null,
            'due_at'      => now()->addDays($action['due_in_days'] ?? 1),
        ]);
    }
}
