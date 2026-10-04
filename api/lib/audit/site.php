<?php
/* =========================================================
   NEAM Digital Score — Collecte des données d'un site web
   Page d'accueil + page contact + robots.txt + sitemap.xml
   ========================================================= */
declare(strict_types=1);

const SOCIAL_PATTERNS = [
    'facebook'  => '#^https?://(?:[a-z-]+\.)?(?:facebook\.com|fb\.com|fb\.me)/(?!sharer|share|dialog|plugins|tr\b|groups/?$)[^\s"\'?#]+#i',
    'instagram' => '#^https?://(?:www\.)?instagram\.com/(?!p/|explore|reel/)[^\s"\'?#]+#i',
    'linkedin'  => '#^https?://(?:[a-z]{2,3}\.)?linkedin\.com/(?:company|in|school|showcase)/[^\s"\'?#]+#i',
    'tiktok'    => '#^https?://(?:www\.)?tiktok\.com/@[^\s"\'?#]+#i',
    'youtube'   => '#^https?://(?:www\.)?youtube\.com/(?:@|channel/|c/|user/)[^\s"\'?#]+#i',
    'x'         => '#^https?://(?:www\.)?(?:twitter\.com|x\.com)/(?!intent|share|home)[^\s"\'?#]+#i',
];

function text_has(string $text, array $words): bool
{
    foreach ($words as $w) {
        if (mb_stripos($text, $w) !== false) {
            return true;
        }
    }
    return false;
}

function absolute_url(string $base, string $href): string
{
    if (preg_match('#^https?://#i', $href)) {
        return $href;
    }
    $b = parse_url($base);
    $root = $b['scheme'] . '://' . $b['host'];
    if (strpos($href, '//') === 0) {
        return $b['scheme'] . ':' . $href;
    }
    if (strpos($href, '/') === 0) {
        return $root . $href;
    }
    $dir = preg_replace('#/[^/]*$#', '/', $b['path'] ?? '/');
    return $root . $dir . $href;
}

