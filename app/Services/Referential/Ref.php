<?php
declare(strict_types=1);

namespace App\Services\Referential;

use App\Core\DB;

/**
 * Accès aux cinq référentiels de la v1.1 (cahier des charges §3 à §8).
 *
 * Le moteur de score lit toujours une version PUBLIÉE des référentiels : un instantané figé
 * (règles, fiches métier, compétences, échelle des diplômes) écrit dans storage/referentiels/vN.json.
 * Les curateurs modifient les tables de travail ; rien ne change pour les candidats tant qu'une
 * nouvelle version n'est pas publiée (après passage du jeu de référence). Un même profil face à
 * une même offre obtient donc toujours le même score pour une même version.
 */
final class Ref
{
    /** Échelle de maîtrise des compétences (§5). */
    public const LEVELS = [
        1 => ['Notions', 'Connaît les principes ; a suivi un cours ou une initiation.'],
        2 => ['Opérationnel', 'Réalise des tâches simples sous supervision (projet d\'école, stage).'],
        3 => ['Maîtrise', 'Réalise des tâches courantes en autonomie, avec une expérience vérifiable.'],
        4 => ['Expert', 'Résout des cas complexes, forme ou encadre d\'autres personnes.'],
    ];

    public const CATEGORIES = [
        'technique'       => ['Techniques', 'Savoir-faire propres à un métier'],
        'numerique'       => ['Numériques', 'Bureautique, outils collaboratifs, données, réseaux professionnels (DigComp)'],
        'comportementale' => ['Comportementales', 'Communication, travail en équipe, rigueur, autonomie'],
        'linguistique'    => ['Linguistiques', 'Langues évaluées de A1 à C2 (CECRL)'],
        'transverse'      => ['Transverses', 'Gestion de projet, résolution de problèmes, service client'],
    ];

    /** Preuves acceptées : sans preuve, une compétence déclarée est plafonnée (§5). */
    public const PROOFS = [
        'aucune'     => 'Déclarée sans preuve',
        'diplome'    => 'Diplôme',
        'certificat' => 'Certificat ou attestation',
        'experience' => 'Expérience (stage, emploi)',
        'projet'     => 'Projet réalisé',
    ];

    /** Cycle de vie d'une fiche (§11). */
    public const STATUSES = [
        'brouillon' => ['Brouillon', 'gray'],
        'relu'      => ['Relu par un expert', 'blue'],
        'valide'    => ['Validé', 'green'],
        'archive'   => ['Archivé', 'amber'],
    ];

    public const CRITERIA = [
        'skills'     => ['Compétences', 'Couverture des compétences requises, pondérée par leur poids et l\'écart de niveau'],
        'degree'     => ['Diplôme', 'Niveau Tremplin et domaine d\'études comparés à l\'exigence'],
        'experience' => ['Expérience', 'Durée et pertinence des stages, emplois et projets'],
        'languages'  => ['Langues', 'Niveau CECRL comparé au niveau exigé'],
        'cv'         => ['Qualité du CV', 'Complétude, clarté, preuves, adaptation à l\'offre'],
        'location'   => ['Localisation et disponibilité', 'Ville, mobilité, dates de disponibilité'],
    ];

