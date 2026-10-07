<?php
declare(strict_types=1);

use App\Core\Auth;
use App\Core\Config;
use App\Core\Csrf;
use App\Core\DB;
use App\Core\Session;
use App\Core\View;

/* ---------- Configuration & environnement ---------- */

function config(string $key, mixed $default = null): mixed
{
    return Config::get($key, $default);
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

function client_ip(): string
{
    return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/** Paramètre éditable depuis le back-office (table settings). */
function setting(string $key, mixed $default = null): mixed
{
    static $cache = null;
    if ($cache === null) {
        try {
            $cache = [];
            foreach (DB::all('SELECT skey, svalue FROM settings') as $r) {
                $cache[$r['skey']] = $r['svalue'];
            }
        } catch (\Throwable) {
            $cache = [];
        }
    }
    return $cache[$key] ?? $default;
}

/** Clé secrète locale (signature des URL de photos). Générée au premier usage, hors du dépôt. */
function app_secret(): string
{
    static $key = null;
    if ($key === null) {
        $key = (string)(config('app.secret') ?: '');
        if ($key === '') {
            $file = STORAGE_PATH . '/cache/app-secret.key';
            if (!is_file($file)) {
                @file_put_contents($file, bin2hex(random_bytes(32)));
            }
            $key = (string)@file_get_contents($file) ?: 'tremplin';
        }
    }
    return $key;
}

/* ---------- HTTP ---------- */

function e(mixed $value): string
{
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function url(string $path = '/', array $query = []): string
{
    $q = array_filter($query, fn($v) => $v !== null && $v !== '' && $v !== []);
    return config('app.url') . '/' . ltrim($path, '/') . ($q ? '?' . http_build_query($q) : '');
}

function asset(string $path): string
{
    $file = BASE_PATH . '/public/assets/' . ltrim($path, '/');
    $v = is_file($file) ? substr((string)filemtime($file), -6) : '1';
    return url('assets/' . ltrim($path, '/')) . '?v=' . $v;
}

function redirect(string $to, int $code = 302): never
{
    header('Location: ' . (str_starts_with($to, 'http') ? $to : url($to)), true, $code);
    exit;
}

function back(): never
{
    $ref = $_SERVER['HTTP_REFERER'] ?? '/';
    $host = parse_url($ref, PHP_URL_HOST);
    if ($host && $host !== ($_SERVER['HTTP_HOST'] ?? '') && $host !== parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) {
        $ref = '/';
    }
    header('Location: ' . $ref, true, 302);
    exit;
}

function abort(int $code, string $message = ''): never
{
    http_response_code($code);
    if (str_starts_with((string)parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/api/')) {
        json_response(['error' => $code, 'message' => $message ?: 'Erreur'], $code);
    }
    $titles = [403 => 'Accès refusé', 404 => 'Page introuvable', 405 => 'Méthode non autorisée', 419 => 'Session expirée', 429 => 'Trop de requêtes', 500 => 'Erreur serveur'];
    echo View::render('errors/error', [
        'code'    => $code,
        'title'   => $titles[$code] ?? 'Erreur',
        'message' => $message,
    ]);
    exit;
}

/** Requête envoyée en arrière-plan (fetch) plutôt que par un formulaire classique. */
function is_ajax(): bool
{
    return ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch' || str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json');
}

function json_response(mixed $data, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function input(string $key, mixed $default = null): mixed
{
    $v = $_POST[$key] ?? $_GET[$key] ?? $default;
    return is_string($v) ? trim($v) : $v;
}

function json_input(): array
{
    static $data = null;
    if ($data === null) {
        $raw = file_get_contents('php://input') ?: '';
        $data = json_decode($raw, true) ?: $_POST;
    }
    return $data;
}

function is_current(string $prefix, bool $exact = false): bool
{
    $path = rtrim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/', '/') ?: '/';
    return $exact ? $path === $prefix : ($path === $prefix || str_starts_with($path, rtrim($prefix, '/') . '/'));
}

/* ---------- Session : flash, erreurs, anciennes valeurs ---------- */

function flash(string $type, string $message): void
{
    $f = Session::get('_flash', []);
    $f[] = ['type' => $type, 'message' => $message];
    Session::put('_flash', $f);
}

function old(string $key, mixed $default = ''): mixed
{
    static $old = null;
    $old ??= Session::pull('_old', []);
    return $old[$key] ?? $default;
}

function errors(): array
{
    static $errors = null;
    $errors ??= Session::pull('_errors', []);
    return $errors;
}

function error_for(string $field): string
{
    $err = errors()[$field] ?? null;
    return $err ? '<p class="field-error" id="err-' . e($field) . '" role="alert">' . e($err) . '</p>' : '';
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(Csrf::token()) . '">';
}

function method_field(string $m): string
{
    return '<input type="hidden" name="_method" value="' . e($m) . '">';
}

/* ---------- Présentation ---------- */

function icon(string $name, string $class = ''): string
{
    return '<svg class="ic ' . e($class) . '" aria-hidden="true" focusable="false"><use href="' . e(url('assets/img/icons.svg')) . '#i-' . e($name) . '"></use></svg>';
}

function money(int|float|null $amount, bool $withCurrency = true): string
{
    if ($amount === null) {
        return '—';
    }
    return number_format((float)$amount, 0, ',', ' ') . ($withCurrency ? ' ' . config('app.currency') : '');
}

function nf(int|float|null $n): string
{
    return number_format((float)$n, 0, ',', ' ');
}

function date_fr(?string $date, bool $withTime = false): string
{
    if (!$date) {
        return '—';
    }
    $ts = strtotime($date);
    $months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    $s = date('j', $ts) . ' ' . $months[(int)date('n', $ts) - 1] . ' ' . date('Y', $ts);
    return $withTime ? $s . ' à ' . date('H\hi', $ts) : $s;
}

function time_ago(?string $date): string
{
    if (!$date) {
        return '';
    }
    $d = time() - strtotime($date);
    return match (true) {
        $d < 60      => "à l'instant",
        $d < 3600    => 'il y a ' . floor($d / 60) . ' min',
        $d < 86400   => 'il y a ' . floor($d / 3600) . ' h',
        $d < 172800  => 'hier',
        $d < 2592000 => 'il y a ' . floor($d / 86400) . ' jours',
        default      => date_fr($date),
    };
}

function slugify(string $text): string
{
    $text = strtr($text, ['œ' => 'oe', 'Œ' => 'oe', 'æ' => 'ae']);
    $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;
    $text = strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $text));
    return trim($text, '-') ?: 'n-a';
}

/** Normalise un texte pour la comparaison (minuscule, sans accent). */
function normalize(string $text): string
{
    $t = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', mb_strtolower($text)) ?: mb_strtolower($text);
    return trim(preg_replace('/[^a-z0-9+#.]+/', ' ', $t));
}

function initials(?string $first, ?string $last = ''): string
{
    return mb_strtoupper(mb_substr((string)$first, 0, 1) . mb_substr((string)$last, 0, 1));
}

function excerpt(?string $text, int $len = 140): string
{
    $t = trim(preg_replace('/\s+/', ' ', strip_tags((string)$text)));
    return mb_strlen($t) > $len ? rtrim(mb_substr($t, 0, $len)) . '…' : $t;
}

/** Paragraphes simples à partir d'un texte brut (échappé). */
function nl2p(?string $text): string
{
    $out = '';
    foreach (preg_split("/\n\s*\n/", trim((string)$text)) as $para) {
        $lines = array_map('trim', explode("\n", $para));
        if (count(array_filter($lines, fn($l) => str_starts_with($l, '- ') || str_starts_with($l, '• '))) === count($lines)) {
            $out .= '<ul>' . implode('', array_map(fn($l) => '<li>' . e(ltrim($l, '-• ')) . '</li>', $lines)) . '</ul>';
        } else {
            $out .= '<p>' . nl2br(e($para)) . '</p>';
        }
    }
    return $out;
}

function score_class(int|float $score): string
{
    return $score >= 75 ? 'high' : ($score >= 50 ? 'mid' : 'low');
}

function avatar_color(string $seed): string
{
    $palette = ['#0057ff', '#00a3ff', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9', '#f97316'];
    return $palette[crc32($seed) % count($palette)];
}

/* ---------- Référentiels d'affichage ---------- */

function job_types(): array
{
    return [
        'stage'          => 'Stage',
        'alternance'     => 'Alternance',
        'premier_emploi' => 'Premier emploi',
        'cdd'            => 'CDD',
        'cdi'            => 'CDI',
        'freelance'      => 'Mission freelance',
    ];
}

function education_levels(): array
{
    // Échelle commune Tremplin N0-N6 (référentiel Diplômes & Équivalences)
    return [
        0 => 'N0 · Sans diplôme',
        1 => 'N1 · BEPC, CAP',
        2 => 'N2 · Baccalauréat',
        3 => 'N3 · Bac+2 (BTS, DUT, DTS)',
        4 => 'N4 · Bac+3 (Licence)',
        5 => 'N5 · Bac+5 (Master, ingénieur)',
        6 => 'N6 · Bac+8 (Doctorat)',
    ];
}

function application_statuses(): array
{
    return [
        'draft'       => ['Brouillon', 'gray', 'pencil'],
        'sent'        => ['Envoyée', 'blue', 'send'],
        'viewed'      => ['Consultée', 'sky', 'eye'],
        'shortlisted' => ['Présélectionnée', 'violet', 'star'],
        'interview'   => ['Entretien', 'amber', 'calendar'],
        'accepted'    => ['Acceptée', 'green', 'circle-check-big'],
        'rejected'    => ['Non retenue', 'red', 'circle-x'],
    ];
}

function status_badge(string $status): string
{
    [$label, $color, $ic] = application_statuses()[$status] ?? [$status, 'gray', 'info'];
    return '<span class="badge badge-' . $color . '">' . icon($ic) . e($label) . '</span>';
}

function internship_statuses(): array
{
    return [
        'recherche'   => ['En recherche', 'gray'],
        'candidature' => ['Candidatures', 'blue'],
        'placement'   => ['Placé·e', 'violet'],
        'convention'  => ['Convention signée', 'amber'],
        'en_cours'    => ['En stage', 'sky'],
        'termine'     => ['Terminé', 'green'],
    ];
}

function mobility_labels(): array
{
    return ['ville' => 'Ma ville uniquement', 'national' => 'Tout le pays', 'international' => 'Afrique et international'];
}

function language_levels(): array
{
    return ['A1' => 'Débutant', 'A2' => 'Élémentaire', 'B1' => 'Intermédiaire', 'B2' => 'Avancé', 'C1' => 'Courant', 'C2' => 'Bilingue / natif'];
}

/* ---------- Contexte utilisateur ---------- */

function user(): ?array
{
    return Auth::user();
}

function current_company(): ?array
{
    static $company = false;
    if ($company === false) {
        $company = Auth::check()
            ? DB::one('SELECT c.* FROM companies c JOIN company_users cu ON cu.company_id = c.id WHERE cu.user_id = :u', ['u' => Auth::id()])
            : null;
    }
    return $company;
}

function current_school(): ?array
{
    static $school = false;
    if ($school === false) {
        $school = Auth::check() ? DB::one('SELECT * FROM schools WHERE owner_user_id = :u', ['u' => Auth::id()]) : null;
    }
    return $school;
}

function unread_notifications(): int
{
    return Auth::check() ? (int)DB::value('SELECT COUNT(*) FROM notifications WHERE user_id = :u AND read_at IS NULL', ['u' => Auth::id()]) : 0;
}

function audit(string $action, ?string $entity = null, ?int $entityId = null, array $meta = []): void
{
    App\Services\AuditLogger::log($action, $entity, $entityId, $meta);
}

/* ---------- Navigation des espaces connectés ---------- */

/** @return array<int, array{0:string,1:string,2:string,3?:string}> [libellé, url, icône, section] */
function app_nav(string $role): array
{
    return match ($role) {
        'candidate' => [
            ['Tableau de bord', '/espace', 'house', 'Mon parcours'],
            ['Offres pour moi', '/espace/recommandations', 'sparkles'],
            ['Rechercher', '/offres', 'search'],
            ['Mes candidatures', '/espace/candidatures', 'send'],
            ['Favoris', '/espace/favoris', 'heart'],
            ['Mon profil', '/espace/profil', 'user', 'Ma candidature'],
            ['Mon CV', '/espace/cv', 'file-text'],
            ['Lettres de motivation', '/espace/lettres', 'scroll-text'],
            ['Axes de progression', '/espace/progression', 'trending-up', 'Progresser'],
            ['Mes formations', '/espace/formations', 'award'],
            ['Score d\'employabilité', '/espace/employabilite', 'gauge'],
            ['Préparation aux stages', '/espace/preparation-stages', 'target'],
            ['Orientation RIASEC', '/espace/orientation', 'compass'],
            ['Préparer un entretien', '/espace/entretien', 'mic'],
            ['Plan 30/60/90 jours', '/espace/plan', 'route'],
            ['Catalogue de formations', '/formations', 'graduation-cap'],
            ['Certifications', '/certifications', 'badge-check'],
        ],
        'company' => [
            ['Tableau de bord', '/entreprise', 'house', 'Recrutement'],
            ['Mes offres', '/entreprise/offres', 'briefcase-business'],
            ['Publier une offre', '/entreprise/offres/nouvelle', 'plus'],
            ['CVthèque', '/entreprise/cvtheque', 'users'],
            ['Statistiques', '/entreprise/statistiques', 'bar-chart-3'],
            ['Profil entreprise', '/entreprise/profil', 'building-2', 'Entreprise'],
            ...(launch_mode() ? [] : [['Abonnement', '/abonnement', 'credit-card']]),
        ],
        'school' => [
            ['Tableau de bord', '/ecole', 'house', 'Établissement'],
            ['Étudiants', '/ecole/etudiants', 'users'],
            ['Suivi des stages', '/ecole/stages', 'kanban'],
            ['Diffusion d\'offres', '/ecole/diffusion', 'send'],
            ['Export du rapport', '/ecole/export', 'file-down'],
        ],
        'admin' => [
            ['Vue d\'ensemble', '/admin', 'layout-dashboard', 'Pilotage'],
            ['Utilisateurs', '/admin/utilisateurs', 'users'],
            ['Entreprises', '/admin/entreprises', 'building-2'],
            ['Offres', '/admin/offres', 'briefcase-business'],
            ['Signalements', '/admin/signalements', 'flag'],
            ['Formations & certificats', '/admin/formations', 'graduation-cap'],
            ['Veille des stages', '/admin/veille-stages', 'globe'],
            ['Référentiels', '/admin/referentiels', 'database', 'Référentiels v1.1'],
            ['File de curation', '/admin/curation', 'list-checks'],
            ['Objectifs & seuils', '/admin/referentiels/regles', 'target'],
            ['Versions & jeu de référence', '/admin/referentiels/versions', 'layers'],
            ['Qualité & calibrage', '/admin/qualite', 'gauge'],
            ['Pays, villes, secteurs', '/admin/referentiels/donnees', 'globe', 'Configuration'],
            ['Contenus', '/admin/contenus', 'book-open'],
            ['Paiements', '/admin/paiements', 'wallet'],
            ['Communications', '/admin/communications', 'mail'],
            ['Journal d\'audit', '/admin/audit', 'shield-check'],
            ['Paramètres', '/admin/parametres', 'settings'],
        ],
        default => [],
    };
}

/** Navigation basse mobile (5 entrées max). */
function bottom_nav(string $role): array
{
    return match ($role) {
        'candidate' => [['Accueil', '/espace', 'house'], ['Offres', '/offres', 'briefcase-business'], ['CV', '/espace/cv', 'file-text'], ['Formations', '/formations', 'graduation-cap'], ['Profil', '/espace/profil', 'user']],
        'company'   => [['Accueil', '/entreprise', 'house'], ['Offres', '/entreprise/offres', 'briefcase-business'], ['Publier', '/entreprise/offres/nouvelle', 'plus'], ['CVthèque', '/entreprise/cvtheque', 'users'], ['Stats', '/entreprise/statistiques', 'bar-chart-3']],
        'school'    => [['Accueil', '/ecole', 'house'], ['Étudiants', '/ecole/etudiants', 'users'], ['Stages', '/ecole/stages', 'kanban'], ['Diffuser', '/ecole/diffusion', 'send'], ['Compte', '/compte', 'settings']],
        'admin'     => [['Accueil', '/admin', 'layout-dashboard'], ['Utilisateurs', '/admin/utilisateurs', 'users'], ['Offres', '/admin/offres', 'briefcase-business'], ['Signalements', '/admin/signalements', 'flag'], ['Réglages', '/admin/parametres', 'settings']],
        default     => [],
    };
}

/** L'élément de navigation le plus spécifique correspondant à l'URL courante. */
function nav_active(array $items): ?string
{
    $best = null;
    foreach ($items as $it) {
        if (is_current($it[1]) && ($best === null || strlen($it[1]) > strlen($best))) {
            $best = $it[1];
        }
    }
    return $best;
}

function role_label(string $role): string
{
    return ['candidate' => 'Candidat', 'company' => 'Recruteur', 'school' => 'École', 'admin' => 'Admin NEAM'][$role] ?? $role;
}

/** Envoie un export CSV compatible Excel (UTF-8 avec BOM, séparateur « ; »). */
function send_csv(string $filename, array $header, array $rows): never
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . str_replace('"', '', $filename) . '"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, $header, ';', '"', '\\');
    foreach ($rows as $r) {
        // Neutralise l'injection de formules dans les tableurs
        $r = array_map(fn($v) => is_string($v) && preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v, $r);
        fputcsv($out, $r, ';', '"', '\\');
    }
    fclose($out);
    exit;
}

/** Phase de lancement : toutes les fonctionnalités sont gratuites, les paiements sont désactivés. */
function launch_mode(): bool
{
    return setting('launch_mode', '1') === '1';
}
