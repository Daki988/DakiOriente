<?php
/* =========================================================
   Atelier NEAM — Affichage et export des livrables
   ========================================================= */
declare(strict_types=1);

require_once __DIR__ . '/core.php';

function para(string $s): string
{
    return nl2br(h($s));
}

function ul(array $items): string
{
    return $items ? '<ul>' . implode('', array_map(fn($x) => '<li>' . para((string) $x) . '</li>', $items)) . '</ul>' : '';
}

/** Vue lisible d'un livrable dans l'Atelier. */
function rendu_livrable(string $type, array $d): string
{
    switch ($type) {
        case 'diagnostic':
            $p = '';
            foreach ($d['priorites'] ?? [] as $i => $x) {
                $p .= '<li><b>' . h($x['action']) . '</b><br>' . para($x['pourquoi']) . '<br><i>Impact : ' . h($x['impact']) . '</i></li>';
            }
            $pack = ATELIER_PACKS[$d['pack_recommande'] ?? ''] ?? null;
            return '<p>' . para($d['synthese'] ?? '') . '</p><div class="cols"><div><h4>Forces</h4>' . ul($d['forces'] ?? []) . '</div><div><h4>Faiblesses</h4>' . ul($d['faiblesses'] ?? []) . '</div></div>'
                . '<h4>3 priorités</h4><ol>' . $p . '</ol>'
                . ($pack ? '<h4>Offre recommandée : ' . h($pack['nom']) . '</h4><p>' . para($d['justification'] ?? '') . '</p>' : '')
                . '<h4>Questions à poser au client</h4>' . ul($d['questions_a_poser'] ?? []);
        case 'fiche_google':
            $s = '<h4>Description (' . mb_strlen($d['description'] ?? '') . ' / 750 caractères)</h4><p class="copie">' . para($d['description'] ?? '') . '</p>'
                . '<h4>Catégories</h4><p><b>' . h($d['categorie_principale'] ?? '') . '</b>' . (($d['categories_secondaires'] ?? []) ? ' · ' . h(implode(' · ', $d['categories_secondaires'])) : '') . '</p><h4>Services</h4><dl>';
            foreach ($d['services'] ?? [] as $x) {
                $s .= '<dt>' . h($x['nom']) . '</dt><dd>' . para($x['description']) . '</dd>';
            }
            $s .= '</dl><h4>Publications Google</h4>';
            foreach ($d['posts'] ?? [] as $x) {
                $s .= '<div class="carte"><b>' . h($x['titre']) . '</b><p class="copie">' . para($x['texte']) . '</p><span class="tag">Bouton : ' . h($x['bouton']) . '</span></div>';
            }
            $s .= '<h4>Réponses aux avis positifs</h4>' . ul($d['reponses_avis']['positif'] ?? []) . '<h4>Réponses aux avis négatifs</h4>' . ul($d['reponses_avis']['negatif'] ?? []) . '<h4>Questions et réponses</h4><dl>';
            foreach ($d['questions_reponses'] ?? [] as $x) {
                $s .= '<dt>' . h($x['question']) . '</dt><dd>' . para($x['reponse']) . '</dd>';
            }
            return $s . '</dl>';
        case 'page':
            $s = '<p><span class="tag">Titre Google</span> ' . h($d['titre_seo'] ?? '') . ' <small>(' . mb_strlen($d['titre_seo'] ?? '') . ')</small></p><p><span class="tag">Description Google</span> ' . h($d['meta_description'] ?? '') . ' <small>(' . mb_strlen($d['meta_description'] ?? '') . ')</small></p>'
                . '<h3>' . h($d['accroche'] ?? '') . '</h3><p>' . para($d['sous_titre'] ?? '') . '</p><h4>À propos</h4><p>' . para($d['a_propos'] ?? '') . '</p><h4>Services</h4><dl>';
            foreach ($d['services'] ?? [] as $x) {
                $s .= '<dt>' . h($x['titre']) . '</dt><dd>' . para($x['texte']) . '</dd>';
            }
            $s .= '</dl><h4>Points forts</h4><dl>';
            foreach ($d['points_forts'] ?? [] as $x) {
                $s .= '<dt>' . h($x['titre']) . '</dt><dd>' . para($x['texte']) . '</dd>';
            }
            $s .= '</dl><h4>FAQ</h4><dl>';
            foreach ($d['faq'] ?? [] as $x) {
                $s .= '<dt>' . h($x['question']) . '</dt><dd>' . para($x['reponse']) . '</dd>';
            }
            return $s . '</dl><p><span class="tag">Bouton</span> ' . h($d['appel_action'] ?? '') . ' · <span class="tag">Message</span> ' . h($d['message_whatsapp'] ?? '') . '</p>';
        case 'whatsapp':
            $s = '<h4>Description du profil</h4><p class="copie">' . para($d['profil_description'] ?? '') . '</p><h4>Message d’accueil</h4><p class="copie">' . para($d['message_accueil'] ?? '') . '</p><h4>Message d’absence</h4><p class="copie">' . para($d['message_absence'] ?? '') . '</p><h4>Réponses rapides</h4><dl>';
            foreach ($d['reponses_rapides'] ?? [] as $x) {
                $s .= '<dt>' . h($x['raccourci']) . '</dt><dd class="copie">' . para($x['texte']) . '</dd>';
            }
            $s .= '</dl><h4>Catalogue</h4><dl>';
            foreach ($d['catalogue'] ?? [] as $x) {
                $s .= '<dt>' . h($x['produit']) . '</dt><dd>' . para($x['description']) . '</dd>';
            }
            return $s . '</dl>';
        case 'sequences':
            $s = '';
            foreach ($d['sequences'] ?? [] as $q) {
                $s .= '<div class="carte"><b>' . h($q['nom']) . '</b> <small>· ' . h($q['declencheur']) . '</small>';
                foreach ($q['messages'] ?? [] as $m) {
                    $s .= '<p><span class="tag">' . h($m['quand']) . ' · ' . h($m['canal']) . '</span><br><span class="copie">' . para($m['texte']) . '</span></p>';
                }
                $s .= '</div>';
            }
            return $s;
        case 'calendrier':
            $s = '<table class="tab"><thead><tr><th>Sem.</th><th>Jour</th><th>Réseau</th><th>Format</th><th>Texte</th><th>Visuel</th></tr></thead><tbody>';
            foreach ($d['publications'] ?? [] as $x) {
                $s .= '<tr><td>' . h($x['semaine']) . '</td><td>' . h($x['jour']) . '</td><td>' . h($x['reseau']) . '</td><td>' . h($x['format']) . '<br><small>' . h($x['theme']) . '</small></td><td class="copie">' . para($x['texte']) . '<br><small>' . h(implode(' ', $x['hashtags'] ?? [])) . '</small></td><td>' . para($x['visuel']) . '</td></tr>';
            }
            return $s . '</tbody></table>';
        case 'rapport':
            $a = '';
            foreach ($d['actions'] ?? [] as $x) {
                $a .= '<li><b>' . h($x['action']) . '</b><br>' . para($x['pourquoi']) . '</li>';
            }
            return '<p>' . para($d['resume'] ?? '') . '</p><h4>Faits marquants</h4>' . ul($d['faits_marquants'] ?? []) . '<h4>Ce que cela veut dire</h4><p>' . para($d['lecture'] ?? '') . '</p><h4>Le mois prochain</h4><ol>' . $a . '</ol><h4>Message d’envoi au client</h4><p class="copie">' . para($d['message_client'] ?? '') . '</p>';
    }
    return rendu_generique($d);
}

