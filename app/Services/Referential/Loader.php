<?php
declare(strict_types=1);

namespace App\Services\Referential;

use App\Core\DB;

/**
 * Chargement initial des référentiels v1.1 (installation et mise à jour d'une plateforme existante).
 * Idempotent : peut être relancé sans créer de doublons. Les fiches importées sont en brouillon :
 * aucune n'est validée sans relecture humaine (§11).
 */
final class Loader
{
    private const DIR = BASE_PATH . '/database/referentiels/';

    /** Tout charger ; retourne un résumé lisible. */
    public static function run(bool $linkJobs = true): array
    {
        $out = [];
        $out['competences'] = self::skills();
        $out['diplomes'] = self::degrees();
        $out['rome'] = self::rome();
        $out['metiers'] = self::occupations();
        $out['formations'] = self::trainingSkills();
        self::educationScale();
        self::candidateSkills();
        if ($linkJobs) {
            $out['offres'] = self::linkJobs();
        }
        if (!(int)DB::value('SELECT COUNT(*) FROM score_rules')) {
            DB::insert('score_rules', ['version_id' => null, 'rules' => json_encode(Ref::DEFAULT_RULES, JSON_UNESCAPED_UNICODE), 'note' => 'Valeurs de départ du cahier des charges v1.1', 'created_at' => now()]);
        }
        Normalizer::reset();
        Ref::reset();
        return $out;
    }

    /** Compétences : mise à jour des 60 compétences existantes (même nom) et ajout des nouvelles. */
    public static function skills(): int
    {
        $rows = require self::DIR . 'competences.php';
        $existing = [];
        foreach (DB::all('SELECT id, name, aliases, category FROM skills') as $s) {
            $existing[$s['name']] = $s;
        }
        $n = 0;
        foreach ($rows as $r) {
            $data = [
                'code' => $r['code'], 'category' => $r['category'], 'definition' => $r['definition'], 'esco_uri' => $r['esco_uri'], 'esco_label' => $r['esco_label'],
                'framework' => $r['framework'], 'credential' => $r['credential'] ? 1 : 0, 'proofs' => $r['credential'] ? 'certificat' : 'diplome,certificat,experience,projet',
            ];
            if (isset($existing[$r['name']])) {
                $aliases = array_unique(array_filter(array_map('trim', explode(',', (string)$existing[$r['name']]['aliases'] . ',' . $r['aliases']))));
                DB::update('skills', $data + ['aliases' => implode(',', $aliases)], 'id = :id', ['id' => $existing[$r['name']]['id']]);
            } else {
                $slug = slugify($r['name']);
                if (DB::value('SELECT id FROM skills WHERE slug = :s', ['s' => $slug])) {
                    $slug .= '-' . strtolower($r['code']);
                }
                DB::insert('skills', $data + ['name' => $r['name'], 'slug' => $slug, 'aliases' => $r['aliases'], 'status' => 'brouillon', 'revision' => 1, 'updated_at' => now()]);
                $n++;
            }
        }
        // Anciennes catégories (tech / soft) des compétences ajoutées hors référentiel
        DB::run("UPDATE skills SET category = 'technique' WHERE category = 'tech'");
        DB::run("UPDATE skills SET category = 'comportementale' WHERE category = 'soft'");
        foreach (DB::column('SELECT id FROM skills WHERE code IS NULL') as $sid) {
            DB::update('skills', ['code' => 'CMP-AJO-' . $sid], 'id = :id', ['id' => $sid]);
        }
        return $n;
    }

    public static function degrees(): int
    {
        if ((int)DB::value('SELECT COUNT(*) FROM degrees')) {
            return 0;
        }
        foreach (Ref::data()['degrees'] as [$title, $level, $country, $reco, $syn, $verify]) {
            DB::insert('degrees', ['title' => $title, 'level' => $level, 'country' => $country, 'recognition' => $reco, 'synonyms' => $syn, 'to_verify' => $verify ? 1 : 0, 'status' => 'brouillon', 'updated_at' => now()]);
        }
        return count(Ref::data()['degrees']);
    }

