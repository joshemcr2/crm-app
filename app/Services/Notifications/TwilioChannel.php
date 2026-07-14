<?php

namespace App\Services\Notifications;

use App\Models\Lead;
use App\Services\Contracts\NotificationChannel;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioChannel implements NotificationChannel
{
    private string $sid;
    private string $token;
    private string $fromWhatsapp;

    public function __construct()
    {
        $this->sid = config('services.twilio.sid');
        $this->token = config('services.twilio.token');
        $this->fromWhatsapp = config('services.twilio.whatsapp_from'); // ej: whatsapp:+14155238886
    }

    public function send(Lead $lead, string $template, array $extra = []): array
    {
        if (!$lead->phone) {
            return ['success' => false, 'provider_response' => ['error' => 'Lead sin teléfono']];
        }

        try {
            $response = Http::asForm()
                ->withBasicAuth($this->sid, $this->token)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$this->sid}/Messages.json", [
                    'From' => $this->fromWhatsapp,
                    'To'   => 'whatsapp:' . $lead->phone,
                    'Body' => $extra['body'] ?? $this->bodyFor($template, $lead),
                ]);

            Log::info('TwilioChannel: mensaje enviado', [
                'lead_id' => $lead->id,
                'status'  => $response->status(),
            ]);

            return [
                'success' => $response->successful(),
                'provider_response' => $response->json() ?? [],
            ];
        } catch (\Throwable $e) {
            Log::error('TwilioChannel: fallo al enviar mensaje', ['error' => $e->getMessage()]);
            return ['success' => false, 'provider_response' => ['error' => $e->getMessage()]];
        }
    }

    private function bodyFor(string $template, Lead $lead): string
    {
        return match ($template) {
            'won_deal' => "¡Hola {$lead->name}! 🎉 Tu propuesta fue aceptada. Pronto un asesor te escribirá.",
            default    => "Hola {$lead->name}, tenemos novedades sobre tu proceso.",
        };
    }
}
