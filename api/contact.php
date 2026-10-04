<?php
/* =========================================================
   NEAM — Formulaire de contact
   Envoie le message à l'équipe (config.php → contact_to).
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

if ($nom === '' || $besoin === '' || $message === '' || !valid_email($email)) {
    respond(422, ['ok' => false, 'error' => 'Merci d’indiquer votre nom, un e-mail valide, votre besoin et un message.']);
}

$rows = [
    'Nom'        => $nom,
    'Entreprise' => $entreprise ?: '—',
    'E-mail'     => $email,
    'Téléphone'  => $telephone ?: '—',
    'Besoin'     => $besoin,
    'Message'    => $message,
    'Date'       => date('d/m/Y H:i'),
];
$html = email_layout('Nouveau message depuis le site', email_table($rows)
    . '<p style="margin:20px 0 0;font-size:14px;color:#3c3c40">Répondez directement à cet e-mail pour écrire à ' . h($nom) . '.</p>');
$text = "Nouveau message depuis le site\n\n";
foreach ($rows as $k => $v) {
    $text .= "$k : $v\n";
}

$subject = '[Site NEAM] ' . $besoin . ' — ' . $nom . ($entreprise ? " ($entreprise)" : '');
if (!send_mail($CONFIG['contact_to'], $subject, $html, $text, $email, $nom)) {
    respond(500, ['ok' => false, 'error' => 'L’envoi n’a pas abouti.']);
}
respond(200, ['ok' => true]);
