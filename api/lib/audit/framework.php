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

    return array_merge([
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
    ], criteria_extra());
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
        'security' => ['title' => 'Renforcer la sécurité du serveur', 'impact' => 1, 'difficulty' => 1, 'when' => 's2',
            'why' => 'Un site mal protégé peut être piraté, détourné ou signalé comme dangereux par les navigateurs.',
            'todo' => 'Activer les en-têtes de sécurité (HSTS, X-Content-Type-Options, X-Frame-Options, CSP) et masquer la version du serveur.'],
        'accessibility' => ['title' => 'Rendre le site accessible à tous', 'impact' => 1, 'difficulty' => 2, 'when' => 's3',
            'why' => 'Un site lisible par tous (malvoyants, seniors, petits écrans) touche plus de clients et plaît davantage à Google.',
            'todo' => 'Autoriser le zoom, nommer chaque champ et chaque lien, renforcer les contrastes.'],
        'chat' => ['title' => 'Ajouter une messagerie instantanée', 'impact' => 1, 'difficulty' => 1, 'when' => 's3',
            'why' => 'Un visiteur qui hésite pose sa question tout de suite au lieu de partir chez un concurrent.',
            'todo' => 'Installer un widget de discussion relié à WhatsApp ou à votre téléphone, avec réponses automatiques hors horaires.'],
        'newsletter' => ['title' => 'Collecter les contacts de vos visiteurs', 'impact' => 1, 'difficulty' => 1, 'when' => 'm3',
            'why' => 'Un contact collecté aujourd’hui est un client que vous pourrez relancer demain, gratuitement.',
            'todo' => 'Proposer une inscription (e-mail ou WhatsApp) contre une offre ou un conseil utile, puis envoyer une lettre par mois.'],
        'offers' => ['title' => 'Afficher vos prix et vos offres', 'impact' => 2, 'difficulty' => 1, 'when' => 's2',
            'why' => 'Sans indication de prix, beaucoup de visiteurs n’osent pas demander et vont voir ailleurs.',
            'todo' => 'Afficher des tarifs indicatifs, des formules ou des « à partir de », avec un bouton de demande de devis.'],
        'payment' => ['title' => 'Accepter le paiement mobile', 'impact' => 2, 'difficulty' => 2, 'when' => 'm3',
            'why' => 'Au Gabon, Airtel Money et Moov Money facilitent l’achat immédiat, sans déplacement.',
            'todo' => 'Afficher et activer les paiements Airtel Money, Moov Money et carte bancaire sur le site et dans vos échanges WhatsApp.'],
        'pro_domain' => ['title' => 'Passer à un nom de domaine à votre nom', 'impact' => 2, 'difficulty' => 1, 'when' => 's1',
            'why' => 'Un nom de domaine à votre nom (.ga ou .com) est plus facile à retenir et inspire confiance.',
            'todo' => 'Réserver votre-entreprise.ga ou .com et y rattacher le site et les adresses e-mail.'],
        'booking' => ['title' => 'Proposer la réservation ou la commande en ligne', 'impact' => 1, 'difficulty' => 2, 'when' => 'm3',
            'why' => 'Permettre de réserver ou commander 24 h/24 capte les clients hors des heures d’ouverture.',
            'todo' => 'Ajouter un module de prise de rendez-vous ou de commande, avec confirmation par WhatsApp ou e-mail.'],
    ];
}

const IMPACT_LABELS = [3 => 'Très fort', 2 => 'Fort', 1 => 'Moyen'];
const DIFFICULTY_LABELS = [1 => 'Faible', 2 => 'Moyenne', 3 => 'Élevée'];
const WHEN_LABELS = ['s1' => 'Semaine 1', 's2' => 'Semaine 2', 's3' => 'Semaine 3', 's4' => 'Semaine 4', 'm3' => '30 – 90 jours', 'm6' => '90 – 180 jours'];

/* =========================================================
   Référentiel étendu : critères techniques, sécurité, performance,
   accessibilité, preuves de confiance, conversion, identité et réputation.
   ========================================================= */
function crit(string $id, string $axis, int $w, string $action, string $label, callable $fn, ?string $needs = 'site'): array
{
    $c = ['id' => $id, 'axis' => $axis, 'w' => $w, 'action' => $action, 'label' => $label, 'fn' => $fn];
    if ($needs) {
        $c['needs'] = $needs;
    }
    return $c;
}

