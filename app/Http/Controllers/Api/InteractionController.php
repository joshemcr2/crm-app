<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InteractionResource;
use App\Models\Interaction;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InteractionController extends Controller
{
    public function index(Lead $lead): JsonResponse
    {
        return response()->json([
            'data' => InteractionResource::collection(
                $lead->interactions()->with('user')->get()
            ),
        ]);
    }

    public function store(Request $request, Lead $lead): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:note,call,email,whatsapp,sms,task'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_at' => ['nullable', 'date'],
        ]);

        $interaction = Interaction::create([
            ...$data,
            'lead_id' => $lead->id,
            'user_id' => $request->user()?->id,
        ]);

        $lead->update(['last_activity_at' => now()]);

        return response()->json([
            'message' => 'Interacción registrada.',
            'data' => new InteractionResource($interaction),
        ], 201);
    }
}
