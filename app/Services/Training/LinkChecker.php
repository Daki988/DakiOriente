<?php
declare(strict_types=1);

namespace App\Services\Training;

use App\Core\DB;
use App\Services\Referential\Curation;

/**
 * Vérification automatique des liens de formation (référentiel Formations, §6 et §15).
 * Lien joignable → date de vérification mise à jour. Lien mort (404, 410) → formation masquée
 * (elle n'est plus « vérifiée ») et signalée en curation. Erreur réseau → aucun changement, nouvel essai plus tard.
 */
final class LinkChecker
{
    /** Code HTTP d'une URL (0 si injoignable). */
    public static function status(string $url, int $timeout = 15): int
    {
        if (!function_exists('curl_init')) {
            $h = @get_headers($url);
            return $h && preg_match('#\s(\d{3})\s#', (string)$h[0], $m) ? (int)$m[1] : 0;
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_NOBODY => false, CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_RANGE => '0-2048',
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; TremplinBot/1.0; verification des liens de formation)',
        ]);
        curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return $code;
    }

    /** Vérifie les formations les plus anciennement vérifiées ; retourne le bilan. */
    public static function run(int $limit = 30): array
    {
        $rows = DB::all('SELECT id, title, url FROM trainings WHERE active = 1 AND platform_id IS NOT NULL AND url IS NOT NULL
            ORDER BY CASE WHEN verified_at IS NULL THEN 0 ELSE 1 END, verified_at LIMIT ' . max(1, $limit));
        $ok = $dead = $error = 0;
        foreach ($rows as $t) {
            $code = self::status((string)$t['url']);
            if ($code >= 200 && $code < 400 || in_array($code, [401, 403, 405, 429], true)) {
                // Certaines plateformes refusent les robots (403, 429) : le lien existe, il est conservé
                DB::update('trainings', ['verified_at' => now(), 'link_status' => 'ok'], 'id = :id', ['id' => $t['id']]);
                $ok++;
            } elseif (in_array($code, [404, 410], true)) {
                DB::update('trainings', ['verified_at' => null, 'link_status' => 'mort'], 'id = :id', ['id' => $t['id']]);
                Curation::add('lien', $t['title'], 'systeme', (int)$t['id'], null, ['url' => $t['url'], 'http' => $code]);
                $dead++;
            } else {
                DB::update('trainings', ['link_status' => 'erreur'], 'id = :id', ['id' => $t['id']]);
                $error++;
            }
        }
        return ['checked' => count($rows), 'ok' => $ok, 'dead' => $dead, 'error' => $error];
    }
}
