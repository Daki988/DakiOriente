<?php
/* =========================================================
   NEAM Digital Score — AI Analyst (facultatif)
   L'IA interprète des données déjà calculées : elle n'invente
   ni score ni constat. Sans clé, une synthèse par règles est produite.
   Appel HTTP direct à l'API Claude (pas de Composer sur l'hébergement mutualisé).
   ========================================================= */
declare(strict_types=1);

function ai_enabled(): bool
{
    global $CONFIG;
    return !empty($CONFIG['audit']['anthropic_api_key']);
}

/** Synthèse rédigée sans IA, à partir des résultats. */
function rule_based_analysis(array $r): array
{
    $axes = array_filter($r['axes'], fn($a) => $a['score'] !== null);
    usort($axes, fn($a, $b) => $b['score'] <=> $a['score']);
    $best = $axes[0] ?? null;
    $worst = end($axes) ?: null;
    $n = count($r['competitors']);
    $s = "{$r['company']} obtient {$r['score']}/100 (niveau « {$r['level']['name']} »).";
    if ($best && $worst && $best['key'] !== $worst['key']) {
        $s .= " Votre point fort est « {$best['label']} » ({$best['score']}/100). Le point le plus urgent est « {$worst['label']} » ({$worst['score']}/100).";
    }
    $comp = $n
        ? "Sur les " . ($n + 1) . " entreprises comparées, vous êtes {$r['rank']}" . ($r['rank'] === 1 ? 'ᵉʳ' : 'ᵉ') . '. ' . ($r['rank'] === 1 ? 'Vous menez, mais l’écart peut vite se refermer.' : 'Les premières actions du plan suffisent souvent à gagner plusieurs places.')
        : 'Aucun concurrent n’a pu être comparé automatiquement : ajoutez leurs sites pour obtenir un benchmark.';
    if (!empty($r['partial'])) {
        $s .= ' Attention : votre site est construit en JavaScript, une partie des critères n’a pas pu être lue automatiquement. Ce score est donc partiel.';
    }
    $first = $r['actions'][0]['title'] ?? null;
    $msg = $first ? "Par où commencer ? « $first ». C’est votre priorité numéro un : elle a le plus d’impact sur votre visibilité et vos ventes." : 'Continuez à mesurer vos résultats chaque mois.';
    return ['summary' => $s, 'competition' => $comp, 'advice' => $msg, 'source' => 'rules'];
}

/** Interprétation par Claude. Renvoie null en cas d'échec (on garde alors la synthèse par règles). */
function ai_analysis(array $r): ?array
{
    global $CONFIG;
    if (!ai_enabled()) {
        return null;
    }
    $facts = [
        'entreprise' => $r['company'], 'secteur' => $r['sector'], 'ville' => $r['city'], 'pays' => $r['country'],
        'score' => $r['score'], 'niveau' => $r['level']['name'], 'audit_partiel_site_javascript' => !empty($r['partial']), 'rang' => $r['rank'], 'nb_entreprises_comparees' => count($r['competitors']) + 1,
        'axes' => array_map(fn($a) => ['axe' => $a['label'], 'score' => $a['score'], 'moyenne_concurrents' => $a['competitors'], 'problemes' => array_column($a['fail'], 'note')], $r['axes']),
        'concurrents' => array_map(fn($c) => ['nom' => $c['name'], 'score' => $c['score'], 'avis' => $c['reviews'], 'note' => $c['rating']], $r['competitors']),
        'actions_prioritaires' => array_map(fn($a) => ['action' => $a['title'], 'priorite' => 'P' . $a['priority']], array_slice($r['actions'], 0, 6)),
        'opportunites' => array_map(fn($o) => ['titre' => $o['title'], 'constat' => $o['evidence']], $r['opportunities']),
        'fiche_google' => $r['gbp'] ? ['note' => $r['gbp']['rating'], 'avis' => $r['gbp']['reviews'], 'moyenne_avis_concurrents' => $r['gbp']['competitor_reviews']] : null,
    ];
    $system = 'Tu es l’analyste digital de NEAM Softwares Industry, agence de transformation digitale à Libreville (Gabon). '
        . 'Tu rédiges en français, sur un ton conversationnel, pédagogique, expert et légèrement persuasif, en vouvoyant le dirigeant. '
        . 'Tu t’appuies uniquement sur les données JSON fournies : n’invente aucun chiffre, aucun concurrent, aucune donnée. '
        . 'Si une donnée manque, n’en parle pas. Phrases courtes, sans jargon, sans emoji.';
    $prompt = "Voici les résultats d’audit calculés par notre moteur de règles :\n\n" . json_encode($facts, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
        . "\n\nRédige : summary (3 à 4 phrases : où en est l’entreprise et pourquoi), competition (2 à 3 phrases : lecture de sa position face aux concurrents), advice (2 phrases : par quoi commencer et ce que cela va changer).";

    $model = $CONFIG['audit']['anthropic_model'] ?? 'claude-opus-5-5';
    $res = api_json('POST', 'https://api.anthropic.com/v1/messages', [
        'x-api-key: ' . $CONFIG['audit']['anthropic_api_key'],
        'anthropic-version: 2023-06-01',
        'anthropic-beta: server-side-fallback-2026-07-01',
    ], [
        'model' => $model,
        'max_tokens' => 4000,
        'fallbacks' => 'default',
        'output_config' => [
            'effort' => 'low',
            'format' => ['type' => 'json_schema', 'schema' => [
                'type' => 'object',
                'properties' => ['summary' => ['type' => 'string'], 'competition' => ['type' => 'string'], 'advice' => ['type' => 'string']],
                'required' => ['summary', 'competition', 'advice'],
                'additionalProperties' => false,
            ]],
        ],
        'system' => $system,
        'messages' => [['role' => 'user', 'content' => $prompt]],
    ], 45);

    if ($res['status'] !== 200 || !$res['data'] || ($res['data']['stop_reason'] ?? '') === 'refusal') {
        error_log('NEAM AI error: HTTP ' . $res['status'] . ' ' . substr(json_encode($res['data']), 0, 400));
        return null;
    }
    $text = '';
    foreach ($res['data']['content'] ?? [] as $block) {
        if (($block['type'] ?? '') === 'text') {
            $text .= $block['text'];
        }
    }
    $out = json_decode($text, true);
    if (!is_array($out) || empty($out['summary'])) {
        return null;
    }
    return [
        'summary' => clean_text($out['summary'], 900),
        'competition' => clean_text($out['competition'] ?? '', 700),
        'advice' => clean_text($out['advice'] ?? '', 500),
        'source' => 'ai',
    ];
}
