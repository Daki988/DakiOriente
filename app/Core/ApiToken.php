<?php
declare(strict_types=1);

namespace App\Core;

/** Jetons d'API opaques (seul le hash SHA-256 est stocké). */
final class ApiToken
{
    public static function issue(int $userId, string $name = 'api', int $days = 30): string
    {
        $plain = bin2hex(random_bytes(32));
        DB::insert('api_tokens', [
            'user_id'    => $userId,
            'name'       => $name,
            'token_hash' => hash('sha256', $plain),
            'expires_at' => date('Y-m-d H:i:s', strtotime("+$days days")),
            'created_at' => now(),
        ]);
        return $plain;
    }

    public static function resolve(string $plain): ?array
    {
        $row = DB::one(
            'SELECT u.* FROM api_tokens t JOIN users u ON u.id = t.user_id
             WHERE t.token_hash = :h AND t.expires_at > :now AND u.status = :s',
            ['h' => hash('sha256', $plain), 'now' => now(), 's' => 'active']
        );
        if ($row) {
            DB::run('UPDATE api_tokens SET last_used_at = :n WHERE token_hash = :h', ['n' => now(), 'h' => hash('sha256', $plain)]);
        }
        return $row;
    }
}
