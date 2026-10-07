<?php
declare(strict_types=1);

namespace App\Services\Internship;

use App\Core\DB;
use App\Services\Ai\AiService;
use App\Services\Ai\AnthropicProvider;
use App\Services\Referential\Normalizer;
use App\Services\Referential\Ref;

/**
 * Veille des offres de stage réelles publiées hors de Tremplin (préparation des candidats).
 *
 * Aucune offre n'est inventée :
 *  1. la recherche web de Claude est limitée aux domaines des sources vérifiées par NEAM pour le pays ;
 *  2. une offre n'est retenue que si son adresse figure dans les résultats bruts renvoyés par le moteur de recherche
 *     (et pas seulement dans le texte rédigé par Claude) ;
 *  3. elle doit appartenir à une source active du pays, être un stage, dater de moins de 12 mois si la date est connue ;
 *  4. le lien est contrôlé : une page supprimée (404, 410) ou un domaine injoignable écarte l'offre.
 * Chaque rejet est consigné avec son motif (Admin › Veille des stages).
 */
final class OfferWatch
{
    public const KINDS = ['plateforme' => 'Site d\'emploi', 'relais' => 'Relais d\'annonces', 'entreprise' => 'Site carrière d\'entreprise', 'reseau' => 'Réseau professionnel', 'institution' => 'Institution'];
    public const STATUSES = ['ouverte' => ['Ouverte', 'green'], 'cloturee' => ['Clôturée', 'gray'], 'inconnu' => ['Statut non indiqué', 'amber']];
    private const STAGE_WORDS = '/\b(stage|stages|stagiaire|stagiaires|internship|intern|interns|alternance|alternant|apprenti|apprentissage|pnpe|trainee|graduate)\b/u';

    /** Paramètres (modifiables dans Admin › Veille des stages). */
    public static function config(): array
    {
        return [
            'max_age_days' => max(30, (int)setting('stage_offers_max_age', '365')),   // ancienneté maximale d'une offre datée
            'cache_days'   => max(1, (int)setting('stage_search_cache_days', '7')),    // une même recherche n'est relancée qu'après ce délai
            'max_offers'   => max(3, min(15, (int)setting('stage_search_max_offers', '10'))),
            'level_cap'    => max(1, min(4, (int)setting('stage_level_cap', '2'))),     // niveau de compétence attendu d'un stagiaire
        ];
    }

    public static function sources(string $country, bool $activeOnly = true): array
    {
        $rows = DB::all('SELECT * FROM offer_sources' . ($activeOnly ? ' WHERE active = 1' : '') . ' ORDER BY name');
        return array_values(array_filter($rows, fn($s) => self::coversCountry($s, $country)));
    }

    public static function coversCountry(array $source, string $country): bool
    {
        $list = array_map('trim', explode(',', strtoupper((string)$source['countries'])));
        return in_array('*', $list, true) || in_array(strtoupper($country), $list, true);
    }

    /** Source active couvrant l'adresse (domaine exact ou sous-domaine). */
    public static function sourceFor(string $url, array $sources): ?array
    {
        $host = strtolower((string)parse_url($url, PHP_URL_HOST));
        $host = preg_replace('/^www\./', '', $host) ?? $host;
        if ($host === '') {
            return null;
        }
        $best = null;
        foreach ($sources as $s) {
            $d = strtolower(preg_replace('/^www\./', '', trim((string)$s['domain'])) ?? '');
            if ($d !== '' && ($host === $d || str_ends_with($host, '.' . $d)) && (!$best || strlen($d) > strlen((string)$best['domain']))) {
                $best = $s;
            }
        }
        return $best;
    }

