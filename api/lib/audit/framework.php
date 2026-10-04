<?php
/* =========================================================
   NEAM Digital Audit Framework
   Référentiel des critères, pondérations et actions associées.
   Chaque critère renvoie [valeur 0..1, constat] ou null (non mesuré).
   ========================================================= */
declare(strict_types=1);

const AXES = [
    'visibilite'    => ['label' => 'Visibilité', 'weight' => 20],
    'referencement' => ['label' => 'Référencement', 'weight' => 15],
    'conversion'    => ['label' => 'Conversion', 'weight' => 15],
    'credibilite'   => ['label' => 'Crédibilité', 'weight' => 15],
    'reputation'    => ['label' => 'Réputation', 'weight' => 15],
    'reseaux'       => ['label' => 'Réseaux sociaux', 'weight' => 10],
    'identite'      => ['label' => 'Identité digitale', 'weight' => 10],
];

const LEVELS = [
    [39, 'Critique', 'Votre présence en ligne vous fait perdre des clients. Les bases sont à construire en priorité.'],
    [59, 'À améliorer', 'Les fondations existent, mais plusieurs points vous rendent moins visible et moins convaincant que vos concurrents.'],
    [79, 'Solide', 'Votre présence est sérieuse. Quelques optimisations ciblées peuvent vous faire passer devant.'],
    [100, 'Excellent', 'Vous êtes une référence en ligne dans votre secteur. L’enjeu est de garder l’avance et d’automatiser.'],
];

function level_for(int $score): array
{
    foreach (LEVELS as [$max, $name, $text]) {
        if ($score <= $max) {
            return ['name' => $name, 'text' => $text];
        }
    }
    return ['name' => 'Excellent', 'text' => ''];
}

/** Réseaux sociaux connus : trouvés sur le site + déclarés. */
function entity_socials(array $e): array
{
    $s = $e['site']['social'] ?? [];
    foreach ($e['socials_declared'] ?? [] as $net => $url) {
        $s[$net] = $s[$net] ?? $url;
    }
    return $s;
}

function digits_tail(string $phone): string
{
    return substr(preg_replace('/\D/', '', $phone), -8);
}