/** Version texte, à copier-coller dans Google, WhatsApp ou l'outil d'envoi. */
function export_texte(string $type, array $d, array $c): string
{
    $t = mb_strtoupper(ATELIER_LIVRABLES[$type][0] ?? $type) . ' — ' . ($c['brief']['entreprise'] ?? '') . "\n\n";
    switch ($type) {
        case 'fiche_google':
            $t .= "DESCRIPTION\n{$d['description']}\n\nCATÉGORIE PRINCIPALE : {$d['categorie_principale']}\nCATÉGORIES SECONDAIRES : " . implode(', ', $d['categories_secondaires'] ?? []) . "\n\nSERVICES\n";
            foreach ($d['services'] ?? [] as $x) {
                $t .= "- {$x['nom']} : {$x['description']}\n";
            }
            $t .= "\nPUBLICATIONS\n";
            foreach ($d['posts'] ?? [] as $i => $x) {
                $t .= ($i + 1) . ". {$x['titre']}\n{$x['texte']}\n[Bouton : {$x['bouton']}]\n\n";
            }
            $t .= "RÉPONSES AUX AVIS POSITIFS\n- " . implode("\n- ", $d['reponses_avis']['positif'] ?? []) . "\n\nRÉPONSES AUX AVIS NÉGATIFS\n- " . implode("\n- ", $d['reponses_avis']['negatif'] ?? []) . "\n\nQUESTIONS ET RÉPONSES\n";
            foreach ($d['questions_reponses'] ?? [] as $x) {
                $t .= "Q : {$x['question']}\nR : {$x['reponse']}\n\n";
            }
            return $t;
        case 'whatsapp':
            $t .= "DESCRIPTION DU PROFIL\n{$d['profil_description']}\n\nMESSAGE D’ACCUEIL\n{$d['message_accueil']}\n\nMESSAGE D’ABSENCE\n{$d['message_absence']}\n\nRÉPONSES RAPIDES\n";
            foreach ($d['reponses_rapides'] ?? [] as $x) {
                $t .= "{$x['raccourci']}\n{$x['texte']}\n\n";
            }
            $t .= "CATALOGUE\n";
            foreach ($d['catalogue'] ?? [] as $x) {
                $t .= "- {$x['produit']} : {$x['description']}\n";
            }
            return $t;
        case 'sequences':
            foreach ($d['sequences'] ?? [] as $q) {
                $t .= mb_strtoupper($q['nom']) . "\nDéclencheur : {$q['declencheur']}\n";
                foreach ($q['messages'] ?? [] as $m) {
                    $t .= "[{$m['quand']} · {$m['canal']}]\n{$m['texte']}\n\n";
                }
            }
            return $t;
        default:
            return $t . texte_generique($d);
    }
}

