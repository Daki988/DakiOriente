<?php
declare(strict_types=1);

namespace App\Core;

final class Auth
{
    private static ?array $user = null;
    private static bool $loaded = false;

    public static function user(): ?array
    {
        if (!self::$loaded) {
            self::$loaded = true;
            $id = Session::get('user_id');
            if ($id) {
                self::$user = DB::one('SELECT * FROM users WHERE id = :id AND status = :s', ['id' => $id, 's' => 'active']);
                if (!self::$user) {
                    Session::forget('user_id');
                }
            }
        }
        return self::$user;
    }

    public static function id(): ?int
    {
        return isset(self::user()['id']) ? (int)self::user()['id'] : null;
    }

    public static function check(): bool
    {
        return self::user() !== null;
    }

    public static function is(string ...$roles): bool
    {
        return self::check() && in_array(self::user()['role'], $roles, true);
    }

    public static function attempt(string $login, string $password): ?array
    {
        $login = trim($login);
        $user = DB::one('SELECT * FROM users WHERE email = :l OR phone = :l2', ['l' => mb_strtolower($login), 'l2' => $login]);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return null;
        }
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            DB::update('users', ['password_hash' => password_hash($password, PASSWORD_DEFAULT)], 'id = :id', ['id' => $user['id']]);
        }
        return $user;
    }

    public static function login(array $user): void
    {
        Session::regenerate();
        Session::put('user_id', (int)$user['id']);
        DB::update('users', ['last_login_at' => now()], 'id = :id', ['id' => $user['id']]);
        self::$user = $user;
        self::$loaded = true;
    }

    public static function setApiUser(array $user): void
    {
        self::$user = $user;
        self::$loaded = true;
    }

    public static function logout(): void
    {
        Session::destroy();
        self::$user = null;
    }

    public static function refresh(): void
    {
        self::$loaded = false;
        self::user();
    }

    public static function homeUrl(?array $user = null): string
    {
        $user ??= self::user();
        return match ($user['role'] ?? null) {
            'company' => '/entreprise',
            'school'  => '/ecole',
            'admin'   => '/admin',
            'candidate' => '/espace',
            default   => '/',
        };
    }
}