/** Extrait les signaux utiles d'une page HTML. */
function parse_page(string $html, string $url): array
{
    $doc = new DOMDocument();
    libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_NONET | LIBXML_NOWARNING | LIBXML_NOERROR);
    libxml_clear_errors();
    $xp = new DOMXPath($doc);
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    $bare = preg_replace('/^www\./', '', $host);

    $meta = function (string $attr, string $name) use ($xp): string {
        $n = $xp->query("//meta[translate(@$attr,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='$name']/@content")->item(0);
        return $n ? trim($n->nodeValue) : '';
    };
    $title = trim((string) ($xp->query('//title')->item(0)->textContent ?? ''));
    $h1 = [];
    foreach ($xp->query('//h1') as $n) {
        $t = trim(preg_replace('/\s+/', ' ', $n->textContent));
        if ($t !== '') {
            $h1[] = mb_substr($t, 0, 140);
        }
    }

    // Texte visible
    foreach ($xp->query('//script|//style|//noscript|//template') as $n) {
        $n->parentNode->removeChild($n);
    }
    $body = $xp->query('//body')->item(0);
    $text = trim(preg_replace('/\s+/u', ' ', $body ? $body->textContent : ''));

    $links = ['internal' => [], 'external' => 0];
    $social = [];
    $tel = $mailto = $whatsapp = $maps = $booking = false;
    $phones = $emails = [];
    foreach ($xp->query('//a[@href]') as $a) {
        $href = trim($a->getAttribute('href'));
        $label = mb_strtolower(trim(preg_replace('/\s+/', ' ', $a->textContent . ' ' . $a->getAttribute('title') . ' ' . $a->getAttribute('aria-label'))));
        if (stripos($href, 'tel:') === 0) {
            $num = trim(urldecode(substr($href, 4)));
            if (strlen(preg_replace('/\D/', '', $num)) >= 8) {
                $tel = true;
                $phones[] = $num;
            }
            continue;
        }
        if (stripos($href, 'mailto:') === 0) {
            $mailto = true;
            $emails[] = strtolower(trim(explode('?', substr($href, 7))[0]));
            continue;
        }
        if (preg_match('#(wa\.me/|api\.whatsapp\.com|whatsapp://|web\.whatsapp\.com|chat\.whatsapp\.com)#i', $href)) {
            $whatsapp = true;
        }
        if (preg_match('#(google\.[a-z.]+/maps|maps\.google|goo\.gl/maps|maps\.app\.goo\.gl)#i', $href)) {
            $maps = true;
        }
        if (preg_match('#(calendly\.com|setmore|booksy|simplybook|zcal|cal\.com|reservation|booking|rendez-vous|prendre-rdv)#i', $href)) {
            $booking = true;
        }
        foreach (SOCIAL_PATTERNS as $net => $re) {
            if (!isset($social[$net]) && preg_match($re, $href, $m)) {
                $social[$net] = rtrim($m[0], '/');
            }
        }
        if (preg_match('#^(mailto|javascript|data):#i', $href) || $href === '' || $href[0] === '#') {
            continue;
        }
        $abs = absolute_url($url, $href);
        $h = preg_replace('/^www\./', '', strtolower((string) parse_url($abs, PHP_URL_HOST)));
        if ($h === $bare) {
            $links['internal'][strtok($abs, '#')] = $label;
        } else {
            $links['external']++;
        }
    }
    foreach ($xp->query('//iframe[@src]') as $f) {
        if (preg_match('#google\.[a-z.]+/maps|maps\.google#i', $f->getAttribute('src'))) {
            $maps = true;
        }
    }
    if (preg_match_all('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i', $text, $m)) {
        foreach ($m[0] as $e) {
            $emails[] = strtolower($e);
        }
    }
    if (preg_match_all('/(?:\+|00)\s?241[\s.\-]?(?:\d[\s.\-]?){7,8}|\b0[1-7](?:[\s.\-]?\d{2}){3}\b/', $text, $m)) {
        foreach ($m[0] as $ph) {
            $phones[] = trim($ph);
        }
    }

    $imgs = $xp->query('//img');
    $withAlt = 0;
    $logo = false;
    foreach ($imgs as $img) {
        if (trim($img->getAttribute('alt')) !== '') {
            $withAlt++;
        }
        $sig = strtolower($img->getAttribute('src') . ' ' . $img->getAttribute('alt') . ' ' . $img->getAttribute('class') . ' ' . $img->getAttribute('id'));
        if (strpos($sig, 'logo') !== false) {
            $logo = true;
        }
    }
    if (!$logo && $xp->query("//*[contains(translate(@class,'LOGO','logo'),'logo') or contains(translate(@id,'LOGO','logo'),'logo')]")->length) {
        $logo = true;
    }

    $forms = 0;
    foreach ($xp->query('//form') as $f) {
        if ($xp->query('.//input[not(@type="hidden")]|.//textarea|.//select', $f)->length >= 2) {
            $forms++;
        }
    }
    $jsonld = [];
    foreach ((new DOMXPath($doc))->query('//script[@type="application/ld+json"]') as $s) {
        if (preg_match_all('/"@type"\s*:\s*"([^"]+)"/', $s->textContent, $m)) {
            $jsonld = array_merge($jsonld, $m[1]);
        }
    }
    // Les scripts ont été retirés plus haut : on relit le HTML brut pour les données structurées
    if (!$jsonld && preg_match_all('#<script[^>]+application/ld\+json[^>]*>(.*?)</script>#is', $html, $m)) {
        foreach ($m[1] as $block) {
            if (preg_match_all('/"@type"\s*:\s*"([^"]+)"/', $block, $mm)) {
                $jsonld = array_merge($jsonld, $mm[1]);
            }
        }
    }
    $favicon = (bool) preg_match('#<link[^>]+rel=["\'][^"\']*icon#i', $html);
    $lower = mb_strtolower($text);
    $years = [];
    if (preg_match_all('/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/iu', $text, $m)) {
        $years = array_map('intval', $m[1]);
    }

    return [
        'title' => mb_substr($title, 0, 200),
        'description' => mb_substr($meta('name', 'description'), 0, 400),
        'robots_meta' => strtolower($meta('name', 'robots')),
        'viewport' => $meta('name', 'viewport') !== '',
        'canonical' => (bool) $xp->query('//link[@rel="canonical"]')->length,
        'lang' => trim((string) ($xp->query('//html/@lang')->item(0)->nodeValue ?? '')),
        'og_title' => $meta('property', 'og:title') !== '',
        'og_image' => $meta('property', 'og:image') !== '',
        'site_name' => mb_substr($meta('property', 'og:site_name'), 0, 120),
        'generator' => mb_substr($meta('name', 'generator'), 0, 80),
        'favicon' => $favicon,
        'logo' => $logo,
        'h1' => array_slice($h1, 0, 5),
        'h2' => $xp->query('//h2')->length,
        'images' => $imgs->length,
        'images_alt' => $withAlt,
        'internal_links' => $links['internal'],
        'external_links' => $links['external'],
        'social' => $social,
        'tel' => $tel,
        'mailto' => $mailto,
        'whatsapp' => $whatsapp || text_has($lower, ['whatsapp']),
        'maps' => $maps,
        'booking' => $booking || text_has($lower, ['prendre rendez-vous', 'réserver en ligne', 'réservation en ligne', 'commander en ligne', 'ajouter au panier', 'book now', 'réservez maintenant']),
        'forms' => $forms,
        'jsonld' => array_values(array_unique($jsonld)),
        'phones' => array_values(array_unique(array_filter($phones))),
        'emails' => array_values(array_unique(array_filter($emails, fn($e) => !preg_match('/\.(png|jpe?g|gif|webp|svg)$/', $e)))),
        'words' => count(preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY)),
        'scripts' => preg_match_all('#<script[^>]+src=#i', $html),
        'styles' => preg_match_all('#<link[^>]+stylesheet#i', $html),
        'text' => mb_substr($lower, 0, 60000),
        'copyright_year' => $years ? max($years) : null,
    ];
}

