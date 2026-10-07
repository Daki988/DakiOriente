<?php
declare(strict_types=1);

/*
 * Vérification des liens de formation (à planifier chaque nuit dans le gestionnaire de tâches cron LWS) :
 *   php bin/verifier-formations.php [nombre]   (par défaut 60 formations, les moins récemment vérifiées d'abord)
 * Une formation non vérifiée depuis 6 mois est masquée automatiquement jusqu'à sa revérification.
 */
require dirname(__DIR__) . '/app/bootstrap.php';

$n = (int)($argv[1] ?? 60);
$r = App\Services\Training\LinkChecker::run($n);
printf("✔ %d liens vérifiés : %d joignables, %d morts (signalés en curation), %d erreurs réseau (réessai au prochain passage)\n", $r['checked'], $r['ok'], $r['dead'], $r['error']);