    /** Adresse canonique : sans fragment ni paramètres de suivi, hôte en minuscules, sans barre finale. */
    public static function canonical(string $url): string
    {
        $url = trim(html_entity_decode($url));
        $p = parse_url($url);
        if (!$p || empty($p['host'])) {
            return '';
        }
        $query = '';
        if (!empty($p['query'])) {
            parse_str($p['query'], $q);
            $q = array_filter($q, fn($k) => !preg_match('/^(utm_|fbclid|gclid|ref|trk|trackingid|refid)/i', (string)$k), ARRAY_FILTER_USE_KEY);
            ksort($q);
            $query = $q ? '?' . http_build_query($q) : '';
        }
        $host = preg_replace('/^www\./', '', strtolower($p['host'])) ?? '';
        $path = rtrim($p['path'] ?? '', '/');
        return 'https://' . $host . $path . $query;
    }

    public static function queryNorm(string $query): string
    {
        $n = normalize($query);
        $words = array_filter(explode(' ', $n), fn($w) => $w !== '' && !in_array($w, ['stage', 'stages', 'stagiaire', 'de', 'en', 'du', 'des', 'la', 'le', 'h', 'f'], true));
        return mb_substr(implode(' ', $words), 0, 160);
    }

    /* ================================================================== Offres disponibles */