/** Audit complet d'un site : renvoie les signaux bruts (sans le texte) pour le moteur de score. */
function collect_site(string $url, string $company = '', string $city = ''): array
{
    $first = fetch_many(['home' => $url], 12);
    $home = $first['home'];
    if (!$home['ok']) {
        // Deuxième essai en http:// si https:// ne répond pas
        if (stripos($url, 'https://') === 0) {
            $alt = 'http://' . substr($url, 8);
            $retry = fetch_many(['home' => $alt], 10)['home'];
            if ($retry['ok']) {
                $home = $retry;
            }
        }
    }
    if (!$home['ok']) {
        $err = $home['error'] ?: ('erreur HTTP ' . $home['status']);
        return ['reachable' => false, 'url' => $url, 'status' => $home['status'], 'error' => $err];
    }

    $final = $home['url'];
    $p = parse_page($home['body'], $final);
    $root = parse_url($final, PHP_URL_SCHEME) . '://' . parse_url($final, PHP_URL_HOST);

    // Pages internes utiles : contact, à propos, mentions légales
    $find = function (array $words) use ($p): ?string {
        foreach ($p['internal_links'] as $href => $label) {
            $hay = mb_strtolower($href . ' ' . $label);
            if (text_has($hay, $words)) {
                return $href;
            }
        }
        return null;
    };
    $contactUrl = $find(['contact', 'nous-joindre', 'nous joindre', 'écrivez-nous']);
    $aboutUrl = $find(['a-propos', 'about', 'qui-sommes', 'qui sommes', 'à propos', 'notre-histoire', 'entreprise']);
    $legalUrl = $find(['mentions', 'legal', 'cgu', 'cgv', 'confidentialit', 'privacy', 'conditions']);
    $blogUrl = $find(['blog', 'actualit', 'news', 'articles', 'conseils']);
    $servicesUrl = $find(['services', 'prestations', 'nos-offres', 'produits', 'solutions', 'expertises']);

    $jobs = ['robots' => $root . '/robots.txt', 'sitemap' => $root . '/sitemap.xml'];
    if ($contactUrl && $contactUrl !== $final) {
        $jobs['contact'] = $contactUrl;
    }
    $more = fetch_many($jobs, 8, 800000);

    $robotsOk = $more['robots']['ok'] && stripos($more['robots']['body'], 'user-agent') !== false;
    $sitemapOk = $more['sitemap']['ok'] && stripos($more['sitemap']['body'], '<urlset') !== false || ($more['sitemap']['ok'] && stripos($more['sitemap']['body'], '<sitemapindex') !== false);
    if (!$sitemapOk && $robotsOk && preg_match('/^\s*sitemap:\s*(\S+)/im', $more['robots']['body'], $m)) {
        $sm = fetch_many(['s' => trim($m[1])], 8, 800000)['s'];
        $sitemapOk = $sm['ok'] && preg_match('/<(urlset|sitemapindex)/i', $sm['body']);
    }
    $robotsBlocks = $robotsOk && preg_match('/user-agent:\s*\*\s*(?:\r?\n(?!user-agent).*)*?\r?\ndisallow:\s*\/\s*$/im', $more['robots']['body']);

    $c = null;
    if (isset($more['contact']) && $more['contact']['ok']) {
        $c = parse_page($more['contact']['body'], $more['contact']['url']);
    }
    $merge = fn(string $k) => $p[$k] || ($c && $c[$k]);

    $text = $p['text'] . ($c ? ' ' . $c['text'] : '');
    $companyLow = mb_strtolower(trim($company));
    $cityLow = mb_strtolower(trim($city));
    $nameTokens = array_filter(preg_split('/[\s\-_.&]+/u', $companyLow), fn($t) => mb_strlen($t) >= 3);
    $nameIn = function (string $hay) use ($companyLow, $nameTokens): bool {
        if ($companyLow === '') {
            return false;
        }
        if (mb_stripos($hay, $companyLow) !== false) {
            return true;
        }
        foreach ($nameTokens as $t) {
            if (mb_stripos($hay, $t) !== false) {
                return true;
            }
        }
        return false;
    };
    $host = preg_replace('/^www\./', '', strtolower((string) parse_url($final, PHP_URL_HOST)));
    $socialAll = $p['social'] + ($c['social'] ?? []);

    // Site construit en JavaScript (React, Vue…) : le HTML reçu est presque vide
    $spa = $p['words'] < 40 && ($p['scripts'] > 0 || preg_match('#<div[^>]+id=["\'](root|app|__next|__nuxt)["\']#i', $home['body']));

    return [
        'reachable' => true,
        'spa' => (bool) $spa,
        'url' => $final,
        'host' => $host,
        'https' => stripos($final, 'https://') === 0,
        'status' => $home['status'],
        'time' => $home['time'],
        'size_kb' => (int) round($home['size'] / 1024),
        'title' => $p['title'],
        'description' => $p['description'],
        'site_name' => $p['site_name'],
        'h1' => $p['h1'],
        'h2' => $p['h2'],
        'lang' => $p['lang'],
        'viewport' => $p['viewport'],
        'canonical' => $p['canonical'],
        'noindex' => strpos($p['robots_meta'], 'noindex') !== false,
        'og' => $p['og_title'] && $p['og_image'],
        'favicon' => $p['favicon'],
        'logo' => $p['logo'],
        'images' => $p['images'],
        'images_alt' => $p['images_alt'],
        'internal_links' => count($p['internal_links']),
        'words' => $p['words'],
        'scripts' => $p['scripts'],
        'jsonld' => $p['jsonld'],
        'generator' => $p['generator'],
        'robots_txt' => $robotsOk,
        'robots_blocks' => (bool) $robotsBlocks,
        'sitemap' => (bool) $sitemapOk,
        'social' => $socialAll,
        'tel' => $merge('tel'),
        'mailto' => $merge('mailto'),
        'whatsapp' => $merge('whatsapp'),
        'maps' => $merge('maps'),
        'booking' => $merge('booking'),
        'forms' => $p['forms'] + ($c['forms'] ?? 0),
        'phones' => array_values(array_unique(array_merge($p['phones'], $c['phones'] ?? []))),
        'emails' => array_values(array_unique(array_merge($p['emails'], $c['emails'] ?? []))),
        'contact_page' => (bool) $contactUrl,
        'about_page' => (bool) $aboutUrl || text_has($text, ['qui sommes-nous', 'à propos de nous', 'notre histoire', 'notre équipe']),
        'legal_page' => (bool) $legalUrl || text_has($text, ['mentions légales', 'politique de confidentialité', 'conditions générales']),
        'blog' => (bool) $blogUrl,
        'services_page' => (bool) $servicesUrl,
        'testimonials' => text_has($text, ['témoignage', 'avis client', 'ils nous font confiance', 'nos clients', 'ce que disent', 'recommandent', 'satisfaits']),
        'portfolio' => text_has($text, ['réalisations', 'portfolio', 'références', 'nos projets', 'cas client', 'études de cas', 'galerie']),
        'cta' => text_has($text, ['demander un devis', 'devis gratuit', 'contactez-nous', 'nous contacter', 'appelez', 'réserver', 'commander', 'prendre rendez-vous', 'demander', 'écrivez-nous', 'démarrer']),
        'address' => text_has($text, ['b.p', 'bp ', 'boîte postale', 'quartier', 'boulevard', 'avenue', 'rue ', 'immeuble', 'carrefour']) || (bool) array_intersect(['PostalAddress', 'LocalBusiness'], $p['jsonld']),
        'city_mentioned' => $cityLow !== '' && mb_stripos($text, $cityLow) !== false,
        'city_in_title' => $cityLow !== '' && (mb_stripos(mb_strtolower($p['title'] . ' ' . implode(' ', $p['h1'])), $cityLow) !== false),
        'name_in_title' => $nameIn(mb_strtolower($p['title'] . ' ' . $p['site_name'])),
        'name_on_site' => $nameIn($text . ' ' . mb_strtolower($p['title']) . ' ' . $host),
        'copyright_year' => $p['copyright_year'],
    ];
}
