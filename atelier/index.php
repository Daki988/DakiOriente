<?php
/* =========================================================
   Atelier NEAM — Back-office de production (accès réservé à l'équipe)
   Un dossier par client, le parcours en 6 étapes, la proposition et le ROI
   calculés automatiquement, les livrables produits par l'IA, contrôlés
   automatiquement puis validés par un expert NEAM.
   ========================================================= */
declare(strict_types=1);

require __DIR__ . '/../api/lib/atelier/ia.php';
require __DIR__ . '/../api/lib/atelier/rendu.php';
require __DIR__ . '/../api/mailer.php';

header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: same-origin');

const MESURES = [
    'vues_fiche' => 'Vues de la fiche Google',
    'appels' => 'Appels depuis Google',
    'itineraires' => 'Demandes d’itinéraire',
    'visites_page' => 'Visites de la page ou du site',
    'messages_whatsapp' => 'Conversations WhatsApp',
    'abonnes' => 'Abonnés sur les réseaux',
    'publications' => 'Publications faites',
    'avis_nouveaux' => 'Nouveaux avis Google',
    'note_google' => 'Note Google',
    'ventes_declarees' => 'Ventes déclarées par le client',
];

$p = (string) ($_GET['p'] ?? 'tableau');
$flash = '';

// ---------- Première visite : installation guidée (code reçu par e-mail, puis mot de passe) ----------
if (!atelier_ouvert()) {
    atelier_session();
    installation();
    exit;
}

atelier_session();

// ---------- Connexion ----------
if ($p === 'sortir') {
    $_SESSION = [];
    session_destroy();
    header('Location: ./');
    exit;
}
if (!atelier_connecte()) {
    $err = '';
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['mdp'])) {
        if (csrf_ok() && atelier_connexion((string) $_POST['mdp'])) {
            header('Location: ./');
            exit;
        }
        $err = '<p class="alerte">Mot de passe incorrect, ou trop d’essais : réessayez dans quelques minutes.</p>';
    }
    page_debut('Connexion', false);
    echo '<form class="login" method="post"><h1>Atelier NEAM</h1>' . $err . csrf_champ()
        . '<label>Mot de passe<input type="password" name="mdp" autocomplete="current-password" required autofocus></label><button class="btn">Entrer</button></form>';
    page_fin();
    exit;
}
$_SESSION['seen'] = time();

