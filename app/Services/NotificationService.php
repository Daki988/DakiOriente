<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;

/**
 * Notifications multicanal (cahier des charges §11) : in-app, e-mail transactionnel, SMS/WhatsApp
 * selon le consentement et les préférences de l'utilisateur. Les fournisseurs externes sont encapsulés :
 * en mode « log », les messages sont tracés dans la table outbox (visible dans le back-office).
 */
final class NotificationService
{
    public static function notify(int $userId, string $type, string $title, string $body = '', ?string $link = null, bool $email = true, bool $sms = false): void
    {
        DB::insert('notifications', [
            'user_id' => $userId, 'type' => $type, 'title' => $title, 'body' => mb_substr($body, 0, 500),
            'link' => $link, 'created_at' => now(),
        ]);
        $user = DB::one('SELECT email, phone, first_name, notify_email, notify_sms, notify_whatsapp FROM users WHERE id = :id', ['id' => $userId]);
        if (!$user) {
            return;
        }
        if ($email && (int)$user['notify_email']) {
            self::sendEmail($user['email'], $title, self::emailBody($user['first_name'], $title, $body, $link));
        }
        if ($sms && $user['phone']) {
            if ((int)$user['notify_sms']) {
                self::queue('sms', $user['phone'], null, 'Tremplin : ' . $title . ($link ? ' ' . url($link) : ''));
            }
            if ((int)$user['notify_whatsapp']) {
                self::queue('whatsapp', $user['phone'], null, '*Tremplin* — ' . $title . "\n" . $body);
            }
        }
    }

    public static function sendEmail(string $to, string $subject, string $body): void
    {
        $id = self::queue('email', $to, $subject, $body);
        if (config('mail.driver') === 'mail') {
            $headers = 'From: Tremplin by NEAM <' . config('mail.from') . ">\r\nContent-Type: text/plain; charset=UTF-8";
            $ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
            DB::update('outbox', ['status' => $ok ? 'sent' : 'failed', 'sent_at' => now()], 'id = :id', ['id' => $id]);
        }
    }

    private static function queue(string $channel, string $to, ?string $subject, string $body): int
    {
        $id = DB::insert('outbox', [
            'channel' => $channel, 'recipient' => $to, 'subject' => $subject, 'body' => $body,
            'status' => config('mail.driver') === 'log' || $channel !== 'email' ? 'logged' : 'queued', 'created_at' => now(),
        ]);
        @file_put_contents(
            STORAGE_PATH . '/logs/outbox.log',
            sprintf("[%s] %s → %s | %s\n", now(), strtoupper($channel), $to, $subject ?? mb_substr($body, 0, 80)),
            FILE_APPEND
        );
        return $id;
    }

    private static function emailBody(string $firstName, string $title, string $body, ?string $link): string
    {
        return "Bonjour $firstName,\n\n$title\n\n$body\n\n" . ($link ? 'Voir sur Tremplin : ' . url($link) . "\n\n" : '')
            . "— L'équipe Tremplin by NEAM\nTransformer le potentiel en opportunités.\n\n"
            . "Pour modifier tes préférences de notification : " . url('/compte');
    }

    /** Alerte les candidats dont le profil correspond fortement à une offre nouvellement publiée. */
    public static function jobAlerts(int $jobId, int $threshold = 70): int
    {
        $job = MatchingEngine::loadJob($jobId);
        if (!$job || $job['status'] !== 'published') {
            return 0;
        }
        $count = 0;
        $ids = DB::column("SELECT u.id FROM users u JOIN candidate_profiles cp ON cp.user_id = u.id WHERE u.role = 'candidate' AND u.status = 'active' AND u.alert_frequency != 'off'");
        foreach ($ids as $uid) {
            $p = ProfileService::load((int)$uid);
            $m = MatchingEngine::compute($p, $job);
            if ($m['score'] >= $threshold && !$m['eliminated']) {
                self::notify((int)$uid, 'job_match', 'Nouvelle offre compatible à ' . $m['score'] . ' % : ' . $job['title'],
                    $job['company_name'] . ' · ' . ($job['city_name'] ?? '') . ' — ' . $m['level'], '/offres/' . $jobId, true, true);
                $count++;
            }
        }
        return $count;
    }
}
