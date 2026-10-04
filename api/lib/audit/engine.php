<?php
/* =========================================================
   NEAM Digital Score — Moteurs de score, benchmark,
   opportunités et recommandations.
   Les règles calculent ; l'IA (facultative) ne fait qu'interpréter.
   ========================================================= */
declare(strict_types=1);

require_once __DIR__ . '/framework.php';

/** Évalue une entité (entreprise ou concurrent) sur tout le référentiel. */
function score_entity(array $e): array
{
    $siteOk = !empty($e['site']['reachable']);
    $results = [];
    $axes = [];
    foreach (AXES as $k => $_) {
        $axes[$k] = ['sum' => 0.0, 'w' => 0];
    }
    foreach (criteria() as $c) {
        $needs = $c['needs'] ?? null;
        if ($needs === 'gbp' && empty($e['gbp_measured'])) {
            $r = null;
        } else {
            $r = ($c['fn'])($e);
        }
        if ($r === null) {
            $results[$c['id']] = ['v' => null, 'note' => 'Non mesuré', 'masked' => false];
            continue;
        }
        // Critère qui dépend d'un élément absent : compté à zéro, mais regroupé sous l'action racine
        $masked = ($needs === 'site' && !$siteOk) || ($needs === 'gbp' && empty($e['gbp']));
        $results[$c['id']] = ['v' => $r[0], 'note' => $r[1], 'masked' => $masked];
        $axes[$c['axis']]['sum'] += $r[0] * $c['w'];
        $axes[$c['axis']]['w'] += $c['w'];
    }
    $axisScores = [];
    $total = 0.0;
    $totalW = 0;
    foreach (AXES as $k => $a) {
        if ($axes[$k]['w'] === 0) {
            $axisScores[$k] = null;
            continue;
        }
        $axisScores[$k] = (int) round($axes[$k]['sum'] / $axes[$k]['w'] * 100);
        $total += $axisScores[$k] * $a['weight'];
        $totalW += $a['weight'];
    }
    $global = $totalW ? (int) round($total / $totalW) : 0;
    return ['score' => $global, 'axes' => $axisScores, 'criteria' => $results];
}

/** Score de pertinence concurrentielle (0-100) d'une fiche Google par rapport à l'entreprise. */
function competitor_relevance(array $place, ?array $target, string $city, int $maxReviews): int
{
    $s = 0;
    // Secteur 30 % : même catégorie principale, ou catégorie voisine
    if ($target && $target['type'] !== '' && $place['type'] === $target['type']) {
        $s += 30;
    } elseif ($target && array_intersect($place['types'], $target['types'] ?? [])) {
        $s += 22;
    } else {
        $s += 18; // trouvé sur la recherche du secteur
    }
    // Zone géographique 20 %
    $s += ($city !== '' && mb_stripos($place['address'], $city) !== false) ? 20 : 8;
    // Produits / services 20 % : approximé par la proximité des catégories
    $s += $target ? min(20, 6 + 7 * count(array_intersect($place['types'], $target['types'] ?? []))) : 12;
    // Taille estimée 10 % : volume d'avis comparable
    if ($target) {
        $a = max(1, $target['reviews']);
        $b = max(1, $place['reviews']);
        $s += (int) round(10 * min($a, $b) / max($a, $b));
    } else {
        $s += 5;
    }
    // Visibilité digitale 20 %
    $vis = ($place['website'] !== '' ? 8 : 0) + ($maxReviews ? (int) round(12 * min(1, $place['reviews'] / $maxReviews)) : 0);
    $s += $vis;
    return max(0, min(100, $s));
}