// ---------- Actions ----------
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $ajax = !empty($_POST['ajax']);
    if (!csrf_ok()) {
        repondre($ajax, false, 'Session expirée : rechargez la page.');
    }
    $a = (string) ($_POST['a'] ?? '');
    if ($a === 'nouveau') {
        $nom = clean($_POST['entreprise'] ?? '', 120);
        if ($nom === '') {
            repondre(false, false, 'Indiquez le nom de l’entreprise.');
        }
        $c = client_nouveau($nom, (string) ($_POST['pack'] ?? 'starter'));
        client_enregistrer($c);
        header('Location: ?p=client&id=' . $c['id']);
        exit;
    }
    if ($a === 'acces') {
        $acces = atelier_acces();
        $mdp = (string) ($_POST['mdp'] ?? '');
        if ($mdp !== '') {
            if (mb_strlen($mdp) < 10 || $mdp !== (string) ($_POST['mdp2'] ?? '')) {
                repondre(false, false, 'Le mot de passe doit faire au moins 10 caractères, et les deux saisies doivent être identiques.', '?p=reglages');
            }
            $acces['hash'] = password_hash($mdp, PASSWORD_DEFAULT);
        }
        $cle = trim((string) ($_POST['cle'] ?? ''));
        if ($cle !== '') {
            $acces['cle'] = $cle;
        }
        if (!empty($_POST['oublier_cle'])) {
            unset($acces['cle']);
        }
        acces_enregistrer($acces);
        repondre(false, true, 'Réglages enregistrés.', '?p=reglages');
    }
    $c = client_charger((string) ($_POST['id'] ?? ''));
    if (!$c) {
        repondre($ajax, false, 'Dossier introuvable.');
    }
    $retour = '?p=client&id=' . $c['id'];
    switch ($a) {
        case 'brief':
            foreach (ATELIER_BRIEF as $k => [, $type]) {
                if (isset($_POST[$k])) {
                    $c['brief'][$k] = $type === 'number' ? (string) (float) str_replace([' ', ','], ['', '.'], (string) $_POST[$k]) : clean($_POST[$k], $type === 'text' ? 3000 : 200);
                    if ($type === 'number' && trim((string) $_POST[$k]) === '') {
                        $c['brief'][$k] = '';
                    }
                }
            }
            journal($c, 'Brief mis à jour');
            $flash = 'Brief enregistré.';
            break;
        case 'reglages':
            $etape = (string) ($_POST['etape'] ?? $c['etape']);
            if (isset(ATELIER_ETAPES[$etape]) && $etape !== $c['etape']) {
                journal($c, 'Étape : ' . ATELIER_ETAPES[$c['etape']] . ' → ' . ATELIER_ETAPES[$etape]);
                $c['etape'] = $etape;
                if ($etape === 'en_ligne' && empty($c['en_ligne'])) {
                    $c['en_ligne'] = date('Y-m-d');
                }
            }
            $pack = (string) ($_POST['pack'] ?? $c['pack']);
            if (isset(ATELIER_PACKS[$pack])) {
                $c['pack'] = $pack;
            }
            $c['engagement'] = in_array((int) ($_POST['engagement'] ?? 0), [6, 12, 24], true) ? (int) $_POST['engagement'] : $c['engagement'];
            $c['options'] = array_values(array_intersect((array) ($_POST['options'] ?? []), array_keys(ATELIER_SERVICES)));
            $flash = 'Réglages enregistrés.';
            break;
        case 'roi':
            $c['roi'] = [];
            foreach (['panier', 'marge', 'heures_mois', 'valeur_heure', 'prudent', 'cible', 'agents'] as $k) {
                $v = trim(str_replace([' ', ','], ['', '.'], (string) ($_POST[$k] ?? '')));
                if ($v !== '' && is_numeric($v)) {
                    $c['roi'][$k] = (float) $v;
                }
            }
            $retour = '?p=proposition&id=' . $c['id'];
            break;
        case 'generer':
            $type = (string) ($_POST['type'] ?? '');
            $extra = [];
            $mois = preg_match('/^\d{4}-\d{2}$/', (string) ($_POST['mois'] ?? '')) ? $_POST['mois'] : date('Y-m');
            if ($type === 'diagnostic' && trim((string) ($_POST['digital_score'] ?? '')) !== '') {
                $extra['resultat_digital_score'] = clean($_POST['digital_score'], 6000);
            }
            if ($type === 'formation') {
                $extra['duree'] = in_array($c['pack'], ['growth', 'enterprise'], true) ? 'une journée' : 'une demi-journée';
            }
            if ($type === 'cahier_des_charges') {
                $besoins = array_map(fn($k) => ATELIER_SERVICES[$k][0], array_intersect($c['options'] ?? [], ['cadrage', 'outil', 'crm', 'dashboard']));
                $extra['besoin'] = $besoins ? implode(' ; ', $besoins) : ATELIER_PACKS[$c['pack']]['contenu'][0];
            }
            if ($type === 'calendrier') {
                $pack = ATELIER_PACKS[$c['pack']];
                $extra = ['mois' => mois_fr($mois), 'nombre_de_publications' => max(4, $pack['publications']), 'reseaux' => ($c['brief']['reseaux'] ?? '') ?: ($pack['reseaux'] > 1 ? 'Facebook et Instagram' : 'Facebook')];
            }
            if ($type === 'rapport') {
                $mes = [];
                foreach (MESURES as $k => $label) {
                    $v = trim(str_replace([' ', ','], ['', '.'], (string) ($_POST['m_' . $k] ?? '')));
                    if ($v !== '' && is_numeric($v)) {
                        $mes[$k] = (float) $v;
                    }
                }
                $c['rapports'][$mois]['mesures'] = $mes;
                $prec = date('Y-m', strtotime($mois . '-01 -1 month'));
                $extra = ['mois' => mois_fr($mois), 'mesures_du_mois' => mesures_lisibles($mes), 'mesures_du_mois_precedent' => mesures_lisibles($c['rapports'][$prec]['mesures'] ?? [])];
                if (!$mes) {
                    repondre($ajax, false, 'Saisissez au moins une mesure du mois.', $retour);
                }
            }
            $r = ia_generer($type, $c, $extra);
            if (!$r['ok']) {
                repondre($ajax, false, $r['erreur'], $retour);
            }
            $data = $r['data'];
            if ($type === 'calendrier') {
                $data['_attendu'] = $extra['nombre_de_publications'];
            }
            $liv = ['statut' => 'brouillon', 'data' => $data, 'genere' => date('c'), 'source' => 'ia', 'qc' => controle_qualite($type, $data, $c['brief'])];
            if ($type === 'calendrier') {
                $c['calendriers'][$mois] = $liv;
            } elseif ($type === 'rapport') {
                $c['rapports'][$mois] = $liv + ['mesures' => $c['rapports'][$mois]['mesures']];
            } else {
                $c['livrables'][$type] = $liv;
            }
            journal($c, 'Généré par l’IA : ' . ATELIER_LIVRABLES[$type][0] . (in_array($type, ['calendrier', 'rapport'], true) ? ' (' . mois_fr($mois) . ')' : ''));
            if ($type === 'diagnostic' && $c['etape'] === 'contact') {
                $c['etape'] = 'diagnostic';
            }
            client_enregistrer($c);
            repondre($ajax, true, 'Livrable généré : relisez-le puis validez-le.', $retour . '#' . $type);
            // no break
        case 'valider':
        case 'devalider':
        case 'modifier':
            $ref = &livrable_ref($c, (string) ($_POST['cible'] ?? ''));
            if ($ref === null) {
                repondre($ajax, false, 'Livrable introuvable.', $retour);
            }
            [$kind, $type] = cible_type((string) $_POST['cible']);
            if ($a === 'modifier') {
                $data = json_decode((string) ($_POST['json'] ?? ''), true);
                if (!is_array($data)) {
                    repondre($ajax, false, 'Le texte modifié n’est pas un JSON valide : rien n’a été enregistré.', $retour);
                }
                $ref['data'] = $data;
                $ref['source'] = 'ia+retouche';
                $ref['statut'] = 'brouillon';
                $ref['qc'] = controle_qualite($type, $data, $c['brief']);
                journal($c, 'Retouché à la main : ' . ATELIER_LIVRABLES[$type][0]);
            } elseif ($a === 'valider') {
                if (livrable_bloque($ref)) {
                    repondre($ajax, false, 'Corrigez d’abord les points bloquants du contrôle qualité.', $retour);
                }
                $ref['statut'] = 'valide';
                $ref['valide'] = date('c');
                journal($c, 'Validé : ' . ATELIER_LIVRABLES[$type][0]);
            } else {
                $ref['statut'] = 'brouillon';
                journal($c, 'Remis en brouillon : ' . ATELIER_LIVRABLES[$type][0]);
            }
            unset($ref);
            $retour .= '#' . $type;
            break;
        case 'publier':
            $type = ($_POST['cible'] ?? '') === 'liv:site' ? 'site' : 'page';
            $l = $c['livrables'][$type] ?? null;
            if (!$l || $l['statut'] !== 'valide') {
                repondre(false, false, 'Validez d’abord le livrable avant de le publier.', $retour);
            }
            $dir = __DIR__ . '/../vitrines/' . $c['slug'];
            if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
                repondre(false, false, 'Impossible de créer le dossier vitrines/ sur l’hébergement.', $retour);
            }
            $fichiers = $type === 'site' ? site_pages($c, $l['data']) : ['index.html' => vitrine_html($c, $l['data'])];
            foreach ($fichiers as $nom => $html) {
                file_put_contents($dir . '/' . basename($nom), $html);
            }
            $c['vitrine'] = 'vitrines/' . $c['slug'] . '/';
            journal($c, ($type === 'site' ? 'Site publié (' . count($fichiers) . ' pages) : ' : 'Page publiée : ') . $c['vitrine']);
            $flash = $type === 'site' ? 'Site publié.' : 'Page publiée.';
            $retour .= '#' . $type;
            break;
        case 'note':
            $n = clean($_POST['note'] ?? '', 600);
            if ($n !== '') {
                journal($c, 'Note : ' . $n);
            }
            break;
        default:
            repondre($ajax, false, 'Action inconnue.', $retour);
    }
    client_enregistrer($c);
    repondre($ajax, true, $flash, $retour);
}

// ---------- Pages ----------
switch ($p) {
    case 'client':
        $c = client_charger((string) ($_GET['id'] ?? '')) ?? introuvable();
        page_client($c);
        break;
    case 'proposition':
        $c = client_charger((string) ($_GET['id'] ?? '')) ?? introuvable();
        page_proposition($c);
        break;
    case 'rapport':
        $c = client_charger((string) ($_GET['id'] ?? '')) ?? introuvable();
        page_rapport($c, (string) ($_GET['m'] ?? ''));
        break;
    case 'apercu':
        $c = client_charger((string) ($_GET['id'] ?? '')) ?? introuvable();
        header('Content-Security-Policy: sandbox allow-popups');
        if (($_GET['t'] ?? '') === 'site' && !empty($c['livrables']['site'])) {
            $pages = site_pages($c, $c['livrables']['site']['data']);
            $f = (string) ($_GET['f'] ?? 'index.html');
            $html = $pages[$f] ?? reset($pages);
            // les liens du menu restent dans l'aperçu
            echo preg_replace('/href="([a-z0-9-]+\.html)"/', 'href="?p=apercu&amp;id=' . $c['id'] . '&amp;t=site&amp;f=$1"', (string) $html);
        } elseif (!empty($c['livrables']['page'])) {
            echo vitrine_html($c, $c['livrables']['page']['data']);
        } else {
            introuvable();
        }
        break;
    case 'doc':
        $c = client_charger((string) ($_GET['id'] ?? '')) ?? introuvable();
        page_doc($c, (string) ($_GET['cible'] ?? ''));
        break;
    case 'export':
        $c = client_charger((string) ($_GET['id'] ?? '')) ?? introuvable();
        exporter($c, (string) ($_GET['cible'] ?? ''));
        break;
    case 'offres':
        page_offres();
        break;
    case 'reglages':
        page_reglages();
        break;
    default:
        page_tableau();
}