    /** Appellations ROME 4.0 (14 301) : index de normalisation des intitulés et aide à la curation. */
    public static function rome(): int
    {
        if ((int)DB::value('SELECT COUNT(*) FROM rome_labels')) {
            return 0;
        }
        $data = self::romeData();
        $pdo = DB::pdo();
        $own = !$pdo->inTransaction();
        if ($own) {
            $pdo->beginTransaction();
        }
        $batch = [];
        $n = 0;
        $flush = function () use (&$batch, &$n) {
            if (!$batch) {
                return;
            }
            $vals = [];
            $params = [];
            foreach ($batch as $i => [$code, $label, $norm, $fiche]) {
                $vals[] = "(:c$i, :l$i, :n$i, :f$i)";
                $params += ["c$i" => $code, "l$i" => mb_substr($label, 0, 190), "n$i" => mb_substr($norm, 0, 190), "f$i" => $fiche];
            }
            DB::run('INSERT INTO rome_labels (rome_code, label, norm, fiche) VALUES ' . implode(', ', $vals), $params);
            $n += count($batch);
            $batch = [];
        };
        foreach ($data['fiches'] as $code => [$title, $labels]) {
            $seen = [];
            $items = [[$title, 1]];
            foreach ($labels as $l) {
                $items[] = [$l, 0];
            }
            foreach ($items as [$label, $fiche]) {
                foreach (Normalizer::variants($label) as $v) {
                    $norm = normalize($v);
                    if ($norm === '' || isset($seen[$norm])) {
                        continue;
                    }
                    $seen[$norm] = true;
                    $batch[] = [$code, $fiche ? $title : $label, $norm, $fiche];
                    if (count($batch) >= 200) {
                        $flush();
                    }
                }
            }
        }
        $flush();
        if ($own) {
            $pdo->commit();
        }
        return $n;
    }

    public static function romeData(): array
    {
        static $d = null;
        if ($d === null) {
            $raw = (string)file_get_contents(self::DIR . 'rome-4.json.gz');
            $d = json_decode(function_exists('gzdecode') ? (string)gzdecode($raw) : '{}', true) ?: ['fiches' => [], 'domains' => []];
        }
        return $d;
    }

