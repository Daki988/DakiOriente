<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Configuration : valeurs par défaut + surcharge via le fichier .env (non versionné).
 */
final class Config
{
    private static array $items = [];

    public static function load(string $basePath): void
    {
        $env = self::parseEnv($basePath . '/.env');
        $get = fn(string $k, $d = null) => $env[$k] ?? getenv($k) ?: $d;
        $bool = fn(string $k, bool $d) => filter_var($get($k, $d ? 'true' : 'false'), FILTER_VALIDATE_BOOLEAN);

        self::$items = [
            'app' => [
                'name'     => $get('APP_NAME', 'Tremplin by NEAM'),
                'url'      => rtrim((string)$get('APP_URL', ''), '/'),
                'debug'    => $bool('APP_DEBUG', false),
                'demo'     => $bool('APP_DEMO', true),
                'timezone' => $get('APP_TIMEZONE', 'Africa/Libreville'),
                'key'      => $get('APP_KEY', 'change-me-in-env-file-please-0000000000'),
                'country'  => $get('APP_DEFAULT_COUNTRY', 'GA'),
                'currency' => $get('APP_CURRENCY', 'FCFA'),
            ],
            'db' => [
                'driver'   => $get('DB_DRIVER', 'sqlite'),
                'path'     => $get('DB_PATH', STORAGE_PATH . '/database.sqlite'),
                'host'     => $get('DB_HOST', '127.0.0.1'),
                'port'     => $get('DB_PORT', '3306'),
                'name'     => $get('DB_NAME', 'tremplin'),
                'user'     => $get('DB_USER', 'root'),
                'password' => $get('DB_PASSWORD', ''),
            ],
            'mail' => [
                'driver' => $get('MAIL_DRIVER', 'log'), // log | mail
                'from'   => $get('MAIL_FROM', 'no-reply@tremplin.ga'),
            ],
            'sms' => [
                'driver' => $get('SMS_DRIVER', 'log'),
            ],
            'ai' => [
                'provider' => $get('AI_PROVIDER', 'local'), // local | anthropic
                'api_key'  => $get('ANTHROPIC_API_KEY', ''),
                'model'    => $get('AI_MODEL', 'claude-opus-5-5'),
            ],
            'payment' => [
                'driver' => $get('PAYMENT_DRIVER', 'sandbox'),
            ],
            'upload' => [
                'max_size' => (int)$get('UPLOAD_MAX_SIZE', 5 * 1024 * 1024),
            ],
        ];
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = self::$items;
        foreach (explode('.', $key) as $part) {
            if (!is_array($value) || !array_key_exists($part, $value)) {
                return $default;
            }
            $value = $value[$part];
        }
        return $value;
    }

    private static function parseEnv(string $file): array
    {
        if (!is_file($file)) {
            return [];
        }
        $vars = [];
        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
                continue;
            }
            [$k, $v] = array_map('trim', explode('=', $line, 2));
            $vars[$k] = trim($v, "\"'");
        }
        return $vars;
    }
}
