<?php
/* =========================================================
   NEAM Digital Score™ — Point d'entrée de l'outil d'audit
   Étapes appelées successivement par la page digital-score.html :
   discover → site (×N, en parallèle) → psi (facultatif) → report → unlock → mail
   ========================================================= */
declare(strict_types=1);
require __DIR__ . '/mailer.php';
require __DIR__ . '/lib/audit/http.php';
require __DIR__ . '/lib/audit/site.php';
require __DIR__ . '/lib/audit/places.php';
require __DIR__ . '/lib/audit/engine.php';
require __DIR__ . '/lib/audit/ai.php';

@set_time_limit(90);
@ini_set('memory_limit', '256M');

const SECTOR_QUERIES = [
    'Commerce' => 'boutique', 'Restauration' => 'restaurant', 'Hôtellerie & tourisme' => 'hôtel', 'Immobilier' => 'agence immobilière',
    'Santé' => 'clinique', 'Beauté & bien-être' => 'salon de beauté', 'BTP & construction' => 'entreprise BTP', 'Éducation & formation' => 'école privée',
    'Transport & logistique' => 'transport logistique', 'Automobile' => 'garage automobile', 'Banque & assurance' => 'assurance',
    'Informatique & télécoms' => 'entreprise informatique', 'Conseil & services aux entreprises' => 'cabinet de conseil', 'Événementiel' => 'agence événementielle',
];

$step = (string) ($_GET['step'] ?? '');
$limits = ['discover' => 8, 'site' => 60, 'psi' => 30, 'report' => 10, 'unlock' => 8, 'mail' => 8];
if (!isset($limits[$step])) {
    respond(404, ['ok' => false, 'error' => 'Étape inconnue.']);
}
$d = read_request($step === 'mail' ? 3000000 : 20000, $limits[$step], $step);

