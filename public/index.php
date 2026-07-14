<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Modo mantenimiento
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Autoloader de Composer
require __DIR__.'/../vendor/autoload.php';

// Arrancar la aplicación
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
