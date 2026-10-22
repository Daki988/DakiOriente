<?php
/* =========================================================
   Atelier NEAM — Socle : réglages, connexion, dossiers clients, contrôle qualité
   Les dossiers sont des fichiers JSON dans api/data/atelier/ (dossier fermé au web).
   ========================================================= */
declare(strict_types=1);

require_once __DIR__ . '/offres.php';

if (!isset($CONFIG)) {
    $CONFIG = require (is_file(__DIR__ . '/../../config.php') ? __DIR__ . '/../../config.php' : __DIR__ . '/../../config.sample.php');
}
date_default_timezone_set('Africa/Libreville');

const ATELIER_DATA = __DIR__ . '/../../data/atelier';

/** Champs du brief client : clé => [libellé, type, aide]. */
const ATELIER_BRIEF = [
    'entreprise' => ['Nom de l’entreprise', 'line', ''],
    'secteur' => ['Secteur d’activité', 'line', 'Ex. boutique de vêtements, institut de beauté, cabinet comptable'],
    'ville' => ['Ville', 'line', 'Ex. Libreville'],
    'quartier' => ['Quartier ou adresse', 'line', 'Ex. Louis, près du carrefour…'],
    'contact' => ['Nom du dirigeant ou de la dirigeante', 'line', ''],
    'whatsapp' => ['Numéro WhatsApp', 'line', 'Ex. 077 45 31 67'],
    'telephone' => ['Téléphone (si différent)', 'line', ''],
    'email' => ['E-mail', 'line', ''],
    'site' => ['Site web ou page actuelle', 'line', 'Laisser vide s’il n’y en a pas'],
    'reseaux' => ['Réseaux sociaux utilisés', 'line', 'Ex. Facebook, Instagram, TikTok'],
    'description' => ['Ce que fait l’entreprise', 'text', 'En quelques phrases, comme vous l’expliqueriez à un nouveau client'],
    'offres' => ['Produits ou services, avec leurs prix si vous le souhaitez', 'text', 'Un par ligne'],
    'horaires' => ['Horaires d’ouverture', 'line', 'Ex. du lundi au samedi, 9 h – 19 h'],
    'clientele' => ['Vos clients', 'text', 'Qui sont-ils ? Comment vous trouvent-ils aujourd’hui ?'],
    'atouts' => ['Ce qui vous distingue', 'text', 'Pourquoi vos clients vous choisissent'],
    'questions' => ['Les questions que vos clients posent le plus', 'text', 'Une par ligne'],
    'ton' => ['Ton souhaité', 'line', 'Ex. chaleureux, premium, simple et direct'],
    'objectif' => ['Votre objectif principal pour les 6 prochains mois', 'text', ''],
    'panier' => ['Panier moyen (FCFA)', 'number', 'Montant moyen d’une vente'],
    'marge' => ['Marge moyenne (%)', 'number', 'Ce qu’il vous reste sur une vente, en pourcentage'],
    'heures' => ['Heures perdues par semaine en tâches répétitives', 'number', 'Messages, devis, relances, recopie…'],
];

