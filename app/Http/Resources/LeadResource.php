<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'company'    => $this->company,
            'email'      => $this->email,
            'phone'      => $this->phone,
            'value'      => (float) $this->value,
            'priority'   => $this->priority,
            'stage_id'   => $this->stage_id,
            'position'   => $this->position,
            'assignee'   => $this->whenLoaded('assignee', fn () => [
                'id'     => $this->assignee->id,
                'name'   => $this->assignee->name,
                'avatar' => $this->assignee->avatar_url ?? null,
            ]),
            'last_activity_at' => $this->last_activity_at?->diffForHumans(),
            'created_at' => $this->created_at,
        ];
    }
}