/** Calendrier au format CSV (séparateur « ; », lisible par Excel en français). */
function calendrier_csv(array $d): string
{
    $f = fopen('php://temp', 'r+');
    fwrite($f, "\xEF\xBB\xBF");
    fputcsv($f, ['Semaine', 'Jour', 'Réseau', 'Format', 'Thème', 'Texte', 'Hashtags', 'Visuel'], ';', '"', '');
    foreach ($d['publications'] ?? [] as $x) {
        fputcsv($f, [$x['semaine'], $x['jour'], $x['reseau'], $x['format'], $x['theme'], $x['texte'], implode(' ', $x['hashtags'] ?? []), $x['visuel']], ';', '"', '');
    }
    rewind($f);
    return (string) stream_get_contents($f);
}

/** Page de présentation complète, autonome (une seule page HTML, sans dépendance). */
const VITRINE_CSS = <<<'CSS'
:root{--ink:#14161a;--muted:#5d6068;--accent:#f5b31b;--bg:#faf8f3;--card:#fff;--line:#e8e4da}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;font-size:17px}
.w{max-width:960px;margin:0 auto;padding:0 20px}
header{padding:20px 0;border-bottom:1px solid var(--line);background:var(--card)}
header .w{display:flex;justify-content:space-between;align-items:center;gap:12px}
header b{font-size:19px}
.btn{display:inline-block;background:#1fa855;color:#fff;font-weight:700;padding:14px 22px;border-radius:999px;text-decoration:none}
header .btn{padding:10px 16px;font-size:15px}
.hero{padding:64px 0 48px}
.hero h1{font-size:clamp(32px,6vw,52px);line-height:1.1;letter-spacing:-.02em;margin-bottom:16px}
.hero p{font-size:19px;color:var(--muted);max-width:640px;margin-bottom:28px}
section{padding:44px 0;border-top:1px solid var(--line)}
h2{font-size:28px;margin-bottom:20px;letter-spacing:-.01em}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.grid article{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px}
.grid h3{font-size:18px;margin-bottom:6px}
.grid p,.pf span{color:var(--muted)}
.pf{list-style:none;display:grid;gap:14px}
.pf li{border-left:4px solid var(--accent);padding-left:14px}
.pf b{display:block}
details{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin-bottom:10px}
summary{font-weight:600;cursor:pointer}
details p{margin-top:8px;color:var(--muted)}
.infos{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}
.infos a{color:var(--ink)}
footer{padding:28px 0 90px;color:var(--muted);font-size:14px;border-top:1px solid var(--line)}
.flottant{position:fixed;right:16px;bottom:16px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
.menu{display:flex;gap:16px;flex-wrap:wrap;font-size:15px}
.menu a{color:var(--ink);text-decoration:none}
.menu a[aria-current]{font-weight:700;border-bottom:2px solid var(--accent)}
header .w{flex-wrap:wrap}
CSS;

function vitrine_html(array $c, array $d): string
{
    $b = $c['brief'];
    $nom = $b['entreprise'] ?? '';
    $wa = !empty($b['whatsapp']) ? 'https://wa.me/' . wa_num($b['whatsapp']) . '?text=' . rawurlencode($d['message_whatsapp'] ?? 'Bonjour') : '';
    $tel = $b['telephone'] ?? ($b['whatsapp'] ?? '');
    $lieu = trim(implode(', ', array_filter([$b['quartier'] ?? '', $b['ville'] ?? ''])));
    $carte = $lieu !== '' ? 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($nom . ' ' . $lieu) : '';
    $svc = implode('', array_map(fn($x) => '<article><h3>' . h($x['titre']) . '</h3><p>' . h($x['texte']) . '</p></article>', $d['services'] ?? []));
    $pf = implode('', array_map(fn($x) => '<li><b>' . h($x['titre']) . '</b><span>' . h($x['texte']) . '</span></li>', $d['points_forts'] ?? []));
    $faq = implode('', array_map(fn($x) => '<details><summary>' . h($x['question']) . '</summary><p>' . h($x['reponse']) . '</p></details>', $d['faq'] ?? []));
    $faqLd = ['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => array_map(fn($x) => ['@type' => 'Question', 'name' => $x['question'], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $x['reponse']]], $d['faq'] ?? [])];
    $orgLd = array_filter(['@context' => 'https://schema.org', '@type' => 'LocalBusiness', 'name' => $nom, 'description' => $d['meta_description'] ?? '', 'telephone' => $tel ? '+' . wa_num($tel) : null,
        'address' => $lieu ? ['@type' => 'PostalAddress', 'streetAddress' => $b['quartier'] ?? '', 'addressLocality' => $b['ville'] ?? '', 'addressCountry' => 'GA'] : null]);
    $ld = '<script type="application/ld+json">' . json_encode($orgLd, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . '</script>'
        . ($faq ? '<script type="application/ld+json">' . json_encode($faqLd, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . '</script>' : '');
    $btn = $wa ? '<a class="btn" href="' . h($wa) . '">' . h($d['appel_action'] ?? 'Écrire sur WhatsApp') . '</a>' : '';
    $infos = ($b['horaires'] ?? '') !== '' ? '<p><b>Horaires</b><br>' . h($b['horaires']) . '</p>' : '';
    $infos .= $lieu !== '' ? '<p><b>Adresse</b><br>' . h($lieu) . ($carte ? '<br><a href="' . h($carte) . '">Voir sur Google Maps</a>' : '') . '</p>' : '';
    $infos .= $tel !== '' ? '<p><b>Téléphone</b><br><a href="tel:+' . h(wa_num($tel)) . '">' . h($tel) . '</a></p>' : '';
    $e = [
        'titre' => h($d['titre_seo'] ?? $nom), 'meta' => h($d['meta_description'] ?? ''), 'nom' => h($nom),
        'accroche' => h($d['accroche'] ?? $nom), 'sous' => h($d['sous_titre'] ?? ''), 'apropos' => h($d['a_propos'] ?? ''),
    ];
    $flottant = $btn ? str_replace('class="btn"', 'class="btn flottant"', $btn) : '';
    $css = VITRINE_CSS;
    return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{$e['titre']}</title>
<meta name="description" content="{$e['meta']}">
<meta property="og:title" content="{$e['nom']}">
<meta property="og:description" content="{$e['meta']}">
{$ld}
<style>
{$css}</style>
</head>
<body>
<header><div class="w"><b>{$e['nom']}</b>{$btn}</div></header>
<main>
<div class="hero"><div class="w"><h1>{$e['accroche']}</h1><p>{$e['sous']}</p>{$btn}</div></div>
<section><div class="w"><h2>À propos</h2><p>{$e['apropos']}</p></div></section>
<section><div class="w"><h2>Nos services</h2><div class="grid">{$svc}</div></div></section>
<section><div class="w"><h2>Pourquoi nous choisir</h2><ul class="pf">{$pf}</ul></div></section>
<section><div class="w"><h2>Questions fréquentes</h2>{$faq}</div></section>
<section><div class="w"><h2>Nous trouver</h2><div class="infos">{$infos}</div></div></section>
</main>
<footer><div class="w">© {$e['nom']} · Page réalisée par <a href="https://www.neamindustry.com/">NEAM Softwares Industry</a></div></footer>
{$flottant}
</body>
</html>
HTML;
}

/** Libellé lisible d'une clé JSON (« base_de_connaissances » → « Base de connaissances »). */
function libelle(string $k): string
{
    $l = ['faq' => 'Questions fréquentes', 'seo' => 'SEO', 'titre_seo' => 'Titre Google', 'meta_description' => 'Description Google', 'aujourd_hui' => 'Aujourd’hui', 'controle_humain' => 'Contrôle humain', 'probleme' => 'Problème', 'priorite' => 'Priorité', 'evaluation' => 'Évaluation', 'etapes' => 'Étapes', 'donnees' => 'Données', 'integrations' => 'Intégrations', 'fonctionnalites' => 'Fonctionnalités', 'periode' => 'Période', 'priorites' => 'Priorités', 'reseau' => 'Réseau', 'ton_a_eviter' => 'Ton à éviter', 'ton_a_faire' => 'Ton à adopter', 'messages_cles' => 'Messages clés', 'hashtags_marque' => 'Hashtags de marque', 'signature_email' => 'Signature e-mail', 'reponse' => 'Réponse', 'duree' => 'Durée', 'regles' => 'Règles', 'escalade' => 'Passage à un humain', 'categorie' => 'Catégorie', 'categories' => 'Catégories', 'description_courte' => 'Description courte', 'recette' => 'Critère de recette', 'declencheur' => 'Déclencheur', 'role' => 'Rôle', 'demain' => 'Demain', 'problemes' => 'Problèmes', 'mesure' => 'Mesure du gain', 'porteur' => 'Qui', 'livrable' => 'Livrable attendu', 'cibles' => 'Clients visés', 'objectifs' => 'Objectifs', 'modules' => 'Modules', 'fiches_pratiques' => 'Fiches pratiques', 'base_de_connaissances' => 'Base de connaissances', 'questions_ouvertes' => 'Questions à poser au client', 'nom_menu' => 'Menu'];
    return $l[$k] ?? ucfirst(str_replace('_', ' ', $k));
}

/** Affichage générique d'un livrable structuré (titres, listes, cartes). */
function rendu_generique($v, int $niveau = 0): string
{
    if (!is_array($v)) {
        return '<span class="copie">' . para((string) $v) . '</span>';
    }
    if (array_is_list($v)) {
        if ($v && !is_array($v[0])) {
            return ul(array_map('strval', $v));
        }
        $s = '';
        foreach ($v as $x) {
            $s .= '<div class="carte">' . rendu_generique($x, $niveau + 1) . '</div>';
        }
        return $s;
    }
    $s = '';
    foreach ($v as $k => $x) {
        if (str_starts_with((string) $k, '_') || $x === '' || $x === []) {
            continue;
        }
        $s .= is_array($x) || $niveau === 0
            ? '<h4>' . h(libelle((string) $k)) . '</h4>' . rendu_generique($x, $niveau + 1)
            : '<p><b>' . h(libelle((string) $k)) . ' :</b> ' . rendu_generique($x, $niveau + 1) . '</p>';
    }
    return $s;
}

/** Version texte générique, pour copier-coller. */
function texte_generique($v, int $niveau = 0): string
{
    $pad = str_repeat('  ', $niveau);
    if (!is_array($v)) {
        return (string) $v;
    }
    $t = '';
    foreach ($v as $k => $x) {
        if (is_string($k) && str_starts_with($k, '_')) {
            continue;
        }
        $label = is_string($k) ? libelle($k) : '-';
        if (is_array($x)) {
            $t .= $pad . (is_string($k) ? mb_strtoupper($label) : '•') . "\n" . texte_generique($x, $niveau + 1) . "\n";
        } else {
            $t .= $pad . (is_string($k) ? "$label : " : '- ') . $x . "\n";
        }
    }
    return $t;
}

/** Catalogue de la boutique au format CSV (import WooCommerce, Shopify ou tableur). */
function boutique_csv(array $d): string
{
    $f = fopen('php://temp', 'r+');
    fwrite($f, "\xEF\xBB\xBF");
    fputcsv($f, ['Nom', 'Catégorie', 'Description courte', 'Description', 'Prix', 'Variantes'], ';', '"', '');
    foreach ($d['produits'] ?? [] as $x) {
        fputcsv($f, [$x['nom'], $x['categorie'], $x['description_courte'], $x['description'], $x['prix'], implode(', ', $x['variantes'] ?? [])], ';', '"', '');
    }
    rewind($f);
    return (string) stream_get_contents($f);
}

/** Site vitrine : fichier => HTML (index.html pour l'accueil, puis une page par fichier). */
function site_pages(array $c, array $d): array
{
    $b = $c['brief'];
    $nom = $b['entreprise'] ?? ($d['titre_site'] ?? '');
    $wa = !empty($b['whatsapp']) ? 'https://wa.me/' . wa_num($b['whatsapp']) . '?text=' . rawurlencode($d['message_whatsapp'] ?? 'Bonjour') : '';
    $tel = $b['telephone'] ?? ($b['whatsapp'] ?? '');
    $lieu = trim(implode(', ', array_filter([$b['quartier'] ?? '', $b['ville'] ?? ''])));
    $pages = [];
    $vus = [];
    foreach ($d['pages'] ?? [] as $i => $p) {
        $slug = $i === 0 ? 'index' : slugifier((string) ($p['slug'] ?? $p['nom_menu'] ?? 'page'));
        while (isset($vus[$slug])) {
            $slug .= '-2';
        }
        $vus[$slug] = true;
        $pages[] = $p + ['_fichier' => $slug . '.html'];
    }
    $out = [];
    foreach ($pages as $i => $p) {
        $menu = implode('', array_map(fn($q) => '<a href="' . h($q['_fichier']) . '"' . ($q['_fichier'] === $p['_fichier'] ? ' aria-current="page"' : '') . '>' . h($q['nom_menu']) . '</a>', $pages));
        $btn = $wa ? '<a class="btn" href="' . h($wa) . '">' . h($p['appel_action'] ?: 'Écrire sur WhatsApp') . '</a>' : '';
        $sections = implode('', array_map(fn($x) => '<section><div class="w"><h2>' . h($x['titre']) . '</h2><p>' . nl2br(h($x['texte'])) . '</p></div></section>', $p['sections'] ?? []));
        $extra = '';
        if (($p['slug'] ?? '') === 'contact' || $i === count($pages) - 1) {
            $infos = ($b['horaires'] ?? '') !== '' ? '<p><b>Horaires</b><br>' . h($b['horaires']) . '</p>' : '';
            $infos .= $lieu !== '' ? '<p><b>Adresse</b><br>' . h($lieu) . '<br><a href="https://www.google.com/maps/search/?api=1&amp;query=' . h(rawurlencode($nom . ' ' . $lieu)) . '">Voir sur Google Maps</a></p>' : '';
            $infos .= $tel !== '' ? '<p><b>Téléphone</b><br><a href="tel:+' . h(wa_num($tel)) . '">' . h($tel) . '</a></p>' : '';
            $extra = $infos ? '<section><div class="w"><h2>Nous trouver</h2><div class="infos">' . $infos . '</div></div></section>' : '';
        }
        if ($i === 0 && !empty($d['faq'])) {
            $extra .= '<section><div class="w"><h2>Questions fréquentes</h2>' . implode('', array_map(fn($x) => '<details><summary>' . h($x['question']) . '</summary><p>' . h($x['reponse']) . '</p></details>', $d['faq'])) . '</div></section>';
        }
        $ld = $i === 0 ? '<script type="application/ld+json">' . json_encode(array_filter(['@context' => 'https://schema.org', '@type' => 'LocalBusiness', 'name' => $nom, 'description' => $p['meta_description'] ?? '', 'telephone' => $tel ? '+' . wa_num($tel) : null,
            'address' => $lieu ? ['@type' => 'PostalAddress', 'streetAddress' => $b['quartier'] ?? '', 'addressLocality' => $b['ville'] ?? '', 'addressCountry' => 'GA'] : null]), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . '</script>' : '';
        $flottant = $btn ? str_replace('class="btn"', 'class="btn flottant"', $btn) : '';
        $out[$p['_fichier']] = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<title>' . h($p['titre_seo'] ?: $nom) . '</title><meta name="description" content="' . h($p['meta_description']) . '"><meta property="og:title" content="' . h($p['titre_seo'] ?: $nom) . '">' . $ld
            . '<style>' . VITRINE_CSS . '</style></head><body>'
            . '<header><div class="w"><a href="index.html" style="text-decoration:none;color:inherit"><b>' . h($nom) . '</b></a><nav class="menu">' . $menu . '</nav></div></header><main>'
            . '<div class="hero"><div class="w"><h1>' . h($p['titre']) . '</h1><p>' . h($p['intro']) . '</p>' . $btn . '</div></div>' . $sections . $extra
            . '</main><footer><div class="w">© ' . h($nom) . ' · Site réalisé par <a href="https://www.neamindustry.com/">NEAM Softwares Industry</a></div></footer>' . $flottant . '</body></html>';
    }
    return $out;
}