// =========================================================
// Fonctions des pages
// =========================================================

function repondre(bool $ajax, bool $ok, string $msg, string $retour = './'): void
{
    if ($ajax) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $_SESSION['flash'] = [$ok, $msg];
    header('Location: ' . $retour);
    exit;
}

function introuvable(): void
{
    http_response_code(404);
    page_debut('Introuvable');
    echo '<p>Ce dossier n’existe pas. <a href="./">Retour au tableau de bord</a></p>';
    page_fin();
    exit;
}

function cible_type(string $cible): array
{
    if (preg_match('/^(cal|rap):\d{4}-\d{2}$/', $cible)) {
        return [substr($cible, 0, 3), substr($cible, 0, 3) === 'cal' ? 'calendrier' : 'rapport'];
    }
    return ['liv', substr($cible, 4)];
}

/** Référence vers un livrable : liv:page, cal:2026-11, rap:2026-10. */
function &livrable_ref(array &$c, string $cible)
{
    $nul = null;
    if (preg_match('/^liv:([a-z_]+)$/', $cible, $m) && isset($c['livrables'][$m[1]])) {
        return $c['livrables'][$m[1]];
    }
    if (preg_match('/^cal:(\d{4}-\d{2})$/', $cible, $m) && isset($c['calendriers'][$m[1]]['data'])) {
        return $c['calendriers'][$m[1]];
    }
    if (preg_match('/^rap:(\d{4}-\d{2})$/', $cible, $m) && isset($c['rapports'][$m[1]]['data'])) {
        return $c['rapports'][$m[1]];
    }
    return $nul;
}

function mesures_lisibles(array $m): array
{
    $out = [];
    foreach ($m as $k => $v) {
        $out[MESURES[$k] ?? $k] = $v;
    }
    return $out;
}

function page_debut(string $titre, bool $nav = true, string $classe = ''): void
{
    $f = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    echo '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">'
        . '<title>' . h($titre) . ' · Atelier NEAM</title><link rel="icon" href="../assets/favicon.svg">'
        . '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">'
        . '<link rel="stylesheet" href="atelier.css"></head><body class="' . h($classe) . '">';
    if ($nav) {
        echo '<header class="top"><a href="./" class="logo"><img src="../assets/logo-light.png" alt="NEAM"><span>Atelier</span></a><nav><a href="./">Tableau de bord</a><a href="?p=offres">Offres et tarifs</a><a href="?p=reglages">Réglages</a><a href="?p=sortir">Se déconnecter</a></nav></header>';
    }
    echo '<main class="wrap">';
    if ($f && $f[1] !== '') {
        echo '<p class="' . ($f[0] ? 'ok' : 'alerte') . '">' . h($f[1]) . '</p>';
    }
}

function page_fin(): void
{
    echo '</main><script src="atelier.js" defer></script></body></html>';
}

function badge(string $statut): string
{
    $l = ['brouillon' => 'À valider', 'valide' => 'Validé'][$statut] ?? $statut;
    return '<span class="badge badge--' . h($statut) . '">' . h($l) . '</span>';
}

function mensuel_client(array $c): float
{
    $d = atelier_devis($c['pack'], (int) $c['engagement'], $c['options'] ?? []);
    return $d['mensuel'];
}

/** Tous les livrables d'un dossier, à plat : [cible, type, libellé, livrable]. */
function livrables_plats(array $c): array
{
    $out = [];
    foreach ($c['livrables'] ?? [] as $t => $l) {
        $out[] = ['liv:' . $t, $t, ATELIER_LIVRABLES[$t][0], $l];
    }
    foreach ($c['calendriers'] ?? [] as $m => $l) {
        $out[] = ['cal:' . $m, 'calendrier', 'Calendrier ' . mois_fr($m), $l];
    }
    foreach ($c['rapports'] ?? [] as $m => $l) {
        if (isset($l['data'])) {
            $out[] = ['rap:' . $m, 'rapport', 'Rapport ' . mois_fr($m), $l];
        }
    }
    return $out;
}

function page_tableau(): void
{
    $clients = clients_tous();
    $actifs = array_filter($clients, fn($c) => in_array($c['etape'], ['en_ligne', 'suivi'], true));
    $mrr = array_sum(array_map('mensuel_client', $actifs));
    $pipe = array_sum(array_map(fn($c) => atelier_devis($c['pack'], (int) $c['engagement'], $c['options'] ?? [])['total_engagement'], array_filter($clients, fn($c) => $c['etape'] === 'proposition')));
    $tous = array_merge(...array_map('livrables_plats', $clients ?: [[]]));
    $aValider = count(array_filter($tous, fn($x) => ($x[3]['statut'] ?? '') === 'brouillon'));
    $ia = count(array_filter($tous, fn($x) => str_starts_with($x[3]['source'] ?? '', 'ia')));
    $part = $tous ? round(100 * $ia / count($tous)) : null;
    $parEtape = array_count_values(array_column($clients, 'etape'));

    page_debut('Tableau de bord');
    echo '<div class="tete"><h1>Tableau de bord</h1><form method="post" class="inline">' . csrf_champ() . '<input type="hidden" name="a" value="nouveau"><input name="entreprise" placeholder="Nom de l’entreprise" required><select name="pack">' . options_packs('starter') . '</select><button class="btn">Nouveau client</button></form></div>';
    echo '<div class="kpis">'
        . kpi('Clients actifs', (string) count($actifs))
        . kpi('Revenu mensuel récurrent', fcfa($mrr))
        . kpi('Propositions en cours', fcfa($pipe), 'sur la durée d’engagement')
        . kpi('Livrables à valider', (string) $aValider)
        . kpi('Produits par l’IA', $part === null ? '–' : $part . "\u{00A0}%", 'objectif : 75 % ou plus')
        . '</div>';
    echo '<div class="etapes">';
    foreach (ATELIER_ETAPES as $k => $l) {
        if ($k !== 'perdu') {
            echo '<div><b>' . (int) ($parEtape[$k] ?? 0) . '</b><span>' . h($l) . '</span></div>';
        }
    }
    echo '</div>';
    if (!$clients) {
        echo '<p class="vide">Aucun client pour l’instant. Créez le premier dossier ci-dessus, puis envoyez-lui le lien de son brief.</p>';
    } else {
        echo '<table class="tab"><thead><tr><th>Client</th><th>Offre</th><th>Étape</th><th>Prochaine action</th><th>Mensuel</th></tr></thead><tbody>';
        foreach ($clients as $c) {
            echo '<tr><td><a href="?p=client&id=' . h($c['id']) . '"><b>' . h($c['brief']['entreprise'] ?? '') . '</b></a><br><small>' . h($c['brief']['secteur'] ?? '') . '</small></td><td>' . h(ATELIER_PACKS[$c['pack']]['nom']) . '</td><td>' . h(ATELIER_ETAPES[$c['etape']]) . '</td><td>' . h(prochaine_action($c)) . '</td><td>' . fcfa(mensuel_client($c)) . '</td></tr>';
        }
        echo '</tbody></table>';
    }
    page_fin();
}

