<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Routeur minimaliste : verbes HTTP, paramètres {id}, middlewares (auth, rôles, CSRF, API).
 */
final class Router
{
    private array $routes = [];
    private array $groupStack = [];

    public function get(string $path, array|callable $handler, array $mw = []): void
    {
        $this->add('GET', $path, $handler, $mw);
    }

    public function post(string $path, array|callable $handler, array $mw = []): void
    {
        $this->add('POST', $path, $handler, $mw);
    }

    public function patch(string $path, array|callable $handler, array $mw = []): void
    {
        $this->add('PATCH', $path, $handler, $mw);
    }

    public function group(string $prefix, array $mw, callable $fn): void
    {
        $this->groupStack[] = [$prefix, $mw];
        $fn($this);
        array_pop($this->groupStack);
    }

    private function add(string $method, string $path, array|callable $handler, array $mw): void
    {
        $prefix = '';
        $groupMw = [];
        foreach ($this->groupStack as [$p, $m]) {
            $prefix .= $p;
            $groupMw = array_merge($groupMw, $m);
        }
        $full = rtrim($prefix . $path, '/') ?: '/';
        $regex = '#^' . preg_replace('#\{([a-z_]+)\}#', '(?P<$1>[^/]+)', $full) . '$#';
        $this->routes[] = compact('method', 'full', 'regex', 'handler') + ['mw' => array_merge($groupMw, $mw)];
    }

    public function dispatch(string $method, string $uri): void
    {
        $path = rawurldecode(parse_url($uri, PHP_URL_PATH) ?: '/');
        $path = rtrim($path, '/') ?: '/';
        if ($method === 'POST' && isset($_POST['_method'])) {
            $method = strtoupper((string)$_POST['_method']);
        }

        $allowed = false;
        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $path, $m)) {
                continue;
            }
            $allowed = true;
            if ($route['method'] !== $method && !($method === 'HEAD' && $route['method'] === 'GET')) {
                continue;
            }
            $params = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
            Middleware::run($route['mw'], $method);
            $this->invoke($route['handler'], $params);
            return;
        }

        if ($allowed) {
            abort(405);
        }
        abort(404);
    }

    private function invoke(array|callable $handler, array $params): void
    {
        if (is_array($handler)) {
            [$class, $action] = $handler;
            $controller = new $class();
            $out = $controller->$action(...array_values($params));
        } else {
            $out = $handler(...array_values($params));
        }
        if (is_string($out)) {
            echo $out;
        }
    }
}