/** Construit le rapport complet à partir des données collectées. */
function build_report(array $target, array $competitors, array $meta): array
{
    $acts = actions();
    $crit = [];
    foreach (criteria() as $c) {
        $crit[$c['id']] = $c;
    }

    // Moyennes Google des concurrents, pour les critères relatifs de réputation
    $cr = array_values(array_filter(array_map(fn($c) => $c['gbp']['reviews'] ?? null, $competitors), fn($v) => $v !== null));
    $cn = array_values(array_filter(array_map(fn($c) => $c['gbp']['rating'] ?? null, $competitors), fn($v) => $v !== null));
    $target['comp_reviews_avg'] = $cr ? array_sum($cr) / count($cr) : null;
    $target['comp_rating_avg'] = $cn ? array_sum($cn) / count($cn) : null;

    $roi = action_roi();
    $t = score_entity($target);
    $comps = [];
    $skipped = [];
    foreach ($competitors as $c) {
        // Concurrent sans site joignable ni fiche Google : rien à comparer
        if (empty($c['site']['reachable']) && empty($c['gbp'])) {
            $skipped[] = ['name' => $c['name'], 'reason' => $c['site']['error'] ?? 'aucune donnée'];
            continue;
        }
        $sc = score_entity($c);
        $comps[] = ['name' => $c['name'], 'host' => $c['site']['host'] ?? '', 'relevance' => $c['relevance'] ?? null,
            'reviews' => $c['gbp']['reviews'] ?? null, 'rating' => $c['gbp']['rating'] ?? null,
            'score' => $sc['score'], 'axes' => $sc['axes'], 'criteria' => $sc['criteria'], 'site' => !empty($c['site']['reachable'])];
    }

    // ---------- Classement ----------
    $ranking = [['name' => $meta['company'], 'score' => $t['score'], 'self' => true]];
    foreach ($comps as $c) {
        $ranking[] = ['name' => $c['name'], 'score' => $c['score'], 'self' => false];
    }
    usort($ranking, fn($a, $b) => $b['score'] <=> $a['score']);
    $rank = 1 + (int) array_search(true, array_column($ranking, 'self'), true);

    // ---------- Constats par axe ----------
    $axisDetails = [];
    foreach (AXES as $k => $a) {
        $pass = $fail = [];
        foreach ($t['criteria'] as $id => $r) {
            if ($crit[$id]['axis'] !== $k || $r['v'] === null || $r['note'] === '') {
                continue;
            }
            if ($r['v'] >= 1) {
                $pass[] = $r['note'];
            } elseif (!$r['masked']) {
                $fail[] = ['note' => $r['note'], 'partial' => $r['v'] > 0];
            }
        }
        $compAvg = null;
        $vals = array_filter(array_map(fn($c) => $c['axes'][$k], $comps), fn($v) => $v !== null);
        if ($vals) {
            $compAvg = (int) round(array_sum($vals) / count($vals));
        }
        $axisDetails[] = ['key' => $k, 'label' => $a['label'], 'score' => $t['axes'][$k], 'competitors' => $compAvg, 'pass' => $pass, 'fail' => $fail];
    }

    // ---------- Actions recommandées ----------
    $byAction = [];
    foreach ($t['criteria'] as $id => $r) {
        if ($r['v'] === null || $r['v'] >= 1) {
            continue;
        }
        $c = $crit[$id];
        $aid = $c['action'];
        if ($r['masked']) {
            // Remplacé par l'action racine
            $aid = ($c['needs'] ?? '') === 'site' ? 'create_site' : 'gbp_create';
        }
        $byAction[$aid]['loss'] = ($byAction[$aid]['loss'] ?? 0) + (1 - $r['v']) * $c['w'];
        if (!$r['masked'] && $r['note'] !== '') {
            $byAction[$aid]['notes'][] = $r['note'];
        }
        $byAction[$aid]['criteria'][] = $id;
        $byAction[$aid]['axis'][$c['axis']] = true;
    }
    $actionsOut = [];
    foreach ($byAction as $aid => $info) {
        $a = $acts[$aid];
        $axisList = array_keys($info['axis']);
        $minAxis = min(array_map(fn($k) => $t['axes'][$k] ?? 100, $axisList));
        $urgency = $minAxis < 40 ? 2 : ($minAxis < 60 ? 1 : 0);
        $points = $a['impact'] * 2 + (4 - $a['difficulty']) + $urgency;
        $critical = in_array($aid, ['create_site', 'gbp_create', 'https'], true);
        $prio = ($points >= 7 && ($a['difficulty'] < 3 || $critical)) ? 1 : ($points >= 5 ? 2 : 3);

        // Comparaison concurrentielle : part des concurrents qui réussissent ces critères
        $compNote = '';
        if ($comps) {
            $ok = 0;
            foreach ($comps as $c) {
                $vals = array_map(fn($id) => $c['criteria'][$id]['v'] ?? null, $info['criteria']);
                $vals = array_filter($vals, fn($v) => $v !== null);
                if ($vals && array_sum($vals) / count($vals) >= 0.75) {
                    $ok++;
                }
            }
            $compNote = $ok ? "$ok concurrent(s) sur " . count($comps) . ' font déjà mieux sur ce point.' : 'Aucun concurrent analysé ne le fait bien : c’est un moyen de vous démarquer.';
        }
        $actionsOut[] = [
            'id' => $aid,
            'title' => $a['title'],
            'priority' => $prio,
            'impact' => IMPACT_LABELS[$a['impact']],
            'difficulty' => DIFFICULTY_LABELS[$a['difficulty']],
            'when' => $a['when'],
            'when_label' => WHEN_LABELS[$a['when']],
            'why' => array_values(array_unique(array_slice($info['notes'] ?? [], 0, 4))),
            'importance' => trim($a['why'] . ' ' . $compNote),
            'todo' => $a['todo'],
            'axes' => array_map(fn($k) => AXES[$k]['label'], $axisList),
            'roi' => $roi[$aid] ?? null,
            'criteria_failed' => count($info['criteria']),
            'weight' => $info['loss'] * $a['impact'],
        ];
    }
    usort($actionsOut, fn($x, $y) => [$x['priority'], -$x['weight']] <=> [$y['priority'], -$y['weight']]);
    // Cinq priorités absolues au maximum : au-delà, on passe en P2
    $p1 = 0;
    foreach ($actionsOut as &$a) {
        if ($a['priority'] === 1 && ++$p1 > 5) {
            $a['priority'] = 2;
        }
    }
    unset($a);
    usort($actionsOut, fn($x, $y) => [$x['priority'], -$x['weight']] <=> [$y['priority'], -$y['weight']]);

    // ---------- Opportunités ----------
    $opps = find_opportunities($target, $t, $comps);
    $oppScore = $opps ? min(100, (int) round(array_sum(array_column($opps, 'strength')) / max(1, count($opps)) * 0.6 + count($opps) * 8)) : 20;

    // ---------- Plan d'action ----------
    $plan = [];
    foreach (WHEN_LABELS as $w => $label) {
        $items = array_values(array_map(fn($a) => $a['title'], array_filter($actionsOut, fn($a) => $a['when'] === $w)));
        $plan[] = ['key' => $w, 'label' => $label, 'items' => $items];
    }
    $defaults = [
        's1' => 'Vérifier et uniformiser vos coordonnées sur tous les canaux',
        's2' => 'Contrôler l’affichage du site sur plusieurs smartphones',
        's3' => 'Préparer un calendrier de publications pour le mois suivant',
        's4' => 'Mesurer les résultats et refaire votre Digital Score',
        'm3' => 'Suivre les demandes entrantes et ajuster les messages',
        'm6' => 'Automatiser la relation client (relances, avis, devis)',
    ];
    foreach ($plan as &$p) {
        if (!$p['items']) {
            $p['items'][] = $defaults[$p['key']];
        }
    }
    unset($p);

    // ---------- Problèmes principaux ----------
    $problems = array_slice(array_map(fn($a) => [
        'title' => $a['title'], 'priority' => $a['priority'],
        'detail' => $a['why'] ? $a['why'][0] : $a['importance'],
    ], $actionsOut), 0, 5);

    $level = level_for($t['score']);
    return [
        'company' => $meta['company'],
        'sector' => $meta['sector'],
        'city' => $meta['city'],
        'country' => $meta['country'],
        'date' => date('d/m/Y'),
        'score' => $t['score'],
        'level' => $level,
        'axes' => $axisDetails,
        'rank' => $rank,
        'ranking' => $ranking,
        'competitors' => array_map(fn($c) => ['name' => $c['name'], 'host' => $c['host'], 'relevance' => $c['relevance'], 'reviews' => $c['reviews'], 'rating' => $c['rating'], 'score' => $c['score'], 'axes' => $c['axes'], 'site' => $c['site']], $comps),
        'skipped' => $skipped,
        'problems' => $problems,
        'problem_count' => count(array_filter($actionsOut, fn($a) => $a['priority'] === 1)),
        'actions' => array_map(function ($a) {
            unset($a['weight']);
            return $a;
        }, $actionsOut),
        'opportunities' => array_slice($opps, 0, 5),
        'opportunity_score' => $oppScore,
        'roi' => roi_summary($actionsOut),
        'business' => $meta['business'] ?? null,
        'plan' => $plan,
        'gbp' => $target['gbp'] ? [
            'name' => $target['gbp']['name'], 'rating' => $target['gbp']['rating'], 'reviews' => $target['gbp']['reviews'],
            'photos' => $target['gbp']['photos'], 'hours' => $target['gbp']['hours'], 'phone' => $target['gbp']['phone'] !== '',
            'website' => $target['gbp']['website'] !== '', 'address' => $target['gbp']['address'], 'maps_url' => $target['gbp']['maps_url'],
            'score' => gbp_score($target['gbp']),
            'competitor_reviews' => competitor_review_avg($comps),
        ] : null,
        'sources' => $meta['sources'],
        'criteria_count' => count(array_filter($t['criteria'], fn($r) => $r['v'] !== null)),
        'criteria_total' => count($t['criteria']),
        // Site rendu en JavaScript : une partie des critères n'a pas pu être lue
        'partial' => !empty($target['site']['spa']),
    ];
}