/** Liste des critères. needs : 'site' (site joignable) ou 'gbp' (fiche Google trouvée). */
function criteria(): array
{
    $site = fn($e) => $e['site'] && !empty($e['site']['reachable']) ? $e['site'] : null;
    $yes = fn(bool $ok, string $good, string $bad) => [$ok ? 1.0 : 0.0, $ok ? $good : $bad];
    // Critère lisible dans le contenu de la page : non mesurable si le site est rendu en JavaScript
    $content = function (callable $fn) use ($site) {
        return function ($e) use ($fn, $site) {
            $s = $site($e);
            if ($s && !empty($s['spa'])) {
                return null;
            }
            return $fn($e);
        };
    };
    // Réseaux : non mesurables si rien n'est déclaré et que le site est rendu en JavaScript
    $social = function (callable $fn) use ($site) {
        return function ($e) use ($fn, $site) {
            $s = $site($e);
            if ($s && !empty($s['spa']) && !entity_socials($e)) {
                return null;
            }
            return $fn($e);
        };
    };

    return [
        // ---------- Visibilité ----------
        ['id' => 'v_site', 'axis' => 'visibilite', 'w' => 3, 'action' => 'create_site', 'label' => 'Site web accessible',
            'fn' => function ($e) use ($site) {
                if ($site($e)) {
                    return [1.0, 'Site en ligne : ' . $e['site']['host']];
                }
                if (!empty($e['site']['url'])) {
                    return [0.0, 'Le site ' . parse_url($e['site']['url'], PHP_URL_HOST) . ' ne répond pas (' . ($e['site']['error'] ?? 'erreur') . ')'];
                }
                return [0.0, 'Aucun site web trouvé'];
            }],
        ['id' => 'v_gbp', 'axis' => 'visibilite', 'w' => 3, 'action' => 'gbp_create', 'label' => 'Fiche Google Business',
            'fn' => function ($e) {
                if (empty($e['gbp_measured'])) {
                    return null;
                }
                return $e['gbp'] ? [1.0, 'Fiche Google trouvée : ' . $e['gbp']['name']] : [0.0, 'Aucune fiche Google Business trouvée'];
            }],
        ['id' => 'v_local_rank', 'axis' => 'visibilite', 'w' => 3, 'action' => 'local_seo', 'label' => 'Présence dans les recherches locales Google Maps',
            'fn' => function ($e) {
                if (!isset($e['rank'])) {
                    return null;
                }
                $r = (int) $e['rank'];
                if ($r >= 1 && $r <= 5) {
                    return [1.0, "Apparaît en position $r sur la recherche « {$e['query']} »"];
                }
                if ($r >= 1) {
                    return [0.5, "Apparaît seulement en position $r sur la recherche « {$e['query']} »"];
                }
                return [0.0, "N’apparaît pas dans les 20 premiers résultats pour « {$e['query']} »"];
            }],
        ['id' => 'v_socials', 'axis' => 'visibilite', 'w' => 2, 'action' => 'social_setup', 'label' => 'Présence sur au moins deux réseaux sociaux',
            'fn' => $social(function ($e) {
                $n = count(entity_socials($e));
                return [$n >= 2 ? 1.0 : ($n === 1 ? 0.5 : 0.0), $n ? "$n réseau(x) social(aux) détecté(s)" : 'Aucun réseau social détecté'];
            })],
        ['id' => 'v_indexable', 'axis' => 'visibilite', 'w' => 2, 'action' => 'seo_tech', 'label' => 'Site autorisé dans Google', 'needs' => 'site',
            'fn' => function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, 'Pas de site à indexer'];
                }
                $ok = !$s['noindex'] && !$s['robots_blocks'];
                return [$ok ? 1.0 : 0.0, $ok ? 'Le site peut être indexé par Google' : 'Le site demande à Google de ne pas l’indexer'];
            }],

        // ---------- Référencement ----------
        ['id' => 'r_https', 'axis' => 'referencement', 'w' => 2, 'action' => 'https', 'label' => 'Connexion sécurisée (HTTPS)', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes($e['site']['https'], 'Site sécurisé en HTTPS', 'Site non sécurisé : les navigateurs affichent « Non sécurisé »') : [0.0, '']],
        ['id' => 'r_title', 'axis' => 'referencement', 'w' => 2, 'action' => 'seo_onpage', 'label' => 'Titre de page optimisé', 'needs' => 'site',
            'fn' => function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                $l = mb_strlen($s['title']);
                if ($l === 0) {
                    return [0.0, 'Aucun titre de page'];
                }
                return $l >= 15 && $l <= 70 ? [1.0, "Titre de $l caractères"] : [0.5, "Titre de $l caractères (idéal : 15 à 70)"];
            }],
        ['id' => 'r_desc', 'axis' => 'referencement', 'w' => 2, 'action' => 'seo_onpage', 'label' => 'Meta-description', 'needs' => 'site',
            'fn' => function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                $l = mb_strlen($s['description']);
                if ($l === 0) {
                    return [0.0, 'Pas de meta-description : Google choisit seul le texte affiché'];
                }
                return $l >= 50 && $l <= 170 ? [1.0, "Meta-description de $l caractères"] : [0.5, "Meta-description de $l caractères (idéal : 50 à 170)"];
            }],
        ['id' => 'r_h1', 'axis' => 'referencement', 'w' => 2, 'action' => 'seo_onpage', 'label' => 'Titre principal (H1) unique', 'needs' => 'site',
            'fn' => $content(function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                $n = count($s['h1']);
                return $n === 1 ? [1.0, 'Un titre H1 : « ' . $s['h1'][0] . ' »'] : ($n > 1 ? [0.5, "$n titres H1 sur la page d’accueil"] : [0.0, 'Aucun titre H1 sur la page d’accueil']);
            })],
        ['id' => 'r_mobile', 'axis' => 'referencement', 'w' => 3, 'action' => 'mobile', 'label' => 'Site adapté au mobile', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes($e['site']['viewport'], 'Affichage mobile prévu', 'Le site n’est pas configuré pour les smartphones') : [0.0, '']],
        ['id' => 'r_speed', 'axis' => 'referencement', 'w' => 2, 'action' => 'speed', 'label' => 'Temps de réponse du serveur', 'needs' => 'site',
            'fn' => function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                $t = (float) $s['time'];
                $txt = 'Page d’accueil chargée en ' . number_format($t, 1, ',', ' ') . ' s (' . $s['size_kb'] . ' Ko de HTML)';
                return [$t < 1.5 ? 1.0 : ($t < 3.5 ? 0.5 : 0.0), $txt];
            }],
        ['id' => 'r_perf', 'axis' => 'referencement', 'w' => 2, 'action' => 'speed', 'label' => 'Performance mobile (Google PageSpeed)', 'needs' => 'site',
            'fn' => function ($e) {
                if (!isset($e['psi']['performance'])) {
                    return null;
                }
                $p = (int) $e['psi']['performance'];
                return [$p >= 70 ? 1.0 : ($p >= 40 ? 0.5 : 0.0), "Score PageSpeed mobile : $p/100"];
            }],
        ['id' => 'r_sitemap', 'axis' => 'referencement', 'w' => 1, 'action' => 'seo_tech', 'label' => 'Plan du site (sitemap.xml)', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes($e['site']['sitemap'], 'sitemap.xml présent', 'Pas de sitemap.xml') : [0.0, '']],
        ['id' => 'r_robots', 'axis' => 'referencement', 'w' => 1, 'action' => 'seo_tech', 'label' => 'Fichier robots.txt', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes($e['site']['robots_txt'], 'robots.txt présent', 'Pas de robots.txt') : [0.0, '']],
        ['id' => 'r_canonical', 'axis' => 'referencement', 'w' => 1, 'action' => 'seo_tech', 'label' => 'URL canonique', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes($e['site']['canonical'], 'Balise canonique présente', 'Pas de balise canonique') : [0.0, '']],
        ['id' => 'r_schema', 'axis' => 'referencement', 'w' => 1, 'action' => 'seo_tech', 'label' => 'Données structurées (Schema.org)', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes((bool) $e['site']['jsonld'], 'Données structurées : ' . implode(', ', array_slice($e['site']['jsonld'], 0, 3)), 'Aucune donnée structurée pour Google') : [0.0, '']],
        ['id' => 'r_lang', 'axis' => 'referencement', 'w' => 1, 'action' => 'seo_tech', 'label' => 'Langue déclarée', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes($e['site']['lang'] !== '', 'Langue déclarée : ' . $e['site']['lang'], 'Langue de la page non déclarée') : [0.0, '']],
        ['id' => 'r_render', 'axis' => 'referencement', 'w' => 2, 'action' => 'prerender', 'label' => 'Contenu lisible sans JavaScript', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes(empty($e['site']['spa']), 'Le contenu est présent dans le code de la page', 'Le contenu n’apparaît qu’après exécution du JavaScript : les aperçus WhatsApp, certains moteurs et outils ne voient qu’une page vide') : [0.0, '']],
        ['id' => 'r_alt', 'axis' => 'referencement', 'w' => 1, 'action' => 'seo_onpage', 'label' => 'Images décrites (attribut alt)', 'needs' => 'site',
            'fn' => $content(function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                if (!$s['images']) {
                    return null;
                }
                $r = $s['images_alt'] / $s['images'];
                return [$r >= 0.8 ? 1.0 : ($r >= 0.4 ? 0.5 : 0.0), round($r * 100) . ' % des images sont décrites'];
            })],
        ['id' => 'r_content', 'axis' => 'referencement', 'w' => 2, 'action' => 'content_seo', 'label' => 'Contenu de la page d’accueil', 'needs' => 'site',
            'fn' => $content(function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                $w = (int) $s['words'];
                return [$w >= 400 ? 1.0 : ($w >= 150 ? 0.5 : 0.0), "$w mots sur la page d’accueil"];
            })],
        ['id' => 'r_local', 'axis' => 'referencement', 'w' => 2, 'action' => 'local_seo', 'label' => 'Référencement local (ville citée)', 'needs' => 'site',
            'fn' => $content(function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                if ($s['city_in_title']) {
                    return [1.0, 'La ville figure dans le titre ou le H1'];
                }
                return $s['city_mentioned'] ? [0.5, 'La ville est citée, mais pas dans le titre ni le H1'] : [0.0, 'La ville n’est jamais citée sur le site'];
            })],
        ['id' => 'r_links', 'axis' => 'referencement', 'w' => 1, 'action' => 'site_structure', 'label' => 'Maillage interne', 'needs' => 'site',
            'fn' => $content(function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                $n = (int) $s['internal_links'];
                return [$n >= 15 ? 1.0 : ($n >= 5 ? 0.5 : 0.0), "$n liens internes depuis l’accueil"];
            })],
        ['id' => 'r_blog', 'axis' => 'referencement', 'w' => 1, 'action' => 'content_seo', 'label' => 'Blog ou actualités', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['blog'], 'Rubrique blog / actualités présente', 'Pas de blog ni d’actualités') : [0.0, ''])],

        // ---------- Conversion ----------
        ['id' => 'c_whatsapp', 'axis' => 'conversion', 'w' => 3, 'action' => 'whatsapp', 'label' => 'Contact WhatsApp', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['whatsapp'], 'Bouton ou lien WhatsApp présent', 'Pas de contact WhatsApp sur le site') : [0.0, ''])],
        ['id' => 'c_tel', 'axis' => 'conversion', 'w' => 2, 'action' => 'contact_channels', 'label' => 'Téléphone cliquable', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['tel'], 'Numéro cliquable (appel en un geste)', 'Le numéro n’est pas cliquable sur mobile') : [0.0, ''])],
        ['id' => 'c_form', 'axis' => 'conversion', 'w' => 2, 'action' => 'contact_form', 'label' => 'Formulaire de contact', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['forms'] > 0, 'Formulaire de contact présent', 'Aucun formulaire de contact') : [0.0, ''])],
        ['id' => 'c_cta', 'axis' => 'conversion', 'w' => 2, 'action' => 'cta', 'label' => 'Appels à l’action clairs', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['cta'], 'Appels à l’action présents (devis, contact…)', 'Pas d’appel à l’action clair (devis, rendez-vous, commande)') : [0.0, ''])],
        ['id' => 'c_services', 'axis' => 'conversion', 'w' => 2, 'action' => 'site_structure', 'label' => 'Page services / offres', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['services_page'], 'Page services ou offres présente', 'Pas de page dédiée aux services') : [0.0, ''])],
        ['id' => 'c_mail', 'axis' => 'conversion', 'w' => 1, 'action' => 'contact_channels', 'label' => 'E-mail visible', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['mailto'] || $e['site']['emails'], 'Adresse e-mail visible', 'Aucune adresse e-mail visible') : [0.0, ''])],
        ['id' => 'c_contact_page', 'axis' => 'conversion', 'w' => 1, 'action' => 'site_structure', 'label' => 'Page contact', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['contact_page'], 'Page contact présente', 'Pas de page contact') : [0.0, ''])],
        ['id' => 'c_maps', 'axis' => 'conversion', 'w' => 1, 'action' => 'contact_channels', 'label' => 'Plan d’accès Google Maps', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['maps'], 'Plan Google Maps intégré', 'Pas de plan d’accès') : [0.0, ''])],
        ['id' => 'c_booking', 'axis' => 'conversion', 'w' => 2, 'action' => 'booking', 'label' => 'Réservation ou commande en ligne', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['booking'], 'Réservation / commande en ligne possible', 'Pas de prise de rendez-vous ni de commande en ligne') : [0.0, ''])],

        // ---------- Crédibilité ----------
        ['id' => 'cr_testimonials', 'axis' => 'credibilite', 'w' => 2, 'action' => 'social_proof', 'label' => 'Témoignages clients', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['testimonials'], 'Témoignages ou références clients visibles', 'Aucun témoignage client') : [0.0, ''])],
        ['id' => 'cr_portfolio', 'axis' => 'credibilite', 'w' => 2, 'action' => 'social_proof', 'label' => 'Réalisations / références', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['portfolio'], 'Réalisations ou références présentées', 'Aucune réalisation présentée') : [0.0, ''])],
        ['id' => 'cr_about', 'axis' => 'credibilite', 'w' => 1, 'action' => 'site_structure', 'label' => 'Présentation de l’entreprise', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['about_page'], 'Page « À propos » présente', 'Pas de page de présentation') : [0.0, ''])],
        ['id' => 'cr_address', 'axis' => 'credibilite', 'w' => 2, 'action' => 'contact_channels', 'label' => 'Adresse physique', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['address'], 'Adresse physique indiquée', 'Aucune adresse physique') : [0.0, ''])],
        ['id' => 'cr_legal', 'axis' => 'credibilite', 'w' => 1, 'action' => 'legal', 'label' => 'Mentions légales / confidentialité', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['legal_page'], 'Mentions légales présentes', 'Pas de mentions légales ni de politique de confidentialité') : [0.0, ''])],
        ['id' => 'cr_fresh', 'axis' => 'credibilite', 'w' => 1, 'action' => 'maintenance', 'label' => 'Site à jour', 'needs' => 'site',
            'fn' => $content(function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                $y = $s['copyright_year'];
                $now = (int) date('Y');
                if (!$y) {
                    return [0.5, 'Année de mise à jour non affichée'];
                }
                return $y >= $now - 1 ? [1.0, "Site daté de $y"] : [0.0, "Dernière date affichée : $y"];
            })],
        ['id' => 'cr_hours', 'axis' => 'credibilite', 'w' => 1, 'action' => 'gbp_optimize', 'label' => 'Horaires d’ouverture sur Google', 'needs' => 'gbp',
            'fn' => fn($e) => $e['gbp'] ? $yes($e['gbp']['hours'], 'Horaires renseignés sur Google', 'Horaires absents de la fiche Google') : [0.0, '']],

        // ---------- Réputation ----------
        ['id' => 'rep_rating', 'axis' => 'reputation', 'w' => 3, 'action' => 'reviews', 'label' => 'Note Google', 'needs' => 'gbp',
            'fn' => function ($e) {
                if (!$e['gbp']) {
                    return [0.0, ''];
                }
                $r = $e['gbp']['rating'];
                if ($r === null || !$e['gbp']['reviews']) {
                    return [0.0, 'Aucune note sur Google'];
                }
                $v = $r >= 4.5 ? 1.0 : ($r >= 4.0 ? 0.7 : ($r >= 3.5 ? 0.4 : 0.0));
                return [$v, 'Note de ' . number_format($r, 1, ',', '') . '/5'];
            }],
        ['id' => 'rep_count', 'axis' => 'reputation', 'w' => 3, 'action' => 'reviews', 'label' => 'Nombre d’avis Google', 'needs' => 'gbp',
            'fn' => function ($e) {
                if (!$e['gbp']) {
                    return [0.0, ''];
                }
                $n = (int) $e['gbp']['reviews'];
                return [$n >= 50 ? 1.0 : ($n >= 20 ? 0.6 : ($n >= 5 ? 0.3 : 0.0)), "$n avis Google"];
            }],
        ['id' => 'rep_photos', 'axis' => 'reputation', 'w' => 1, 'action' => 'gbp_optimize', 'label' => 'Photos sur la fiche Google', 'needs' => 'gbp',
            'fn' => fn($e) => $e['gbp'] ? [$e['gbp']['photos'] >= 5 ? 1.0 : ($e['gbp']['photos'] > 0 ? 0.5 : 0.0), $e['gbp']['photos'] . ' photo(s) sur la fiche'] : [0.0, '']],
        ['id' => 'rep_site_link', 'axis' => 'reputation', 'w' => 1, 'action' => 'gbp_optimize', 'label' => 'Site relié à la fiche Google', 'needs' => 'gbp',
            'fn' => fn($e) => $e['gbp'] ? $yes($e['gbp']['website'] !== '', 'La fiche renvoie vers le site', 'La fiche Google ne renvoie vers aucun site') : [0.0, '']],
        ['id' => 'rep_phone', 'axis' => 'reputation', 'w' => 1, 'action' => 'gbp_optimize', 'label' => 'Téléphone sur la fiche Google', 'needs' => 'gbp',
            'fn' => fn($e) => $e['gbp'] ? $yes($e['gbp']['phone'] !== '', 'Téléphone présent sur la fiche', 'Pas de téléphone sur la fiche Google') : [0.0, '']],

        // ---------- Réseaux sociaux ----------
        ['id' => 's_facebook', 'axis' => 'reseaux', 'w' => 3, 'action' => 'social_setup', 'label' => 'Page Facebook',
            'fn' => $social(fn($e) => $yes(isset(entity_socials($e)['facebook']), 'Page Facebook détectée', 'Aucune page Facebook détectée'))],
        ['id' => 's_instagram', 'axis' => 'reseaux', 'w' => 2, 'action' => 'social_setup', 'label' => 'Compte Instagram',
            'fn' => $social(fn($e) => $yes(isset(entity_socials($e)['instagram']), 'Compte Instagram détecté', 'Aucun compte Instagram détecté'))],
        ['id' => 's_linkedin', 'axis' => 'reseaux', 'w' => 2, 'action' => 'social_setup', 'label' => 'Page LinkedIn',
            'fn' => $social(fn($e) => $yes(isset(entity_socials($e)['linkedin']), 'Page LinkedIn détectée', 'Aucune page LinkedIn détectée'))],
        ['id' => 's_video', 'axis' => 'reseaux', 'w' => 2, 'action' => 'video', 'label' => 'Vidéo (TikTok ou YouTube)',
            'fn' => $social(function ($e) {
                $s = entity_socials($e);
                $ok = isset($s['tiktok']) || isset($s['youtube']);
                return [$ok ? 1.0 : 0.0, $ok ? 'Chaîne vidéo détectée' : 'Pas de TikTok ni de YouTube'];
            })],
        ['id' => 's_linked', 'axis' => 'reseaux', 'w' => 2, 'action' => 'social_links', 'label' => 'Réseaux reliés au site', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes((bool) $e['site']['social'], 'Les réseaux sont accessibles depuis le site', 'Le site ne renvoie vers aucun réseau social') : [0.0, ''])],

        // ---------- Identité digitale ----------
        ['id' => 'i_logo', 'axis' => 'identite', 'w' => 2, 'action' => 'branding', 'label' => 'Logo visible', 'needs' => 'site',
            'fn' => $content(fn($e) => $site($e) ? $yes($e['site']['logo'], 'Logo affiché sur le site', 'Logo non détecté sur le site') : [0.0, ''])],
        ['id' => 'i_name', 'axis' => 'identite', 'w' => 2, 'action' => 'seo_onpage', 'label' => 'Nom de l’entreprise dans le titre', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes($e['site']['name_in_title'], 'Le nom de l’entreprise figure dans le titre', 'Le nom de l’entreprise n’apparaît pas dans le titre de la page') : [0.0, '']],
        ['id' => 'i_favicon', 'axis' => 'identite', 'w' => 1, 'action' => 'branding', 'label' => 'Icône d’onglet (favicon)', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes($e['site']['favicon'], 'Favicon présent', 'Pas de favicon') : [0.0, '']],
        ['id' => 'i_share', 'axis' => 'identite', 'w' => 1, 'action' => 'branding', 'label' => 'Aperçu de partage (WhatsApp, Facebook)', 'needs' => 'site',
            'fn' => fn($e) => $site($e) ? $yes($e['site']['og'], 'Image et titre de partage définis', 'Aucun aperçu prévu quand le lien est partagé') : [0.0, '']],
        ['id' => 'i_email', 'axis' => 'identite', 'w' => 2, 'action' => 'pro_email', 'label' => 'E-mail professionnel', 'needs' => 'site',
            'fn' => $content(function ($e) use ($site) {
                $s = $site($e);
                if (!$s) {
                    return [0.0, ''];
                }
                if (!$s['emails']) {
                    return null; // déjà compté dans « E-mail visible »
                }
                foreach ($s['emails'] as $m) {
                    if (str_ends_with($m, '@' . $s['host'])) {
                        return [1.0, "E-mail à votre nom de domaine : $m"];
                    }
                }
                return [0.5, 'E-mail générique : ' . $s['emails'][0]];
            })],
        ['id' => 'i_consistency', 'axis' => 'identite', 'w' => 2, 'action' => 'consistency', 'label' => 'Coordonnées cohérentes (site / Google)',
            'fn' => function ($e) use ($site) {
                $s = $site($e);
                if (!$s || !$e['gbp'] || !$e['gbp']['phone'] || !$s['phones']) {
                    return null;
                }
                $g = digits_tail($e['gbp']['phone']);
                foreach ($s['phones'] as $ph) {
                    if (digits_tail($ph) === $g) {
                        return [1.0, 'Même numéro sur le site et sur Google'];
                    }
                }
                return [0.0, 'Numéro différent entre le site et la fiche Google'];
            }],
    ];
}

