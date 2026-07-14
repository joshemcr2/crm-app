<?php

namespace App\Services\Contracts;

use App\Models\Lead;

interface NotificationChannel
{
    /**
     * Envía una notificación relacionada a un Lead.
     *
     * @param  Lead   $lead
     * @param  string $template  Clave de plantilla (ej. "won_deal", "welcome")
     * @param  array  $extra     Datos adicionales para interpolar en la plantilla
     * @return array{success: bool, provider_response: array}
     */
    public function send(Lead $lead, string $template, array $extra = []): array;
}