function kpi(string $label, string $val, string $note = ''): string
{
    return '<div class="kpi"><span>' . h($label) . '</span><b>' . h($val) . '</b>' . ($note ? '<small>' . h($note) . '</small>' : '') . '</div>';
}

function options_packs(string $sel): string
{
    $o = '';
    foreach (ATELIER_PACKS as $k => $p) {
        $o .= '<option value="' . $k . '"' . ($k === $sel ? ' selected' : '') . '>' . h($p['nom']) . '</option>';
    }
    return $o;
}

function lien_brief(array $c): string
{
    $https = (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $base = ($https ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'www.neamindustry.com') . rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/atelier/index.php'), '/');
    return $base . '/brief.php?t=' . $c['jeton'];
}

function page_client(array $c): void
{
    $id = h($c['id']);
    $b = $c['brief'];
    $pack = ATELIER_PACKS[$c['pack']];
    page_debut($b['entreprise'] ?? 'Client');
    echo '<div class="tete"><div><a href="./" class="retour">← Tableau de bord</a><h1>' . h($b['entreprise'] ?? '') . '</h1><p class="sous">' . h($pack['nom']) . ' · ' . h(ATELIER_ETAPES[$c['etape']]) . ' · Prochaine action : <b>' . h(prochaine_action($c)) . '</b></p></div>'
        . '<div class="actions"><a class="btn btn--ghost" href="?p=proposition&id=' . $id . '">Proposition et ROI</a></div></div>';

    // Parcours
    echo '<ol class="parcours">';
    $ordre = array_keys(ATELIER_ETAPES);
    $i = array_search($c['etape'], $ordre, true);
    foreach (ATELIER_ETAPES as $k => $l) {
        if ($k === 'perdu') {
            continue;
        }
        $j = array_search($k, $ordre, true);
        echo '<li class="' . ($j < $i && $c['etape'] !== 'perdu' ? 'fait' : ($k === $c['etape'] ? 'ici' : '')) . '">' . h($l) . '</li>';
    }
    echo '</ol>';

    echo '<div class="grille"><section class="bloc">';
    // Livrables
    echo '<h2>Livrables</h2><p class="aide">L’IA produit, le contrôle qualité vérifie, un expert valide. Rien n’est livré au client sans validation.</p>';
    $liste = livrables_client($c);
    $manquants = array_values(array_filter($liste, fn($t) => !in_array($t, ['calendrier', 'rapport'], true) && empty($c['livrables'][$t])));
    if ($manquants && !empty($b['description'])) {
        echo '<button class="btn" data-tout="' . h(implode(',', $manquants)) . '" data-id="' . $id . '" data-csrf="' . h($_SESSION['csrf']) . '">Tout générer (' . count($manquants) . ' livrables)</button><p class="progression" hidden></p>';
    } elseif (empty($b['description'])) {
        echo '<p class="alerte">Complétez le brief (au moins « Ce que fait l’entreprise ») avant de générer les livrables.</p>';
    }
    foreach (ATELIER_EXPERTISES as $exp) {
        $ts = array_filter($liste, fn($t) => ATELIER_LIVRABLES[$t][2] === $exp && !in_array($t, ['calendrier', 'rapport'], true));
        if ($ts) {
            echo '<h3 class="expertise">' . h($exp) . '</h3>';
        }
        foreach ($ts as $t) {
            bloc_livrable($c, 'liv:' . $t, $t, ATELIER_LIVRABLES[$t][0], $c['livrables'][$t] ?? null);
        }
    }

    // Calendriers
    if (in_array('calendrier', $liste, true)) {
        echo '<h2 id="calendrier">Calendriers éditoriaux</h2>';
        echo '<form method="post" class="inline">' . csrf_champ() . '<input type="hidden" name="a" value="generer"><input type="hidden" name="type" value="calendrier"><input type="hidden" name="id" value="' . $id . '"><input type="month" name="mois" value="' . date('Y-m', strtotime('first day of next month')) . '"><button class="btn btn--ghost" data-attente>Générer ' . max(8, (int) $pack['publications']) . ' publications</button></form>';
        foreach (array_reverse($c['calendriers'] ?? [], true) as $m => $l) {
            bloc_livrable($c, 'cal:' . $m, 'calendrier', 'Calendrier ' . mois_fr($m), $l);
        }
    }

    // Rapports
    echo '<h2 id="rapport">Rapports mensuels</h2>';
    $mois = date('Y-m', strtotime('first day of last month'));
    $prev = $c['rapports'][$mois]['mesures'] ?? [];
    echo '<form method="post" class="mesures">' . csrf_champ() . '<input type="hidden" name="a" value="generer"><input type="hidden" name="type" value="rapport"><input type="hidden" name="id" value="' . $id . '"><label>Mois<input type="month" name="mois" value="' . $mois . '"></label>';
    foreach (MESURES as $k => $l) {
        echo '<label>' . h($l) . '<input name="m_' . $k . '" inputmode="decimal" value="' . h($prev[$k] ?? '') . '"></label>';
    }
    echo '<button class="btn btn--ghost" data-attente>Générer le rapport</button></form>';
    foreach (array_reverse($c['rapports'] ?? [], true) as $m => $l) {
        if (isset($l['data'])) {
            bloc_livrable($c, 'rap:' . $m, 'rapport', 'Rapport ' . mois_fr($m), $l);
        }
    }
    echo '</section><aside>';

    // Réglages
    echo '<div class="bloc"><h3>Réglages</h3><form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="reglages"><input type="hidden" name="id" value="' . $id . '">'
        . '<label>Étape<select name="etape">';
    foreach (ATELIER_ETAPES as $k => $l) {
        echo '<option value="' . $k . '"' . ($k === $c['etape'] ? ' selected' : '') . '>' . h($l) . '</option>';
    }
    echo '</select></label><label>Offre<select name="pack">' . options_packs($c['pack']) . '</select></label><label>Engagement<select name="engagement">';
    foreach ([6, 12, 24] as $e) {
        echo '<option value="' . $e . '"' . ($e === (int) $c['engagement'] ? ' selected' : '') . '>' . $e . ' mois' . ($e === 24 ? ' (−10 %)' : '') . '</option>';
    }
    echo '</select></label><details><summary>Options à l’unité</summary>';
    foreach (ATELIER_SERVICES as $k => [$nom, $prix, $type]) {
        echo '<label class="case"><input type="checkbox" name="options[]" value="' . $k . '"' . (in_array($k, $c['options'] ?? [], true) ? ' checked' : '') . '> ' . h($nom) . ' <small>' . fcfa($prix) . ($type === 'mensuel' ? '/mois' : '') . '</small></label>';
    }
    echo '</details><button class="btn btn--ghost">Enregistrer</button></form></div>';

    // Lien du brief
    echo '<div class="bloc"><h3>Brief du client</h3><p class="aide">Envoyez ce lien au client : il remplit lui-même son brief, sans compte.</p><input class="copie-lien" readonly value="' . h(lien_brief($c)) . '">'
        . (!empty($b['whatsapp']) ? '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' . h(wa_num($b['whatsapp'])) . '?text=' . rawurlencode('Bonjour, voici le formulaire pour préparer votre diagnostic NEAM (5 minutes) : ' . lien_brief($c)) . '">Envoyer par WhatsApp</a>' : '')
        . '<details' . (empty($b['description']) ? ' open' : '') . '><summary>Voir et modifier le brief</summary><form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="brief"><input type="hidden" name="id" value="' . $id . '">';
    foreach (ATELIER_BRIEF as $k => [$l, $type, $aide]) {
        $v = h($b[$k] ?? '');
        echo '<label>' . h($l) . ($type === 'text' ? '<textarea name="' . $k . '" rows="3" placeholder="' . h($aide) . '">' . $v . '</textarea>' : '<input name="' . $k . '" value="' . $v . '" placeholder="' . h($aide) . '"' . ($type === 'number' ? ' inputmode="decimal"' : '') . '>') . '</label>';
    }
    echo '<button class="btn btn--ghost">Enregistrer le brief</button></form></details></div>';

    // Diagnostic : Digital Score
    echo '<div class="bloc"><h3>Diagnostic</h3><form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="generer"><input type="hidden" name="type" value="diagnostic"><input type="hidden" name="id" value="' . $id . '"><label>Résultat du Digital Score (facultatif, à coller)<textarea name="digital_score" rows="3"></textarea></label><button class="btn btn--ghost" data-attente>' . (empty($c['livrables']['diagnostic']) ? 'Générer le diagnostic' : 'Refaire le diagnostic') . '</button></form></div>';

    // Page publiée
    if (!empty($c['vitrine'])) {
        echo '<div class="bloc"><h3>Page en ligne</h3><a href="../' . h($c['vitrine']) . '" target="_blank" rel="noopener">' . h($c['vitrine']) . '</a></div>';
    }

    // Journal
    echo '<div class="bloc"><h3>Journal</h3><form method="post" class="inline">' . csrf_champ() . '<input type="hidden" name="a" value="note"><input type="hidden" name="id" value="' . $id . '"><input name="note" placeholder="Ajouter une note (appel, décision…)"><button class="btn btn--ghost">+</button></form><ul class="journal">';
    foreach (array_slice($c['journal'], 0, 25) as $j) {
        echo '<li><small>' . h(date_fr($j['t'])) . '</small> ' . h($j['msg']) . '</li>';
    }
    echo '</ul></div></aside></div>';
    page_fin();
}

function bloc_livrable(array $c, string $cible, string $type, string $titre, ?array $l): void
{
    $id = h($c['id']);
    $ancre = $type === 'calendrier' || $type === 'rapport' ? '' : ' id="' . h($type) . '"';
    echo '<article class="livrable"' . $ancre . '><div class="livrable__tete"><h3>' . h($titre) . '</h3>' . ($l ? badge($l['statut']) : '<span class="badge">À produire</span>') . '</div>';
    if (!$l) {
        echo '<p class="aide">' . h(ATELIER_LIVRABLES[$type][1]) . '</p>';
        if ($type !== 'diagnostic') {
            echo '<form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="generer"><input type="hidden" name="type" value="' . h($type) . '"><input type="hidden" name="id" value="' . $id . '"><button class="btn btn--ghost" data-attente>Générer</button></form>';
        }
        echo '</article>';
        return;
    }
    foreach ($l['qc'] ?? [] as [$niveau, $msg]) {
        echo '<p class="qc qc--' . h($niveau) . '">' . ($niveau === 'bloquant' ? 'Bloquant : ' : 'À vérifier : ') . h($msg) . '</p>';
    }
    if (!$l['qc']) {
        echo '<p class="qc qc--ok">Contrôle qualité automatique : aucun problème détecté.</p>';
    }
    echo '<details' . ($l['statut'] === 'brouillon' ? ' open' : '') . '><summary>Voir le contenu <small>· généré le ' . h(date_fr($l['genere'])) . ($l['source'] === 'ia+retouche' ? ', retouché' : '') . '</small></summary><div class="contenu">' . rendu_livrable($type, $l['data']) . '</div></details>';
    $f = fn(string $a, string $label, string $cls = 'btn btn--ghost') => '<form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="' . $a . '"><input type="hidden" name="id" value="' . $id . '"><input type="hidden" name="cible" value="' . h($cible) . '"><button class="' . $cls . '">' . $label . '</button></form>';
    echo '<div class="livrable__actions">';
    echo $l['statut'] === 'valide' ? $f('devalider', 'Remettre en brouillon') : $f('valider', 'Valider', 'btn');
    $exports = ['calendrier' => 'Exporter (CSV)', 'page' => 'Télécharger la page', 'site' => 'Télécharger le site (ZIP)', 'boutique' => 'Catalogue (CSV)'];
    if ($type !== 'diagnostic' && $type !== 'rapport') {
        echo '<a class="btn btn--ghost" href="?p=export&id=' . $id . '&cible=' . h($cible) . '">' . ($exports[$type] ?? 'Exporter (texte)') . '</a>';
    }
    if (in_array($type, ['feuille_de_route', 'cahier_des_charges', 'formation', 'charte', 'workflows', 'assistant_ia', 'boutique', 'diagnostic'], true)) {
        echo '<a class="btn btn--ghost" target="_blank" href="?p=doc&id=' . $id . '&cible=' . h($cible) . '">Version à imprimer</a>';
    }
    if ($type === 'page' || $type === 'site') {
        echo '<a class="btn btn--ghost" target="_blank" href="?p=apercu&id=' . $id . ($type === 'site' ? '&t=site' : '') . '">Aperçu</a>';
        if ($l['statut'] === 'valide') {
            echo $f('publier', empty($c['vitrine']) ? 'Publier en ligne' : 'Republier');
        }
    }
    if ($type === 'rapport') {
        echo '<a class="btn btn--ghost" target="_blank" href="?p=rapport&id=' . $id . '&m=' . h(substr($cible, 4)) . '">Version à imprimer</a>';
    }
    if ($type === 'diagnostic') {
        echo '<a class="btn btn--ghost" href="?p=proposition&id=' . $id . '">Proposition et ROI</a>';
    }
    if (!in_array($type, ['calendrier', 'rapport', 'diagnostic'], true)) {
        echo '<form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="generer"><input type="hidden" name="type" value="' . h($type) . '"><input type="hidden" name="id" value="' . $id . '"><button class="btn btn--ghost" data-attente data-confirm="Remplacer ce livrable par une nouvelle version ?">Regénérer</button></form>';
    }
    echo '</div><details class="edition"><summary>Retoucher à la main</summary><form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="modifier"><input type="hidden" name="id" value="' . $id . '"><input type="hidden" name="cible" value="' . h($cible) . '"><textarea name="json" rows="14" spellcheck="true">' . h(json_encode($l['data'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) . '</textarea><p class="aide">Modifiez seulement les textes entre guillemets. Le contrôle qualité est refait à l’enregistrement.</p><button class="btn btn--ghost">Enregistrer la retouche</button></form></details></article>';
}

function exporter(array $c, string $cible): void
{
    $l = livrable_ref($c, $cible);
    if (!$l) {
        introuvable();
    }
    [, $type] = cible_type($cible);
    $nom = $c['slug'] . '-' . str_replace('_', '-', $type) . (preg_match('/^(cal|rap):(\d{4}-\d{2})$/', $cible, $m) ? '-' . $m[2] : '');
    if ($type === 'calendrier') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $nom . '.csv"');
        echo calendrier_csv($l['data']);
    } elseif ($type === 'boutique') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $nom . '-produits.csv"');
        echo boutique_csv($l['data']);
    } elseif ($type === 'site' && class_exists('ZipArchive')) {
        $tmp = tempnam(sys_get_temp_dir(), 'site');
        $zip = new ZipArchive();
        $zip->open($tmp, ZipArchive::OVERWRITE);
        foreach (site_pages($c, $l['data']) as $f => $html) {
            $zip->addFromString($f, $html);
        }
        $zip->close();
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $nom . '.zip"');
        readfile($tmp);
        @unlink($tmp);
    } elseif ($type === 'page') {
        header('Content-Type: text/html; charset=utf-8');
        header('Content-Disposition: attachment; filename="index.html"');
        echo vitrine_html($c, $l['data']);
    } else {
        header('Content-Type: text/plain; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $nom . '.txt"');
        echo export_texte($type, $l['data'], $c);
    }
    exit;
}

