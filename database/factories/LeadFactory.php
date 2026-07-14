<?php

namespace Database\Factories;

use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeadFactory extends Factory
{
    protected $model = Lead::class;

    /**
     * Nota: 'pipeline_id' y 'stage_id' se omiten del definition() a propósito.
     * Este factory se usa siempre pasando esos IDs explícitamente
     * (ver database/seeders/CrmDemoSeeder.php), ya que un Lead nunca
     * debe crearse sin un pipeline/stage real existente.
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'company' => $this->faker->company(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->numerify('+34 6## ### ###'),
            'value' => $this->faker->randomFloat(2, 300, 25000),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
            'source' => $this->faker->randomElement(['web_form', 'api', 'manual', 'referral']),
            'position' => 0,
            'last_activity_at' => $this->faker->dateTimeBetween('-15 days', 'now'),
        ];
    }
}
