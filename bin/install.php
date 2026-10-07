<?php
declare(strict_types=1);

/*
 * Installation de la base TREMPLIN.
 *   php bin/install.php            → crée le schéma + données de démonstration
 *   php bin/install.php --fresh    → supprime et recrée tout
 *   php bin/install.php --no-seed  → schéma seul (production)
 *   php bin/install.php --upgrade  → met à jour une base existante
 */

require dirname(__DIR__) . '/app/bootstrap.php';
require BASE_PATH . '/database/Migrator.php';

$args = $argv ?? [];
if (in_array('--upgrade', $args, true)) {
    $added = Database\Migrator::upgrade();
    echo $added ? '✔ Mise à jour : ' . implode(', ', $added) . "\n" : "✔ Base déjà à jour\n";
    exit;
}
$fresh = in_array('--fresh', $args, true);
$seed = !in_array('--no-seed', $args, true);

if ($fresh && config('db.driver') === 'sqlite' && is_file(config('db.path'))) {
    unlink(config('db.path'));
    @unlink(config('db.path') . '-wal');
    @unlink(config('db.path') . '-shm');
    $fresh = false;
}

$t = microtime(true);
Database\Migrator::install($seed, $fresh);
App\Core\DB::run('DELETE FROM settings WHERE skey = :k', ['k' => 'schema_version']);
App\Core\DB::insert('settings', ['skey' => 'schema_version', 'svalue' => APP_VERSION]);
@file_put_contents(STORAGE_PATH . '/installed.lock', date('c') . " (installation en ligne de commande)\n");
printf("✔ Base TREMPLIN installée (%s) en %.1fs%s\n", config('db.driver'), microtime(true) - $t, $seed ? ' avec les données de démonstration' : '');
if ($seed) {
    echo "\nComptes de démonstration (mot de passe : Tremplin2026!)\n";
    echo "  Candidat   : candidat@tremplin.ga\n  Recruteur  : recruteur@tremplin.ga\n  École      : ecole@tremplin.ga\n  Admin NEAM : admin@tremplin.ga\n";
}