    /** Valeurs de départ du référentiel Objectifs & Seuils (§8), recalibrées après 6 mois d'usage. */
    public const DEFAULT_RULES = [
        'weights' => ['skills' => 40, 'degree' => 20, 'experience' => 15, 'languages' => 10, 'cv' => 10, 'location' => 5],
        'thresholds' => [
            ['min' => 75, 'key' => 'adapte', 'label' => 'Profil adapté', 'color' => 'green', 'action' => 'Postuler : une lettre de motivation ciblée t\'est proposée.'],
            ['min' => 55, 'key' => 'proche', 'label' => 'Profil proche', 'color' => 'blue', 'action' => 'Adapter ton CV et valoriser tes points forts avant de postuler.'],
            ['min' => 40, 'key' => 'renforcer', 'label' => 'Profil à renforcer', 'color' => 'amber', 'action' => 'Te former d\'abord : les formations liées à tes écarts sont proposées ci-dessous.'],
            ['min' => 0, 'key' => 'eloigne', 'label' => 'Profil éloigné', 'color' => 'gray', 'action' => 'Offre non recommandée pour l\'instant : des métiers proches te sont suggérés.'],
        ],
        'blocked' => ['key' => 'prerequis', 'label' => 'Prérequis manquant', 'color' => 'red'],
        'level_penalty' => 0.35,       // perte par niveau manquant sur une compétence (§9)
        'unproven_cap' => 2,           // niveau maximal retenu sans preuve (§5)
        'degree' => ['gap' => [1.0, 0.5, 0.2, 0.0], 'level_share' => 0.75, 'domain_unknown' => 0.6, 'domain_other' => 0.3],
        'experience' => ['beginner' => 0.7, 'project_months' => 2, 'other_share' => 0.5],
        'languages' => ['per_level' => 0.25],
        'location' => ['same_city' => 1.0, 'national' => 0.8, 'city_only' => 0.3, 'abroad_mobile' => 0.6, 'abroad' => 0.1, 'unknown' => 0.5, 'late' => 0.3, 'share' => 0.6],
        'employability' => ['offers' => 10, 'ready' => 70, 'max_targets' => 3],
        'trainings' => ['per_gap' => 3, 'freshness_months' => 6],
        'normalization' => ['auto' => 85, 'confirm' => 60],
        'golden' => ['max_mae' => 10, 'min_pairs' => 20, 'target_pairs' => 200],
    ];

    private static ?array $snapshot = null;
    private static ?array $override = null;

    /* ------------------------------------------------------------------ Versions */

    /** Version publiée en vigueur (0 si aucune). */
    public static function version(): int
    {
        return (int)(self::snapshot()['version'] ?? 0);
    }

    public static function snapshot(): array
    {
        if (self::$override !== null) {
            return self::$override;
        }
        if (self::$snapshot !== null) {
            return self::$snapshot;
        }
        $row = null;
        try {
            $row = DB::one('SELECT * FROM ref_versions ORDER BY number DESC LIMIT 1');
        } catch (\Throwable) {
        }
        $snap = null;
        if ($row && $row['file'] && is_file($f = STORAGE_PATH . '/referentiels/' . basename((string)$row['file']))) {
            $snap = json_decode((string)file_get_contents($f), true);
        }
        if (!is_array($snap)) {
            // Aucune version publiée lisible : instantané des tables de travail (installation en cours, tests)
            $snap = self::build(0);
        }
        return self::$snapshot = $snap;
    }

    /** Évalue temporairement un instantané non publié (jeu de référence avant publication). */
    public static function withSnapshot(array $snap, callable $fn): mixed
    {
        $prev = self::$override;
        self::$override = $snap;
        try {
            return $fn();
        } finally {
            self::$override = $prev;
        }
    }

    public static function reset(): void
    {
        self::$snapshot = null;
    }

    /** Instantané complet des référentiels à partir des tables de travail (fiches archivées exclues). */
    public static function build(int $version, ?array $rules = null): array
    {
        $occ = [];
        try {
            $skillsBy = [];
            foreach (DB::all('SELECT occupation_id, skill_id, level, weight, blocking FROM occupation_skills') as $r) {
                $skillsBy[(int)$r['occupation_id']][] = ['id' => (int)$r['skill_id'], 'level' => (int)$r['level'], 'weight' => (int)$r['weight'], 'blocking' => (int)$r['blocking']];
            }
            foreach (DB::all("SELECT id, code, rome_code, title, family, sector_id, education_min, fields, languages, regulated_degree, related, isco_code, esco_uri, status FROM occupations WHERE status != 'archive'") as $o) {
                $occ[(int)$o['id']] = [
                    'code' => $o['code'], 'rome' => $o['rome_code'], 'title' => $o['title'], 'family' => $o['family'], 'sector_id' => (int)$o['sector_id'],
                    'education' => (int)$o['education_min'], 'fields' => array_values(array_filter(explode(',', (string)$o['fields']))),
                    'languages' => json_decode((string)$o['languages'], true) ?: [], 'regulated' => $o['regulated_degree'],
                    'related' => array_values(array_filter(explode(',', (string)$o['related']))), 'isco' => $o['isco_code'], 'status' => $o['status'],
                    'skills' => $skillsBy[(int)$o['id']] ?? [],
                ];
            }
            $skills = [];
            foreach (DB::all('SELECT id, code, name, category, credential, status FROM skills') as $s) {
                $skills[(int)$s['id']] = ['code' => $s['code'], 'name' => $s['name'], 'category' => self::category((string)$s['category']), 'credential' => (int)$s['credential']];
            }
            $degrees = DB::all('SELECT id, title, level, synonyms, to_verify FROM degrees ORDER BY level, id');
        } catch (\Throwable) {
            $skills = [];
            $degrees = [];
        }
        return [
            'version' => $version, 'built_at' => now(), 'rules' => $rules ?? self::draftRules(),
            'occupations' => $occ, 'skills' => $skills, 'degrees' => $degrees,
        ];
    }