    /** Fiches métier proposées par NEAM (brouillon), leurs appellations et compétences requises. */
    public static function occupations(): int
    {
        $rows = require self::DIR . 'metiers.php';
        $sectors = array_column(DB::all('SELECT id, name FROM sectors'), 'id', 'name');
        $skills = array_column(DB::all('SELECT id, name FROM skills'), 'id', 'name');
        $n = 0;
        foreach ($rows as $r) {
            if (DB::value('SELECT id FROM occupations WHERE code = :c', ['c' => $r['code']])) {
                continue;
            }
            $id = DB::insert('occupations', [
                'code' => $r['code'], 'rome_code' => $r['rome'], 'title' => $r['title'], 'family' => $r['family'], 'sector_id' => $sectors[$r['sector']] ?? null,
                'education_min' => $r['education'], 'fields' => implode(',', $r['fields']), 'languages' => $r['languages'] ? json_encode($r['languages'], JSON_UNESCAPED_UNICODE) : null,
                'regulated_degree' => $r['regulated'], 'related' => implode(',', $r['related']), 'isco_code' => $r['isco'], 'isco_label' => $r['isco_label'],
                'isco_source' => $r['isco_source'], 'esco_uri' => $r['esco_uri'], 'esco_label' => $r['esco_label'], 'status' => 'brouillon', 'revision' => 1,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $seen = [];
            $labels = array_merge([[$r['title'], 'rome']], array_map(fn($l) => [$l, 'rome'], $r['rome_labels']), array_map(fn($l) => [$l, 'local'], $r['local']));
            foreach ($labels as [$label, $src]) {
                foreach (Normalizer::variants($label) as $v) {
                    $norm = normalize($v);
                    if ($norm !== '' && !isset($seen[$norm])) {
                        $seen[$norm] = true;
                        DB::insert('occupation_labels', ['occupation_id' => $id, 'label' => mb_substr($v, 0, 190), 'norm' => mb_substr($norm, 0, 190), 'source' => $src]);
                    }
                }
            }
            foreach ($r['skills'] as $s) {
                if (isset($skills[$s['name']])) {
                    DB::insert('occupation_skills', ['occupation_id' => $id, 'skill_id' => $skills[$s['name']], 'level' => $s['level'], 'weight' => $s['weight'], 'blocking' => 0]);
                }
            }
            foreach ($r['blocking'] as $b) {
                if (isset($skills[$b])) {
                    DB::insert('occupation_skills', ['occupation_id' => $id, 'skill_id' => $skills[$b], 'level' => 1, 'weight' => 0, 'blocking' => 1]);
                }
            }
            $n++;
        }
        return $n;
    }

    /** Compétences développées par chaque formation et niveau atteint (référentiel Formations, §6). */
    public static function trainingSkills(): int
    {
        $skills = array_column(DB::all('SELECT id, name FROM skills'), 'id', 'name');
        $n = 0;
        $done = array_flip(DB::column('SELECT DISTINCT training_id FROM training_skills'));
        foreach (DB::all('SELECT id, skill_id, skills, level, certificate FROM trainings') as $t) {
            if (isset($done[$t['id']])) {
                continue;
            }
            $reached = self::levelReached((string)$t['level'], (string)$t['certificate']);
            $ids = [];
            if ($t['skill_id']) {
                $ids[] = (int)$t['skill_id'];
            }
            foreach (array_filter(array_map('trim', explode(',', (string)$t['skills']))) as $name) {
                if (isset($skills[$name])) {
                    $ids[] = (int)$skills[$name];
                }
            }
            foreach (array_unique($ids) as $sid) {
                DB::insert('training_skills', ['training_id' => $t['id'], 'skill_id' => $sid, 'level_reached' => $reached]);
                $n++;
            }
        }
        // Reconnaissance déduite du type de certificat ; date de vérification = constitution du catalogue
        DB::run("UPDATE trainings SET recognition = CASE certificate WHEN 'gratuit' THEN 'certifiante' WHEN 'payant' THEN 'certifiante' WHEN 'badge' THEN 'attestation' WHEN 'aucun' THEN 'aucune' ELSE 'attestation' END WHERE recognition IS NULL");
        $catalogDate = (require BASE_PATH . '/database/learning.php')['verified_at'] ?? null;
        if ($catalogDate) {
            DB::run("UPDATE trainings SET verified_at = :d WHERE verified_at IS NULL AND source = 'catalogue'", ['d' => $catalogDate . ' 00:00:00']);
        }
        DB::run("UPDATE trainings SET verified_at = updated_at WHERE verified_at IS NULL AND source IN ('api', 'import') AND updated_at IS NOT NULL");
        return $n;
    }

    /** Niveau atteint en fin de formation sur l'échelle 1-4 : un cours seul ne prouve pas une expérience. */
    public static function levelReached(string $level, string $certificate): int
    {
        return match ($level) {
            'avance' => in_array($certificate, ['gratuit', 'payant', 'badge'], true) ? 3 : 2,
            'intermediaire' => 2,
            default => in_array($certificate, ['gratuit', 'payant', 'badge'], true) ? 2 : 1,
        };
    }

    /**
     * Passage à l'échelle commune N0-N6 (§7). Ancienne échelle : 0-7 avec un niveau Bac+4 distinct,
     * désormais rattaché à N4 (Bac+3), Bac+5 → N5 et Doctorat → N6.
     */
    public static function educationScale(): void
    {
        if (setting('education_scale') === 'tremplin-n' || DB::value("SELECT svalue FROM settings WHERE skey = 'education_scale'")) {
            return;
        }
        $map = 'CASE %1$s WHEN 5 THEN 4 WHEN 6 THEN 5 WHEN 7 THEN 6 ELSE %1$s END';
        DB::run('UPDATE candidate_profiles SET education_level = ' . sprintf($map, 'education_level'));
        DB::run('UPDATE jobs SET education_min = ' . sprintf($map, 'education_min'));
        DB::run('UPDATE job_families SET education_min = ' . sprintf($map, 'education_min'));
        DB::insert('settings', ['skey' => 'education_scale', 'svalue' => 'tremplin-n']);
    }

    /** Ancienne échelle de compétences 1-5 ramenée à 1-4 ; les preuves restent à fournir par le candidat. */
    public static function candidateSkills(): void
    {
        if (DB::value("SELECT svalue FROM settings WHERE skey = 'skill_scale'")) {
            return;
        }
        DB::run('UPDATE candidate_skills SET level = 4 WHERE level > 4');
        DB::run('UPDATE job_skills SET level = CASE WHEN required = 1 THEN 3 ELSE 2 END');
        DB::insert('settings', ['skey' => 'skill_scale', 'svalue' => '1-4']);
    }

    /**
     * Rattache les offres existantes à un code métier (proposé, à confirmer par le recruteur),
     * complète leurs compétences comportementales et envoie les intitulés inconnus en curation.
     */
    public static function linkJobs(bool $confirm = false): array
    {
        $rules = Ref::draftRules()['normalization'];
        $linked = $queued = 0;
        $softIds = array_column(DB::all("SELECT id, name FROM skills WHERE category = 'comportementale'"), 'id', 'name');
        foreach (DB::all('SELECT id, title, soft_skills, occupation_id FROM jobs') as $j) {
            if (!$j['occupation_id']) {
                $m = Normalizer::occupation((string)$j['title']);
                if ($m && $m['confidence'] >= $rules['confirm']) {
                    DB::update('jobs', ['occupation_id' => $m['id'], 'occupation_confidence' => $m['confidence'], 'occupation_confirmed' => $confirm ? 1 : 0], 'id = :id', ['id' => $j['id']]);
                    $linked++;
                } else {
                    Curation::add('appellation', (string)$j['title'], 'offre', (int)$j['id'], $m ? ['code' => $m['code'], 'title' => $m['title'], 'confidence' => $m['confidence']] : Normalizer::romeFor((string)$j['title']));
                    $queued++;
                }
            }
            foreach (array_filter(array_map('trim', explode(',', (string)$j['soft_skills']))) as $soft) {
                $sid = $softIds[$soft] ?? null;
                if ($sid && !DB::value('SELECT 1 FROM job_skills WHERE job_id = :j AND skill_id = :s', ['j' => $j['id'], 's' => $sid])) {
                    DB::insert('job_skills', ['job_id' => $j['id'], 'skill_id' => $sid, 'required' => 0, 'weight' => 1, 'level' => 2, 'blocking' => 0]);
                }
            }
        }
        return ['linked' => $linked, 'queued' => $queued];
    }
}
