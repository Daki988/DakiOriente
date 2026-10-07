<?php
declare(strict_types=1);

namespace App\Services\Referential;

use App\Core\DB;
use App\Services\Ai\AiService;

/**
 * Explicabilité (§10) : chaque score répond à la question « pourquoi » en moins de 30 secondes de lecture.
 * Le texte de base est produit par les règles à partir des éléments calculés. Claude peut le reformuler
 * en langage plus naturel, sans pouvoir modifier les éléments : une reformulation qui introduit un chiffre
 * absent du calcul est rejetée et le texte de base est conservé.
 */
final class Explainer
{
    /** Explication en langage clair (vocabulaire simple, ton encourageant mais honnête, aucune promesse d'embauche). */
    public static function text(array $m, array $job, ?int $gain = null): string
    {
        $v = $m['verdict'];
        $parts = [];
        $parts[] = 'Ton score est de ' . $m['score'] . ' sur 100 pour « ' . self::short((string)$job['title']) . ' » : ' . mb_strtolower($v['label']) . '.';
        if ($m['blocked']) {
            $parts[] = 'Un prérequis indispensable manque : ' . implode(', ', array_map(fn($b) => $b['label'], $m['blocking'])) . '. Tant qu\'il manque, la candidature ne peut pas être retenue.';
        }
        if ($m['strength_items']) {
            $parts[] = 'Tes points forts ici : ' . self::join(array_map(fn($s) => self::lc($s['text']), $m['strength_items'])) . '.';
        }
        $gaps = array_slice($m['gap_items'], 0, 2);
        if ($gaps) {
            $parts[] = 'Ce qui pèse le plus sur ton score : ' . self::join(array_map(fn($g) => self::lc($g['text']), $gaps)) . '.';
        }
        if (!$m['blocked']) {
            $parts[] = 'Notre conseil : ' . self::lc($v['action']) . '.';
        }
        if (($m['gap_items'][0] ?? null) && $gain !== null) {
            if ($gain > 0) {
                $parts[] = 'En comblant le premier écart, ton score gagnerait environ ' . $gain . ' point' . ($gain > 1 ? 's' : '') . '.';
            }
        }
        $parts[] = 'Ce score mesure l\'adéquation avec l\'offre : il ne garantit pas une embauche.';
        return implode(' ', $parts);
    }

    /**
     * Reformulation par Claude (mise en cache par offre, version des référentiels et score).
     * @return array{text:string, provider:string}
     */
    public static function rephrase(int $userId, array $m, array $job, string $base): array
    {
        $hash = md5($base . '|' . $m['version']);
        $row = DB::one('SELECT explanation FROM match_scores WHERE user_id = :u AND job_id = :j', ['u' => $userId, 'j' => (int)$job['id']]);
        $cached = json_decode((string)($row['explanation'] ?? ''), true);
        if (is_array($cached) && ($cached['hash'] ?? '') === $hash) {
            return ['text' => $cached['text'], 'provider' => $cached['provider']];
        }
        $out = AiService::explainScore($base);
        $result = ['text' => $base, 'provider' => 'Moteur NEAM'];
        if ($out && self::faithful($out, $base)) {
            $result = ['text' => $out, 'provider' => 'Claude'];
        }
        if ($row) {
            DB::update('match_scores', ['explanation' => json_encode($result + ['hash' => $hash], JSON_UNESCAPED_UNICODE)], 'user_id = :u AND job_id = :j', ['u' => $userId, 'j' => (int)$job['id']]);
        }
        return $result;
    }

    /** La reformulation ne doit contenir aucun nombre absent du texte calculé. */
    public static function faithful(string $out, string $base): bool
    {
        preg_match_all('/\d+(?:[.,]\d+)?/', $base, $a);
        preg_match_all('/\d+(?:[.,]\d+)?/', $out, $b);
        $allowed = array_flip($a[0]);
        foreach ($b[0] as $n) {
            if (!isset($allowed[$n])) {
                return false;
            }
        }
        return mb_strlen($out) >= 60 && mb_strlen($out) <= 1200;
    }

    private static function short(string $t): string
    {
        return mb_strlen($t) > 60 ? mb_substr($t, 0, 57) . '…' : $t;
    }

    private static function lc(string $s): string
    {
        // Minuscule initiale sauf pour les sigles et noms propres techniques (SQL, JavaScript, HSE…)
        $second = mb_substr($s, 1, 1);
        $keep = $second !== '' && mb_strtoupper($second) === $second && mb_strtolower($second) !== $second
            || preg_match('/^(JavaScript|PowerPoint|AutoCAD|Excel|Python|Power BI|Git|PHP|Java|Fang|Punu|Français|Anglais|Espagnol|Portugais|Arabe|Chinois|Allemand)\b/u', $s);
        return rtrim($keep ? $s : mb_strtolower(mb_substr($s, 0, 1)) . mb_substr($s, 1), '.');
    }

    private static function join(array $items): string
    {
        if (count($items) <= 1) {
            return (string)($items[0] ?? '');
        }
        return implode(' ; ', array_slice($items, 0, -1)) . ' et ' . end($items);
    }
}