/* ---------- Stockage des audits en cours ---------- */
function audit_dir(): string
{
    $dir = __DIR__ . '/data/audits';
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    // Nettoyage occasionnel (audits de plus de 30 jours)
    if (random_int(1, 50) === 1) {
        foreach (glob($dir . '/*.json') ?: [] as $f) {
            if (filemtime($f) < time() - 30 * 86400) {
                @unlink($f);
            }
        }
    }
    return $dir;
}
function audit_id(array $d): string
{
    $id = (string) ($d['aid'] ?? '');
    if (!preg_match('/^[a-f0-9]{24}$/', $id) || !is_file(audit_dir() . "/$id.json")) {
        respond(404, ['ok' => false, 'error' => 'Audit introuvable ou expiré. Merci de relancer l’analyse.']);
    }
    return $id;
}
function audit_load(string $id, string $part = ''): ?array
{
    $f = audit_dir() . "/$id" . ($part !== '' ? "-$part" : '') . '.json';
    return is_file($f) ? json_decode((string) file_get_contents($f), true) : null;
}
function audit_save(string $id, array $data, string $part = ''): void
{
    file_put_contents(audit_dir() . "/$id" . ($part !== '' ? "-$part" : '') . '.json', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}
function parse_socials(string $text): array
{
    $out = [];
    foreach (preg_split('/[\s,;]+/', $text) as $u) {
        $u = trim($u);
        if ($u === '') {
            continue;
        }
        if (!preg_match('#^https?://#i', $u)) {
            $u = 'https://' . $u;
        }
        foreach (SOCIAL_PATTERNS as $net => $re) {
            if (!isset($out[$net]) && preg_match($re, $u, $m)) {
                $out[$net] = rtrim($m[0], '/');
            }
        }
    }
    return $out;
}
function host_of(string $url): string
{
    return preg_replace('/^www\./', '', strtolower((string) parse_url($url, PHP_URL_HOST)));
}

/* =====================================================
   1. DISCOVERY ENGINE
   ===================================================== */
if ($step === 'discover') {
    $company = clean_line($d['company'] ?? '', 120);
    $sector = clean_line($d['sector'] ?? '', 80);
    $activity = clean_line($d['activity'] ?? '', 80);
    $city = clean_line($d['city'] ?? '', 80);
    $country = clean_line($d['country'] ?? 'Gabon', 60) ?: 'Gabon';
    if (mb_strlen($company) < 2 || $city === '') {
        respond(422, ['ok' => false, 'error' => 'Indiquez au moins le nom de l’entreprise et la ville.']);
    }
    $website = isset($d['url']) ? normalize_url((string) $d['url']) : null;
    if (!empty($d['url']) && !$website) {
        respond(422, ['ok' => false, 'error' => 'L’adresse du site web ne semble pas valide.']);
    }
    $socials = parse_socials(clean_text($d['socials'] ?? '', 1000));
    $manual = [];
    foreach (array_slice(is_array($d['competitors'] ?? null) ? $d['competitors'] : [], 0, 4) as $u) {
        $nu = normalize_url((string) $u);
        if ($nu && (!$website || host_of($nu) !== host_of($website))) {
            $manual[host_of($nu)] = $nu;
        }
    }

    $gbpMeasured = places_enabled();
    $gbp = null;
    $rank = null;
    $query = trim(($activity !== '' ? $activity : (SECTOR_QUERIES[$sector] ?? $sector)) . ' ' . $city);
    $competitors = [];
    $sources = ['site' => true, 'places' => $gbpMeasured, 'pagespeed' => !empty($CONFIG['audit']['pagespeed_key']), 'ai' => ai_enabled()];

    if ($gbpMeasured) {
        $gbp = places_find_company($company, $city, $country);
        $list = places_search($query, 20);
        if ($list === null) {
            $sources['places'] = false;
            $gbpMeasured = $gbp !== null;
        } else {
            $rank = 0;
            foreach ($list as $i => $pl) {
                $isSelf = ($gbp && $pl['id'] === $gbp['id']) || name_similarity($company, $pl['name']) >= 0.85
                    || ($website && $pl['website'] !== '' && host_of($pl['website']) === host_of($website));
                if ($isSelf) {
                    if (!$rank) {
                        $rank = $i + 1;
                    }
                    if (!$gbp) {
                        $gbp = $pl + ['match' => 85];
                    }
                    continue;
                }
                $pl['position'] = $i + 1;
                $competitors[] = $pl;
            }
            $maxReviews = max(array_merge([1], array_column($competitors, 'reviews')));
            foreach ($competitors as &$c) {
                $c['relevance'] = competitor_relevance($c, $gbp, $city, $maxReviews);
            }
            unset($c);
            usort($competitors, fn($a, $b) => $b['relevance'] <=> $a['relevance']);
        }
    }
    if (!$website && $gbp && $gbp['website'] !== '') {
        $website = normalize_url($gbp['website']);
    }

    // Concurrents retenus : ceux saisis d'abord, puis les plus pertinents trouvés sur Google
    $picked = [];
    foreach ($manual as $host => $url) {
        $picked[] = ['name' => $host, 'url' => $url, 'gbp' => null, 'gbp_measured' => false, 'relevance' => null, 'rank' => null, 'manual' => true];
    }
    foreach ($competitors as $c) {
        if (count($picked) >= 4) {
            break;
        }
        $url = $c['website'] !== '' ? normalize_url($c['website']) : null;
        if ($url && isset($manual[host_of($url)])) {
            continue;
        }
        $picked[] = ['name' => $c['name'], 'url' => $url, 'gbp' => $c, 'gbp_measured' => true, 'relevance' => $c['relevance'], 'rank' => $c['position'], 'manual' => false];
    }

    $id = bin2hex(random_bytes(12));
    audit_save($id, [
        'created' => time(),
        'meta' => ['company' => $company, 'sector' => $sector ?: $activity, 'activity' => $activity, 'city' => $city, 'country' => $country, 'query' => $query],
        'target' => ['name' => $company, 'url' => $website, 'gbp' => $gbp, 'gbp_measured' => $gbpMeasured, 'rank' => $rank, 'socials_declared' => $socials],
        'competitors' => $picked,
        'sources' => $sources,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    respond(200, [
        'ok' => true,
        'aid' => $id,
        'website' => $website,
        'gbp' => $gbp ? ['name' => $gbp['name'], 'address' => $gbp['address']] : null,
        'socials' => array_keys($socials),
        'competitors' => array_map(fn($c) => ['name' => $c['name'], 'url' => $c['url']], $picked),
        'sites' => array_merge($website ? [-1] : [], array_keys(array_filter($picked, fn($c) => $c['url']))),
        'psi' => $sources['pagespeed'],
        'sources' => $sources,
    ]);
}

/* =====================================================
   2-3. DATA COLLECTION + AUDIT ENGINE (un site par appel)
   ===================================================== */
if ($step === 'site' || $step === 'psi') {
    $id = audit_id($d);
    $state = audit_load($id);
    $idx = (int) ($d['idx'] ?? -1);
    $url = $idx === -1 ? ($state['target']['url'] ?? null) : ($state['competitors'][$idx]['url'] ?? null);
    if (!$url) {
        respond(404, ['ok' => false, 'error' => 'Site inconnu.']);
    }
    if ($step === 'site') {
        $name = $idx === -1 ? $state['meta']['company'] : $state['competitors'][$idx]['name'];
        $res = collect_site($url, $name, $state['meta']['city']);
        audit_save($id, $res, "site$idx");
        respond(200, ['ok' => true, 'reachable' => $res['reachable'], 'host' => $res['host'] ?? host_of($url)]);
    }
    // Google PageSpeed (mobile), si une clé est configurée
    $key = $CONFIG['audit']['pagespeed_key'] ?? '';
    if ($key === '') {
        respond(200, ['ok' => true, 'skipped' => true]);
    }
    $api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' . http_build_query(['url' => $url, 'strategy' => 'mobile', 'key' => $key, 'locale' => 'fr'])
        . '&category=performance&category=seo&category=accessibility';
    $r = api_json('GET', $api, [], null, 70);
    $cats = $r['data']['lighthouseResult']['categories'] ?? null;
    if ($r['status'] !== 200 || !$cats) {
        respond(200, ['ok' => true, 'skipped' => true]);
    }
    $psi = [
        'performance' => (int) round(($cats['performance']['score'] ?? 0) * 100),
        'seo' => (int) round(($cats['seo']['score'] ?? 0) * 100),
        'accessibility' => (int) round(($cats['accessibility']['score'] ?? 0) * 100),
    ];
    audit_save($id, $psi, "psi$idx");
    respond(200, ['ok' => true] + $psi);
}

/* =====================================================
   4-7. COMPETITOR + SCORING + AI ANALYST + RECOMMENDATIONS
   ===================================================== */
function build_entities(string $id, array $state): array
{
    $siteFor = function (int $idx, ?string $url) use ($id) {
        if (!$url) {
            return null;
        }
        return audit_load($id, "site$idx") ?? ['reachable' => false, 'url' => $url, 'error' => 'non analysé'];
    };
    $t = $state['target'];
    $target = [
        'name' => $state['meta']['company'],
        'site' => $siteFor(-1, $t['url']),
        'gbp' => $t['gbp'],
        'gbp_measured' => $t['gbp_measured'],
        'psi' => audit_load($id, 'psi-1'),
        'socials_declared' => $t['socials_declared'],
        'query' => $state['meta']['query'],
    ];
    if ($t['rank'] !== null) {
        $target['rank'] = $t['rank'];
    }
    $comps = [];
    foreach ($state['competitors'] as $i => $c) {
        $site = $siteFor($i, $c['url']);
        $name = $c['name'];
        if (!empty($c['manual']) && !empty($site['reachable'])) {
            $name = $site['site_name'] ?: (trim(preg_split('/\s[|\-–—:]\s/u', $site['title'])[0] ?? '') ?: $name);
        }
        $e = ['name' => mb_substr($name, 0, 60), 'site' => $site, 'gbp' => $c['gbp'], 'gbp_measured' => $c['gbp_measured'], 'psi' => audit_load($id, "psi$i"),
            'socials_declared' => [], 'relevance' => $c['relevance'], 'query' => $state['meta']['query']];
        if ($c['rank'] !== null) {
            $e['rank'] = $c['rank'];
        }
        $comps[] = $e;
    }
    return [$target, $comps];
}

function discovery_rows(array $target): array
{
    $rows = [];
    $s = !empty($target['site']['reachable']) ? $target['site'] : null;
    $g = $target['gbp'];
    if ($s) {
        $conf = $s['name_on_site'] ? 98 : 60;
        $rows[] = ['label' => 'Site web', 'value' => $s['host'], 'source' => $g && $g['website'] ? 'Saisi / Google' : 'Saisi', 'confidence' => $conf,
            'warning' => $s['name_on_site'] ? '' : 'Le nom de l’entreprise n’apparaît pas sur ce site : vérifiez qu’il s’agit bien du vôtre.'];
    } elseif (!empty($target['site']['url'])) {
        $rows[] = ['label' => 'Site web', 'value' => host_of($target['site']['url']) . ' (inaccessible)', 'source' => 'Saisi', 'confidence' => 90, 'warning' => ''];
    } else {
        $rows[] = ['label' => 'Site web', 'value' => 'Non trouvé', 'source' => '—', 'confidence' => null, 'warning' => ''];
    }
    if ($g) {
        $rows[] = ['label' => 'Google Business', 'value' => $g['name'], 'source' => 'Google Maps', 'confidence' => (int) ($g['match'] ?? 90), 'warning' => ''];
        if ($g['address']) {
            $rows[] = ['label' => 'Adresse', 'value' => $g['address'], 'source' => 'Google Maps', 'confidence' => 95, 'warning' => ''];
        }
        if ($g['rating'] !== null) {
            $rows[] = ['label' => 'Avis clients', 'value' => number_format($g['rating'], 1, ',', '') . '/5 · ' . $g['reviews'] . ' avis', 'source' => 'Google Maps', 'confidence' => 99, 'warning' => ''];
        }
        $rows[] = ['label' => 'Horaires', 'value' => $g['hours'] ? 'Renseignés' : 'Absents', 'source' => 'Google Maps', 'confidence' => 95, 'warning' => ''];
    } elseif (!empty($target['gbp_measured'])) {
        $rows[] = ['label' => 'Google Business', 'value' => 'Non trouvé', 'source' => 'Google Maps', 'confidence' => 80, 'warning' => ''];
    }
    $sitePhone = $s['phones'][0] ?? null;
    if ($sitePhone && $g && $g['phone'] && digits_tail($sitePhone) === digits_tail($g['phone'])) {
        $rows[] = ['label' => 'Téléphone', 'value' => $g['phone'], 'source' => 'Site + Google', 'confidence' => 99, 'warning' => ''];
    } elseif ($g && $g['phone']) {
        $rows[] = ['label' => 'Téléphone', 'value' => $g['phone'], 'source' => 'Google Maps', 'confidence' => 95, 'warning' => $sitePhone ? 'Numéro différent sur le site : ' . $sitePhone : ''];
    } elseif ($sitePhone) {
        $rows[] = ['label' => 'Téléphone', 'value' => $sitePhone, 'source' => 'Site web', 'confidence' => 90, 'warning' => ''];
    }
    if (!empty($s['emails'])) {
        $rows[] = ['label' => 'E-mail', 'value' => $s['emails'][0], 'source' => 'Site web', 'confidence' => 90, 'warning' => ''];
    }
    $names = ['facebook' => 'Facebook', 'instagram' => 'Instagram', 'linkedin' => 'LinkedIn', 'tiktok' => 'TikTok', 'youtube' => 'YouTube', 'x' => 'X (Twitter)'];
    foreach ($names as $k => $label) {
        $fromSite = $s['social'][$k] ?? null;
        $declared = $target['socials_declared'][$k] ?? null;
        if ($fromSite || $declared) {
            $rows[] = ['label' => $label, 'value' => preg_replace('#^https?://(www\.)?#', '', $fromSite ?: $declared), 'source' => $fromSite ? 'Lien sur le site officiel' : 'Saisi', 'confidence' => $fromSite ? 95 : 100, 'warning' => ''];
        } else {
            $rows[] = ['label' => $label, 'value' => 'Non détecté', 'source' => '—', 'confidence' => null, 'warning' => ''];
        }
    }
    return $rows;
}

if ($step === 'report') {
    $id = audit_id($d);
    $state = audit_load($id);
    [$target, $comps] = build_entities($id, $state);
    $report = build_report($target, $comps, $state['meta'] + ['sources' => $state['sources']]);
    $report['discovery'] = discovery_rows($target);
    $report['analysis'] = ai_analysis($report) ?? rule_based_analysis($report);
    $report['id'] = $id;
    audit_save($id, $report, 'report');

    // Aperçu gratuit : score, axes, classement et trois problèmes
    respond(200, ['ok' => true, 'preview' => [
        'company' => $report['company'],
        'score' => $report['score'],
        'level' => $report['level'],
        'axes' => array_map(fn($a) => ['label' => $a['label'], 'score' => $a['score'], 'competitors' => $a['competitors']], $report['axes']),
        'rank' => $report['rank'],
        'total' => count($report['ranking']),
        'problem_count' => $report['problem_count'],
        'action_count' => count($report['actions']),
        'opportunity_count' => count($report['opportunities']),
        'problems' => array_slice(array_map(fn($p) => ['title' => $p['title'], 'priority' => $p['priority']], $report['problems']), 0, 3),
        'criteria_count' => $report['criteria_count'],
        'partial' => $report['partial'],
    ]]);
}

/* =====================================================
   Rapport complet contre coordonnées
   ===================================================== */
if ($step === 'unlock') {
    $id = audit_id($d);
    $report = audit_load($id, 'report');
    if (!$report) {
        respond(409, ['ok' => false, 'error' => 'Le rapport n’est pas encore prêt.']);
    }
    $lead = [
        'nom' => clean_line($d['nom'] ?? '', 120),
        'fonction' => clean_line($d['fonction'] ?? '', 120),
        'email' => clean_line($d['email'] ?? '', 160),
        'telephone' => clean_line($d['telephone'] ?? '', 40),
        'consent' => !empty($d['consent']),
        'date' => date('d/m/Y H:i'),
    ];
    if ($lead['nom'] === '' || !valid_email($lead['email'])) {
        respond(422, ['ok' => false, 'error' => 'Indiquez votre nom et une adresse e-mail valide.']);
    }
    audit_save($id, $lead, 'lead');
    respond(200, ['ok' => true, 'report' => $report]);
}

/* =====================================================
   Envoi du rapport : à l'équipe NEAM et au prospect
   ===================================================== */
if ($step === 'mail') {
    $id = audit_id($d);
    $report = audit_load($id, 'report');
    $lead = audit_load($id, 'lead');
    if (!$report || !$lead) {
        respond(409, ['ok' => false, 'error' => 'Rapport non débloqué.']);
    }
    if (audit_load($id, 'sent')) {
        respond(200, ['ok' => true, 'already' => true]);
    }
    $attachments = [];
    if (!empty($d['pdf']) && is_string($d['pdf'])) {
        $pdf = base64_decode($d['pdf'], true);
        if ($pdf !== false && strlen($pdf) < 2500000 && strncmp($pdf, '%PDF', 4) === 0) {
            $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $report['company']) ?: 'entreprise')), '-');
            $attachments[] = ['data' => $pdf, 'name' => 'neam-digital-score-' . ($slug ?: 'entreprise') . '.pdf', 'type' => 'application/pdf'];
        }
    }

    $axesHtml = '';
    foreach ($report['axes'] as $a) {
        $v = $a['score'] === null ? 'n.m.' : $a['score'] . '/100';
        $pct = (int) ($a['score'] ?? 0);
        $axesHtml .= '<tr><td style="padding:6px 0;font-size:14px">' . h($a['label']) . '</td><td style="padding:6px 0;font-size:14px;text-align:right;font-weight:bold">' . $v . '</td></tr>'
            . '<tr><td colspan="2" style="padding:0 0 8px"><div style="height:6px;background:#e3e3e0;border-radius:6px"><div style="height:6px;width:' . $pct . '%;background:#0f0f10;border-radius:6px"></div></div></td></tr>';
    }
    $actionsHtml = '';
    foreach (array_slice($report['actions'], 0, 6) as $a) {
        $color = [1 => '#d64545', 2 => '#e08a00', 3 => '#c9a400'][$a['priority']];
        $actionsHtml .= '<li style="margin:0 0 10px"><b style="color:' . $color . '">P' . $a['priority'] . '</b> · <b>' . h($a['title']) . '</b><br><span style="color:#55555a">' . h($a['todo']) . '</span></li>';
    }
    $scoreBlock = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr>'
        . '<td style="background:#0f0f10;color:#fff;border-radius:8px;padding:18px 22px;width:45%"><div style="font-size:12px;letter-spacing:1px;color:#a9a9ae">NEAM DIGITAL SCORE™</div><div style="font-size:40px;font-weight:bold;line-height:1.1">' . $report['score'] . '<span style="font-size:18px;color:#a9a9ae">/100</span></div><div style="color:#f5b31b;font-weight:bold">' . h($report['level']['name']) . '</div></td>'
        . '<td style="padding:0 0 0 18px;font-size:14px;color:#55555a">Position concurrentielle&nbsp;: <b style="color:#0f0f10">' . $report['rank'] . ' / ' . count($report['ranking']) . '</b><br>Actions prioritaires&nbsp;: <b style="color:#0f0f10">' . $report['problem_count'] . '</b><br>Opportunités détectées&nbsp;: <b style="color:#0f0f10">' . count($report['opportunities']) . '</b></td>'
        . '</tr></table>';

    // 1. Équipe NEAM
    $team = $CONFIG['audit']['notify_to'] ?? $CONFIG['candidature_to'];
    $teamHtml = email_layout('Nouveau Digital Score : ' . $report['company'],
        '<p style="margin:0 0 16px;font-size:15px">Un prospect vient de débloquer son audit complet.</p>'
        . email_table([
            'Entreprise' => $report['company'], 'Secteur' => $report['sector'], 'Ville' => $report['city'] . ', ' . $report['country'],
            'Contact' => $lead['nom'] . ($lead['fonction'] ? ' (' . $lead['fonction'] . ')' : ''), 'E-mail' => $lead['email'], 'Téléphone' => $lead['telephone'] ?: '—',
            'Accepte d’être recontacté' => $lead['consent'] ? 'Oui' : 'Non', 'Date' => $lead['date'],
        ])
        . '<div style="height:20px"></div>' . $scoreBlock
        . '<h2 style="font-size:16px;margin:0 0 8px">Scores par axe</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $axesHtml . '</table>'
        . '<h2 style="font-size:16px;margin:20px 0 8px">Plan d’action proposé</h2><ul style="padding-left:18px;font-size:14px;margin:0">' . $actionsHtml . '</ul>'
        . '<p style="font-size:13px;color:#76767c;margin:20px 0 0">Synthèse&nbsp;: ' . h($report['analysis']['summary']) . '</p>');
    $teamText = "Nouveau Digital Score : {$report['company']} — {$report['score']}/100 ({$report['level']['name']})\nContact : {$lead['nom']} <{$lead['email']}> {$lead['telephone']}\n";
    $teamOk = send_mail($team, 'Digital Score — ' . $report['company'] . ' — ' . $report['score'] . '/100', $teamHtml, $teamText, $lead['email'], $lead['nom'], $attachments);

    // 2. Prospect
    $first = explode(' ', $lead['nom'])[0];
    $clientHtml = email_layout('Votre NEAM Digital Score™',
        '<p style="margin:0 0 16px;font-size:15px">Bonjour ' . h($first) . ',</p>'
        . '<p style="margin:0 0 16px;font-size:15px">Merci d’avoir testé la présence digitale de <b>' . h($report['company']) . '</b>. Vous trouverez votre audit complet en pièce jointe : diagnostic, benchmark concurrentiel et plan d’action priorisé.</p>'
        . $scoreBlock
        . '<p style="margin:0 0 16px;font-size:15px">' . h($report['analysis']['advice']) . '</p>'
        . '<h2 style="font-size:16px;margin:0 0 8px">Vos premières actions</h2><ul style="padding-left:18px;font-size:14px;margin:0 0 20px">' . $actionsHtml . '</ul>'
        . '<p style="margin:0 0 20px;font-size:15px">Vous voulez qu’on regarde ensemble comment passer à l’action ? Répondez simplement à cet e-mail : un expert NEAM vous rappelle.</p>'
        . '<p style="margin:0"><a href="https://www.neamindustry.com/contact.html?besoin=NEAM%20Digital%20Score" style="display:inline-block;background:#f5b31b;color:#0f0f10;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:30px">Parler à un expert NEAM</a></p>');
    $clientText = "Bonjour $first,\n\nVotre NEAM Digital Score : {$report['score']}/100 ({$report['level']['name']}).\nVotre audit complet est en pièce jointe.\n\nNEAM Softwares Industry — contact@neamindustry.com";
    $clientOk = send_mail([$lead['email']], 'Votre NEAM Digital Score™ : ' . $report['score'] . '/100', $clientHtml, $clientText, $CONFIG['from_email'], $CONFIG['from_name'], $attachments);

    if ($teamOk || $clientOk) {
        audit_save($id, ['at' => time(), 'team' => $teamOk, 'client' => $clientOk], 'sent');
    }
    respond($teamOk || $clientOk ? 200 : 502, ['ok' => $teamOk || $clientOk, 'clientMail' => $clientOk, 'error' => $teamOk || $clientOk ? null : 'L’envoi de l’e-mail a échoué.']);
}
