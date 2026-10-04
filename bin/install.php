<?php
declare(strict_types=1);

/*
 * Installation de la base TREMPLIN.
 *   php bin/install.php            → crée le schéma + données de démonstration
 *   php bin/install.php --fresh    → supprime et recrée tout
 *   php bin/install.php --no-seed  → schéma seul (production)
 */

require dirname(__DIR__) . '/app/bootstrap.php';
require BASE_PATH . '/database/Migrator.php';

$args = $argv ?? [];
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
printf("✔ Base TREMPLIN installée (%s) en %.1fs%s\n", config('db.driver'), microtime(true) - $t, $seed ? ' avec les données de démonstration' : '');
if ($seed) {
    echo "\nComptes de démonstration (mot de passe : Tremplin2026!)\n";
    echo "  Candidat   : candidat@tremplin.ga\n  Recruteur  : recruteur@tremplin.ga\n  École      : ecole@tremplin.ga\n  Admin NEAM : admin@tremplin.ga\n";
}