function page_proposition(array $c): void
{
    $b = $c['brief'];
    $pack = ATELIER_PACKS[$c['pack']];
    $devis = atelier_devis($c['pack'], (int) $c['engagement'], $c['options'] ?? []);
    $h = atelier_hypotheses($c['pack'], $b, $c['roi'] ?? []);
    $roi = atelier_roi($c['pack'], $devis, $h);
    $diag = $c['livrables']['diagnostic'] ?? null;
    page_debut('Proposition · ' . ($b['entreprise'] ?? ''), true, 'imprimable');

    // Hypothèses modifiables (non imprimées)
    echo '<form method="post" class="ecran roi-form">' . csrf_champ() . '<input type="hidden" name="a" value="roi"><input type="hidden" name="id" value="' . h($c['id']) . '"><b>Hypothèses du ROI</b>';
    $champs = $h['unite'] === 'heures'
        ? ['agents' => 'Agents concernés', 'prudent' => 'Heures gagnées / agent / semaine (prudent)', 'cible' => 'Idem (cible)', 'valeur_heure' => 'Valeur d’une heure (FCFA)']
        : ['panier' => 'Panier moyen (FCFA)', 'marge' => 'Marge (%)', 'heures_mois' => 'Heures gagnées / mois', 'valeur_heure' => 'Valeur d’une heure (FCFA)', 'prudent' => ucfirst($h['unite']) . ' en plus / mois (prudent)', 'cible' => 'Idem (cible)'];
    foreach ($champs as $k => $l) {
        echo '<label>' . h($l) . '<input name="' . $k . '" inputmode="decimal" value="' . h((string) ($h[$k] ?? '')) . '"></label>';
    }
    echo '<button class="btn btn--ghost">Recalculer</button><button type="button" class="btn" onclick="print()">Imprimer ou enregistrer en PDF</button><a class="retour" href="?p=client&id=' . h($c['id']) . '">← Retour au dossier</a></form>';

    echo '<article class="doc"><header class="doc__tete"><img src="../assets/logo-light.png" alt="NEAM Softwares Industry"><div><b>Proposition commerciale</b><span>' . date('d/m/Y') . ' · valable 30 jours</span></div></header>';
    echo '<h1>' . h($pack['nom']) . ' pour ' . h($b['entreprise'] ?? '') . '</h1>';
    if ($diag) {
        $d = $diag['data'];
        echo '<h2>Ce que nous avons compris</h2><p>' . para($d['synthese'] ?? '') . '</p><h3>Vos 3 priorités</h3><ol>';
        foreach ($d['priorites'] ?? [] as $x) {
            echo '<li><b>' . h($x['action']) . '</b> : ' . h($x['pourquoi']) . '</li>';
        }
        echo '</ol>';
    }
    echo '<h2>Ce que comprend l’offre</h2>' . ul($pack['contenu']);
    echo '<h2>Investissement</h2><table class="tab"><thead><tr><th>Poste</th><th>Montant HT</th></tr></thead><tbody>';
    foreach ($devis['lignes'] as [$nom, $prix, $type, $deduit]) {
        echo '<tr><td>' . h($nom) . '</td><td class="n">' . fcfa($prix) . ($type === 'mensuel' ? ' / mois' : '') . '</td></tr>';
    }
    echo '</tbody><tfoot><tr><td>À la commande et à la livraison</td><td class="n">' . fcfa($devis['unique']) . '</td></tr><tr><td>Chaque mois, pendant ' . (int) $devis['engagement'] . ' mois</td><td class="n">' . fcfa($devis['mensuel']) . '</td></tr><tr><td><b>Total sur l’engagement</b></td><td class="n"><b>' . fcfa($devis['total_engagement']) . '</b></td></tr></tfoot></table>';
    echo '<p class="petit">Mise en place payable 50 % à la commande et 50 % à la livraison (Growth et Enterprise : 40 % à la commande, 30 % à la recette, 30 % à la mise en service). Abonnement payable en début de mois, par virement ou Mobile Money. Montants hors taxes.</p>';

    echo '<h2>Votre retour sur investissement estimé</h2>';
    if (!$roi) {
        echo '<p class="alerte ecran">Renseignez le panier moyen et la marge du client pour calculer le ROI.</p>';
    } else {
        $u = $h['unite'];
        echo '<table class="tab"><thead><tr><th>Scénario</th><th>' . ($u === 'heures' ? 'Heures gagnées par agent et par semaine' : ucfirst($u) . ' en plus par mois') . '</th><th>Gain mensuel</th><th>ROI année 1</th><th>ROI année 2</th></tr></thead><tbody>';
        foreach (['point_mort' => 'Point mort (année 1)', 'prudent' => 'Prudent', 'cible' => 'Cible'] as $k => $l) {
            $s = $roi[$k];
            echo '<tr><td>' . $l . '</td><td class="n">' . h(number_format($s['n'], $s['n'] == floor($s['n']) ? 0 : 1, ',', ' ')) . '</td><td class="n">' . fcfa($s['gain_mensuel']) . '</td><td class="n">' . pct($s['an1_roi']) . '</td><td class="n">' . pct($s['an2_roi']) . '</td></tr>';
        }
        echo '</tbody></table><p class="petit">Hypothèses : ';
        echo $u === 'heures'
            ? (int) $h['agents'] . ' agents, heure valorisée à ' . fcfa($h['valeur_heure']) . ', gains comptés à partir du mois ' . (int) $h['debut_temps'] . '.'
            : 'panier moyen ' . fcfa($h['panier']) . ', marge ' . h((string) $h['marge']) . ' % (' . fcfa($h['marge_unitaire']) . ' par ' . ($u === 'ventes' ? 'vente' : 'client') . '), ' . (int) $h['heures_mois'] . ' h gagnées par mois valorisées à ' . fcfa($h['valeur_heure']) . ', temps gagné à partir du mois ' . (int) $h['debut_temps'] . ', nouvelles ventes à partir du mois ' . (int) $h['debut_ventes'] . '.';
        echo ' ROI = (gains − coût NEAM) / coût NEAM. Ce sont des estimations, pas une garantie de résultat : chaque mois, votre rapport compare les résultats réels à ces hypothèses.</p>';
    }
    echo '<h2>Les prochaines étapes</h2><ol><li>Vous validez la proposition (WhatsApp ou e-mail).</li><li>Mise en place : vous nous transmettez logo, photos et accès ; nous produisons, vous validez.</li><li>Mise en ligne et prise en main.</li><li>Suivi mensuel, avec un rapport chaque mois.</li></ol>';
    echo '<footer class="doc__pied">NEAM Softwares Industry · Libreville, Gabon · neamindustry.com · WhatsApp 077 45 31 67 · contact@neamindustry.com</footer></article>';
    page_fin();
}

