<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pipeline_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stage_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();

            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->decimal('value', 12, 2)->default(0);       // valor estimado del negocio
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->enum('source', ['web_form', 'api', 'manual', 'referral', 'import'])->default('manual');
            $table->json('meta')->nullable();                  // payload crudo del trigger externo
            $table->unsignedInteger('position')->default(0);   // orden dentro de la columna Kanban
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['stage_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
