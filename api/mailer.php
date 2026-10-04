<?php
/* =========================================================
   NEAM — Fonctions communes aux formulaires
   ========================================================= */
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';

$CONFIG = require __DIR__ . '/config.php';
date_default_timezone_set('Africa/Libreville');

/** Réponse JSON puis arrêt. */
function respond(int $status, array $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Contrôles communs : méthode, origine, taille, anti-robot, limite d'envois. Renvoie le JSON décodé. */
function read_request(int $maxBytes, ?int $limit = null, string $bucket = ''): array
{
    global $CONFIG;
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        respond(405, ['ok' => false, 'error' => 'Méthode non autorisée.']);
    }

    // Le formulaire doit venir du site lui-même
    $origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
    if ($origin !== '') {
        $host = strtolower((string) parse_url($origin, PHP_URL_HOST));
        $self = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
        $self = preg_replace('/:\d+$/', '', $self);
        if ($host !== $self && !in_array($host, $CONFIG['allowed_hosts'], true)) {
            respond(403, ['ok' => false, 'error' => 'Origine non autorisée.']);
        }
    }

    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($raw === false || strlen($raw) > $maxBytes) {
        respond(413, ['ok' => false, 'error' => 'Envoi trop volumineux.']);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        respond(400, ['ok' => false, 'error' => 'Données invalides.']);
    }

    // Champ piège : rempli uniquement par les robots
    if (!empty($data['website'])) {
        respond(200, ['ok' => true]);
    }

    rate_limit($limit ?? (int) $CONFIG['rate_limit'], $bucket);
    return $data;
}

/** Limite le nombre d'envois par adresse IP (fenêtre de 10 minutes). */
function rate_limit(int $max, string $bucket = ''): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
    $file = sys_get_temp_dir() . '/neam_rl_' . md5($ip . basename($_SERVER['SCRIPT_NAME'] ?? '') . $bucket);
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $hits = array_filter(
            array_map('intval', explode(',', (string) file_get_contents($file))),
            fn($t) => $t > $now - 600
        );
    }
    if (count($hits) >= $max) {
        respond(429, ['ok' => false, 'error' => 'Trop d’envois en peu de temps. Merci de réessayer dans quelques minutes.']);
    }
    $hits[] = $now;
    @file_put_contents($file, implode(',', $hits), LOCK_EX);
}

/** Texte sur une ligne, sans retour chariot (évite l'injection d'en-têtes). */
function clean_line($value, int $max = 200): string
{
    $v = trim(preg_replace('/[\r\n\t]+/', ' ', (string) $value));
    return mb_substr($v, 0, $max);
}

/** Texte multiligne. */
function clean_text($value, int $max = 3000): string
{
    $v = trim(str_replace("\r", '', (string) $value));
    return mb_substr($v, 0, $max);
}

function valid_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/** Gabarit HTML commun des e-mails. */
function email_layout(string $title, string $inner): string
{
    return '<!doctype html><html lang="fr"><body style="margin:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#1b1b1d">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:24px 0"><tr><td align="center">'
        . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden">'
        . '<tr><td style="background:#0f0f10;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:1px">NEAM <span style="color:#f5b31b">▲</span> <span style="font-size:12px;font-weight:normal;color:#a9a9ae;letter-spacing:2px">SOFTWARES INDUSTRY</span></td></tr>'
        . '<tr><td style="padding:28px">'
        . '<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f0f10">' . h($title) . '</h1>'
        . $inner
        . '</td></tr>'
        . '<tr><td style="padding:18px 28px;background:#f4f4f2;font-size:12px;color:#76767c">NEAM Softwares Industry · Libreville, Gabon · <a href="https://www.neamindustry.com" style="color:#76767c">neamindustry.com</a><br>Build a better tomorrow !</td></tr>'
        . '</table></td></tr></table></body></html>';
}

/** Tableau HTML « libellé / valeur ». */
function email_table(array $rows): string
{
    $html = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">';
    foreach ($rows as $label => $value) {
        $html .= '<tr><td style="padding:8px 10px;border-bottom:1px solid #e3e3e0;color:#76767c;width:38%;vertical-align:top">' . h((string) $label) . '</td>'
            . '<td style="padding:8px 10px;border-bottom:1px solid #e3e3e0;vertical-align:top">' . nl2br(h((string) $value)) . '</td></tr>';
    }
    return $html . '</table>';
}

/**
 * Envoi d'un e-mail. $attachments : [['data' => binaire, 'name' => 'fichier.pdf', 'type' => 'application/pdf']]
 * Renvoie true si l'envoi a été accepté.
 */
function send_mail(array $to, string $subject, string $html, string $text, ?string $replyTo = null, ?string $replyName = null, array $attachments = []): bool
{
    global $CONFIG;
    $mail = new PHPMailer(true);
    try {
        $mail->CharSet = 'UTF-8';
        $smtp = $CONFIG['smtp'];
        if (!empty($smtp['password'])) {
            $mail->isSMTP();
            $mail->Host = $smtp['host'];
            $mail->Port = (int) $smtp['port'];
            $mail->SMTPAuth = true;
            $mail->Username = $smtp['username'];
            $mail->Password = $smtp['password'];
            $mail->SMTPSecure = $smtp['secure'] === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->isMail();
        }
        $mail->setFrom($CONFIG['from_email'], $CONFIG['from_name']);
        $mail->Sender = $CONFIG['from_email'];
        foreach ($to as $address) {
            $mail->addAddress($address);
        }
        if ($replyTo && valid_email($replyTo)) {
            $mail->addReplyTo($replyTo, $replyName ?? '');
        }
        foreach ($attachments as $a) {
            $mail->addStringAttachment($a['data'], $a['name'], PHPMailer::ENCODING_BASE64, $a['type']);
        }
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $html;
        $mail->AltBody = $text;
        return $mail->send();
    } catch (MailException $e) {
        error_log('NEAM mail error: ' . $mail->ErrorInfo);
        return false;
    }
}