/**
 * Catalogue des actions. impact : 3 très fort, 2 fort, 1 moyen. difficulty : 1 faible, 2 moyenne, 3 élevée.
 * when : s1..s4 (semaines du plan 30 jours), m3 (30-90 jours), m6 (90-180 jours).
 */
function actions(): array
{
    return [
        'create_site' => ['title' => 'Créer un site web professionnel', 'impact' => 3, 'difficulty' => 3, 'when' => 'm3',
            'why' => 'Sans site, vous n’existez pas pour les clients qui comparent sur Internet avant d’acheter.',
            'todo' => 'Un site simple et rapide : accueil, services, réalisations, contact avec WhatsApp. Pensé d’abord pour le mobile.'],
        'gbp_create' => ['title' => 'Créer et valider votre fiche Google Business', 'impact' => 3, 'difficulty' => 1, 'when' => 's1',
            'why' => 'C’est la première chose que voient vos clients quand ils cherchent votre activité sur Google ou Maps.',
            'todo' => 'Créer la fiche, la valider, renseigner catégorie, horaires, téléphone, site et 10 photos.'],
        'gbp_optimize' => ['title' => 'Compléter votre fiche Google Business', 'impact' => 2, 'difficulty' => 1, 'when' => 's1',
            'why' => 'Une fiche incomplète inspire moins confiance et apparaît moins souvent.',
            'todo' => 'Ajouter horaires, photos récentes, lien vers le site et numéro de téléphone. Publier une actualité par mois.'],
        'reviews' => ['title' => 'Lancer une campagne d’avis clients', 'impact' => 3, 'difficulty' => 1, 'when' => 's4',
            'why' => 'Les avis sont le premier critère de choix entre deux entreprises sur Google.',
            'todo' => 'Envoyer le lien d’avis par WhatsApp après chaque prestation, répondre à tous les avis, viser 10 nouveaux avis par mois.'],
        'whatsapp' => ['title' => 'Installer un bouton WhatsApp', 'impact' => 2, 'difficulty' => 1, 'when' => 's1',
            'why' => 'Au Gabon, WhatsApp est le canal de contact préféré. Chaque clic évité est un client gagné.',
            'todo' => 'Ajouter un bouton WhatsApp flottant et un lien wa.me dans les bios des réseaux, avec un message pré-rempli.'],
        'contact_channels' => ['title' => 'Rendre vos coordonnées complètes et cliquables', 'impact' => 2, 'difficulty' => 1, 'when' => 's1',
            'why' => 'Un client pressé doit pouvoir vous appeler, vous écrire ou venir vous voir en un geste.',
            'todo' => 'Téléphone cliquable, e-mail, adresse et plan Google Maps dans le pied de page et la page contact.'],
        'consistency' => ['title' => 'Uniformiser vos coordonnées partout', 'impact' => 2, 'difficulty' => 1, 'when' => 's1',
            'why' => 'Des informations contradictoires font perdre des clients et brouillent Google.',
            'todo' => 'Mêmes nom, numéro et adresse sur le site, Google, Facebook, Instagram et les annuaires.'],
        'pro_email' => ['title' => 'Passer à une adresse e-mail professionnelle', 'impact' => 1, 'difficulty' => 1, 'when' => 's1',
            'why' => 'Une adresse @gmail rassure moins qu’une adresse à votre nom de domaine.',
            'todo' => 'Créer contact@votre-domaine et l’utiliser partout (site, devis, signatures).'],
        'https' => ['title' => 'Sécuriser le site (HTTPS)', 'impact' => 3, 'difficulty' => 1, 'when' => 's2',
            'why' => 'Les navigateurs affichent « Non sécurisé » et Google pénalise les sites sans HTTPS.',
            'todo' => 'Activer le certificat SSL gratuit chez votre hébergeur et rediriger tout le site vers https://.'],
        'mobile' => ['title' => 'Rendre le site parfaitement lisible sur mobile', 'impact' => 3, 'difficulty' => 2, 'when' => 's2',
            'why' => 'La grande majorité des visites se fait depuis un smartphone.',
            'todo' => 'Mise en page responsive, boutons larges, textes lisibles sans zoom.'],
        'speed' => ['title' => 'Accélérer le chargement du site', 'impact' => 2, 'difficulty' => 2, 'when' => 's2',
            'why' => 'Sur une connexion mobile, chaque seconde d’attente fait fuir des visiteurs.',
            'todo' => 'Compresser les images, alléger les scripts, activer le cache et un hébergement performant.'],
        'seo_onpage' => ['title' => 'Optimiser titres, descriptions et H1', 'impact' => 2, 'difficulty' => 1, 'when' => 's2',
            'why' => 'Ce sont les textes que Google lit en premier pour décider sur quelles recherches vous montrer.',
            'todo' => 'Un titre clair par page (nom + activité + ville), une meta-description incitative, un seul H1, des images décrites.'],
        'seo_tech' => ['title' => 'Corriger les bases techniques du SEO', 'impact' => 2, 'difficulty' => 1, 'when' => 's2',
            'why' => 'Sans ces fichiers, Google explore mal votre site et vous classe moins bien.',
            'todo' => 'Ajouter sitemap.xml, robots.txt, balise canonique, langue et données structurées LocalBusiness.'],
        'site_structure' => ['title' => 'Structurer le site autour de vos services', 'impact' => 2, 'difficulty' => 2, 'when' => 's2',
            'why' => 'Un visiteur doit comprendre en dix secondes ce que vous faites et comment vous contacter.',
            'todo' => 'Une page par service, une page à propos, une page contact, et un menu clair qui les relie.'],
        'cta' => ['title' => 'Ajouter des appels à l’action visibles', 'impact' => 2, 'difficulty' => 1, 'when' => 's2',
            'why' => 'Sans invitation claire, le visiteur repart sans vous contacter.',
            'todo' => 'Un bouton « Demander un devis » ou « Écrire sur WhatsApp » en haut de chaque page.'],
        'contact_form' => ['title' => 'Mettre en place un formulaire de contact', 'impact' => 2, 'difficulty' => 1, 'when' => 's2',
            'why' => 'Certains clients préfèrent écrire, à toute heure, sans appeler.',
            'todo' => 'Un formulaire court (nom, téléphone, besoin) relié à votre e-mail et à WhatsApp.'],
        'content_seo' => ['title' => 'Publier du contenu utile et régulier', 'impact' => 1, 'difficulty' => 3, 'when' => 'm3',
            'why' => 'Le contenu fait remonter votre site sur les questions que se posent vos clients.',
            'todo' => 'Enrichir la page d’accueil puis publier 2 articles par mois répondant aux questions fréquentes.'],
        'local_seo' => ['title' => 'Travailler le référencement local', 'impact' => 2, 'difficulty' => 2, 'when' => 'm3',
            'why' => 'Vos clients cherchent « votre activité + votre ville ». Vous devez apparaître dans ces résultats.',
            'todo' => 'Citer la ville dans les titres, créer une page par zone desservie, s’inscrire dans les annuaires locaux.'],
        'social_proof' => ['title' => 'Montrer vos réalisations et témoignages', 'impact' => 2, 'difficulty' => 1, 'when' => 's4',
            'why' => 'Les preuves concrètes rassurent plus que n’importe quel slogan.',
            'todo' => 'Ajouter 3 à 6 réalisations avec photos et des témoignages clients nommés.'],
        'legal' => ['title' => 'Ajouter mentions légales et confidentialité', 'impact' => 1, 'difficulty' => 1, 'when' => 's2',
            'why' => 'C’est un gage de sérieux et une obligation dès que vous collectez des données.',
            'todo' => 'Une page mentions légales et une politique de confidentialité, liées depuis le pied de page.'],
        'maintenance' => ['title' => 'Mettre le site à jour', 'impact' => 1, 'difficulty' => 1, 'when' => 's3',
            'why' => 'Un site qui semble abandonné fait douter de l’activité de l’entreprise.',
            'todo' => 'Mettre à jour les informations, l’année, les offres et les photos.'],
        'social_setup' => ['title' => 'Ouvrir et optimiser vos réseaux sociaux clés', 'impact' => 2, 'difficulty' => 2, 'when' => 's3',
            'why' => 'Vos clients passent du temps sur Facebook et Instagram. Y être présent entretient la relation.',
            'todo' => 'Créer ou compléter Facebook, Instagram et LinkedIn : bio claire, lien WhatsApp, 8 publications par mois.'],
        'social_links' => ['title' => 'Relier le site et les réseaux sociaux', 'impact' => 1, 'difficulty' => 1, 'when' => 's1',
            'why' => 'Chaque canal doit renvoyer vers les autres pour multiplier les points de contact.',
            'todo' => 'Ajouter les icônes des réseaux dans l’en-tête ou le pied de page du site.'],
        'video' => ['title' => 'Lancer du contenu vidéo court', 'impact' => 1, 'difficulty' => 2, 'when' => 'm6',
            'why' => 'La vidéo courte est le format qui génère le plus de portée gratuite aujourd’hui.',
            'todo' => 'Ouvrir TikTok ou YouTube Shorts, publier 2 vidéos par semaine (coulisses, avant/après, conseils).'],
        'branding' => ['title' => 'Renforcer votre identité visuelle en ligne', 'impact' => 1, 'difficulty' => 1, 'when' => 's3',
            'why' => 'Une identité cohérente rend votre entreprise reconnaissable et professionnelle.',
            'todo' => 'Logo visible, favicon, image de partage, mêmes couleurs sur le site et les réseaux.'],
        'prerender' => ['title' => 'Rendre le contenu lisible par tous les robots', 'impact' => 2, 'difficulty' => 2, 'when' => 's2',
            'why' => 'Un site entièrement rendu en JavaScript est lu plus lentement par Google et mal par les autres plateformes.',
            'todo' => 'Activer le pré-rendu ou le rendu serveur (SSR) des pages principales, ou générer des pages statiques.'],
        'booking' => ['title' => 'Proposer la réservation ou la commande en ligne', 'impact' => 1, 'difficulty' => 2, 'when' => 'm3',
            'why' => 'Permettre de réserver ou commander 24 h/24 capte les clients hors des heures d’ouverture.',
            'todo' => 'Ajouter un module de prise de rendez-vous ou de commande, avec confirmation par WhatsApp ou e-mail.'],
    ];
}

const IMPACT_LABELS = [3 => 'Très fort', 2 => 'Fort', 1 => 'Moyen'];
const DIFFICULTY_LABELS = [1 => 'Faible', 2 => 'Moyenne', 3 => 'Élevée'];
const WHEN_LABELS = ['s1' => 'Semaine 1', 's2' => 'Semaine 2', 's3' => 'Semaine 3', 's4' => 'Semaine 4', 'm3' => '30 – 90 jours', 'm6' => '90 – 180 jours'];