function criteria_extra(): array
{
    $S = fn($e) => !empty($e['site']['reachable']) ? $e['site'] : null;
    // Critère booléen lu dans les signaux étendus du site
    $flag = function (string $key, string $good, string $bad, bool $content = false, bool $invert = false) use ($S) {
        return function ($e) use ($S, $key, $good, $bad, $content, $invert) {
            $s = $S($e);
            if (!$s) {
                return [0.0, ''];
            }
            if ($content && !empty($s['spa'])) {
                return null;
            }
            $v = $s['x'][$key] ?? null;
            if ($v === null) {
                return null;
            }
            $ok = $invert ? !$v : (bool) $v;
            return [$ok ? 1.0 : 0.0, $ok ? $good : $bad];
        };
    };
    // Critère numérique : [seuil bon, seuil moyen], plus petit = meilleur si $lower
    $num = function (callable $get, float $good, float $mid, bool $lower, callable $note, bool $content = false) use ($S) {
        return function ($e) use ($S, $get, $good, $mid, $lower, $note, $content) {
            $s = $S($e);
            if (!$s) {
                return [0.0, ''];
            }
            if ($content && !empty($s['spa'])) {
                return null;
            }
            $v = $get($s, $e);
            if ($v === null) {
                return null;
            }
            $v = (float) $v;
            $score = $lower ? ($v <= $good ? 1.0 : ($v <= $mid ? 0.5 : 0.0)) : ($v >= $good ? 1.0 : ($v >= $mid ? 0.5 : 0.0));
            return [$score, $note($v)];
        };
    };
    $psi = function (string $key, float $good, float $mid, bool $lower, callable $note) {
        return function ($e) use ($key, $good, $mid, $lower, $note) {
            if (!isset($e['psi'][$key])) {
                return null;
            }
            $v = (float) $e['psi'][$key];
            $score = $lower ? ($v <= $good ? 1.0 : ($v <= $mid ? 0.5 : 0.0)) : ($v >= $good ? 1.0 : ($v >= $mid ? 0.5 : 0.0));
            return [$score, $note($v)];
        };
    };
    $gbp = function (callable $test, string $good, string $bad) {
        return fn($e) => $e['gbp'] ? ($test($e['gbp']) ? [1.0, $good] : [0.0, $bad]) : [0.0, ''];
    };
    $socialHas = fn(string $net, string $label) => function ($e) use ($net, $label) {
        $s = entity_socials($e);
        if (!empty($e['site']['spa']) && !$s) {
            return null;
        }
        return isset($s[$net]) ? [1.0, "Compte $label détecté"] : [0.0, "Aucun compte $label détecté"];
    };
    $fmt = fn($v, $d = 1) => number_format($v, $d, ',', ' ');

    return [
        // ---------- Référencement : bases techniques ----------
        crit('r_doctype', 'referencement', 1, 'seo_tech', 'Déclaration HTML5', $flag('doctype', 'Page déclarée en HTML5', 'Pas de déclaration HTML5 (<!doctype html>)')),
        crit('r_charset', 'referencement', 1, 'seo_tech', 'Encodage des caractères', $flag('charset', 'Encodage déclaré', 'Encodage non déclaré : risque d’accents mal affichés')),
        crit('r_http_redirect', 'referencement', 2, 'https', 'Redirection http → https', $flag('http_to_https', 'L’adresse http:// redirige vers https://', 'L’adresse http:// ne redirige pas vers la version sécurisée')),
        crit('r_canonical_ok', 'referencement', 1, 'seo_tech', 'Canonique vers votre domaine', $flag('canonical_ok', 'La balise canonique pointe vers votre domaine', 'La balise canonique pointe vers un autre domaine')),
        crit('r_sitemap_robots', 'referencement', 1, 'seo_tech', 'Sitemap déclaré dans robots.txt', $flag('sitemap_in_robots', 'Le plan du site est déclaré dans robots.txt', 'robots.txt ne déclare pas le plan du site')),
        crit('r_sitemap_depth', 'referencement', 1, 'content_seo', 'Pages déclarées à Google', $num(fn($s) => $s['sitemap'] ? $s['x']['sitemap_urls'] : null, 10, 3, false, fn($v) => (int) $v . ' page(s) dans le plan du site')),
        crit('r_404', 'referencement', 1, 'seo_tech', 'Vraie page d’erreur 404', $flag('real404', 'Les pages inexistantes renvoient une erreur 404', 'Les pages inexistantes ne renvoient pas d’erreur 404 (« soft 404 »)')),
        crit('r_links_ok', 'referencement', 2, 'maintenance', 'Liens internes fonctionnels', $num(fn($s) => $s['x']['links_checked'] ? $s['x']['links_ok'] / $s['x']['links_checked'] : null, 1, .75, false, fn($v) => round($v * 100) . ' % des liens testés fonctionnent')),
        crit('r_clean_urls', 'referencement', 1, 'seo_tech', 'Adresses de pages lisibles', $num(fn($s) => $s['internal_links'] ? $s['x']['query_links'] / $s['internal_links'] : null, .2, .5, true, fn($v) => round($v * 100) . ' % des liens internes contiennent des paramètres (?id=…)', true)),
        crit('r_h2', 'referencement', 1, 'seo_onpage', 'Sous-titres (H2)', $num(fn($s) => $s['h2'], 2, 1, false, fn($v) => (int) $v . ' sous-titre(s) H2 sur l’accueil', true)),
        crit('r_hierarchy', 'referencement', 1, 'seo_onpage', 'Hiérarchie des titres', $num(fn($s) => $s['x']['h3'] > 0 && $s['h2'] === 0 ? 0 : 1, 1, 1, false, fn($v) => $v ? 'Titres hiérarchisés correctement' : 'Des H3 sans H2 : structure de titres incohérente', true)),
        crit('r_title_desc', 'referencement', 1, 'seo_onpage', 'Description différente du titre', $flag('title_desc_diff', 'Titre et description sont complémentaires', 'La description reprend le titre ou est absente')),
        crit('r_h1_title', 'referencement', 1, 'seo_onpage', 'H1 différent du titre', $flag('h1_title_diff', 'Le H1 complète le titre de la page', 'Le H1 est identique au titre ou absent', true)),
        crit('r_desc_city', 'referencement', 1, 'local_seo', 'Ville dans la description', $flag('desc_city', 'La meta-description cite votre ville', 'La meta-description ne cite pas votre ville')),
        crit('r_text_ratio', 'referencement', 1, 'content_seo', 'Part de texte dans la page', $num(fn($s) => $s['x']['text_ratio'], .1, .04, false, fn($v) => 'Texte : ' . $fmt($v * 100) . ' % du code de la page', true)),
        crit('r_breadcrumb', 'referencement', 1, 'site_structure', 'Fil d’Ariane', $flag('breadcrumb', 'Fil d’Ariane présent', 'Pas de fil d’Ariane pour se repérer', true)),
        crit('r_schema_org', 'referencement', 2, 'seo_tech', 'Fiche entreprise structurée (LocalBusiness)', $flag('schema_org', 'Données « entreprise » déclarées à Google', 'Pas de données LocalBusiness / Organization pour Google')),
        crit('r_schema_address', 'referencement', 1, 'seo_tech', 'Adresse et téléphone structurés', $flag('schema_address', 'Adresse ou téléphone déclarés en données structurées', 'Adresse et téléphone non déclarés en données structurées')),
        crit('r_faq', 'referencement', 1, 'content_seo', 'Questions fréquentes', $flag('faq', 'Rubrique de questions fréquentes', 'Pas de questions fréquentes (FAQ)', true)),
        crit('r_compression', 'referencement', 2, 'speed', 'Compression des pages', $flag('compressed', 'Pages compressées (gzip / brotli)', 'Pages envoyées sans compression : chargement plus lent')),
        crit('r_cache', 'referencement', 1, 'speed', 'Mise en cache', $flag('cache', 'Règles de cache présentes', 'Aucune règle de cache navigateur')),
        crit('r_html_weight', 'referencement', 1, 'speed', 'Poids du code HTML', $num(fn($s) => $s['x']['html_kb'], 150, 400, true, fn($v) => 'Code HTML de ' . (int) $v . ' Ko')),
        crit('r_scripts', 'referencement', 1, 'speed', 'Nombre de scripts', $num(fn($s) => $s['scripts'], 20, 40, true, fn($v) => (int) $v . ' script(s) externe(s) chargé(s)')),
        crit('r_img_dims', 'referencement', 1, 'speed', 'Images dimensionnées', $num(fn($s) => $s['x']['img_dims'], .8, .4, false, fn($v) => round($v * 100) . ' % des images ont des dimensions déclarées', true)),
        crit('r_img_lazy', 'referencement', 1, 'speed', 'Chargement différé des images', $num(fn($s) => $s['images'] > 6 ? ($s['x']['img_lazy'] > 0 ? 1 : 0) : null, 1, 1, false, fn($v) => $v ? 'Images chargées au fil du défilement' : 'Toutes les images se chargent d’un coup', true)),
        crit('r_img_modern', 'referencement', 1, 'speed', 'Formats d’image modernes', $num(fn($s) => $s['images'] ? ($s['x']['img_modern'] > 0 ? 1 : 0) : null, 1, 1, false, fn($v) => $v ? 'Images WebP / AVIF utilisées' : 'Aucune image en format moderne (WebP / AVIF)', true)),
        crit('r_mixed', 'referencement', 2, 'https', 'Pas de contenu non sécurisé', $flag('mixed', 'Toutes les ressources sont chargées en https', 'Des ressources sont chargées en http sur une page https', false, true)),
        crit('r_deprecated', 'referencement', 1, 'maintenance', 'Code à jour', $flag('deprecated', 'Pas de balises obsolètes', 'Balises HTML obsolètes (font, center, marquee…)', false, true)),
        crit('r_flash', 'referencement', 1, 'maintenance', 'Pas de Flash', $flag('flash', 'Aucune technologie obsolète', 'Contenu Flash, illisible sur mobile', false, true)),
        crit('r_iframes', 'referencement', 1, 'speed', 'Contenus intégrés limités', $num(fn($s) => $s['x']['iframes'], 3, 6, true, fn($v) => (int) $v . ' contenu(s) intégré(s) (iframes)')),
        crit('r_psi_seo', 'referencement', 2, 'seo_tech', 'Score SEO Google (Lighthouse)', $psi('seo', 90, 70, false, fn($v) => 'Score SEO Google : ' . (int) $v . '/100')),
        crit('r_psi_a11y', 'referencement', 1, 'accessibility', 'Score accessibilité Google', $psi('accessibility', 80, 60, false, fn($v) => 'Score accessibilité Google : ' . (int) $v . '/100')),
        crit('r_psi_bp', 'referencement', 1, 'maintenance', 'Bonnes pratiques Google', $psi('best_practices', 80, 60, false, fn($v) => 'Score bonnes pratiques Google : ' . (int) $v . '/100')),
        crit('r_lcp', 'referencement', 2, 'speed', 'Affichage du contenu principal (LCP)', $psi('lcp', 2.5, 4, true, fn($v) => 'Contenu principal affiché en ' . $fmt($v) . ' s sur mobile')),
        crit('r_cls', 'referencement', 1, 'speed', 'Stabilité de la page (CLS)', $psi('cls', .1, .25, true, fn($v) => 'Décalage visuel : ' . $fmt($v, 2))),
        crit('r_tbt', 'referencement', 1, 'speed', 'Réactivité (TBT)', $psi('tbt', 200, 600, true, fn($v) => 'Page bloquée ' . (int) $v . ' ms au chargement')),
        crit('r_fcp', 'referencement', 1, 'speed', 'Premier affichage (FCP)', $psi('fcp', 1.8, 3, true, fn($v) => 'Premier affichage en ' . $fmt($v) . ' s sur mobile')),
        crit('r_zoom', 'referencement', 1, 'accessibility', 'Zoom autorisé sur mobile', $flag('zoom_blocked', 'Le zoom est autorisé sur mobile', 'Le zoom est bloqué sur mobile (gênant pour les malvoyants)', false, true)),
        crit('r_labels', 'referencement', 1, 'accessibility', 'Champs de formulaire identifiés', $num(fn($s) => $s['x']['inputs'] ? $s['x']['inputs_labelled'] / $s['x']['inputs'] : null, .8, .5, false, fn($v) => round($v * 100) . ' % des champs ont un libellé', true)),
        crit('r_empty_links', 'referencement', 1, 'accessibility', 'Liens explicites', $num(fn($s) => $s['x']['links_total'] ? $s['x']['empty_links'] / $s['x']['links_total'] : null, .05, .15, true, fn($v) => round($v * 100) . ' % des liens n’ont aucun texte', true)),

        // ---------- Crédibilité : sécurité et preuves de confiance ----------
        crit('cr_hsts', 'credibilite', 1, 'security', 'HTTPS imposé (HSTS)', $flag('hsts', 'HTTPS imposé par le serveur', 'Le serveur n’impose pas HTTPS (HSTS)')),
        crit('cr_nosniff', 'credibilite', 1, 'security', 'Protection des types de fichiers', $flag('nosniff', 'En-tête X-Content-Type-Options présent', 'En-tête X-Content-Type-Options absent')),
        crit('cr_frame', 'credibilite', 1, 'security', 'Protection contre le détournement de clic', $flag('frame', 'Le site ne peut pas être intégré à votre insu', 'Le site peut être intégré dans un autre site (clickjacking)')),
        crit('cr_referrer', 'credibilite', 1, 'security', 'Politique de référent', $flag('referrer', 'Politique de référent définie', 'Politique de référent non définie')),
        crit('cr_csp', 'credibilite', 1, 'security', 'Politique de sécurité du contenu', $flag('csp', 'Politique de sécurité (CSP) définie', 'Pas de politique de sécurité du contenu (CSP)')),
        crit('cr_version', 'credibilite', 1, 'security', 'Version du serveur masquée', $flag('version_leak', 'Version du serveur non exposée', 'Le serveur affiche sa version logicielle', false, true)),
        crit('cr_team', 'credibilite', 1, 'social_proof', 'Équipe présentée', $flag('team', 'L’équipe ou le dirigeant est présenté', 'Aucune présentation de l’équipe', true)),
        crit('cr_since', 'credibilite', 1, 'social_proof', 'Ancienneté affichée', $flag('since', 'Ancienneté ou date de création affichée', 'Ancienneté non mentionnée', true)),
        crit('cr_certif', 'credibilite', 1, 'social_proof', 'Agréments et partenaires', $flag('certif', 'Agréments, labels ou partenaires mis en avant', 'Aucun agrément, label ou partenaire mis en avant', true)),
        crit('cr_clients', 'credibilite', 2, 'social_proof', 'Références clients', $flag('clients_logos', 'Références ou clients mis en avant', 'Aucune référence client mise en avant', true)),
        crit('cr_figures', 'credibilite', 1, 'social_proof', 'Chiffres clés', $flag('figures', 'Chiffres clés affichés (clients, projets…)', 'Aucun chiffre clé pour rassurer', true)),
        crit('cr_guarantee', 'credibilite', 1, 'social_proof', 'Garanties et service après-vente', $flag('guarantee', 'Garantie ou service après-vente mentionné', 'Aucune garantie ni service après-vente mentionné', true)),
        crit('cr_press', 'credibilite', 1, 'social_proof', 'Retombées presse', $flag('press', 'Mentions presse affichées', 'Aucune mention presse', true)),
        crit('cr_legal_ids', 'credibilite', 2, 'legal', 'Identifiants légaux (RCCM, NIF)', $flag('legal_ids', 'Identifiants légaux affichés (RCCM, NIF…)', 'RCCM / NIF non affichés', true)),
        crit('cr_cookies', 'credibilite', 1, 'legal', 'Protection des données', $flag('cookies', 'Information sur les données personnelles', 'Aucune information sur les données personnelles', true)),
        crit('cr_reviews_widget', 'credibilite', 1, 'reviews', 'Avis affichés sur le site', $flag('reviews_widget', 'Notes ou avis clients affichés', 'Aucune note ni avis client affiché', true)),
        crit('cr_video', 'credibilite', 1, 'video', 'Vidéo sur le site', $flag('video', 'Vidéo présente sur le site', 'Aucune vidéo sur le site', true)),
        crit('cr_footer', 'credibilite', 1, 'site_structure', 'Pied de page complet', $flag('footer', 'Pied de page présent', 'Pas de pied de page structuré', true)),
        crit('cr_nav', 'credibilite', 1, 'site_structure', 'Menu de navigation', $flag('nav', 'Menu de navigation présent', 'Pas de menu de navigation identifiable', true)),

        // ---------- Conversion ----------
        crit('c_cta_top', 'conversion', 2, 'cta', 'Appel à l’action dès l’arrivée', $flag('cta_top', 'Une invitation à agir dès le haut de page', 'Aucune invitation à agir en haut de page', true)),
        crit('c_cta_count', 'conversion', 1, 'cta', 'Appels à l’action répétés', $num(fn($s) => $s['x']['cta_count'], 3, 1, false, fn($v) => (int) $v . ' appel(s) à l’action sur l’accueil', true)),
        crit('c_tel_header', 'conversion', 1, 'contact_channels', 'Téléphone dans l’en-tête', $flag('tel_header', 'Téléphone visible dans l’en-tête', 'Téléphone absent de l’en-tête', true)),
        crit('c_form_short', 'conversion', 1, 'contact_form', 'Formulaire court', $num(fn($s) => $s['forms'] ? $s['x']['max_fields'] : null, 6, 9, true, fn($v) => 'Formulaire de ' . (int) $v . ' champ(s)', true)),
        crit('c_channels', 'conversion', 2, 'contact_channels', 'Plusieurs moyens de contact', $num(fn($s) => (int) $s['tel'] + (int) ($s['mailto'] || $s['emails']) + (int) $s['whatsapp'] + (int) ($s['forms'] > 0), 3, 2, false, fn($v) => (int) $v . ' moyen(s) de contact (téléphone, e-mail, WhatsApp, formulaire)', true)),
        crit('c_wa_prefill', 'conversion', 1, 'whatsapp', 'Message WhatsApp pré-rempli', $num(fn($s) => $s['whatsapp'] ? (int) $s['x']['wa_prefill'] : null, 1, 1, false, fn($v) => $v ? 'Lien WhatsApp avec message pré-rempli' : 'Lien WhatsApp sans message pré-rempli', true)),
        crit('c_chat', 'conversion', 1, 'chat', 'Messagerie instantanée', $flag('chat', 'Messagerie instantanée sur le site', 'Pas de messagerie instantanée', true)),
        crit('c_newsletter', 'conversion', 1, 'newsletter', 'Inscription à la newsletter', $flag('newsletter', 'Collecte d’e-mails (newsletter)', 'Aucune collecte d’e-mails de visiteurs', true)),
        crit('c_prices', 'conversion', 2, 'offers', 'Prix ou offres affichés', $flag('prices', 'Prix ou tarifs indicatifs affichés', 'Aucun prix ni tarif indicatif', true)),
        crit('c_payment', 'conversion', 2, 'payment', 'Paiement mobile / en ligne', $flag('payment', 'Moyens de paiement en ligne ou mobile mentionnés', 'Aucun paiement mobile (Airtel Money, Moov Money) ni en ligne', true)),
        crit('c_quote', 'conversion', 1, 'cta', 'Demande de devis', $flag('quote', 'Demande de devis proposée', 'Pas de demande de devis', true)),
        crit('c_hours', 'conversion', 1, 'contact_channels', 'Horaires sur le site', $flag('contact_hours', 'Horaires d’ouverture indiqués', 'Horaires d’ouverture absents du site', true)),

        // ---------- Identité digitale ----------
        crit('i_domain_name', 'identite', 2, 'pro_domain', 'Nom de domaine à votre nom', $flag('domain_name', 'Le nom de domaine reprend le nom de l’entreprise', 'Le nom de domaine ne reprend pas le nom de l’entreprise')),
        crit('i_free_host', 'identite', 2, 'pro_domain', 'Domaine professionnel', $flag('free_host', 'Nom de domaine professionnel', 'Site hébergé sur un sous-domaine gratuit (Wix, Blogspot…)', false, true)),
        crit('i_og_desc', 'identite', 1, 'branding', 'Description de partage', $flag('og_desc', 'Description prévue pour les partages', 'Pas de description pour les partages')),
        crit('i_twitter', 'identite', 1, 'branding', 'Carte de partage X / Twitter', $flag('twitter', 'Carte de partage X / Twitter définie', 'Pas de carte de partage X / Twitter')),
        crit('i_theme', 'identite', 1, 'branding', 'Couleur de marque sur mobile', $flag('theme_color', 'Couleur de marque définie pour le mobile', 'Pas de couleur de marque pour le navigateur mobile')),
        crit('i_apple', 'identite', 1, 'branding', 'Icône pour écran d’accueil', $flag('apple_icon', 'Icône prévue pour l’écran d’accueil', 'Pas d’icône pour l’écran d’accueil des smartphones')),
        crit('i_manifest', 'identite', 1, 'branding', 'Installation sur mobile (manifeste)', $flag('manifest', 'Site installable sur mobile', 'Site non installable sur mobile (pas de manifeste)')),
        crit('i_logo_home', 'identite', 1, 'branding', 'Logo cliquable vers l’accueil', $flag('logo_home', 'Le logo ramène à l’accueil', 'Le logo ne ramène pas à l’accueil', true)),
        crit('i_footer_name', 'identite', 1, 'branding', 'Nom dans le copyright', $flag('name_in_footer', 'Nom de l’entreprise dans le copyright', 'Nom de l’entreprise absent du copyright', true)),
        crit('i_sitename', 'identite', 1, 'branding', 'Nom du site déclaré', fn($e) => $S($e) ? ($e['site']['site_name'] !== '' ? [1.0, 'Nom du site déclaré : ' . $e['site']['site_name']] : [0.0, 'Nom du site non déclaré pour les partages']) : [0.0, '']),

        // ---------- Réseaux sociaux ----------
        crit('s_tiktok', 'reseaux', 1, 'video', 'Compte TikTok', $socialHas('tiktok', 'TikTok'), null),
        crit('s_youtube', 'reseaux', 1, 'video', 'Chaîne YouTube', $socialHas('youtube', 'YouTube'), null),
        crit('s_x', 'reseaux', 1, 'social_setup', 'Compte X (Twitter)', $socialHas('x', 'X (Twitter)'), null),
        crit('s_count', 'reseaux', 2, 'social_setup', 'Présence sur 3 réseaux ou plus', function ($e) {
            $n = count(entity_socials($e));
            if (!empty($e['site']['spa']) && !$n) {
                return null;
            }
            return [$n >= 3 ? 1.0 : ($n === 2 ? 0.5 : 0.0), "$n réseau(x) social(aux) au total"];
        }, null),
        crit('s_share', 'reseaux', 1, 'social_links', 'Boutons de partage', $flag('share', 'Boutons de partage présents', 'Pas de boutons de partage', true)),
        crit('s_embed', 'reseaux', 1, 'social_links', 'Publications intégrées au site', $flag('social_embed', 'Fil de publications intégré au site', 'Aucun fil de publications intégré au site', true)),

        // ---------- Visibilité ----------
        crit('v_top3', 'visibilite', 2, 'local_seo', 'Dans le top 3 local', function ($e) {
            if (!isset($e['rank'])) {
                return null;
            }
            $r = (int) $e['rank'];
            return $r >= 1 && $r <= 3 ? [1.0, "Dans le top 3 sur « {$e['query']} »"] : [0.0, "Hors du top 3 sur « {$e['query']} »"];
        }, null),
        crit('v_pages', 'visibilite', 1, 'content_seo', 'Nombre de pages du site', $num(fn($s) => $s['sitemap'] ? $s['x']['sitemap_urls'] : $s['internal_links'], 20, 6, false, fn($v) => (int) $v . ' page(s) détectée(s)')),

        // ---------- Réputation (Google Business) ----------
        crit('rep_reviews_rel', 'reputation', 2, 'reviews', 'Avis face aux concurrents', function ($e) {
            if (!$e['gbp'] || empty($e['comp_reviews_avg'])) {
                return $e['gbp'] ? null : [0.0, ''];
            }
            $r = $e['gbp']['reviews'] / $e['comp_reviews_avg'];
            return [$r >= 1 ? 1.0 : ($r >= .6 ? 0.5 : 0.0), $e['gbp']['reviews'] . ' avis contre ' . (int) $e['comp_reviews_avg'] . ' en moyenne chez vos concurrents'];
        }, 'gbp'),
        crit('rep_rating_rel', 'reputation', 1, 'reviews', 'Note face aux concurrents', function ($e) {
            if (!$e['gbp'] || empty($e['comp_rating_avg']) || $e['gbp']['rating'] === null) {
                return $e['gbp'] ? null : [0.0, ''];
            }
            $d = $e['gbp']['rating'] - $e['comp_rating_avg'];
            return [$d >= 0 ? 1.0 : ($d >= -.3 ? 0.5 : 0.0), 'Note ' . number_format($e['gbp']['rating'], 1, ',', '') . ' contre ' . number_format($e['comp_rating_avg'], 1, ',', '') . ' en moyenne chez vos concurrents'];
        }, 'gbp'),
        crit('rep_status', 'reputation', 1, 'gbp_optimize', 'Fiche Google active', $gbp(fn($g) => $g['status'] === '' || $g['status'] === 'OPERATIONAL', 'Fiche Google active', 'Fiche Google signalée comme fermée'), 'gbp'),
        crit('rep_category', 'reputation', 1, 'gbp_optimize', 'Catégorie Google renseignée', $gbp(fn($g) => $g['type'] !== '', 'Catégorie principale renseignée', 'Catégorie principale non renseignée'), 'gbp'),
        crit('rep_address', 'reputation', 1, 'gbp_optimize', 'Adresse sur Google', $gbp(fn($g) => $g['address'] !== '', 'Adresse renseignée sur Google', 'Adresse absente de la fiche Google'), 'gbp'),
        crit('rep_summary', 'reputation', 1, 'gbp_optimize', 'Description de la fiche Google', $gbp(fn($g) => $g['summary'] !== '', 'Description présente sur la fiche', 'Fiche Google sans description'), 'gbp'),
    ];
}

