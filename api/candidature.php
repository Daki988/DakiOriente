<?php
/* =========================================================
   NEAM × KANIE 30/30 — Candidature et test de maturité
   1. Rapport complet à l'équipe (config.php → candidature_to)
   2. Résultats + PDF au candidat, depuis contact@neamindustry.com
   ========================================================= */
declare(strict_types=1);
require __DIR__ . '/mailer.php';

$d = read_request(3000000);

$p = is_array($d['profile'] ?? null) ? $d['profile'] : [];
$r = is_array($d['result'] ?? null) ? $d['result'] : [];
$answers = is_array($d['answers'] ?? null) ? array_slice($d['answers'], 0, 30) : [];

$profile = [
    'entreprise' => clean_line($p['entreprise'] ?? '', 160),
    'secteur'    => clean_line($p['secteur'] ?? '', 120),
    'ville'      => clean_line($p['ville'] ?? '', 120),
    'taille'     => clean_line($p['taille'] ?? '', 80),
    'nom'        => clean_line($p['nom'] ?? '', 120),
    'fonction'   => clean_line($p['fonction'] ?? '', 120),
    'email'      => clean_line($p['email'] ?? '', 160),
    'telephone'  => clean_line($p['telephone'] ?? '', 40),
    'objectif'   => clean_line($p['objectif'] ?? '', 160),
    'motivation' => clean_text($p['motivation'] ?? '', 3000),
    'dispo'      => !empty($p['dispo']),
];
if ($profile['entreprise'] === '' || $profile['nom'] === '' || !valid_email($profile['email'])) {
    respond(422, ['ok' => false, 'error' => 'Informations de candidature incomplètes.']);
}

$score = max(0, min(100, (int) ($r['score'] ?? 0)));
$level = clean_line($r['level']['name'] ?? '', 60);
$levelText = clean_text($r['level']['text'] ?? '', 400);
$dims = [];
foreach (array_slice(is_array($r['byDim'] ?? null) ? $r['byDim'] : [], 0, 8) as $dim) {
    $dims[] = ['label' => clean_line($dim['label'] ?? '', 80), 'pct' => max(0, min(100, (int) ($dim['pct'] ?? 0)))];
}
$prios = [];
foreach (array_slice(is_array($r['priorities'] ?? null) ? $r['priorities'] : [], 0, 5) as $pr) {
    $prios[] = ['label' => clean_line($pr['label'] ?? '', 80), 'reco' => clean_text($pr['reco'] ?? '', 400)];
}

// PDF des résultats (facultatif) : contrôle de taille et de format
$attachments = [];
if (!empty($d['pdf']) && is_string($d['pdf'])) {
    $pdf = base64_decode($d['pdf'], true);
    if ($pdf !== false && strlen($pdf) < 2000000 && strncmp($pdf, '%PDF', 4) === 0) {
        $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $profile['entreprise']) ?: 'entreprise')), '-');
        $attachments[] = ['data' => $pdf, 'name' => 'maturite-numerique-' . ($slug ?: 'entreprise') . '.pdf', 'type' => 'application/pdf'];
    }
}

/* ---------- Blocs HTML communs ---------- */
$dimsHtml = '';
foreach ($dims as $dim) {
    $dimsHtml .= '<tr><td style="padding:6px 0;font-size:14px">' . h($dim['label']) . '</td><td style="padding:6px 0;font-size:14px;text-align:right;font-weight:bold">' . $dim['pct'] . '&nbsp;%</td></tr>'
        . '<tr><td colspan="2" style="padding:0 0 8px"><div style="height:6px;background:#e3e3e0;border-radius:6px"><div style="height:6px;width:' . $dim['pct'] . '%;background:#0f0f10;border-radius:6px"></div></div></td></tr>';
}
$priosHtml = '';
foreach ($prios as $i => $pr) {
    $priosHtml .= '<p style="margin:0 0 12px;font-size:14px;line-height:1.5"><b>' . ($i + 1) . '. ' . h($pr['label']) . '</b><br>' . h($pr['reco']) . '</p>';
}
$scoreHtml = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5b31b;border-radius:8px;margin:0 0 20px"><tr>'
    . '<td style="padding:18px 20px;font-size:34px;font-weight:bold;color:#0f0f10;width:120px">' . $score . '<span style="font-size:16px">/100</span></td>'
    . '<td style="padding:18px 20px 18px 0;color:#0f0f10"><b style="font-size:17px">' . h($level) . '</b><br><span style="font-size:13px">' . h($levelText) . '</span></td></tr></table>';

