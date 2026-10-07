<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Middlewares : authentification, contrôle de rôle (RBAC), CSRF, API par jeton, limitation de débit.
 */
final class Middleware
{
    public static function run(array $stack, string $method): void
    {
        $isApi = in_array('api', $stack, true);

        if (!$isApi && !in_array($method, ['GET', 'HEAD'], true)) {
            Csrf::verify();
        }

        foreach ($stack as $mw) {
            [$name, $arg] = array_pad(explode(':', $mw, 2), 2, null);
            match ($name) {
                'auth'     => self::auth($isApi),
                'guest'    => Auth::check() ? redirect(Auth::homeUrl()) : null,
                'role'     => self::role(explode(',', (string)$arg), $isApi),
                'api'      => self::api(),
                'throttle' => self::throttle((string)$arg, $isApi),
                'verified' => self::verifiedCompany(),
                default    => null,
            };
        }
    }

    private static function auth(bool $isApi): void
    {
        if (Auth::check()) {
            return;
        }
        if ($isApi) {
            json_response(['error' => 'unauthenticated', 'message' => 'Jeton d\'accès manquant ou invalide.'], 401);
        }
        Session::put('intended', $_SERVER['REQUEST_URI'] ?? '/');
        flash('info', 'Connecte-toi pour continuer.');
        redirect('/connexion');
    }

    private static function role(array $roles, bool $isApi): void
    {
        self::auth($isApi);
        if (!in_array(Auth::user()['role'], $roles, true)) {
            if ($isApi) {
                json_response(['error' => 'forbidden', 'message' => 'Accès refusé pour ce rôle.'], 403);
            }
            abort(403);
        }
    }

    private static function api(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(\S+)/', $header, $m)) {
            $user = ApiToken::resolve($m[1]);
            if ($user) {
                Auth::setApiUser($user);
            }
        }
    }

    /** throttle:clé,maxTentatives,minutes */
    private static function throttle(string $arg, bool $isApi): void
    {
        [$key, $max, $minutes] = array_pad(explode(',', $arg), 3, null);
        $bucket = ($key ?: 'global') . '|' . client_ip();
        if (!RateLimiter::hit($bucket, (int)($max ?: 60), (int)($minutes ?: 1))) {
            if ($isApi) {
                json_response(['error' => 'too_many_requests', 'message' => 'Trop de requêtes, réessaie plus tard.'], 429);
            }
            http_response_code(429);
            flash('error', 'Trop de tentatives. Patiente quelques minutes avant de réessayer.');
            back();
        }
    }

    private static function verifiedCompany(): void
    {
        $company = current_company();
        if (!$company) {
            redirect('/entreprise/profil');
        }
    }
}
