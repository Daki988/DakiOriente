<?php
/* =========================================================
   NEAM Digital Score — Accès réseau
   Téléchargement sécurisé de pages publiques (anti-SSRF)
   et appels aux API externes (Google, Anthropic).
   ========================================================= */
declare(strict_types=1);

const AUDIT_UA = 'Mozilla/5.0 (compatible; NEAM-DigitalScore/1.0; +https://www.neamindustry.com/digital-score.html)';

/** Normalise une adresse saisie par l'utilisateur (ajoute https:// si besoin). */
function normalize_url(string $raw): ?string
{
    $u = trim($raw);
    if ($u === '') {
        return null;
    }
    if (!preg_match('#^https?://#i', $u)) {
        $u = 'https://' . ltrim($u, '/');
    }
    $parts = parse_url($u);
    if (!$parts || empty($parts['host'])) {
        return null;
    }
    $host = strtolower($parts['host']);
    if (!preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $host)) {
        return null;
    }
    $scheme = strtolower($parts['scheme'] ?? 'https');
    $path = $parts['path'] ?? '/';
    $query = isset($parts['query']) ? '?' . $parts['query'] : '';
    return $scheme . '://' . $host . ($path === '' ? '/' : $path) . $query;
}

/** Vérifie qu'une URL vise un serveur public (pas d'adresse interne) et renvoie l'IP à utiliser. */
function public_target(string $url): ?array
{
    $p = parse_url($url);
    if (!$p || !in_array(strtolower($p['scheme'] ?? ''), ['http', 'https'], true) || empty($p['host'])) {
        return null;
    }
    if (isset($p['port']) && !in_array((int) $p['port'], [80, 443], true)) {
        return null;
    }
    if (isset($p['user']) || isset($p['pass'])) {
        return null;
    }
    $host = strtolower($p['host']);
    if (filter_var($host, FILTER_VALIDATE_IP)) {
        return null; // on n'audite que des noms de domaine
    }
    $ips = @gethostbynamel($host);
    if (!$ips) {
        return null;
    }
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return null;
        }
    }
    $port = strtolower($p['scheme']) === 'https' ? 443 : 80;
    return ['host' => $host, 'ip' => $ips[0], 'port' => $port];
}

function audit_curl_handle(string $url, array $target, int $timeout, int $maxBytes, string &$buffer, $share = null)
{
    $ch = curl_init($url);
    $buffer = '';
    if ($share) {
        curl_setopt($ch, CURLOPT_SHARE, $share);
    }
    curl_setopt_array($ch, [
        CURLOPT_COOKIEFILE => '',
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_HEADER => false,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_RESOLVE => [$target['host'] . ':' . $target['port'] . ':' . $target['ip']],
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_USERAGENT => AUDIT_UA,
        CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language: fr-FR,fr;q=0.9,en;q=0.6'],
        CURLOPT_ENCODING => '',
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_WRITEFUNCTION => function ($ch, $chunk) use (&$buffer, $maxBytes) {
            $buffer .= $chunk;
            return strlen($buffer) > $maxBytes ? 0 : strlen($chunk);
        },
    ]);
    return $ch;
}

/**
 * Télécharge plusieurs pages publiques en parallèle, en suivant les redirections (4 max).
 * Renvoie, pour chaque clé : ok, status, url (finale), body, time (s), size, https, error.
 */
function fetch_many(array $urls, int $timeout = 10, int $maxBytes = 1500000): array
{
    $results = [];
    $pending = [];
    // Cookies partagés entre les redirections (certains sites en ont besoin)
    $share = curl_share_init();
    curl_share_setopt($share, CURLSHOPT_SHARE, CURL_LOCK_DATA_COOKIE);
    foreach ($urls as $key => $url) {
        $pending[$key] = ['url' => $url, 'hops' => 0, 'time' => 0.0];
    }
    while ($pending) {
        $mh = curl_multi_init();
        $handles = [];
        $buffers = [];
        foreach ($pending as $key => $job) {
            $target = public_target($job['url']);
            if (!$target) {
                $host = (string) parse_url($job['url'], PHP_URL_HOST);
                $err = $host !== '' && !@gethostbynamel($host) ? 'domaine introuvable' : 'adresse non autorisée';
                $results[$key] = ['ok' => false, 'status' => 0, 'url' => $job['url'], 'body' => '', 'time' => 0, 'size' => 0, 'https' => false, 'error' => $err];
                continue;
            }
            $buffers[$key] = '';
            $handles[$key] = audit_curl_handle($job['url'], $target, $timeout, $maxBytes, $buffers[$key], $share);
            curl_multi_add_handle($mh, $handles[$key]);
        }
        do {
            $status = curl_multi_exec($mh, $running);
            if ($running) {
                curl_multi_select($mh, 1.0);
            }
        } while ($running && $status === CURLM_OK);

        $next = [];
        foreach ($handles as $key => $ch) {
            $job = $pending[$key];
            $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            $time = $job['time'] + (float) curl_getinfo($ch, CURLINFO_TOTAL_TIME);
            $location = (string) curl_getinfo($ch, CURLINFO_REDIRECT_URL);
            $err = curl_error($ch);
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
            if ($code >= 300 && $code < 400 && $location !== '' && $job['hops'] < 6) {
                $next[$key] = ['url' => $location, 'hops' => $job['hops'] + 1, 'time' => $time];
                continue;
            }
            $body = $buffers[$key];
            $results[$key] = [
                'ok' => $code >= 200 && $code < 300 && $body !== '',
                'status' => $code,
                'url' => $job['url'],
                'body' => $body,
                'time' => round($time, 2),
                'size' => strlen($body),
                'https' => stripos($job['url'], 'https://') === 0,
                'error' => $code >= 300 && $code < 400 ? 'trop de redirections' : ($code ? '' : ($err ?: 'pas de réponse')),
            ];
        }
        curl_multi_close($mh);
        $pending = $next;
    }
    return $results;
}

/** Appel JSON à une API externe (adresse fixe, de confiance). */
function api_json(string $method, string $url, array $headers = [], ?array $body = null, int $timeout = 20): array
{
    $ch = curl_init($url);
    $h = array_merge(['Accept: application/json'], $headers);
    if ($body !== null) {
        $h[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $h,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_USERAGENT => AUDIT_UA,
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    return ['status' => $code, 'data' => is_array($data) ? $data : null, 'error' => $err];
}
