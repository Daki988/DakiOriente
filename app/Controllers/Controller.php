<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\View;

abstract class Controller
{
    protected function view(string $view, array $data = [], string $layout = 'public'): string
    {
        return View::render($view, $data, $layout);
    }

    protected function app(string $view, array $data = []): string
    {
        return View::render($view, $data, 'app');
    }

    protected function wantsJson(): bool
    {
        return str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
    }

    protected function user(): array
    {
        return Auth::user();
    }

    protected function uid(): int
    {
        return (int)Auth::id();
    }

    protected function intOrNull(mixed $v): ?int
    {
        return $v === null || $v === '' ? null : (int)$v;
    }

    /** Pagination simple : [offset, page]. */
    protected function paginate(int $perPage = 12): array
    {
        $page = max(1, (int)($_GET['page'] ?? 1));
        return [($page - 1) * $perPage, $page];
    }
}
