<?php
declare(strict_types=1);

namespace App\Core;

/** Limitation de débit stockée en base (fenêtre fixe). */
final class RateLimiter
{
    public static function hit(string $key, int $max, int $minutes): bool
    {
        $now = time();
        $row = DB::one('SELECT hits, reset_at FROM rate_limits WHERE bucket = :b', ['b' => $key]);
        if (!$row || (int)$row['reset_at'] <= $now) {
            DB::run('DELETE FROM rate_limits WHERE bucket = :b', ['b' => $key]);
            DB::insert('rate_limits', ['bucket' => $key, 'hits' => 1, 'reset_at' => $now + $minutes * 60]);
            return true;
        }
        if ((int)$row['hits'] >= $max) {
            return false;
        }
        DB::run('UPDATE rate_limits SET hits = hits + 1 WHERE bucket = :b', ['b' => $key]);
        return true;
    }

    public static function clear(string $key): void
    {
        DB::run('DELETE FROM rate_limits WHERE bucket = :b', ['b' => $key]);
    }
}
