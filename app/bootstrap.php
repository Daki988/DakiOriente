<?php
declare(strict_types=1);

/*
 * TREMPLIN by NEAM — amorçage de l'application.
 * Charge la configuration, l'autoloader PSR-4 (App\ → app/), les helpers et la session.
 */

define('BASE_PATH', dirname(__DIR__));
define('APP_PATH', BASE_PATH . '/app');
define('STORAGE_PATH', BASE_PATH . '/storage');
// Version de l'application : à chaque nouvelle version déployée, la base est mise à jour automatiquement (public/index.php)
define('APP_VERSION', '1.5.0');

spl_autoload_register(function (string $class): void {
    if (str_starts_with($class, 'App\\')) {
        $file = APP_PATH . '/' . str_replace('\\', '/', substr($class, 4)) . '.php';
        if (is_file($file)) {
            require $file;
        }
    }
});

// Dépendances Composer optionnelles (ex. SDK Claude officiel « anthropic-ai/sdk »)
if (is_file(BASE_PATH . '/vendor/autoload.php')) {
    require BASE_PATH . '/vendor/autoload.php';
}

require APP_PATH . '/helpers.php';

App\Core\Config::load(BASE_PATH);

date_default_timezone_set(config('app.timezone', 'Africa/Libreville'));
mb_internal_encoding('UTF-8');

foreach (['', '/uploads', '/logs', '/cache'] as $dir) {
    if (!is_dir(STORAGE_PATH . $dir)) {
        @mkdir(STORAGE_PATH . $dir, 0775, true);
    }
}

if (config('app.debug')) {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
}
ini_set('log_errors', '1');
ini_set('error_log', STORAGE_PATH . '/logs/php-error.log');