function page_rapport(array $c, string $m): void
{
    $l = $c['rapports'][$m] ?? null;
    if (!$l || empty($l['data'])) {
        introuvable();
    }
    $prec = $c['rapports'][date('Y-m', strtotime($m . '-01 -1 month'))]['mesures'] ?? [];
    page_debut('Rapport ' . mois_fr($m), false, 'imprimable');
    echo '<p class="ecran"><button class="btn" onclick="print()">Imprimer ou enregistrer en PDF</button> <a class="retour" href="?p=client&id=' . h($c['id']) . '#rapport">← Retour au dossier</a></p>';
    if ($l['statut'] !== 'valide') {
        echo '<p class="alerte ecran">Ce rapport n’est pas encore validé.</p>';
    }
    echo '<article class="doc"><header class="doc__tete"><img src="../assets/logo-light.png" alt="NEAM Softwares Industry"><div><b>Rapport mensuel</b><span>' . h(mois_fr($m)) . '</span></div></header><h1>' . h($c['brief']['entreprise'] ?? '') . '</h1>';
    echo '<table class="tab"><thead><tr><th>Mesure</th><th>' . h(mois_fr($m)) . '</th><th>Mois précédent</th></tr></thead><tbody>';
    foreach ($l['mesures'] ?? [] as $k => $v) {
        $p = $prec[$k] ?? null;
        echo '<tr><td>' . h(MESURES[$k] ?? $k) . '</td><td class="n">' . h(number_format((float) $v, $v == floor((float) $v) ? 0 : 1, ',', ' ')) . '</td><td class="n">' . ($p === null ? '–' : h(number_format((float) $p, $p == floor((float) $p) ? 0 : 1, ',', ' '))) . '</td></tr>';
    }
    echo '</tbody></table>' . rendu_livrable('rapport', array_diff_key($l['data'], ['message_client' => 1]));
    echo '<footer class="doc__pied">NEAM Softwares Industry · neamindustry.com · WhatsApp 077 45 31 67</footer></article>';
    page_fin();
}