function gbp_score(array $g): int
{
    $s = 25;
    $s += $g['rating'] !== null ? (int) round(max(0, ($g['rating'] - 3) / 2) * 25) : 0;
    $s += (int) round(min(1, $g['reviews'] / 50) * 25);
    $s += ($g['hours'] ? 8 : 0) + ($g['phone'] !== '' ? 6 : 0) + ($g['website'] !== '' ? 6 : 0) + min(5, $g['photos']);
    return min(100, $s);
}

function competitor_review_avg(array $comps): ?int
{
    $vals = array_filter(array_column($comps, 'reviews'), fn($v) => $v !== null);
    return $vals ? (int) round(array_sum($vals) / count($vals)) : null;
}

/** Moteur d'opportunités : cherche « l'argent laissé sur la table ». */
function find_opportunities(array $target, array $t, array $comps): array
{
    $out = [];
    $n = count($comps);
    $share = function (string $id) use ($comps): int {
        return count(array_filter($comps, fn($c) => ($c['criteria'][$id]['v'] ?? 0) >= 1));
    };
    $has = fn(string $id) => ($t['criteria'][$id]['v'] ?? 0) >= 1;
    $levels = [90 => 'Très élevée', 70 => 'Élevée', 50 => 'Moyenne'];
    $lvl = function (int $s) use ($levels): string {
        foreach ($levels as $min => $l) {
            if ($s >= $min) {
                return $l;
            }
        }
        return 'Moyenne';
    };
    $add = function (string $title, int $strength, string $evidence, string $action, string $impact) use (&$out, $lvl) {
        $out[] = ['title' => $title, 'strength' => $strength, 'level' => $lvl($strength), 'evidence' => $evidence, 'action' => $action, 'impact' => $impact];
    };

    // Avis Google
    $avg = competitor_review_avg($comps);
    if ($target['gbp'] && $avg !== null && $target['gbp']['reviews'] < $avg * 0.6) {
        $list = implode(', ', array_map(fn($c) => (string) $c['reviews'], array_filter($comps, fn($c) => $c['reviews'] !== null)));
        $add('Avis Google', 85, "Votre fiche compte {$target['gbp']['reviews']} avis. Vos concurrents principaux en ont $list (moyenne $avg).",
            'Campagne de collecte d’avis par WhatsApp après chaque vente.', 'Crédibilité et conversion locale en hausse.');
    } elseif (!empty($target['gbp_measured']) && !$target['gbp']) {
        $withGbp = count(array_filter($comps, fn($c) => $c['reviews'] !== null));
        $add('Google Business', 95, $withGbp ? "$withGbp concurrent(s) sur $n ont une fiche Google ; vous n’en avez pas." : 'Vous n’avez pas de fiche Google Business.',
            'Créer et valider la fiche, puis la compléter.', 'Visibilité immédiate sur Google Maps.');
    }
    // Différenciation : ce que personne ne fait
    if ($n) {
        if (!$has('c_booking') && $share('c_booking') === 0) {
            $add('Réservation en ligne', 92, "Aucun des $n concurrents analysés ne propose de réservation ou de commande en ligne.",
                'Être le premier de votre secteur à proposer la prise de rendez-vous ou la commande en ligne.', 'Différenciation forte et clients captés 24 h/24.');
        }
        if (!$has('c_whatsapp')) {
            $s = $share('c_whatsapp');
            $add('WhatsApp Business', $s ? 75 : 88, $s ? "$s concurrent(s) sur $n proposent déjà WhatsApp sur leur site." : "Aucun concurrent n’affiche WhatsApp sur son site.",
                'Bouton WhatsApp, catalogue et réponses rapides.', 'Plus de demandes de devis, plus vite.');
        }
        if (!$has('s_video') && $share('s_video') <= 1) {
            $add('Contenu vidéo', 72, ($share('s_video') ? 'Un seul concurrent publie' : 'Aucun concurrent ne publie') . ' de vidéos (TikTok, YouTube) : le terrain est libre.',
                'Deux vidéos courtes par semaine.', 'Portée gratuite et notoriété.');
        }
        $avgScore = (int) round(array_sum(array_column($comps, 'score')) / $n);
        if ($avgScore < 60) {
            $add('Marché encore peu digitalisé', 80, "Le score moyen de vos concurrents est de $avgScore/100 : personne n’a encore pris la place de leader en ligne.",
                'Investir maintenant pour prendre l’avance.', 'Position de référence durable.');
        }
    }
    if (!$has('r_local') && !empty($target['site']['reachable'])) {
        $add('SEO local', 78, 'Votre ville n’apparaît pas dans les titres de votre site, alors que vos clients cherchent « activité + ville ».',
            'Titres, pages et fiche Google orientés sur votre ville.', 'Plus de visites qualifiées.');
    }
    if (!$has('c_form') && !$has('c_whatsapp') && !empty($target['site']['reachable'])) {
        $add('Automatisation de la prise de contact', 70, 'Votre site ne permet ni d’écrire ni de lancer une conversation WhatsApp.',
            'Formulaire relié à WhatsApp et réponse automatique.', 'Aucune demande perdue, même le soir.');
    }
    if (empty($target['site']['reachable'])) {
        $withSite = count(array_filter($comps, fn($c) => $c['site']));
        $add('Site web', 90, $n ? "$withSite concurrent(s) sur $n ont un site web ; vous n’en avez pas." : 'Vous n’avez pas encore de site web.',
            'Un site simple, rapide et pensé pour le mobile.', 'Crédibilité et nouveaux clients venant de Google.');
    }
    usort($out, fn($a, $b) => $b['strength'] <=> $a['strength']);
    return $out;
}


/** Synthèse du ROI : hausse combinée (effets non additifs) et coût total du plan. */
function roi_summary(array $actions): array
{
    $keepLow = $keepHigh = 1.0;
    $cost = [0, 0];
    $days = 0;
    foreach ($actions as $a) {
        if (!$a['roi']) {
            continue;
        }
        $keepLow *= 1 - $a['roi']['up'][0] / 100;
        $keepHigh *= 1 - $a['roi']['up'][1] / 100;
        $cost[0] += $a['roi']['cost'][0];
        $cost[1] += $a['roi']['cost'][1];
        $days += $a['roi']['days'];
    }
    // Plafond prudent : un plan digital ne double pas un chiffre d'affaires
    return [
        'up' => [round(min(25, (1 - $keepLow) * 100), 1), round(min(45, (1 - $keepHigh) * 100), 1)],
        'cost' => $cost,
        'days' => $days,
    ];
}