if (!function_exists('h')) {
    function h($s): string
    {
        return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

function atelier_cfg(string $key, $default = null)
{
    global $CONFIG;
    return $CONFIG['atelier'][$key] ?? $default;
}

function atelier_ouvert(): bool
{
    return (string) atelier_cfg('password', '') !== '';
}

function clean($value, int $max = 3000): string
{
    $s = trim(str_replace(["\r\n", "\r"], "\n", (string) $value));
    $s = preg_replace('/[^\P{C}\n\t]/u', '', $s) ?? '';
    return mb_substr($s, 0, $max);
}

// ---------- Session et connexion ----------

function atelier_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $https = (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('neam_atelier');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict', 'secure' => $https]);
    session_start();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
}

function atelier_connecte(): bool
{
    atelier_session();
    return !empty($_SESSION['ok']) && ($_SESSION['seen'] ?? 0) > time() - 8 * 3600;
}

/** Vérifie le mot de passe, avec une limite de 8 essais par adresse IP et par quart d'heure. */
function atelier_connexion(string $mdp): bool
{
    $f = sys_get_temp_dir() . '/neam_atelier_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
    $essais = array_filter(array_map('intval', explode(',', (string) @file_get_contents($f))), fn($t) => $t > time() - 900);
    if (count($essais) >= 8) {
        return false;
    }
    if (atelier_ouvert() && hash_equals((string) atelier_cfg('password'), $mdp)) {
        session_regenerate_id(true);
        $_SESSION['ok'] = true;
        $_SESSION['seen'] = time();
        @unlink($f);
        return true;
    }
    $essais[] = time();
    @file_put_contents($f, implode(',', $essais), LOCK_EX);
    return false;
}

function csrf_champ(): string
{
    return '<input type="hidden" name="csrf" value="' . h($_SESSION['csrf'] ?? '') . '">';
}

function csrf_ok(): bool
{
    return is_string($_POST['csrf'] ?? null) && hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf']);
}

// ---------- Dossiers clients ----------

function atelier_dossier(string $sous = 'clients'): string
{
    $d = ATELIER_DATA . '/' . $sous;
    if (!is_dir($d)) {
        @mkdir($d, 0750, true);
    }
    return $d;
}

function client_id_valide(string $id): bool
{
    return (bool) preg_match('/^[a-f0-9]{12}$/', $id);
}

function client_charger(string $id): ?array
{
    if (!client_id_valide($id)) {
        return null;
    }
    $f = atelier_dossier() . "/$id.json";
    $c = is_file($f) ? json_decode((string) file_get_contents($f), true) : null;
    return is_array($c) ? $c : null;
}

function client_enregistrer(array $c): void
{
    $c['maj'] = date('c');
    $f = atelier_dossier() . '/' . $c['id'] . '.json';
    file_put_contents($f . '.tmp', json_encode($c, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    rename($f . '.tmp', $f);
}

/** @return array<int, array> clients triés du plus récent au plus ancien */
function clients_tous(): array
{
    $out = [];
    foreach (glob(atelier_dossier() . '/*.json') ?: [] as $f) {
        $c = json_decode((string) file_get_contents($f), true);
        if (is_array($c)) {
            $out[] = $c;
        }
    }
    usort($out, fn($a, $b) => strcmp($b['maj'] ?? '', $a['maj'] ?? ''));
    return $out;
}

function slugifier(string $s): string
{
    $s = strtolower(trim((string) iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s)));
    $s = trim((string) preg_replace('/[^a-z0-9]+/', '-', $s), '-');
    return substr($s, 0, 48) ?: 'client';
}

function client_nouveau(string $entreprise, string $pack): array
{
    $c = [
        'id' => bin2hex(random_bytes(6)),
        'slug' => slugifier($entreprise),
        'cree' => date('c'),
        'etape' => 'contact',
        'pack' => isset(ATELIER_PACKS[$pack]) ? $pack : 'starter',
        'engagement' => ATELIER_PACKS[$pack]['engagement'] ?? 6,
        'options' => [],
        'jeton' => bin2hex(random_bytes(12)),
        'brief' => ['entreprise' => $entreprise],
        'livrables' => [],
        'calendriers' => [],
        'rapports' => [],
        'journal' => [],
    ];
    journal($c, 'Dossier créé');
    return $c;
}

function journal(array &$c, string $msg): void
{
    array_unshift($c['journal'], ['t' => date('c'), 'msg' => $msg]);
    $c['journal'] = array_slice($c['journal'], 0, 80);
}

/** Lien international WhatsApp à partir d'un numéro gabonais (077 45 31 67 → 24177453167). */
function wa_num(string $tel): string
{
    $d = preg_replace('/\D/', '', $tel) ?? '';
    if (str_starts_with($d, '00')) {
        $d = substr($d, 2);
    }
    if (str_starts_with($d, '241')) {
        return $d;
    }
    return '241' . ltrim($d, '0');
}

// ---------- Contrôle qualité automatique ----------

/** Textes d'un livrable, à plat, pour les contrôles. */
function textes_a_plat($v): array
{
    if (!is_array($v)) {
        return is_scalar($v) ? [(string) $v] : [];
    }
    $out = [];
    foreach ((array) $v as $x) {
        array_push($out, ...textes_a_plat($x));
    }
    return $out;
}

/**
 * Contrôles automatiques. Renvoie une liste [niveau, message] où niveau = 'bloquant' ou 'a_verifier'.
 * Un livrable avec un point bloquant ne peut pas être validé.
 */
function controle_qualite(string $type, array $data, array $brief): array
{
    $pb = [];
    $tout = implode("\n", textes_a_plat($data));
    if (preg_match('/\[[^\]]{2,40}\]|lorem ipsum|XXX|à compléter|TODO/iu', $tout, $m)) {
        $pb[] = ['bloquant', 'Texte à trou ou provisoire : « ' . $m[0] . ' »'];
    }
    // Chiffres absents du brief : peut-être inventés
    $connus = implode(' ', textes_a_plat($brief));
    preg_match_all('/\d[\d\s.,]*\d|\d/u', $tout, $nums);
    $suspects = [];
    foreach (array_unique($nums[0]) as $n) {
        $nn = preg_replace('/\D/', '', $n);
        if (strlen($nn) >= 2 && !str_contains(preg_replace('/\D/', '', $connus) ?? '', $nn)) {
            $suspects[] = trim($n);
        }
    }
    if ($suspects && $type !== 'rapport' && $type !== 'calendrier') {
        $pb[] = ['a_verifier', 'Chiffres absents du brief, à vérifier : ' . implode(', ', array_slice($suspects, 0, 8))];
    }
    if (preg_match('/\b(garanti|garantie|n°\s?1|numéro un|meilleur(e)? (de|du) (gabon|libreville))\b/iu', $tout, $m)) {
        $pb[] = ['a_verifier', 'Promesse forte à vérifier : « ' . $m[0] . ' »'];
    }
    $limites = ['fiche_google' => ['description' => 750], 'page' => ['meta_description' => 160, 'titre_seo' => 65]];
    foreach ($limites[$type] ?? [] as $champ => $max) {
        $len = mb_strlen((string) ($data[$champ] ?? ''));
        if ($len > $max) {
            $pb[] = ['bloquant', "« $champ » fait $len caractères (maximum $max)"];
        }
    }
    if ($type === 'calendrier' && isset($data['_attendu']) && count($data['publications'] ?? []) < $data['_attendu']) {
        $pb[] = ['bloquant', count($data['publications'] ?? []) . ' publications au lieu de ' . $data['_attendu']];
    }
    return $pb;
}

function livrable_bloque(array $l): bool
{
    foreach ($l['qc'] ?? [] as [$niveau]) {
        if ($niveau === 'bloquant') {
            return true;
        }
    }
    return false;
}

/** Prochaine action du dossier, calculée à partir de l'étape et des livrables. */
function prochaine_action(array $c): string
{
    $pack = ATELIER_PACKS[$c['pack']];
    $b = $c['brief'];
    switch ($c['etape']) {
        case 'contact':
            return empty($b['description']) ? 'Envoyer le lien du brief au client' : 'Préparer le diagnostic';
        case 'diagnostic':
            if (empty($c['livrables']['diagnostic'])) {
                return 'Générer le diagnostic';
            }
            return ($c['livrables']['diagnostic']['statut'] ?? '') === 'valide' ? 'Envoyer la proposition' : 'Valider le diagnostic';
        case 'proposition':
            return 'Relancer le client sur la proposition';
        case 'mise_en_place':
            foreach ($pack['livrables'] as $k) {
                if (in_array($k, ['diagnostic', 'rapport', 'calendrier'], true)) {
                    continue;
                }
                $l = $c['livrables'][$k] ?? null;
                if (!$l) {
                    return 'Générer : ' . ATELIER_LIVRABLES[$k][0];
                }
                if (($l['statut'] ?? '') !== 'valide') {
                    return 'Valider : ' . ATELIER_LIVRABLES[$k][0];
                }
            }
            return 'Mettre en ligne et former le client';
        case 'en_ligne':
        case 'suivi':
            $mois = date('Y-m');
            if (in_array('calendrier', $pack['livrables'], true) && empty($c['calendriers'][$mois])) {
                return 'Générer le calendrier ' . de_mois($mois);
            }
            $prec = date('Y-m', strtotime('first day of last month'));
            if (empty($c['rapports'][$prec]) && $c['etape'] === 'suivi') {
                return 'Produire le rapport ' . de_mois($prec);
            }
            return 'Rien à faire ce mois-ci';
    }
    return '—';
}

function mois_fr(string $ym): string
{
    $m = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    [$y, $mm] = array_map('intval', explode('-', $ym));
    return $m[$mm - 1] . ' ' . $y;
}

/** « de novembre 2026 », « d’octobre 2026 ». */
function de_mois(string $ym): string
{
    $m = mois_fr($ym);
    return (in_array($m[0], ['a', 'o'], true) ? 'd’' : 'de ') . $m;
}

function date_fr(string $iso): string
{
    $t = strtotime($iso);
    return $t ? date('d/m/Y H:i', $t) : '';
}
