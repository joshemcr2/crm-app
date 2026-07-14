<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pipeline_id')->constrained()->cascadeOnDelete();
            $table->string('name');                  // Prospecto, Contacto Inicial, Propuesta...
            $table->string('slug');                  // prospecto, contacto_inicial, propuesta...
            $table->unsignedInteger('order')->default(0);
            $table->string('color', 20)->default('zinc');   // token de color pastel para el badge
            $table->enum('type', ['open', 'won', 'lost'])->default('open');
            $table->timestamps();

            $table->unique(['pipeline_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stages');
    }
};
