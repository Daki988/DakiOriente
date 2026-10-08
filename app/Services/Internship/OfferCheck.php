<?php
declare(strict_types=1);

namespace App\Services\Internship;

use App\Core\DB;
use App\Services\Ai\AiService;
use App\Services\MatchingEngine;
use App\Services\ProfileService;
use App\Services\Referential\Normalizer;
use App\Services\Referential\Ref;

/**
 * « Évaluer une offre que j'ai trouvée » : le candidat colle le texte d'une annonce vue sur LinkedIn ou ailleurs.
 * Tremplin n'accède pas au site à sa place (LinkedIn interdit les accès automatisés) : seul le texte fourni est lu.
 * Les exigences sont extraites par Claude puis contrôlées (tout élément absent du texte est écarté), ou par les règles
 * du référentiel sans Claude ; le score est celui du moteur de matching. L'évaluation reste privée.
 */
final class OfferCheck
{
    public const MIN_CHARS = 150;
    public const MAX_CHARS = 8000;
    private const LANGS = ['français' => 'Français', 'francais' => 'Français', 'anglais' => 'Anglais', 'english' => 'Anglais', 'espagnol' => 'Espagnol',
        'portugais' => 'Portugais', 'arabe' => 'Arabe', 'chinois' => 'Chinois', 'allemand' => 'Allemand'];

    /** Site d'origine lisible à partir de l'adresse (linkedin.com → LinkedIn). */
    public static function site(?string $url): ?string
    {
        $host = strtolower((string)parse_url((string)$url, PHP_URL_HOST));
        if ($host === '') {
            return null;
        }
        $host = preg_replace('/^(www|[a-z]{2})\./', '', $host) ?? $host;
        return match (true) {
            $host === 'linkedin.com' => 'LinkedIn',
            default => mb_substr($host, 0, 120),
        };
    }

    /**
     * Exigences de l'annonce.
     * @return array{title:string, organization:?string, city:?string, contract:string, education:?string, education_level:?int,
     *   experience_months:?int, skills:list<string>, languages:list<string>, method:string}
     */
    public static function extract(string $title, string $text, bool $useClaude = true): array
    {
        $ai = $useClaude && AiService::claudeConfigured() ? AiService::extractOffer($text) : null;
        $data = $ai ? self::ground($ai, $text) : self::rules($text);
        $data['title'] = trim($title) !== '' ? trim(mb_substr($title, 0, 190)) : (string)($data['title'] ?? 'Offre sans intitulé');
        $stageWords = '/\b(stage|stagiaire|internship|intern|alternance|apprenti|apprentissage)\b/u';
        $data['contract'] = ($ai && is_bool($ai['is_internship'] ?? null)) ? ($ai['is_internship'] ? 'stage' : 'emploi')
            : (preg_match($stageWords, normalize($data['title'])) ? 'stage' : 'emploi');
        $data['education_level'] = $data['education'] ? OfferWatch::educationLevel((string)$data['education']) : null;
        $data['method'] = $ai ? 'claude' : 'regles';
        return $data;
    }

    /** Ne garde de l'extraction de Claude que ce qui figure réellement dans le texte. */
    public static function ground(array $ai, string $text): array
    {
        $n = ' ' . normalize($text) . ' ';
        $in = function (?string $v) use ($n): bool {
            $v = normalize((string)$v);
            if ($v === '') {
                return false;
            }
            if (str_contains($n, ' ' . $v . ' ') || str_contains($n, $v)) {
                return true;
            }
            // Libellé reformulé : tous ses mots significatifs doivent figurer dans le texte
            $words = array_filter(explode(' ', $v), fn($w) => mb_strlen($w) >= 3);
            return $words && !array_filter($words, fn($w) => !str_contains($n, ' ' . $w));
        };
        $list = fn($v) => array_values(array_filter(array_map(fn($x) => trim(mb_substr(strip_tags((string)$x), 0, 80)), is_array($v) ? $v : [])));
        $skills = array_values(array_filter($list($ai['skills'] ?? []), $in));
        $langs = array_values(array_unique(array_filter(array_map(fn($l) => self::LANGS[normalize($l)] ?? null, $list($ai['languages'] ?? [])),
            fn($l) => $l && $in($l === 'Anglais' && str_contains($n, ' english ') ? 'english' : $l))));
        $years = $ai['experience_years'] ?? null;
        $months = is_numeric($years) && preg_match('/(?<!\d)' . preg_quote((string)(int)$years, '/') . '(?!\d)/', $text) ? (int)round(12 * (float)$years) : null;
        $edu = trim((string)($ai['education'] ?? ''));
        return [
            'title' => trim((string)($ai['title'] ?? '')),
            'organization' => $in($ai['organization'] ?? null) ? mb_substr(trim((string)$ai['organization']), 0, 160) : null,
            'city' => $in($ai['city'] ?? null) ? mb_substr(trim((string)$ai['city']), 0, 100) : null,
            'education' => $edu !== '' && $in($edu) ? mb_substr($edu, 0, 160) : null,
            'experience_months' => $months,
            'skills' => array_slice($skills, 0, 15),
            'languages' => $langs,
        ];
    }

