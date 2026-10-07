<?php
declare(strict_types=1);

namespace App\Services\Referential;

use App\Core\DB;

/**
 * Normalisation : rattache un intitulé libre (offre, CV) à un code des référentiels, avec un indice de confiance (0-100).
 *
 * Ordre : correspondance exacte d'une appellation Tremplin (100) → appellation ROME 4.0 d'une fiche rattachée (95)
 * → appellation contenue dans l'intitulé (75 à 92) → similarité des mots (0 à 80).
 * En dessous du seuil de confirmation, l'élément part en file de curation au lieu d'être ignoré (§4).
 */
final class Normalizer
{
    private const NOISE = ['stage', 'stagiaire', 'stagiaires', 'alternance', 'alternant', 'alternante', 'apprenti', 'apprentie', 'junior', 'senior', 'confirme', 'confirmee',
        'debutant', 'debutante', 'h', 'f', 'hf', 'cdi', 'cdd', 'freelance', 'mission', 'programme', 'jeunes', 'talents', 'poste', 'offre', 'urgent',
        'de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'd', 'l', 'un', 'une', 'pour', 'a', 'ou', 'avec', 'sur', 'dans', 'par'];

    private static ?array $index = null;
    private static ?array $skillIndex = null;

    /** Nettoie un intitulé : formes inclusives (Développeur·se, Agent/Agente), parenthèses, tirets de contexte. */
    public static function clean(string $title): string
    {
        $t = preg_replace('/[·•]\p{L}+/u', '', $title) ?? $title;                     // Développeur·se → Développeur
        $t = preg_replace('/\(([^)]*)\)/u', ' ', $t) ?? $t;
        $t = preg_replace('/\s+[—–-]\s+.*$/u', '', $t) ?? $t;                         // « Conseiller clientèle — Programme Jeunes »
        $t = preg_replace('#\s*/\s*\p{L}+#u', '', $t) ?? $t;                          // « Agent / Agente » → « Agent »
        return trim($t);
    }

    /** Variantes masculine et féminine d'une appellation ROME « Développeur / Développeuse web ». */
    public static function variants(string $label): array
    {
        if (!str_contains($label, ' / ')) {
            return [$label];
        }
        [$a, $b] = explode(' / ', $label, 2);
        $wa = explode(' ', $a);
        $wb = explode(' ', $b);
        $rest = array_slice($wb, count($wa));
        $tail = $rest ? ' ' . implode(' ', $rest) : '';
        return array_values(array_unique([$a . $tail, implode(' ', array_slice($wb, 0, count($wa))) . $tail]));
    }

    public static function tokens(string $text): array
    {
        $words = preg_split('/\s+/', normalize($text)) ?: [];
        $out = [];
        foreach ($words as $w) {
            if ($w === '' || in_array($w, self::NOISE, true) || (mb_strlen($w) < 2 && !ctype_digit($w))) {
                continue;
            }
            $out[] = substr($w, 0, 6);
        }
        return array_values(array_unique($out));
    }

    private static function index(): array
    {
        if (self::$index !== null) {
            return self::$index;
        }
        $idx = ['exact' => [], 'labels' => []];
        foreach (DB::all("SELECT l.occupation_id, l.label, l.norm, o.code, o.title FROM occupation_labels l JOIN occupations o ON o.id = l.occupation_id WHERE o.status != 'archive'") as $r) {
            $idx['exact'][$r['norm']] ??= (int)$r['occupation_id'];
            $tok = self::tokens($r['label']);
            if ($tok) {
                $idx['labels'][] = [(int)$r['occupation_id'], $tok, $r['label']];
            }
        }
        $idx['titles'] = array_column(DB::all("SELECT id, code, title, rome_code FROM occupations WHERE status != 'archive'"), null, 'id');
        return self::$index = $idx;
    }

    public static function reset(): void
    {
        self::$index = null;
        self::$skillIndex = null;
    }

    /**
     * Fiche métier la plus probable pour un intitulé d'offre ou de poste.
     * @return array{id:int, code:string, title:string, confidence:int, via:string, label:string}|null
     */
    public static function occupation(string $title): ?array
    {
        $clean = self::clean($title);
        if (!self::tokens($clean)) {
            // « Mission freelance — Tableaux de bord Power BI » : le sens est après le tiret
            $clean = trim(preg_replace('/[·•]\p{L}+/u', '', $title) ?? $title);
        }
        $norm = normalize($clean);
        if ($norm === '') {
            return null;
        }
        $idx = self::index();
        $hit = fn(int $id, int $conf, string $via, string $label) => isset($idx['titles'][$id])
            ? ['id' => $id, 'code' => $idx['titles'][$id]['code'], 'title' => $idx['titles'][$id]['title'], 'confidence' => $conf, 'via' => $via, 'label' => $label]
            : null;
        // Sans les mots de contexte (stage, junior, CDI…) : « Géologue junior » → « géologue »
        $bare = implode(' ', array_filter(explode(' ', $norm), fn($w) => !in_array($w, self::NOISE, true)));
        foreach (array_unique([$norm, $bare]) as $k => $n) {
            if ($n !== '' && isset($idx['exact'][$n])) {
                return $hit($idx['exact'][$n], $k ? 98 : 100, 'appellation', $clean);
            }
        }
        // Appellation ROME 4.0 dont la fiche est rattachée à une fiche Tremplin
        $rome = DB::value('SELECT rome_code FROM rome_labels WHERE norm IN (:n, :b) LIMIT 1', ['n' => $norm, 'b' => $bare]);
        if ($rome) {
            $id = DB::value("SELECT id FROM occupations WHERE rome_code = :r AND status != 'archive' ORDER BY id LIMIT 1", ['r' => $rome]);
            if ($id) {
                return $hit((int)$id, 95, 'rome', $clean);
            }
        }
        $t = self::tokens($clean);
        if (!$t) {
            return null;
        }
        $best = null;
        foreach ($idx['labels'] as [$id, $l, $label]) {
            $common = count(array_intersect($t, $l));
            if (!$common) {
                continue;
            }
            if ($common === count($l) && (count($l) >= 2 || count($t) === 1)) {
                // Toute l'appellation figure dans l'intitulé : plus elle est longue, plus c'est sûr
                $conf = min(92, 70 + 8 * count($l) - 2 * max(0, count($t) - count($l)));
            } elseif ($common === count($l)) {
                // Appellation d'un seul mot noyée dans un intitulé plus long : indice faible (racines proches)
                $conf = 62;
            } else {
                $conf = (int)round(160 * $common / (count($t) + count($l)));
            }
            $conf = min(92, $conf);
            if (!$best || $conf > $best[1] || ($conf === $best[1] && count($l) > $best[3])) {
                $best = [$id, $conf, $label, count($l)];
            }
        }
        return $best ? $hit($best[0], $best[1], 'similarite', $best[2]) : null;
    }

    /** Fiche ROME 4.0 correspondant exactement à un intitulé (suggestion pour la curation). */
    public static function romeFor(string $title): ?array
    {
        $norm = normalize(self::clean($title));
        $r = $norm !== '' ? DB::one('SELECT rome_code, label FROM rome_labels WHERE norm = :n LIMIT 1', ['n' => $norm]) : null;
        if (!$r) {
            return null;
        }
        $fiche = DB::value('SELECT label FROM rome_labels WHERE rome_code = :c AND fiche = 1 LIMIT 1', ['c' => $r['rome_code']]);
        return ['rome' => $r['rome_code'], 'label' => $r['label'], 'fiche' => $fiche ?: $r['label']];
    }

    /* ------------------------------------------------------------------ Compétences */

    private static function skillIndex(): array
    {
        if (self::$skillIndex !== null) {
            return self::$skillIndex;
        }
        $idx = ['exact' => [], 'all' => []];
        foreach (DB::all('SELECT id, name, aliases, category FROM skills') as $s) {
            foreach (array_filter(array_map('trim', explode(',', $s['name'] . ',' . (string)$s['aliases']))) as $term) {
                $n = normalize($term);
                if ($n !== '') {
                    $idx['exact'][$n] ??= (int)$s['id'];
                    $idx['all'][] = [(int)$s['id'], $n, $s['name']];
                }
            }
        }
        $idx['names'] = array_column(DB::all('SELECT id, name, category FROM skills'), null, 'id');
        return self::$skillIndex = $idx;
    }

    /**
     * Compétence du référentiel pour un libellé (synonymes puis similarité).
     * @return array{id:int, name:string, confidence:int}|null
     */
    public static function skill(string $label): ?array
    {
        $n = normalize($label);
        if ($n === '') {
            return null;
        }
        $idx = self::skillIndex();
        if (isset($idx['exact'][$n])) {
            $id = $idx['exact'][$n];
            return ['id' => $id, 'name' => $idx['names'][$id]['name'], 'confidence' => 100];
        }
        $best = null;
        foreach ($idx['all'] as [$id, $term, $name]) {
            similar_text($n, $term, $pct);
            if (mb_strlen($term) >= 4 && (str_contains(" $n ", " $term ") || str_contains(" $term ", " $n "))) {
                $pct = max($pct, 80);
            }
            if (!$best || $pct > $best[1]) {
                $best = [$id, $pct];
            }
        }
        if (!$best || $best[1] < 50) {
            return null;
        }
        return ['id' => $best[0], 'name' => $idx['names'][$best[0]]['name'], 'confidence' => (int)min(95, round($best[1]))];
    }

    /* ------------------------------------------------------------------ Diplômes */

    /**
     * Diplôme du référentiel reconnu dans un intitulé (« Licence 3 en cours », « BTS Comptabilité »).
     * @return array{id:int, title:string, level:int, to_verify:bool, in_progress:bool}|null
     */
    public static function degree(string $label): ?array
    {
        $n = ' ' . normalize($label) . ' ';
        if (trim($n) === '') {
            return null;
        }
        $best = null;
        foreach (DB::all('SELECT id, title, level, synonyms, to_verify FROM degrees') as $d) {
            foreach (array_filter(array_map('trim', explode(',', (string)$d['synonyms']))) as $syn) {
                if (str_contains($n, ' ' . $syn . ' ') && (!$best || mb_strlen($syn) > $best[1])) {
                    $best = [$d, mb_strlen($syn)];
                }
            }
        }
        if (!$best) {
            return null;
        }
        $d = $best[0];
        return ['id' => (int)$d['id'], 'title' => $d['title'], 'level' => (int)$d['level'], 'to_verify' => (bool)$d['to_verify'],
            'in_progress' => (bool)preg_match('/\b(en cours|en preparation|actuellement)\b/', $n)];
    }
}
