<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\CrmIntegrationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NotifyWonDeal implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 20;

    public function __construct(public Lead $lead) {}

    public function handle(CrmIntegrationService $integrations): void
    {
        $result = $integrations->notifyAllChannels($this->lead, 'won_deal');

        Log::info('NotifyWonDeal: resultado de notificación', [
            'lead_id' => $this->lead->id,
            'result'  => $result,
        ]);
    }
}
