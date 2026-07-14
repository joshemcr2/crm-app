<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MoveLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorización real vía Policies / Sanctum ability
    }

    public function rules(): array
    {
        return [
            'stage_id' => ['required', 'integer', 'exists:stages,id'],
            'position' => ['required', 'integer', 'min:0'],
        ];
    }
}