    /* ------------------------------------------------------------------ Règles */

    public static function rules(): array
    {
        return self::merge(self::DEFAULT_RULES, self::snapshot()['rules'] ?? []);
    }

    /** Règles en cours d'édition (appliquées à la prochaine version publiée). */
    public static function draftRules(): array
    {
        try {
            $r = DB::value('SELECT rules FROM score_rules WHERE version_id IS NULL ORDER BY id DESC LIMIT 1');
            if ($r) {
                return self::merge(self::DEFAULT_RULES, json_decode((string)$r, true) ?: []);
            }
            $r = DB::value('SELECT rules FROM score_rules ORDER BY id DESC LIMIT 1');
            if ($r) {
                return self::merge(self::DEFAULT_RULES, json_decode((string)$r, true) ?: []);
            }
        } catch (\Throwable) {
        }
        return self::DEFAULT_RULES;
    }

    private static function merge(array $base, array $over): array
    {
        foreach ($over as $k => $v) {
            $base[$k] = is_array($v) && isset($base[$k]) && is_array($base[$k]) && !array_is_list($v) ? self::merge($base[$k], $v) : $v;
        }
        return $base;
    }

    /** Verdict et action associés à un score (référentiel Objectifs & Seuils). */
    public static function verdict(int $score, bool $blocked = false): array
    {
        $r = self::rules();
        if ($blocked) {
            return $r['blocked'] + ['action' => 'Le prérequis indiqué est indispensable pour cette offre.'];
        }
        foreach ($r['thresholds'] as $t) {
            if ($score >= (int)$t['min']) {
                return $t;
            }
        }
        return end($r['thresholds']);
    }

    /* ------------------------------------------------------------------ Lecture */

    public static function occupation(?int $id): ?array
    {
        return $id ? (self::snapshot()['occupations'][$id] ?? null) : null;
    }

    public static function occupationByCode(string $code): ?array
    {
        foreach (self::snapshot()['occupations'] as $id => $o) {
            if ($o['code'] === $code) {
                return $o + ['id' => $id];
            }
        }
        return null;
    }

    public static function skill(int $id): ?array
    {
        return self::snapshot()['skills'][$id] ?? null;
    }

    public static function category(string $c): string
    {
        return match ($c) {
            'tech' => 'technique',
            'soft' => 'comportementale',
            default => isset(self::CATEGORIES[$c]) ? $c : 'technique',
        };
    }

    /** Libellé du niveau de diplôme : « N4 · Bac+3 ». */
    public static function degreeLabel(int $n, bool $short = false): string
    {
        $l = self::data()['levels'][max(0, min(6, $n))];
        return $short ? $l[0] : $l[0] . ' · ' . $l[1];
    }

    /** Données de base (diplômes, domaines d'études) livrées avec la plateforme. */
    public static function data(): array
    {
        static $d = null;
        return $d ??= require BASE_PATH . '/database/referentiels/diplomes.php';
    }

    /** Domaines d'études reconnus dans un texte libre (intitulé de diplôme, filière). */
    public static function fieldsOf(string $text): array
    {
        $norm = ' ' . normalize($text) . ' ';
        if (trim($norm) === '') {
            return [];
        }
        $found = [];
        foreach (self::data()['fields'] as $code => [, $kw]) {
            foreach (explode(',', $kw) as $k) {
                if ($k !== '' && str_contains($norm, ' ' . $k . ' ')) {
                    $found[] = $code;
                    break;
                }
            }
        }
        return $found;
    }

    public static function fieldLabel(string $code): string
    {
        return self::data()['fields'][$code][0] ?? ucfirst($code);
    }
}