    /** Offres retenues pour un pays et une recherche (même intitulé normalisé ou même fiche métier). */
    public static function offers(string $country, string $query, ?int $occupationId = null, int $limit = 30): array
    {
        $norm = self::queryNorm($query);
        $minDate = date('Y-m-d', strtotime('-' . self::config()['max_age_days'] . ' days'));
        $params = ['c' => $country, 'q' => $norm, 'd' => $minDate, 'd2' => $minDate];
        $occ = '';
        if ($occupationId) {
            $occ = ' OR e.occupation_id = :o';
            $params['o'] = $occupationId;
        }
        return DB::all("SELECT e.*, s.name AS source_name, s.kind AS source_kind FROM external_offers e LEFT JOIN offer_sources s ON s.id = e.source_id
            WHERE e.country_code = :c AND e.hidden = 0 AND (e.query_norm = :q$occ) AND COALESCE(e.published_at, e.deadline, :d) >= :d2
              AND (s.id IS NULL OR s.active = 1)
            ORDER BY CASE WHEN e.published_at IS NULL THEN 1 ELSE 0 END, e.published_at DESC, e.id DESC LIMIT " . (int)$limit, $params);
    }

    /** Dernière recherche pour ce pays et cet intitulé. */
    public static function lastSearch(string $country, string $query): ?array
    {
        return DB::one('SELECT * FROM internship_searches WHERE country_code = :c AND query_norm = :q ORDER BY id DESC LIMIT 1', ['c' => $country, 'q' => self::queryNorm($query)]);
    }

    public static function searchIsFresh(?array $search): bool
    {
        return $search && $search['status'] === 'ok' && strtotime((string)$search['created_at']) > time() - 86400 * self::config()['cache_days'];
    }

    /* ================================================================== Collecte (Claude + recherche web) */

    /**
     * Lance une recherche d'offres réelles pour le pays et l'intitulé donnés.
     * @return array{ok:bool, message:string, kept:int, rejected:int, cached:bool}
     */
    public static function collect(string $country, string $query, ?int $occupationId, ?int $userId, ?callable $searcher = null): array
    {
        $query = trim(mb_substr($query, 0, 160));
        $norm = self::queryNorm($query);
        if ($norm === '') {
            return ['ok' => false, 'message' => 'Précise le stage recherché (métier ou domaine).', 'kept' => 0, 'rejected' => 0, 'cached' => false];
        }
        if (self::searchIsFresh(self::lastSearch($country, $query))) {
            return ['ok' => true, 'message' => 'Résultats de la recherche récente réutilisés.', 'kept' => 0, 'rejected' => 0, 'cached' => true];
        }
        $sources = self::sources($country);
        $countryName = (string)(DB::value('SELECT name FROM countries WHERE code = :c', ['c' => $country]) ?: $country);
        if (!$sources) {
            return self::logSearch($country, $query, $norm, $occupationId, $userId, 'aucune_source', 0, [],
                'Aucune source vérifiée n\'est encore enregistrée pour ce pays : l\'équipe NEAM doit en ajouter.');
        }
        if (!$searcher) {
            if (!AiService::claudeConfigured()) {
                return ['ok' => false, 'message' => 'La recherche en ligne utilise Claude, qui n\'est pas activé sur cette installation.', 'kept' => 0, 'rejected' => 0, 'cached' => false];
            }
            if (AiService::quotaReached()) {
                return ['ok' => false, 'message' => 'Ton quota mensuel de générations Claude est atteint : les offres déjà collectées restent disponibles.', 'kept' => 0, 'rejected' => 0, 'cached' => false];
            }
        }
        $cfg = self::config();
        $domains = array_values(array_unique(array_map(fn($s) => strtolower(preg_replace('/^www\./', '', trim((string)$s['domain'])) ?? ''), $sources)));
        $system = 'Tu es le veilleur des offres de stage de Tremplin by NEAM. Tu cherches uniquement des annonces réelles, publiées par des employeurs identifiés, '
            . 'sur les sites autorisés. Tu ne rédiges jamais d\'annonce, tu ne complètes jamais une information absente de la page : un champ inconnu vaut null.';
        $prompt = "Recherche des offres de stage réelles correspondant à : « $query », au $countryName (code pays $country).\n"
            . 'Cherche de préférence des annonces des 12 derniers mois ; les annonces clôturées sont acceptées si elles sont représentatives (elles servent à préparer un candidat, pas à postuler).' . "\n"
            . 'Retiens uniquement des pages d\'annonce individuelles (pas des pages de liste ni des articles de conseils), pour un stage situé au ' . $countryName . ".\n"
            . "Réponds uniquement par un tableau JSON d'au plus {$cfg['max_offers']} objets, sans texte autour, avec les clés :\n"
            . '{"url": adresse exacte de la page d\'annonce telle qu\'elle apparaît dans les résultats de recherche, "title": intitulé exact, "organization": employeur ou null, '
            . '"city": ville ou null, "country": code pays ISO à 2 lettres, "published": date de publication AAAA-MM-JJ ou null, "deadline": date limite de candidature AAAA-MM-JJ ou null, "status": "ouverte" | "cloturee" | "inconnu", '
            . '"is_internship": true ou false, "education": niveau d\'études demandé tel qu\'écrit ou null, "duration": durée ou null, '
            . '"skills": compétences et outils demandés, tels qu\'écrits (liste de 0 à 12 libellés courts), "languages": langues demandées (liste), '
            . '"summary": résumé fidèle des missions en 1 à 2 phrases, sans rien ajouter}.' . "\n"
            . 'Si aucune annonce ne correspond, réponds [].';
        if ($searcher) {
            $res = $searcher($system, $prompt, $domains, $country);
        } else {
            $res = (new AnthropicProvider())->searchWeb($system, $prompt, $domains, $country, 5, 3500);
            DB::insert('ai_logs', ['user_id' => $userId, 'feature' => 'stage_search', 'provider' => 'anthropic', 'input_summary' => mb_substr("$country · $query", 0, 250),
                'output_chars' => mb_strlen((string)($res['text'] ?? '')), 'status' => $res && !$res['error'] ? 'ok' : 'error', 'created_at' => now()]);
        }
        if (!$res || ($res['error'] && !$res['results'])) {
            $msg = $res && str_starts_with((string)$res['error'], 'api')
                ? 'La recherche web de Claude n\'est pas disponible (elle doit être autorisée dans la console Anthropic de l\'organisation).'
                : 'La recherche en ligne n\'a pas abouti. Réessaie plus tard.';
            return self::logSearch($country, $query, $norm, $occupationId, $userId, 'erreur', 0, [], $msg);
        }
        $items = self::decode((string)$res['text']);
        $allowed = [];
        foreach ($res['results'] as $r) {
            $c = self::canonical($r['url']);
            if ($c !== '') {
                $allowed[$c] = $r;
            }
        }
        $kept = 0;
        $rejected = [];
        foreach (array_slice($items, 0, $cfg['max_offers'] + 5) as $it) {
            $check = self::validate($it, $country, $sources, $allowed);
            if (!$check['ok']) {
                $rejected[] = ['url' => mb_substr((string)($it['url'] ?? ''), 0, 300), 'title' => mb_substr((string)($it['title'] ?? ''), 0, 160), 'reason' => $check['reason']];
                continue;
            }
            if (self::store($check['offer'], $country, $norm, $occupationId, 'claude', null)) {
                $kept++;
            }
        }
        $searchId = self::logSearch($country, $query, $norm, $occupationId, $userId, 'ok', count($items), $rejected, null, $kept)['search_id'];
        DB::run('UPDATE external_offers SET search_id = :s WHERE search_id IS NULL AND query_norm = :q AND country_code = :c', ['s' => $searchId, 'q' => $norm, 'c' => $country]);
        $msg = $kept ? "$kept offre(s) réelle(s) retenue(s)" . ($rejected ? ', ' . count($rejected) . ' écartée(s) par les contrôles' : '') . '.'
            : 'Aucune nouvelle offre vérifiable trouvée sur les sources autorisées' . ($rejected ? ' (' . count($rejected) . ' écartée(s) par les contrôles)' : '') . '.';
        return ['ok' => true, 'message' => $msg, 'kept' => $kept, 'rejected' => count($rejected), 'cached' => false];
    }

    private static function logSearch(string $country, string $query, string $norm, ?int $occ, ?int $uid, string $status, int $found, array $rejected, ?string $message, int $kept = 0): array
    {
        $id = DB::insert('internship_searches', [
            'country_code' => $country, 'query' => $query, 'query_norm' => $norm, 'occupation_id' => $occ, 'provider' => 'claude', 'status' => $status,
            'found' => $found, 'kept' => $kept, 'rejected' => $rejected ? json_encode($rejected, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
            'message' => $message ? mb_substr($message, 0, 255) : null, 'user_id' => $uid, 'created_at' => now(),
        ]);
        return ['ok' => $status === 'ok', 'message' => (string)$message, 'kept' => $kept, 'rejected' => count($rejected), 'cached' => false, 'search_id' => $id];
    }

    /** Tableau JSON extrait de la réponse (tolère un bloc ```json). */
    public static function decode(string $text): array
    {
        $t = trim(preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($text)) ?? '');
        $start = strpos($t, '[');
        $end = strrpos($t, ']');
        if ($start === false || $end === false || $end < $start) {
            return [];
        }
        $data = json_decode(substr($t, $start, $end - $start + 1), true);
        return is_array($data) ? array_values(array_filter($data, 'is_array')) : [];
    }

    /**
     * Contrôles d'une offre proposée.
     * @param array<string, array{url:string, title:string, page_age:?string}>|null $allowed résultats bruts de la recherche (null : saisie manuelle)
     * @return array{ok:bool, reason?:string, offer?:array}
     */
    public static function validate(array $it, string $country, array $sources, ?array $allowed, bool $checkLink = true): array
    {
        $url = trim((string)($it['url'] ?? ''));
        $title = trim(strip_tags((string)($it['title'] ?? '')));
        if ($url === '' || $title === '' || !preg_match('#^https?://#i', $url)) {
            return ['ok' => false, 'reason' => 'adresse ou intitulé manquant'];
        }
        $canon = self::canonical($url);
        $result = null;
        if ($allowed !== null) {
            $result = $allowed[$canon] ?? null;
            if (!$result) {
                return ['ok' => false, 'reason' => 'adresse absente des résultats de recherche'];
            }
            $url = $result['url'];
        }
        $source = self::sourceFor($url, $sources);
        if (!$source) {
            return ['ok' => false, 'reason' => 'site hors des sources vérifiées du pays'];
        }
        $cc = strtoupper(trim((string)($it['country'] ?? '')));
        if ($cc !== '' && $cc !== strtoupper($country)) {
            return ['ok' => false, 'reason' => 'stage situé dans un autre pays (' . $cc . ')'];
        }
        $text = normalize($title . ' ' . ($it['summary'] ?? ''));
        if (($it['is_internship'] ?? true) === false || !preg_match(self::STAGE_WORDS, $text)) {
            return ['ok' => false, 'reason' => 'pas une offre de stage'];
        }
        $published = self::date((string)($it['published'] ?? '')) ?? self::date((string)($result['page_age'] ?? ''));
        if ($published && $published > date('Y-m-d', strtotime('+1 day'))) {
            $published = null;
        }
        $deadline = self::date((string)($it['deadline'] ?? ''));
        $limit = date('Y-m-d', strtotime('-' . self::config()['max_age_days'] . ' days'));
        if ($published && $published < $limit) {
            return ['ok' => false, 'reason' => 'offre publiée il y a plus de ' . self::config()['max_age_days'] . ' jours'];
        }
        // Sans date de publication, la date limite de candidature trahit les annonces anciennes
        if (!$published && $deadline && $deadline < $limit) {
            return ['ok' => false, 'reason' => 'date limite de candidature dépassée depuis plus de ' . self::config()['max_age_days'] . ' jours'];
        }
        $link = $checkLink ? self::linkStatus($url) : 'non_controle';
        if (in_array($link, ['mort', 'injoignable'], true)) {
            return ['ok' => false, 'reason' => $link === 'mort' ? 'page d\'annonce supprimée' : 'site injoignable'];
        }
        $status = (string)($it['status'] ?? 'inconnu');
        if ($deadline && $deadline < date('Y-m-d') && $status !== 'cloturee') {
            $status = 'cloturee';
        }
        $list = fn($v) => array_values(array_filter(array_map(fn($x) => trim(mb_substr(strip_tags((string)$x), 0, 80)), is_array($v) ? $v : explode(',', (string)$v))));
        return ['ok' => true, 'offer' => [
            'url' => mb_substr($url, 0, 500), 'source_id' => (int)$source['id'], 'title' => mb_substr($title, 0, 190),
            'organization' => self::str($it['organization'] ?? null, 160), 'city' => self::str($it['city'] ?? null, 100), 'published_at' => $published, 'deadline' => $deadline,
            'offer_status' => isset(self::STATUSES[$status]) ? $status : 'inconnu', 'education' => self::str($it['education'] ?? null, 160),
            'duration' => self::str($it['duration'] ?? null, 60), 'skills' => array_slice($list($it['skills'] ?? []), 0, 12),
            'languages' => array_slice($list($it['languages'] ?? []), 0, 4), 'summary' => self::str($it['summary'] ?? null, 600), 'link_status' => $link,
        ]];
    }

    private static function str(mixed $v, int $max): ?string
    {
        $v = trim(strip_tags((string)($v ?? '')));
        return $v === '' || in_array(mb_strtolower($v), ['null', 'n/a', 'non précisé', 'inconnu'], true) ? null : mb_substr($v, 0, $max);
    }

    /** Date AAAA-MM-JJ à partir d'une date explicite ou relative (« 3 days ago », « October 12, 2025 »). */
    public static function date(string $s): ?string
    {
        $s = trim($s);
        if ($s === '' || strtolower($s) === 'null') {
            return null;
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $s)) {
            return substr($s, 0, 10);
        }
        if (preg_match('/^\d{4}-\d{2}$/', $s)) {
            return $s . '-01';
        }
        $t = strtotime($s);
        return $t ? date('Y-m-d', $t) : null;
    }

