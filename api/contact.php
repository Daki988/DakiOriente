<?php
/* =========================================================
   NEAM — Formulaire de contact
   1. Envoie la demande à l'équipe (config.php → contact_to)
   2. Envoie un accusé de réception au visiteur s'il a laissé un e-mail
   ========================================================= */
declare(strict_types=1);
require __DIR__ . '/mailer.php';

$d = read_request(20000);

$nom        = clean_line($d['nom'] ?? '', 120);
$entreprise = clean_line($d['entreprise'] ?? '', 160);
$email      = clean_line($d['email'] ?? '', 160);
$telephone  = clean_line($d['telephone'] ?? '', 40);
$besoin     = clean_line($d['besoin'] ?? '', 120);
$message    = clean_text($d['message'] ?? '', 4000);
$budget     = clean_line($d['budget'] ?? '', 60);
$delai      = clean_line($d['delai'] ?? '', 60);
$marketing  = ($d['marketing'] ?? '') === 'oui';
$origine    = clean_line($d['origine'] ?? '', 120);

$hasEmail = $email !== '' && valid_email($email);
$hasPhone = strlen(preg_replace('/\D/', '', $telephone)) >= 8;
if ($nom === '' || $besoin === '' || $message === '' || (!$hasEmail && !$hasPhone)) {
    respond(422, ['ok' => false, 'error' => 'Merci d’indiquer votre nom, un e-mail ou un téléphone valide, votre besoin et un message.']);
}
if ($email !== '' && !$hasEmail) {
    respond(422, ['ok' => false, 'error' => 'L’adresse e-mail ne semble pas valide.']);
}

$rows = [
    'Nom'                    => $nom,
    'Entreprise'             => $entreprise ?: '—',
    'E-mail'                 => $email ?: '—',
    'Téléphone'              => $telephone ?: '—',
    'Besoin'                 => $besoin,
    'Budget'                 => $budget ?: '—',
    'Délai'                  => $delai ?: '—',
    'Message'                => $message,
    'Accepte la prospection' => $marketing ? 'Oui' : 'Non',
    'Page d’origine'         => $origine ?: '—',
    'Statut'                 => 'Nouveau',
    'Date'                   => date('d/m/Y H:i'),
];
$html = email_layout('Nouvelle demande depuis le site', email_table($rows)
    . '<p style="margin:20px 0 0;font-size:14px;color:#3c3c40">' . ($hasEmail ? 'Répondez directement à cet e-mail pour écrire à ' . h($nom) . '.' : 'Pas d’e-mail : rappelez ' . h($nom) . ' au ' . h($telephone) . '.') . '</p>');
$text = "Nouvelle demande depuis le site\n\n";
foreach ($rows as $k => $v) {
    $text .= "$k : $v\n";
}

$subject = '[Site NEAM] ' . $besoin . ' — ' . $nom . ($entreprise ? " ($entreprise)" : '');
if (!send_mail($CONFIG['contact_to'], $subject, $html, $text, $hasEmail ? $email : null, $nom)) {
    respond(500, ['ok' => false, 'error' => 'L’envoi n’a pas abouti.']);
}

// Accusé de réception
$ack = false;
if ($hasEmail) {
    $first = explode(' ', $nom)[0];
    $ackHtml = email_layout('Nous avons bien reçu votre demande',
        '<p style="margin:0 0 16px;font-size:15px">Bonjour ' . h($first) . ',</p>'
        . '<p style="margin:0 0 16px;font-size:15px">Merci pour votre message. Votre demande « ' . h($besoin) . ' » est bien arrivée chez NEAM. Un membre de l’équipe l’étudie et vous répond avec un premier avis sur votre projet.</p>'
        . '<p style="margin:0 0 16px;font-size:15px">En attendant, vous pouvez réaliser votre diagnostic digital gratuit&nbsp;: il nous aidera à préparer notre échange.</p>'
        . '<p style="margin:0 0 20px"><a href="https://www.neamindustry.com/digital-score.html" style="display:inline-block;background:#f5b31b;color:#0f0f10;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:30px">Réaliser mon diagnostic digital</a></p>'
        . '<p style="margin:0;font-size:13px;color:#76767c">Vous n’êtes pas à l’origine de ce message&nbsp;? Ignorez simplement cet e-mail.</p>');
    $ackText = "Bonjour $first,\n\nMerci pour votre message. Votre demande « $besoin » est bien arrivée chez NEAM : nous vous répondons avec un premier avis sur votre projet.\n\nNEAM Softwares Industry — contact@neamindustry.com";
    $ack = send_mail([$email], 'Nous avons bien reçu votre demande — NEAM', $ackHtml, $ackText, $CONFIG['from_email'], $CONFIG['from_name']);
}
respond(200, ['ok' => true, 'ack' => $ack]);
