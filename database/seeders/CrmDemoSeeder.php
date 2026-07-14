<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CrmDemoSeeder extends Seeder
{
    public function run(): void
    {
        $demoUser = User::firstOrCreate(
            ['email' => 'demo@crm-operativo.test'],
            ['name' => 'Asesor Demo', 'password' => Hash::make('password')]
        );

        $pipeline = Pipeline::create([
            'name' => 'Pipeline Comercial',
            'slug' => 'pipeline-comercial',
            'is_default' => true,
        ]);

        $stages = [
            ['name' => 'Prospecto',        'slug' => 'prospecto',        'order' => 1, 'color' => 'slate',   'type' => 'open'],
            ['name' => 'Contacto Inicial', 'slug' => 'contacto_inicial', 'order' => 2, 'color' => 'sky',     'type' => 'open'],
            ['name' => 'Propuesta',        'slug' => 'propuesta',        'order' => 3, 'color' => 'amber',   'type' => 'open'],
            ['name' => 'Negociación',      'slug' => 'negociacion',      'order' => 4, 'color' => 'violet',  'type' => 'open'],
            ['name' => 'Ganado',           'slug' => 'ganado',           'order' => 5, 'color' => 'emerald', 'type' => 'won'],
            ['name' => 'Perdido',          'slug' => 'perdido',          'order' => 6, 'color' => 'rose',    'type' => 'lost'],
        ];

        foreach ($stages as $stageData) {
            $stage = Stage::create([...$stageData, 'pipeline_id' => $pipeline->id]);

            // 3 leads de ejemplo por columna, con posición secuencial
            for ($i = 0; $i < 3; $i++) {
                Lead::factory()->create([
                    'pipeline_id' => $pipeline->id,
                    'stage_id'    => $stage->id,
                    'position'    => $i,
                    'assigned_to' => $demoUser->id,
                ]);
            }
        }
    }
}