    /** Extraction sans Claude : compétences du référentiel citées, niveau d'études, expérience, langues. */
    public static function rules(string $text): array
    {
        $norm = ' ' . normalize($text) . ' ';
        $skills = [];
        foreach (DB::all("SELECT id, name, aliases FROM skills WHERE status != 'archive'") as $s) {
            foreach (array_filter(array_map('trim', explode(',', $s['name'] . ',' . (string)$s['aliases']))) as $t) {
                $nt = normalize($t);
                // Libellés très courts (« R », « C ») : seulement écrits en majuscules comme un mot isolé
                $short = mb_strlen($nt) < 3;
                if ($nt !== '' && ($short ? preg_match('/(?<![\p{L}\d])' . preg_quote(mb_strtoupper($t), '/') . '(?![\p{L}\d+#])/u', $text)
                    : preg_match('/(?<![a-z0-9])' . preg_quote($nt, '/') . '(?![a-z0-9])/', $norm))) {
                    $skills[(int)$s['id']] = $s['name'];
                    break;
                }
            }
        }
        $edu = null;
        if (preg_match('/[^.\n]*\b(bac\s*\+\s*\d|baccalaur[ée]at|licence|master|bts|dut|doctorat|ing[ée]nieur|dipl[ôo]me)[^.\n]*/iu', $text, $m)) {
            $edu = trim(mb_substr($m[0], 0, 160));
        }
        $months = null;
        if (preg_match('/(\d{1,2})\s*(?:à\s*\d{1,2}\s*)?(?:ans?|années?)\s+(?:minimum\s+)?(?:d[\'’]\s*)?exp[ée]rience/iu', $text, $m)
            || preg_match('/exp[ée]rience[^.\n]{0,40}?(\d{1,2})\s*(?:ans?|années?)/iu', $text, $m)) {
            $months = 12 * (int)$m[1];
        }
        $langs = [];
        foreach (self::LANGS as $k => $label) {
            if (str_contains($norm, ' ' . $k . ' ')) {
                $langs[$label] = $label;
            }
        }
        return ['title' => '', 'organization' => null, 'city' => null, 'education' => $edu, 'experience_months' => $months,
            'skills' => array_values($skills), 'languages' => array_values($langs)];
    }

    /** Offre au format attendu par Readiness::jobFor(). */
    public static function asOffer(array $d, string $country): array
    {
        $occ = Normalizer::occupation($d['title']);
        $minConf = (int)(Ref::rules()['normalization']['confirm'] ?? 60);
        return [
            'id' => 0, 'title' => $d['title'], 'country_code' => $country, 'city' => $d['city'], 'contract' => $d['contract'],
            'occupation_id' => $occ && $occ['confidence'] >= $minConf ? (int)$occ['id'] : null,
            'skills' => json_encode(OfferWatch::skillLabels($d['skills']), JSON_UNESCAPED_UNICODE),
            'languages' => implode(', ', $d['languages']), 'education_level' => $d['education_level'], 'experience_months' => $d['experience_months'],
        ];
    }

    /**
     * Évalue le profil sur l'annonce et enregistre le contrôle (privé).
     * @return array{ok:bool, message:string, id?:int}
     */
    public static function run(int $userId, string $country, string $title, string $text, ?string $url): array
    {
        $text = trim(strip_tags($text));
        if (mb_strlen($text) < self::MIN_CHARS) {
            return ['ok' => false, 'message' => 'Colle le texte complet de l\'annonce (au moins ' . self::MIN_CHARS . ' caractères) : missions, profil, compétences demandées.'];
        }
        $text = mb_substr($text, 0, self::MAX_CHARS);
        $url = $url && preg_match('#^https?://#i', $url) ? mb_substr($url, 0, 500) : null;
        $d = self::extract($title, $text);
        $offer = self::asOffer($d, $country);
        $p = ProfileService::load($userId, true);
        $job = Readiness::jobFor($offer, $p);
        $m = $job ? MatchingEngine::compute($p, $job, false) : null;
        $id = DB::insert('offer_checks', [
            'user_id' => $userId, 'url' => $url, 'site' => self::site($url), 'title' => $d['title'], 'contract' => $d['contract'],
            'offer_text' => $text, 'extracted' => json_encode($d + ['occupation_id' => $offer['occupation_id']], JSON_UNESCAPED_UNICODE),
            'extraction' => $d['method'], 'score' => $m['score'] ?? null, 'verdict' => $m['verdict']['key'] ?? null, 'ref_version' => Ref::version(), 'created_at' => now(),
        ]);
        return ['ok' => true, 'id' => $id, 'message' => $m ? 'Offre évaluée.' : 'Offre enregistrée, mais aucune compétence ni aucun métier du référentiel n\'y a été reconnu : précise l\'intitulé du poste.'];
    }

    /** Recalcule l'évaluation d'un contrôle enregistré (profil à jour). */
    public static function result(array $check, array $p): array
    {
        $d = json_decode((string)$check['extracted'], true) ?: [];
        $country = (string)(DB::value('SELECT country_code FROM users WHERE id = :u', ['u' => $check['user_id']]) ?: 'GA');
        $offer = self::asOffer($d + ['title' => $check['title'], 'city' => null, 'contract' => $check['contract'], 'skills' => [], 'languages' => [],
            'education_level' => null, 'experience_months' => null], $country);
        $job = Readiness::jobFor($offer, $p);
        return ['data' => $d, 'job' => $job, 'm' => $job ? MatchingEngine::compute($p, $job, false) : null];
    }
}