function page_offres(): void
{
    page_debut('Offres et tarifs');
    echo '<h1>Offres et tarifs</h1><p class="aide">Grille de référence de l’Atelier (FCFA hors taxes). Pour la modifier : <code>api/lib/atelier/offres.php</code>.</p><table class="tab"><thead><tr><th>Offre</th><th>Diagnostic</th><th>Mise en place</th><th>Mensuel</th><th>Engagement</th><th>Livrables produits par l’Atelier</th></tr></thead><tbody>';
    foreach (ATELIER_PACKS as $p) {
        echo '<tr><td><b>' . h($p['nom']) . '</b><br><small>' . h($p['cible']) . '</small></td><td class="n">' . ($p['diagnostic'] ? fcfa($p['diagnostic']) : 'Gratuit') . '</td><td class="n">' . ($p['a_partir_de'] ? 'dès ' : '') . fcfa($p['mise_en_place']) . '</td><td class="n">' . fcfa($p['mensuel']) . '</td><td>' . (int) $p['engagement'] . ' mois</td><td>' . h(implode(', ', array_map(fn($t) => ATELIER_LIVRABLES[$t][0], $p['livrables']))) . '</td></tr>';
    }
    echo '</tbody></table><p class="aide">Engagement de 24 mois : −10 % sur l’abonnement.</p><h2>Services à l’unité</h2><table class="tab"><tbody>';
    foreach (ATELIER_SERVICES as [$nom, $prix, $type, $livs]) {
        echo '<tr><td>' . h($nom) . '</td><td class="n">' . fcfa($prix) . ($type === 'mensuel' ? ' / mois' : '') . '</td><td>' . h(implode(', ', array_map(fn($t) => ATELIER_LIVRABLES[$t][0], $livs))) . '</td></tr>';
    }
    echo '</tbody></table>';
    page_fin();
}

function acces_enregistrer(array $acces): void
{
    atelier_dossier('');
    file_put_contents(ATELIER_DATA . '/acces.json', json_encode($acces), LOCK_EX);
    @chmod(ATELIER_DATA . '/acces.json', 0600);
}

