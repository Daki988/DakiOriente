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

    // ---------- Signaux complémentaires (référentiel étendu) ----------
    $imgW = $imgLazy = $imgModern = 0;
    foreach ($imgs as $img) {
        if ($img->getAttribute('width') !== '' && $img->getAttribute('height') !== '') {
            $imgW++;
        }
        if (strtolower($img->getAttribute('loading')) === 'lazy') {
            $imgLazy++;
        }
        if (preg_match('/\.(webp|avif)(\?|$)/i', $img->getAttribute('src') . ' ' . $img->getAttribute('srcset'))) {
            $imgModern++;
        }
    }
    if (preg_match_all('#<source[^>]+type=["\']image/(webp|avif)#i', $html, $mm)) {
        $imgModern += count($mm[0]);
    }
    $inputs = $labelled = 0;
    foreach ($xp->query('//input[not(@type="hidden") and not(@type="submit") and not(@type="button")]|//textarea|//select') as $in) {
        $inputs++;
        $id = $in->getAttribute('id');
        if (($id !== '' && $xp->query("//label[@for='$id']")->length) || $in->getAttribute('aria-label') !== '' || $in->getAttribute('placeholder') !== '' || $in->parentNode->nodeName === 'label') {
            $labelled++;
        }
    }
    $maxFields = 0;
    foreach ($xp->query('//form') as $f) {
        $maxFields = max($maxFields, $xp->query('.//input[not(@type="hidden") and not(@type="submit")]|.//textarea|.//select', $f)->length);
    }
    $emptyLinks = 0;
    $aCount = 0;
    foreach ($xp->query('//a[@href]') as $a) {
        $aCount++;
        if (trim($a->textContent) === '' && $a->getAttribute('aria-label') === '' && $a->getAttribute('title') === '' && !$xp->query('.//img[@alt!=""]|.//svg', $a)->length) {
            $emptyLinks++;
        }
    }
    $queryLinks = count(array_filter(array_keys($links['internal']), fn($u) => strpos($u, '?') !== false));
    $vp = strtolower($meta('name', 'viewport'));
    $head = mb_strtolower(mb_substr(strip_tags(preg_replace('#<(script|style)[^>]*>.*?</\1>#is', ' ', $html)), 0, 4000));
    $firstText = mb_substr($lower, 0, 1500);
    $headerHtml = '';
    if (preg_match('#<header\b.*?</header>#is', $html, $mh)) {
        $headerHtml = $mh[0];
    }
    $x = [
        'doctype' => (bool) preg_match('/^\s*<!doctype html>/i', $html),
        'charset' => (bool) preg_match('#<meta[^>]+charset=#i', $html),
        'og_desc' => $meta('property', 'og:description') !== '',
        'twitter' => $meta('name', 'twitter:card') !== '',
        'theme_color' => $meta('name', 'theme-color') !== '',
        'apple_icon' => (bool) preg_match('#<link[^>]+apple-touch-icon#i', $html),
        'manifest' => (bool) preg_match('#<link[^>]+rel=["\']manifest#i', $html),
        'canonical_href' => (string) ($xp->query('//link[@rel="canonical"]/@href')->item(0)->nodeValue ?? ''),
        'zoom_blocked' => strpos($vp, 'user-scalable=no') !== false || preg_match('/maximum-scale\s*=\s*1(\.0)?\b/', $vp),
        'h3' => $xp->query('//h3')->length,
        'nav' => (bool) $xp->query('//nav')->length,
        'footer' => (bool) $xp->query('//footer')->length,
        'iframes' => $xp->query('//iframe')->length,
        'video' => (bool) ($xp->query('//video')->length || preg_match('#(youtube\.com/embed|youtube-nocookie|player\.vimeo|tiktok\.com/embed)#i', $html)),
        'deprecated' => (bool) preg_match('#<(font|center|marquee|blink)\b#i', $html),
        'flash' => (bool) preg_match('#\.swf\b|application/x-shockwave-flash#i', $html),
        'mixed' => stripos($url, 'https://') === 0 && preg_match('#(src|href)=["\']http://(?!www\.w3\.org)[^"\']+\.(js|css|png|jpe?g|gif|webp|svg)#i', $html),
        'img_dims' => $imgs->length ? $imgW / $imgs->length : null,
        'img_lazy' => $imgLazy,
        'img_modern' => $imgModern,
        'inputs' => $inputs,
        'inputs_labelled' => $labelled,
        'max_fields' => $maxFields,
        'empty_links' => $emptyLinks,
        'links_total' => $aCount,
        'query_links' => $queryLinks,
        'text_ratio' => strlen($html) ? strlen($text) / strlen($html) : 0,
        'html_kb' => (int) round(strlen($html) / 1024),
        'breadcrumb' => (bool) (preg_match('#BreadcrumbList#', $html) || $xp->query('//*[contains(@class,"breadcrumb") or @aria-label="breadcrumb" or @aria-label="Fil d’Ariane"]')->length),
        'schema_org' => (bool) array_intersect($jsonld, ['LocalBusiness', 'Organization', 'Corporation', 'Store', 'Restaurant', 'ProfessionalService', 'MedicalBusiness', 'RealEstateAgent', 'AutoRepair', 'HomeAndConstructionBusiness', 'LodgingBusiness', 'FinancialService', 'LegalService', 'EducationalOrganization']) || preg_match('#"@type"\s*:\s*"[A-Za-z]*(Business|Organization|Store|Restaurant|Service|Agent)"#', $html),
        'schema_address' => (bool) preg_match('#"(address|PostalAddress|telephone)"#', $html),
        'faq' => (bool) (preg_match('#FAQPage#', $html) || text_has($lower, ['questions fréquentes', 'foire aux questions', 'faq'])),
        'newsletter' => text_has($lower, ['newsletter', 'lettre d’information', "lettre d'information", 'abonnez-vous', 'inscrivez-vous à']),
        'chat' => (bool) preg_match('#(tawk\.to|crisp\.chat|intercom|tidio|zopim|zendesk|livechat|messenger.*customerchat|fb-customerchat|chatwoot|smartsupp|whatsapp-widget|wa-widget)#i', $html),
        'prices' => (bool) preg_match('/\d[\d\s.,]*\s?(fcfa|f cfa|xaf|€|eur\b)|à partir de\s+\d|prix\s*:/iu', $text),
        'payment' => text_has($lower, ['airtel money', 'moov money', 'mobile money', 'paiement en ligne', 'carte bancaire', 'visa', 'mastercard', 'paypal', 'paiement sécurisé']),
        'cart' => (bool) (text_has($lower, ['panier', 'ajouter au panier', 'commander maintenant']) || preg_match('#woocommerce|shopify|prestashop|/cart\b|/panier\b#i', $html)),
        'hours' => (bool) preg_match('/(lundi|mardi|lun\.?)\s*(au|-|–|à)\s*(vendredi|samedi|dimanche|ven\.?|sam\.?)|horaires|heures d’ouverture|ouvert(s)? du/iu', $text),
        'quote' => text_has($lower, ['devis gratuit', 'demander un devis', 'demande de devis', 'devis en ligne']),
        'wa_prefill' => (bool) preg_match('#(wa\.me/\d+\?text=|api\.whatsapp\.com/send\?[^"\']*text=)#i', $html),
        'cta_top' => text_has($firstText, ['devis', 'contact', 'appel', 'réserv', 'command', 'rendez-vous', 'démarrer', 'commencer', 'whatsapp', 'inscri', 'acheter', 'découvrir']),
        'cta_count' => preg_match_all('/(demander un devis|devis gratuit|contactez-nous|nous contacter|appelez|réserver|commander|prendre rendez-vous|écrivez-nous|démarrer|acheter|s’inscrire|inscrivez-vous|en savoir plus)/iu', $text),
        'tel_header' => $headerHtml !== '' && stripos($headerHtml, 'tel:') !== false,
        'team' => text_has($lower, ['notre équipe', 'l’équipe', "l'équipe", 'nos experts', 'fondateur', 'fondatrice', 'directeur général', 'gérant']),
        'since' => (bool) preg_match('/(depuis|fondée? en|créée? en|since)\s+(19|20)\d{2}|\d+\s+ans d[’\']expérience/iu', $text),
        'certif' => text_has($lower, ['certifi', 'agréé', 'agrément', 'label', 'iso 9001', 'accrédit', 'partenaire officiel', 'membre de']),
        'clients_logos' => text_has($lower, ['ils nous font confiance', 'nos clients', 'nos partenaires', 'ils nous ont fait confiance', 'nos références']),
        'figures' => (bool) preg_match('/\+\s?\d{2,}[\s\d]*\s*(clients|projets|entreprises|ans|commandes|livraisons|patients|élèves)/iu', $text),
        'guarantee' => text_has($lower, ['garantie', 'satisfait ou remboursé', 'service après-vente', 'sav', 'retour gratuit', 'remboursement']),
        'press' => text_has($lower, ['ils parlent de nous', 'dans la presse', 'revue de presse', 'médias', 'gabonreview', "l'union", 'gabonactu']),
        'legal_ids' => (bool) preg_match('/\b(rccm|nif|n°\s*statistique|capital social|siret|siren)\b/iu', $text),
        'cookies' => text_has($lower, ['cookies', 'données personnelles', 'rgpd', 'protection des données']),
        'reviews_widget' => (bool) (preg_match('#(trustpilot|elfsight|google-reviews|reviews-widget|aggregateRating)#i', $html) || preg_match('/★{3,}|\d[,.]\d\s?\/\s?5/u', $text)),
        'share' => (bool) preg_match('#(facebook\.com/sharer|twitter\.com/intent|x\.com/intent|linkedin\.com/share|wa\.me/\?text|whatsapp://send)#i', $html),
        'social_embed' => (bool) preg_match('#(facebook\.com/plugins/page|instagram\.com/embed|elfsight|snapwidget|lightwidget|juicer\.io|twitter-timeline)#i', $html),
        'logo_home' => (bool) $xp->query('//a[(@href="/" or @href="./" or @href="index.html" or @href="' . $url . '") and .//img]')->length,
        'name_in_footer' => false,
    ];

    return [
        'x' => $x,
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

    $jobs = ['robots' => $root . '/robots.txt', 'sitemap' => $root . '/sitemap.xml', 'probe404' => $root . '/neam-audit-page-inexistante-' . substr(md5($root), 0, 6)];
    if ($contactUrl && $contactUrl !== $final) {
        $jobs['contact'] = $contactUrl;
    }
    // Version http:// : doit rediriger vers https://
    if (stripos($final, 'https://') === 0) {
        $jobs['plain'] = 'http://' . substr($final, 8);
    }
    // Échantillon de liens internes pour vérifier qu'ils fonctionnent
    $sample = array_slice(array_values(array_filter(array_keys($p['internal_links']), fn($u) => $u !== $final && !preg_match('/\.(pdf|jpe?g|png|zip|docx?)$/i', $u))), 0, 4);
    foreach ($sample as $n => $u) {
        $jobs["link$n"] = $u;
    }
    $more = fetch_many($jobs, 8, 800000);
    $linksOk = 0;
    foreach (array_keys($sample) as $n) {
        if ($more["link$n"]['ok']) {
            $linksOk++;
        }
    }

    $robotsOk = $more['robots']['ok'] && stripos($more['robots']['body'], 'user-agent') !== false;
    $sitemapOk = $more['sitemap']['ok'] && stripos($more['sitemap']['body'], '<urlset') !== false || ($more['sitemap']['ok'] && stripos($more['sitemap']['body'], '<sitemapindex') !== false);
    if (!$sitemapOk && $robotsOk && preg_match('/^\s*sitemap:\s*(\S+)/im', $more['robots']['body'], $m)) {
        $sm = fetch_many(['s' => trim($m[1])], 8, 800000)['s'];
        $sitemapOk = $sm['ok'] && preg_match('/<(urlset|sitemapindex)/i', $sm['body']);
    }
    $smBody = $more['sitemap']['ok'] ? $more['sitemap']['body'] : (isset($sm) && $sm['ok'] ? $sm['body'] : '');
    $sitemapUrls = preg_match_all('#<loc>#i', $smBody);
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

    $h = $home['headers'];
    $x = $p['x'];
    if ($c) {
        foreach (['newsletter', 'chat', 'prices', 'payment', 'hours', 'quote', 'wa_prefill', 'team', 'since', 'certif', 'clients_logos', 'figures', 'guarantee', 'press', 'legal_ids', 'cookies', 'faq'] as $k) {
            $x[$k] = $x[$k] || $c['x'][$k];
        }
        $x['max_fields'] = max($x['max_fields'], $c['x']['max_fields']);
    }
    $plain = $more['plain'] ?? null;
    $x += [
        'http_to_https' => $plain ? (bool) preg_grep('#^https://#i', array_slice($plain['chain'], 1)) : null,
        'hsts' => isset($h['strict-transport-security']),
        'nosniff' => stripos($h['x-content-type-options'] ?? '', 'nosniff') !== false,
        'frame' => isset($h['x-frame-options']) || stripos($h['content-security-policy'] ?? '', 'frame-ancestors') !== false,
        'referrer' => isset($h['referrer-policy']),
        'csp' => isset($h['content-security-policy']),
        'compressed' => (bool) preg_match('/gzip|br|deflate|zstd/i', $h['content-encoding'] ?? ''),
        'cache' => isset($h['cache-control']) || isset($h['expires']) || isset($h['etag']) || isset($h['last-modified']),
        'version_leak' => (bool) (preg_match('#/\d#', $h['server'] ?? '') || isset($h['x-powered-by'])),
        'soft404' => $more['probe404']['status'] >= 200 && $more['probe404']['status'] < 300,
        'real404' => $more['probe404']['status'] === 404 || $more['probe404']['status'] === 410,
        'links_checked' => count($sample),
        'links_ok' => $linksOk,
        'sitemap_urls' => $sitemapUrls,
        'sitemap_in_robots' => $robotsOk && (bool) preg_match('/^\s*sitemap:/im', $more['robots']['body']),
        'free_host' => (bool) preg_match('/(wixsite\.com|blogspot\.|wordpress\.com|weebly|jimdo|webnode|site123|godaddysites|business\.site|carrd\.co|e-monsite|over-blog)/i', $final),
        'canonical_ok' => $x['canonical_href'] === '' ? null : (strtolower((string) parse_url(absolute_url($final, $x['canonical_href']), PHP_URL_HOST)) === strtolower((string) parse_url($final, PHP_URL_HOST))),
        'contact_hours' => $x['hours'],
    ];
    $domainLabel = strtolower(explode('.', preg_replace('/^www\./', '', (string) parse_url($final, PHP_URL_HOST)))[0]);
    $compact = preg_replace('/[^a-z0-9]/', '', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $company) ?: $company));
    $x['domain_name'] = $compact !== '' && (str_contains($compact, $domainLabel) || str_contains($domainLabel, substr($compact, 0, max(4, (int) (strlen($compact) * .6)))));
    $x['name_in_footer'] = $companyLow !== '' && (bool) preg_match('/(©|copyright)[^.]{0,80}' . preg_quote(mb_substr($companyLow, 0, 12), '/') . '/iu', $text);
    $x['desc_city'] = $cityLow !== '' && mb_stripos($p['description'], $cityLow) !== false;
    $x['title_desc_diff'] = $p['description'] !== '' && mb_strtolower($p['description']) !== mb_strtolower($p['title']);
    $x['h1_title_diff'] = $p['h1'] && mb_strtolower($p['h1'][0]) !== mb_strtolower($p['title']);

    return [
        'reachable' => true,
        'x' => $x,
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
