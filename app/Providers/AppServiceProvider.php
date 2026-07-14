<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL; // <-- Agregamos esto

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Forzar HTTPS en entornos de producción como Railway
        if (config('app.env') === 'production' || config('app.env') === 'local') {
            URL::forceScheme('https');
        }
    }
}