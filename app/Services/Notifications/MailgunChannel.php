<?php

namespace App\Services\Notifications;

use App\Models\Lead;
use App\Services\Contracts\NotificationChannel;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MailgunChannel implements NotificationChannel
{
    private string $domain;
    private string $apiKey;
    private string $from;

    public function __construct()
    {
        $this->domain = config('services.mailgun.domain');
        $this->apiKey = config('services.mailgun.secret');
        $this->from   = config('mail.from.address');
    }

    public function send(Lead $lead, string $template, array $extra = []): array
    {
        if (!$lead->email) {
            return ['success' => false, 'provider_response' => ['error' => 'Lead sin email']];
        }

        try {
            $response = Http::asForm()
                ->withBasicAuth('api', $this->apiKey)
                ->post("https://api.mailgun.net/v3/{$this->domain}/messages", [
                    'from'    => $this->from,
                    'to'      => $lead->email,
                    'subject' => $extra['subject'] ?? $this->subjectFor($template),
                    'html'    => $extra['html'] ?? $this->bodyFor($template, $lead),
                ]);

            Log::info('MailgunChannel: correo enviado', [
                'lead_id' => $lead->id,
                'status'  => $response->status(),
            ]);

            return [
                'success' => $response->successful(),
                'provider_response' => $response->json() ?? [],
            ];
        } catch (\Throwable $e) {
            Log::error('MailgunChannel: fallo al enviar correo', ['error' => $e->getMessage()]);
            return ['success' => false, 'provider_response' => ['error' => $e->getMessage()]];
        }
    }

    private function subjectFor(string $template): string
    {
        return match ($template) {
            'won_deal' => '¡Gracias por confiar en nosotros! 🎉',
            'welcome'  => 'Hemos recibido tu solicitud',
            default    => 'Actualización de tu proceso comercial',
        };
    }

    private function bodyFor(string $template, Lead $lead): string
    {
        return match ($template) {
            'won_deal' => "<p>Hola {$lead->name}, tu propuesta ha sido aceptada. Nuestro equipo se pondrá en contacto para los próximos pasos.</p>",
            'welcome'  => "<p>Hola {$lead->name}, gracias por tu interés. Un asesor te contactará pronto.</p>",
            default    => "<p>Hola {$lead->name}, tenemos novedades sobre tu caso.</p>",
        };
    }
}
