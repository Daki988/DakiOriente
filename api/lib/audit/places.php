<?php
/* =========================================================
   NEAM Digital Score — Google Business Profile (Places API New)
   Facultatif : actif seulement si une clé est renseignée.
   ========================================================= */
declare(strict_types=1);

const PLACES_FIELDS = 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.regularOpeningHours.weekdayDescriptions,places.photos.name,places.googleMapsUri,places.businessStatus,places.primaryType,places.primaryTypeDisplayName,places.types,places.editorialSummary';

function places_enabled(): bool
{
    global $CONFIG;
    return !empty($CONFIG['audit']['google_places_key']);
}

/** Plafond quotidien d'appels (protège la facturation Google). */
function places_quota_ok(): bool
{
    global $CONFIG;
    $cap = (int) ($CONFIG['audit']['places_daily_cap'] ?? 300);
    $file = sys_get_temp_dir() . '/neam_places_' . date('Ymd');
    $n = is_file($file) ? (int) file_get_contents($file) : 0;
    if ($n >= $cap) {
        return false;
    }
    @file_put_contents($file, (string) ($n + 1), LOCK_EX);
    return true;
}

/** Recherche textuelle Google Maps. Renvoie une liste de fiches normalisées (ou null si indisponible). */
function places_search(string $query, int $max = 10): ?array
{
    global $CONFIG;
    if (!places_enabled() || !places_quota_ok()) {
        return null;
    }
    $res = api_json('POST', 'https://places.googleapis.com/v1/places:searchText', [
        'X-Goog-Api-Key: ' . $CONFIG['audit']['google_places_key'],
        'X-Goog-FieldMask: ' . PLACES_FIELDS,
    ], ['textQuery' => $query, 'languageCode' => 'fr', 'pageSize' => min(20, $max)], 15);
    if ($res['status'] !== 200 || !is_array($res['data'])) {
        error_log('NEAM places error: HTTP ' . $res['status'] . ' ' . json_encode($res['data']));
        return null;
    }
    $out = [];
    foreach ($res['data']['places'] ?? [] as $pl) {
        $out[] = normalize_place($pl);
    }
    return $out;
}

function normalize_place(array $pl): array
{
    return [
        'id' => (string) ($pl['id'] ?? ''),
        'name' => (string) ($pl['displayName']['text'] ?? ''),
        'address' => (string) ($pl['formattedAddress'] ?? ''),
        'phone' => (string) ($pl['nationalPhoneNumber'] ?? ($pl['internationalPhoneNumber'] ?? '')),
        'website' => (string) ($pl['websiteUri'] ?? ''),
        'rating' => isset($pl['rating']) ? (float) $pl['rating'] : null,
        'reviews' => (int) ($pl['userRatingCount'] ?? 0),
        'hours' => !empty($pl['regularOpeningHours']['weekdayDescriptions']),
        'photos' => count($pl['photos'] ?? []),
        'maps_url' => (string) ($pl['googleMapsUri'] ?? ''),
        'status' => (string) ($pl['businessStatus'] ?? ''),
        'type' => (string) ($pl['primaryType'] ?? ''),
        'type_label' => (string) ($pl['primaryTypeDisplayName']['text'] ?? ''),
        'types' => array_values(array_slice($pl['types'] ?? [], 0, 8)),
        'summary' => (string) ($pl['editorialSummary']['text'] ?? ''),
    ];
}

/** Similarité simple entre deux noms d'entreprise (0 à 1). */
function name_similarity(string $a, string $b): float
{
    $norm = function (string $s): string {
        $s = mb_strtolower($s);
        $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s;
        $s = preg_replace('/\b(sarl|sa|sas|sasu|ets|etablissements|ste|societe|group|groupe|gabon|libreville)\b/', ' ', $s);
        return trim(preg_replace('/[^a-z0-9]+/', ' ', $s));
    };
    $x = $norm($a);
    $y = $norm($b);
    if ($x === '' || $y === '') {
        return 0.0;
    }
    if ($x === $y || strpos($y, $x) !== false || strpos($x, $y) !== false) {
        return 1.0;
    }
    similar_text($x, $y, $pct);
    $tx = array_filter(explode(' ', $x), fn($t) => strlen($t) > 2);
    $ty = array_filter(explode(' ', $y), fn($t) => strlen($t) > 2);
    $common = $tx && $ty ? count(array_intersect($tx, $ty)) / max(1, min(count($tx), count($ty))) : 0;
    return max($pct / 100, $common);
}

/** Retrouve la fiche Google de l'entreprise. */
function places_find_company(string $name, string $city, string $country): ?array
{
    $list = places_search(trim("$name $city $country"), 5);
    if (!$list) {
        return null;
    }
    $best = null;
    $bestScore = 0.0;
    foreach ($list as $pl) {
        $s = name_similarity($name, $pl['name']);
        if ($city !== '' && mb_stripos($pl['address'], $city) !== false) {
            $s += 0.1;
        }
        if ($s > $bestScore) {
            $best = $pl;
            $bestScore = $s;
        }
    }
    if (!$best || $bestScore < 0.6) {
        return null;
    }
    $best['match'] = min(99, (int) round($bestScore * 90));
    return $best;
}