    /** Contrôle du lien : ok, protege (page réservée aux robots ou connexion requise), mort (404/410), injoignable. */
    public static function linkStatus(string $url): string
    {
        if (!function_exists('curl_init')) {
            return 'non_controle';
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_NOBODY => false, CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_RANGE => '0-2048', CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; TremplinNEAM/1.0; verification de liens)']);
        curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_errno($ch);
        curl_close($ch);
        if ($err && !$code) {
            return in_array($err, [6, 7], true) ? 'injoignable' : 'non_controle';
        }
        return match (true) {
            $code >= 200 && $code < 400, $code === 416 => 'ok',
            in_array($code, [404, 410], true) => 'mort',
            default => 'protege',
        };
    }

    /** Enregistre (ou complète) une offre contrôlée et la rattache au référentiel. */
    public static function store(array $o, string $country, string $queryNorm, ?int $occupationId, string $provider, ?int $userId): ?int
    {
        $hash = hash('sha256', self::canonical($o['url']));
        $occ = Normalizer::occupation($o['title']);
        $minConf = (int)(Ref::rules()['normalization']['confirm'] ?? 60);
        $skills = [];
        foreach ($o['skills'] as $label) {
            $hit = Normalizer::skill($label);
            // Correspondance exacte, ou approchée sûre sur un libellé assez long (« C » ne doit pas devenir « permis C »)
            $ok = $hit && ($hit['confidence'] >= 100 || ($hit['confidence'] >= 80 && mb_strlen($label) >= 4));
            $skills[] = ['label' => $label, 'id' => $ok ? $hit['id'] : null, 'name' => $ok ? $hit['name'] : null];
        }
        $data = [
            'url' => $o['url'], 'url_hash' => $hash, 'source_id' => $o['source_id'], 'country_code' => $country, 'query_norm' => $queryNorm,
            'title' => $o['title'], 'organization' => $o['organization'], 'city' => $o['city'], 'published_at' => $o['published_at'], 'deadline' => $o['deadline'] ?? null,
            'offer_status' => $o['offer_status'], 'education' => $o['education'], 'education_level' => self::educationLevel((string)$o['education']),
            'duration' => $o['duration'], 'skills' => json_encode($skills, JSON_UNESCAPED_UNICODE), 'languages' => $o['languages'] ? implode(', ', $o['languages']) : null,
            'summary' => $o['summary'], 'occupation_id' => $occ && $occ['confidence'] >= $minConf ? $occ['id'] : $occupationId,
            'occupation_confidence' => $occ && $occ['confidence'] >= $minConf ? $occ['confidence'] : ($occupationId ? 100 : null),
            'provider' => $provider, 'link_status' => $o['link_status'], 'checked_at' => now(),
        ];
        $existing = DB::one('SELECT id, hidden FROM external_offers WHERE url_hash = :h', ['h' => $hash]);
        if ($existing) {
            if ((int)$existing['hidden']) {
                return null; // écartée par l'équipe NEAM : jamais réintroduite automatiquement
            }
            DB::update('external_offers', $data, 'id = :id', ['id' => $existing['id']]);
            return (int)$existing['id'];
        }
        return DB::insert('external_offers', $data + ['created_by' => $userId, 'found_at' => now()]);
    }

