<?php
declare(strict_types=1);

namespace App\Services\Training;

/** Requêtes HTTP minimales pour les connecteurs de catalogues (sans dépendance). */
final class Http
{
    public static function json(string $url, int $timeout = 30, int $retries = 2): ?array
    {
        for ($i = 0; $i <= $retries; $i++) {
            $body = self::get($url, $timeout);
            if ($body !== null) {
                $data = json_decode($body, true);
                if (is_array($data)) {
                    return $data;
                }
            }
            usleep(400000 * ($i + 1));
        }
        return null;
    }

    public static function get(string $url, int $timeout = 30): ?string
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 4,
                CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_USERAGENT => 'TremplinBot/1.0 (+https://tremplin.neamindustry.com; catalogue de formations)',
                CURLOPT_HTTPHEADER => ['Accept: application/json'],
            ]);
            $body = curl_exec($ch);
            $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            curl_close($ch);
            return $body !== false && $code >= 200 && $code < 300 ? (string)$body : null;
        }
        $ctx = stream_context_create(['http' => ['timeout' => $timeout, 'header' => "User-Agent: TremplinBot/1.0\r\nAccept: application/json\r\n", 'ignore_errors' => false]]);
        $body = @file_get_contents($url, false, $ctx);
        return $body === false ? null : $body;
    }

    /** Code HTTP d'une URL (vérification des liens). 0 si injoignable. */
    public static function status(string $url, int $timeout = 15): int
    {
        if (!function_exists('curl_init')) {
            return 0;
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_NOBODY => false, CURLOPT_RANGE => '0-1024', CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => $timeout, CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; TremplinBot/1.0)']);
        curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return $code;
    }
}