/** Installation : 1) un code à 6 chiffres est envoyé aux adresses du site, 2) on choisit le mot de passe. */
function installation(): void
{
    $f = ATELIER_DATA . '/installation.json';
    $etat = is_file($f) ? (json_decode((string) file_get_contents($f), true) ?: []) : [];
    $dest = atelier_destinataires();
    $msg = '';
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && csrf_ok()) {
        if (($_POST['a'] ?? '') === 'code') {
            $envois = array_filter($etat['envois'] ?? [], fn($t) => $t > time() - 3600);
            if (count($envois) >= 3) {
                $msg = '<p class="alerte">Trois codes ont déjà été envoyés cette heure-ci. Utilisez le dernier reçu, ou réessayez plus tard.</p>';
            } else {
                $code = (string) random_int(100000, 999999);
                $envois[] = time();
                $etat = ['code' => password_hash($code, PASSWORD_DEFAULT), 'expire' => time() + 1800, 'essais' => 0, 'envois' => array_values($envois)];
                atelier_dossier('');
                file_put_contents($f, json_encode($etat), LOCK_EX);
                $ok = send_mail($dest, 'Votre code d’installation de l’Atelier NEAM : ' . $code,
                    email_layout('Installation de l’Atelier NEAM', '<p>Votre code d’installation :</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:12px 0">' . $code . '</p><p>Il est valable 30 minutes. Si vous n’avez pas demandé ce code, ignorez cet e-mail : personne ne peut ouvrir l’Atelier sans lui.</p>'),
                    "Votre code d'installation de l'Atelier NEAM : $code (valable 30 minutes).");
                $msg = $ok ? '<p class="ok">Code envoyé à ' . h(implode(', ', array_map('masquer_email', $dest))) . '. Pensez à regarder dans les spams.</p>' : '<p class="alerte">L’e-mail n’a pas pu partir. Vérifiez que le formulaire de contact du site fonctionne, puis réessayez.</p>';
            }
        } elseif (($_POST['a'] ?? '') === 'installer') {
            $mdp = (string) ($_POST['mdp'] ?? '');
            if (empty($etat['code']) || ($etat['expire'] ?? 0) < time() || ($etat['essais'] ?? 0) >= 5) {
                $msg = '<p class="alerte">Code expiré : demandez-en un nouveau.</p>';
            } elseif (!password_verify(preg_replace('/\D/', '', (string) ($_POST['code'] ?? '')), $etat['code'])) {
                $etat['essais'] = ($etat['essais'] ?? 0) + 1;
                file_put_contents($f, json_encode($etat), LOCK_EX);
                $msg = '<p class="alerte">Code incorrect.</p>';
            } elseif (mb_strlen($mdp) < 10 || $mdp !== (string) ($_POST['mdp2'] ?? '')) {
                $msg = '<p class="alerte">Le mot de passe doit faire au moins 10 caractères, et les deux saisies doivent être identiques.</p>';
            } else {
                $acces = ['hash' => password_hash($mdp, PASSWORD_DEFAULT), 'installe' => date('c')];
                $cle = trim((string) ($_POST['cle'] ?? ''));
                if ($cle !== '') {
                    $acces['cle'] = $cle;
                }
                acces_enregistrer($acces);
                @unlink($f);
                atelier_connexion($mdp);
                header('Location: ./');
                exit;
            }
        }
    }
    page_debut('Installation', false);
    echo '<div class="login"><h1>Installer l’Atelier</h1>' . $msg;
    if (!$dest) {
        echo '<p>Aucune adresse e-mail n’est réglée pour le site. Ajoutez votre adresse dans <code>api/config.php</code> (<code>contact_to</code>), puis rechargez cette page.</p></div>';
        page_fin();
        return;
    }
    echo '<p class="aide"><b>Étape 1.</b> Recevez un code de sécurité à ' . h(implode(', ', array_map('masquer_email', $dest))) . '.</p>'
        . '<form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="code"><button class="btn btn--ghost">Recevoir mon code par e-mail</button></form>'
        . '<p class="aide"><b>Étape 2.</b> Saisissez le code et choisissez votre mot de passe.</p>'
        . '<form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="installer">'
        . '<label>Code reçu par e-mail<input name="code" inputmode="numeric" autocomplete="one-time-code" required></label>'
        . '<label>Mot de passe (10 caractères minimum)<input type="password" name="mdp" autocomplete="new-password" minlength="10" required></label>'
        . '<label>Le même, une seconde fois<input type="password" name="mdp2" autocomplete="new-password" minlength="10" required></label>'
        . (ia_cle() === '' ? '<label>Clé Claude (facultatif, ajoutable plus tard)<input type="password" name="cle" autocomplete="off" placeholder="sk-ant-…"></label>' : '')
        . '<button class="btn">Ouvrir l’Atelier</button></form></div>';
    page_fin();
}

function page_reglages(): void
{
    global $CONFIG;
    $cfgCle = (string) (atelier_cfg('anthropic_api_key', '') ?: ($CONFIG['audit']['anthropic_api_key'] ?? ''));
    $cle = atelier_acces()['cle'] ?? '';
    page_debut('Réglages');
    echo '<h1>Réglages</h1><div class="bloc etroit"><form method="post">' . csrf_champ() . '<input type="hidden" name="a" value="acces">'
        . '<h3>Clé Claude</h3><p class="aide">Elle permet à l’Atelier de rédiger les livrables. Elle reste sur le serveur et n’est jamais réaffichée.</p>'
        . ($cfgCle !== '' ? '<p class="ok">Une clé est déjà réglée pour le site (Digital Score) : l’Atelier l’utilise.</p>' : ($cle !== '' ? '<p class="ok">Clé enregistrée (se termine par ' . h(substr($cle, -4)) . ').</p><label class="case"><input type="checkbox" name="oublier_cle" value="1"> Supprimer cette clé</label>' : '<p class="alerte">Aucune clé : les livrables ne peuvent pas encore être générés.</p>'))
        . ($cfgCle === '' ? '<label>Nouvelle clé<input type="password" name="cle" autocomplete="off" placeholder="sk-ant-…"></label>' : '')
        . '<h3>Changer le mot de passe</h3><label>Nouveau mot de passe<input type="password" name="mdp" autocomplete="new-password" minlength="10"></label><label>Le même, une seconde fois<input type="password" name="mdp2" autocomplete="new-password" minlength="10"></label>'
        . '<button class="btn">Enregistrer</button></form></div>';
    page_fin();
}

function page_doc(array $c, string $cible): void
{
    $l = livrable_ref($c, $cible);
    if (!$l) {
        introuvable();
    }
    [, $type] = cible_type($cible);
    page_debut(ATELIER_LIVRABLES[$type][0] . ' · ' . ($c['brief']['entreprise'] ?? ''), false, 'imprimable');
    echo '<p class="ecran"><button class="btn" onclick="print()">Imprimer ou enregistrer en PDF</button> <a class="retour" href="?p=client&id=' . h($c['id']) . '">← Retour au dossier</a></p>';
    if ($l['statut'] !== 'valide') {
        echo '<p class="alerte ecran">Ce livrable n’est pas encore validé.</p>';
    }
    echo '<article class="doc"><header class="doc__tete"><img src="../assets/logo-light.png" alt="NEAM Softwares Industry"><div><b>' . h(ATELIER_LIVRABLES[$type][0]) . '</b><span>' . date('d/m/Y') . '</span></div></header><h1>' . h($c['brief']['entreprise'] ?? '') . '</h1>'
        . rendu_livrable($type, $l['data']) . '<footer class="doc__pied">NEAM Softwares Industry · Libreville, Gabon · neamindustry.com · WhatsApp 077 45 31 67</footer></article>';
    page_fin();
}
