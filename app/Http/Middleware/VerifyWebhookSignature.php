<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyWebhookSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $signature = $request->header('X-CRM-Signature');
        $secret = config('services.webhook.secret');

        if (!$secret) {
            return response()->json(['message' => 'Webhook no configurado en el servidor.'], 500);
        }

        if (!$signature) {
            return response()->json(['message' => 'Firma de webhook ausente.'], 401);
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        if (!hash_equals($expected, $signature)) {
            return response()->json(['message' => 'Firma de webhook inválida.'], 401);
        }

        return $next($request);
    }
}