/* ---------- 1. Rapport à l'équipe ---------- */
$rows = [
    'Entreprise'          => $profile['entreprise'],
    'Secteur'             => $profile['secteur'],
    'Ville'               => $profile['ville'],
    'Taille'              => $profile['taille'],
    'Contact'             => $profile['nom'] . ($profile['fonction'] ? ' — ' . $profile['fonction'] : ''),
    'E-mail'              => $profile['email'],
    'Téléphone / WhatsApp'=> $profile['telephone'],
    'Objectif principal'  => $profile['objectif'],
    'Motivation'          => $profile['motivation'],
    'Disponible 30 jours' => $profile['dispo'] ? 'Oui' : 'Non',
];
$answersRows = [];
foreach ($answers as $i => $a) {
    $answersRows[sprintf('Q%02d — %s', $i + 1, clean_line($a['q'] ?? '', 200))] = clean_line($a['a'] ?? '', 400) . ' (' . max(0, min(3, (int) ($a['pts'] ?? 0))) . '/3)';
}
$reportHtml = email_layout('Nouvelle candidature — ' . $profile['entreprise'],
    $scoreHtml
    . '<h2 style="font-size:16px;margin:0 0 8px">Candidat</h2>' . email_table($rows)
    . '<h2 style="font-size:16px;margin:24px 0 8px">Résultat par axe</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $dimsHtml . '</table>'
    . '<h2 style="font-size:16px;margin:24px 0 8px">Priorités recommandées</h2>' . $priosHtml
    . '<h2 style="font-size:16px;margin:24px 0 8px">Réponses au test</h2>' . email_table($answersRows)
    . '<p style="margin:20px 0 0;font-size:13px;color:#76767c">Reçu le ' . date('d/m/Y à H:i') . '. Répondez à cet e-mail pour écrire au candidat.</p>');
$reportText = "Nouvelle candidature NEAM × KANIE 30/30\n\nScore : $score/100 ($level)\n\n";
foreach ($rows as $k => $v) { $reportText .= "$k : $v\n"; }
foreach ($dims as $dim) { $reportText .= "Axe {$dim['label']} : {$dim['pct']} %\n"; }
foreach ($answersRows as $k => $v) { $reportText .= "$k : $v\n"; }

$teamOk = send_mail(
    $CONFIG['candidature_to'],
    "Candidature 30/30 — {$profile['entreprise']} — $score/100 ($level)",
    $reportHtml, $reportText, $profile['email'], $profile['nom'], $attachments
);

/* ---------- 2. Résultats au candidat ---------- */
$candidateHtml = email_layout('Vos résultats au test de maturité numérique',
    '<p style="margin:0 0 16px;font-size:15px;line-height:1.6">Bonjour ' . h($profile['nom']) . ',</p>'
    . '<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Merci d’avoir passé le test de maturité numérique et candidaté au programme <b>NEAM × KANIE 30/30</b> pour <b>' . h($profile['entreprise']) . '</b>. Voici vos résultats&nbsp;; vous les retrouvez aussi dans le PDF joint.</p>'
    . $scoreHtml
    . '<h2 style="font-size:16px;margin:0 0 8px">Résultat par axe</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $dimsHtml . '</table>'
    . '<h2 style="font-size:16px;margin:24px 0 8px">Vos priorités</h2>' . $priosHtml
    . '<p style="margin:24px 0 0;font-size:15px;line-height:1.6">Notre équipe étudie votre candidature et revient vers vous rapidement. Une question d’ici là&nbsp;? Répondez simplement à cet e-mail.</p>'
    . '<p style="margin:16px 0 0;font-size:15px;line-height:1.6">À très bientôt,<br><b>L’équipe NEAM × KANIE</b></p>'
    . '<p style="margin:20px 0 0;font-size:12px;color:#76767c">Résultat indicatif, établi à partir de vos réponses.</p>');
$candidateText = "Bonjour {$profile['nom']},\n\nMerci d'avoir passé le test de maturité numérique et candidaté au programme NEAM × KANIE 30/30.\n\n"
    . "Votre score : $score/100 ($level)\n$levelText\n\n";
foreach ($dims as $dim) { $candidateText .= "- {$dim['label']} : {$dim['pct']} %\n"; }
$candidateText .= "\nVos priorités :\n";
foreach ($prios as $i => $pr) { $candidateText .= ($i + 1) . ". {$pr['label']} : {$pr['reco']}\n"; }
$candidateText .= "\nNotre équipe étudie votre candidature et revient vers vous rapidement.\n\nL'équipe NEAM × KANIE\nhttps://www.neamindustry.com";

$candidateOk = send_mail(
    [$profile['email']],
    'Vos résultats — Test de maturité numérique NEAM × KANIE 30/30',
    $candidateHtml, $candidateText, $CONFIG['from_email'], $CONFIG['from_name'], $attachments
);

if (!$teamOk) {
    respond(500, ['ok' => false, 'error' => 'L’envoi de la candidature n’a pas abouti.']);
}
respond(200, ['ok' => true, 'candidateMail' => $candidateOk]);