    /** Niveau N0-N6 lu dans « Bac+3 », « Licence », « étudiant en Master »… */
    public static function educationLevel(string $text): ?int
    {
        $n = normalize($text);
        if ($n === '') {
            return null;
        }
        if (preg_match_all('/bac\s*\+?\s*(\d)/', $n, $m)) {
            $min = min(array_map('intval', $m[1]));
            return match (true) { $min >= 8 => 6, $min >= 5 => 5, $min >= 3 => 4, $min >= 2 => 3, default => 2 };
        }
        if (preg_match('/\bbac(calaureat)?\b/', $n)) {
            return 2;
        }
        $d = Normalizer::degree($text);
        return $d ? (int)$d['level'] : null;
    }

    /** Revérifie le lien d'une offre (Admin) ; une page supprimée masque l'offre. */
    public static function recheck(int $id): string
    {
        $o = DB::one('SELECT id, url FROM external_offers WHERE id = :id', ['id' => $id]);
        if (!$o) {
            return 'introuvable';
        }
        $s = self::linkStatus((string)$o['url']);
        $data = ['link_status' => $s, 'checked_at' => now()];
        if ($s === 'mort') {
            $data += ['hidden' => 1, 'hidden_reason' => 'page d\'annonce supprimée'];
        }
        DB::update('external_offers', $data, 'id = :id', ['id' => $id]);
        return $s;
    }
}
