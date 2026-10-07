<?php
declare(strict_types=1);

/*
 * Import des jeux de données ouverts ROME et ESCO (cahier des charges v1.1 §12).
 *
 *   php bin/import-referentiel.php --rome fichier.csv
 *       Appellations ROME (CSV « code ROME ; libellé », séparateur ; ou ,) : complète l'index de normalisation.
 *       Sans fichier, l'arborescence ROME 4.0 livrée avec la plateforme est rechargée.
 *
 *   php bin/import-referentiel.php --esco occupations_fr.csv
 *       Export « occupations » d'ESCO en français (colonnes conceptUri, preferredLabel, altLabels, iscoGroup) :
 *       propose les correspondances ESCO / ISCO-08 manquantes des fiches métier par concordance exacte des appellations.
 *
 * Les correspondances proposées ne changent pas le statut des fiches : elles restent à valider par les experts,
 * et chaque proposition est inscrite au journal de la prochaine version.
 */
require dirname(__DIR__) . '/app/bootstrap.php';

use App\Core\DB;
use App\Services\Referential\Curation;
use App\Services\Referential\Loader;
use App\Services\Referential\Normalizer;

$args = $argv;
$opt = $args[1] ?? '';
$file = $args[2] ?? null;

function rows(string $file): Generator
{
    $h = fopen($file, 'r');
    if (!$h) {
        fwrite(STDERR, "Fichier illisible : $file\n");
        exit(1);
    }
    $first = (string)fgets($h);
    $sep = substr_count($first, ';') > substr_count($first, ',') ? ';' : ',';
    $head = array_map(fn($c) => strtolower(trim($c, " \t\n\r\0\x0B\"\xEF\xBB\xBF")), str_getcsv($first, $sep));
    while (($r = fgetcsv($h, 0, $sep)) !== false) {
        if (count($r) === count($head)) {
            yield array_combine($head, $r);
        }
    }
    fclose($h);
}

if ($opt === '--rome') {
    if (!$file) {
        DB::run('DELETE FROM rome_labels');
        printf("✔ %d appellations ROME 4.0 rechargées depuis l'arborescence livrée\n", Loader::rome());
        exit;
    }
    $n = 0;
    foreach (rows($file) as $r) {
        $code = '';
        $label = '';
        foreach ($r as $k => $v) {
            if ($code === '' && str_contains($k, 'rome') && preg_match('/^[A-N]\d{4}$/', trim($v))) {
                $code = trim($v);
            } elseif ($label === '' && (str_contains($k, 'libelle') || str_contains($k, 'label') || str_contains($k, 'appellation')) && trim($v) !== '') {
                $label = trim($v);
            }
        }
        if ($code === '' || $label === '') {
            continue;
        }
        foreach (Normalizer::variants($label) as $v) {
            $norm = normalize($v);
            if ($norm !== '' && !DB::value('SELECT 1 FROM rome_labels WHERE norm = :n AND rome_code = :c', ['n' => $norm, 'c' => $code])) {
                DB::insert('rome_labels', ['rome_code' => $code, 'label' => mb_substr($label, 0, 190), 'norm' => mb_substr($norm, 0, 190), 'fiche' => 0]);
                $n++;
            }
        }
    }
    printf("✔ %d appellations ROME ajoutées à l'index de normalisation\n", $n);
    exit;
}

if ($opt === '--esco' && $file) {
    // Index des appellations Tremplin (fiches sans correspondance ESCO)
    $targets = [];
    foreach (DB::all("SELECT o.id, o.code, l.norm FROM occupations o JOIN occupation_labels l ON l.occupation_id = o.id WHERE o.esco_uri IS NULL AND o.status != 'archive'") as $r) {
        $targets[$r['norm']][(int)$r['id']] = $r['code'];
    }
    $found = [];
    foreach (rows($file) as $r) {
        $uri = $r['concepturi'] ?? '';
        if ($uri === '') {
            continue;
        }
        $labels = array_merge([(string)($r['preferredlabel'] ?? '')], preg_split('/\n|\|/', (string)($r['altlabels'] ?? '')) ?: []);
        foreach ($labels as $l) {
            foreach (array_map('trim', explode('/', $l)) as $variant) {
                $norm = normalize($variant);
                foreach ($targets[$norm] ?? [] as $id => $code) {
                    $found[$id] ??= ['uri' => $uri, 'label' => (string)$r['preferredlabel'], 'isco' => substr(preg_replace('/\D/', '', (string)($r['iscogroup'] ?? '')), 0, 4), 'code' => $code];
                }
            }
        }
    }
    foreach ($found as $id => $f) {
        $data = ['esco_uri' => mb_substr($f['uri'], 0, 190), 'esco_label' => mb_substr($f['label'], 0, 190), 'updated_at' => now()];
        if (strlen($f['isco']) === 4) {
            $data += ['isco_code' => $f['isco'], 'isco_source' => 'ESCO'];
        }
        DB::update('occupations', $data, 'id = :id', ['id' => $id]);
        Curation::log('metier', $id, 'esco', $f['code'] . ' : correspondance ESCO proposée par import (' . $f['label'] . ')', null);
    }
    printf("✔ %d correspondance(s) ESCO proposée(s), à valider par les experts avant publication\n", count($found));
    exit;
}

echo "Usage : php bin/import-referentiel.php --rome [fichier.csv] | --esco occupations_fr.csv\n";
exit(1);
