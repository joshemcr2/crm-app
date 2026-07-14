<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Disparadores: lead.created, lead.stage_changed, lead.stage_changed:won ...
            $table->string('trigger_event');
            $table->json('conditions')->nullable();     // ej: {"stage_slug": "ganado"}
            $table->json('actions');                     // ej: [{"type":"send_email","template":"welcome"}, {"type":"create_task"}]
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('workflow_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['success', 'failed', 'skipped'])->default('success');
            $table->text('message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_logs');
        Schema::dropIfExists('workflows');
    }
};