/**
 * Hypothèses de ROI par action (barème indicatif NEAM, à ajuster ici).
 * up : hausse estimée du chiffre d'affaires mensuel en % [prudent, optimiste]
 * cost : coût de mise en œuvre en FCFA [bas, haut] — 0 si faisable soi-même
 * days : délai de mise en œuvre en jours ouvrés
 */
function action_roi(): array
{
    return [
        'create_site' => ['up' => [8, 20], 'cost' => [400000, 1500000], 'days' => 20],
        'gbp_create' => ['up' => [3, 8], 'cost' => [0, 50000], 'days' => 2],
        'gbp_optimize' => ['up' => [1, 3], 'cost' => [0, 30000], 'days' => 1],
        'reviews' => ['up' => [2, 6], 'cost' => [0, 50000], 'days' => 3],
        'whatsapp' => ['up' => [2, 5], 'cost' => [0, 30000], 'days' => 1],
        'contact_channels' => ['up' => [1, 3], 'cost' => [0, 30000], 'days' => 1],
        'consistency' => ['up' => [0.5, 2], 'cost' => [0, 25000], 'days' => 1],
        'pro_email' => ['up' => [0.5, 1], 'cost' => [15000, 60000], 'days' => 1],
        'pro_domain' => ['up' => [1, 2], 'cost' => [15000, 60000], 'days' => 1],
        'https' => ['up' => [1, 3], 'cost' => [0, 50000], 'days' => 1],
        'mobile' => ['up' => [3, 8], 'cost' => [150000, 600000], 'days' => 7],
        'speed' => ['up' => [1, 4], 'cost' => [100000, 400000], 'days' => 5],
        'seo_onpage' => ['up' => [2, 5], 'cost' => [50000, 200000], 'days' => 3],
        'seo_tech' => ['up' => [1, 3], 'cost' => [50000, 150000], 'days' => 2],
        'site_structure' => ['up' => [2, 5], 'cost' => [150000, 500000], 'days' => 7],
        'cta' => ['up' => [2, 5], 'cost' => [30000, 100000], 'days' => 2],
        'contact_form' => ['up' => [1, 3], 'cost' => [30000, 100000], 'days' => 2],
        'content_seo' => ['up' => [3, 8], 'cost' => [300000, 900000], 'days' => 30],
        'local_seo' => ['up' => [3, 7], 'cost' => [100000, 350000], 'days' => 10],
        'social_proof' => ['up' => [1, 4], 'cost' => [30000, 150000], 'days' => 3],
        'legal' => ['up' => [0.5, 1], 'cost' => [30000, 100000], 'days' => 2],
        'maintenance' => ['up' => [0.5, 2], 'cost' => [30000, 150000], 'days' => 3],
        'social_setup' => ['up' => [2, 6], 'cost' => [100000, 400000], 'days' => 10],
        'social_links' => ['up' => [0.5, 1], 'cost' => [0, 20000], 'days' => 1],
        'video' => ['up' => [2, 6], 'cost' => [150000, 600000], 'days' => 20],
        'branding' => ['up' => [0.5, 2], 'cost' => [50000, 300000], 'days' => 5],
        'booking' => ['up' => [2, 6], 'cost' => [150000, 600000], 'days' => 7],
        'prerender' => ['up' => [1, 3], 'cost' => [150000, 500000], 'days' => 5],
        'security' => ['up' => [0.5, 1], 'cost' => [30000, 100000], 'days' => 1],
        'accessibility' => ['up' => [0.5, 2], 'cost' => [50000, 200000], 'days' => 3],
        'chat' => ['up' => [1, 3], 'cost' => [0, 100000], 'days' => 1],
        'newsletter' => ['up' => [1, 3], 'cost' => [30000, 150000], 'days' => 2],
        'offers' => ['up' => [2, 5], 'cost' => [30000, 150000], 'days' => 2],
        'payment' => ['up' => [3, 8], 'cost' => [100000, 400000], 'days' => 5],
    ];
}
