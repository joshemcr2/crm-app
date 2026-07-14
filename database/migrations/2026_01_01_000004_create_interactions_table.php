<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // note, call, email, whatsapp, sms, stage_change, task
            $table->string('type');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('payload')->nullable();      // respuesta cruda de Mailgun/Twilio, etc.
            $table->timestamp('due_at')->nullable();   // para interacciones tipo "task"
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interactions');
    }
};
