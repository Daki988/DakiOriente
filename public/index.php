<?php
declare(strict_types=1);

/*
 * TREMPLIN by NEAM — contrôleur frontal.
 * Développement : php -S localhost:8000 -t public public/index.php
 */

if (PHP_SAPI === 'cli-server') {
    $file = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (is_file($file) && !str_ends_with($file, '.php')) {
        return false;
    }
}

require dirname(__DIR__) . '/app/bootstrap.php';

use App\Core\Router;
use App\Core\Session;

// En-têtes de sécurité
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'self'");

// Développement local (php -S) : installation automatique de la démo SQLite au premier lancement
if (PHP_SAPI === 'cli-server' && config('db.driver') === 'sqlite' && !is_file(config('db.path'))) {
    require BASE_PATH . '/database/Migrator.php';
    \Database\Migrator::install(true);
}
// Hébergement : tant que l'installation n'est pas terminée, on renvoie vers l'assistant d'installation
if (PHP_SAPI !== 'cli-server' && !is_file(STORAGE_PATH . '/installed.lock')) {
    if (is_file(__DIR__ . '/install.php')) {
        header('Location: ' . rtrim((string)config('app.url'), '/') . '/install.php', true, 302);
    } else {
        http_response_code(503);
        echo 'Installation non terminée : déposez le fichier public/install.php puis ouvrez /install.php.';
    }
    exit;
}

// Mise à jour automatique de la base après le dépôt d'une nouvelle version (sans accès SSH)
if (is_file(STORAGE_PATH . '/installed.lock') && setting('schema_version') !== APP_VERSION) {
    require_once BASE_PATH . '/database/Migrator.php';
    try {
        $added = \Database\Migrator::upgrade();
        \App\Core\DB::run('DELETE FROM settings WHERE skey = :k', ['k' => 'schema_version']);
        \App\Core\DB::insert('settings', ['skey' => 'schema_version', 'svalue' => APP_VERSION]);
        error_log('[' . date('c') . '] Mise à jour ' . APP_VERSION . ($added ? ' : ' . implode(', ', $added) : ' (schéma déjà à jour)'));
    } catch (\Throwable $e) {
        error_log('[' . date('c') . '] Échec de la mise à jour automatique : ' . $e->getMessage());
    }
}

$isApi = str_starts_with((string)parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/api/v1');
if (!$isApi) {
    Session::start();
}

try {
    $router = new Router();
    (require APP_PATH . '/routes.php')($router);
    $router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $_SERVER['REQUEST_URI'] ?? '/');
} catch (\Throwable $e) {
    error_log('[' . date('c') . '] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine() . "\n" . $e->getTraceAsString());
    if (!headers_sent()) {
        http_response_code(500);
    }
    if ($isApi) {
        echo json_encode(['error' => 500, 'message' => config('app.debug') ? $e->getMessage() : 'Erreur serveur.']);
        exit;
    }
    echo App\Core\View::render('errors/error', [
        'code'    => 500,
        'title'   => 'Oups, une erreur est survenue',
        'message' => config('app.debug') ? $e->getMessage() . ' (' . basename($e->getFile()) . ':' . $e->getLine() . ')' : 'Notre équipe a été prévenue. Réessaie dans quelques instants.',
    ]);
}
