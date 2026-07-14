<?php

namespace App\Services;

use App\Models\Lead;
use App\Services\Notifications\MailgunChannel;
use App\Services\Notifications\TwilioChannel;

class CrmIntegrationService
{
    public function __construct(
        private MailgunChannel $mailgun,
        private TwilioChannel $twilio,
    ) {}

    public function sendEmail(Lead $lead, string $template, array $extra = []): array
    {
        return $this->mailgun->send($lead, $template, $extra);
    }

    public function sendWhatsapp(Lead $lead, string $template, array $extra = []): array
    {
        return $this->twilio->send($lead, $template, $extra);
    }

    /**
     * Notifica por todos los canales disponibles del lead (email + whatsapp)
     * Usado, por ejemplo, cuando un negocio pasa a "Ganado".
     */
    public function notifyAllChannels(Lead $lead, string $template, array $extra = []): array
    {
        return [
            'email'    => $this->sendEmail($lead, $template, $extra),
            'whatsapp' => $this->sendWhatsapp($lead, $template, $extra),
        ];
    }
}
