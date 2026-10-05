<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiToken;
use App\Core\Auth;
use App\Core\DB;
use App\Core\Validator;
use App\Services\NotificationService;

final class AccountController extends Controller
{
    public function notifications(): string
    {
        $items = DB::all('SELECT * FROM notifications WHERE user_id = :u ORDER BY created_at DESC LIMIT 100', ['u' => $this->uid()]);
        return $this->app('account/notifications', compact('items') + ['title' => 'Notifications']);
    }

    public function markRead(): void
    {
        DB::run('UPDATE notifications SET read_at = :n WHERE user_id = :u AND read_at IS NULL', ['n' => now(), 'u' => $this->uid()]);
        flash('success', 'Toutes les notifications sont marquées comme lues.');
        back();
    }

    public function settings(): string
    {
        $tokens = DB::all('SELECT id, name, expires_at, last_used_at, created_at FROM api_tokens WHERE user_id = :u ORDER BY created_at DESC', ['u' => $this->uid()]);
        return $this->app('account/settings', compact('tokens') + ['title' => 'Paramètres du compte']);
    }

    public function preferences(): void
    {
        $freq = in_array(input('alert_frequency'), ['instant', 'daily', 'weekly', 'off'], true) ? input('alert_frequency') : 'instant';
        DB::update('users', [
            'notify_email' => input('notify_email') ? 1 : 0, 'notify_sms' => input('notify_sms') ? 1 : 0,
            'notify_whatsapp' => input('notify_whatsapp') ? 1 : 0, 'consent_marketing' => input('consent_marketing') ? 1 : 0,
            'alert_frequency' => $freq, 'updated_at' => now(),
        ], 'id = :id', ['id' => $this->uid()]);
        audit('account.preferences', 'user', $this->uid());
        flash('success', 'Préférences enregistrées. Tu recevras uniquement les alertes que tu as choisies.');
        redirect('/compte');
    }

    public function password(): void
    {
        $u = $this->user();
        if (!password_verify((string)($_POST['current_password'] ?? ''), $u['password_hash'])) {
            \App\Core\Session::put('_errors', ['current_password' => 'Mot de passe actuel incorrect.']);
            back();
        }
        $d = Validator::make($_POST, ['password' => 'required|min:8|strong|confirmed'])->validateOrBack();
        DB::update('users', ['password_hash' => password_hash($d['password'], PASSWORD_DEFAULT), 'updated_at' => now()], 'id = :id', ['id' => $u['id']]);
        DB::delete('api_tokens', 'user_id = :u', ['u' => $u['id']]);
        audit('account.password_changed', 'user', (int)$u['id']);
        NotificationService::notify((int)$u['id'], 'security', 'Ton mot de passe a été modifié', 'Si tu n\'es pas à l\'origine de ce changement, contacte immédiatement contact@neamindustry.com.', '/compte');
        flash('success', 'Mot de passe modifié. Tes jetons d\'API ont été révoqués par sécurité.');
        redirect('/compte');
    }

    /** Droit d'accès / portabilité : export JSON de toutes les données personnelles. */
    public function export(): void
    {
        $uid = $this->uid();
        $user = DB::one('SELECT id, role, email, phone, first_name, last_name, plan_code, created_at, notify_email, notify_sms, consent_marketing FROM users WHERE id = :u', ['u' => $uid]);
        $data = [
            'export_date' => date('c'), 'platform' => 'Tremplin by NEAM', 'user' => $user,
            'profile' => DB::one('SELECT * FROM candidate_profiles WHERE user_id = :u', ['u' => $uid]),
            'skills' => DB::all('SELECT s.name, cs.level FROM candidate_skills cs JOIN skills s ON s.id = cs.skill_id WHERE cs.user_id = :u', ['u' => $uid]),
            'educations' => DB::all('SELECT * FROM candidate_educations WHERE user_id = :u', ['u' => $uid]),
            'experiences' => DB::all('SELECT * FROM candidate_experiences WHERE user_id = :u', ['u' => $uid]),
            'applications' => DB::all('SELECT a.id, j.title, a.status, a.match_score, a.cover_letter, a.created_at FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.user_id = :u', ['u' => $uid]),
            'cover_letters' => DB::all('SELECT title, body, created_at FROM cover_letters WHERE user_id = :u', ['u' => $uid]),
            'riasec' => DB::all('SELECT code, scores, created_at FROM riasec_results WHERE user_id = :u', ['u' => $uid]),
            'payments' => DB::all('SELECT plan_code, amount, method, reference, status, created_at FROM payments WHERE user_id = :u', ['u' => $uid]),
            'notifications' => DB::all('SELECT type, title, created_at FROM notifications WHERE user_id = :u', ['u' => $uid]),
        ];
        audit('account.export', 'user', $uid);
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="tremplin-mes-donnees-' . date('Y-m-d') . '.json"');
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /** Droit à l'effacement. */
    public function destroy(): void
    {
        $u = $this->user();
        if (!password_verify((string)($_POST['password'] ?? ''), $u['password_hash'])) {
            flash('error', 'Mot de passe incorrect : suppression annulée.');
            back();
        }
        if ($u['role'] === 'admin' && (int)DB::value("SELECT COUNT(*) FROM users WHERE role = 'admin'") <= 1) {
            flash('error', 'Impossible de supprimer le dernier administrateur.');
            back();
        }
        foreach (DB::all('SELECT stored_name FROM documents WHERE user_id = :u', ['u' => $u['id']]) as $d) {
            @unlink(STORAGE_PATH . '/uploads/' . basename($d['stored_name']));
        }
        audit('account.deleted', 'user', (int)$u['id'], ['role' => $u['role']]);
        DB::transaction(function () use ($u) {
            if ($u['role'] === 'company' && ($c = current_company())) {
                if ((int)DB::value('SELECT COUNT(*) FROM company_users WHERE company_id = :c', ['c' => $c['id']]) <= 1) {
                    DB::delete('companies', 'id = :id', ['id' => $c['id']]);
                }
            }
            if ($u['role'] === 'school') {
                DB::run('UPDATE schools SET owner_user_id = NULL WHERE owner_user_id = :u', ['u' => $u['id']]);
            }
            DB::run('UPDATE reports SET user_id = NULL WHERE user_id = :u', ['u' => $u['id']]);
            DB::delete('users', 'id = :id', ['id' => $u['id']]);
        });
        Auth::logout();
        \App\Core\Session::start();
        flash('info', 'Ton compte et tes données ont été supprimés. Merci d\'avoir essayé Tremplin, et bonne route pour la suite !');
        redirect('/');
    }

    public function apiToken(): string
    {
        return $this->settings();
    }

    public function createApiToken(): void
    {
        $name = mb_substr(trim((string)input('name', 'Mon application')), 0, 60) ?: 'Mon application';
        $token = ApiToken::issue($this->uid(), $name);
        audit('api.token_created', 'user', $this->uid());
        \App\Core\Session::put('new_token', $token);
        flash('success', 'Jeton créé. Copie-le maintenant : il ne sera plus affiché.');
        redirect('/compte#api');
    }

    /** Téléchargement sécurisé des documents (propriétaire, recruteur destinataire ou admin). */
    public function document(string $id): void
    {
        $doc = DB::one('SELECT * FROM documents WHERE id = :id', ['id' => (int)$id]);
        if (!$doc) {
            abort(404);
        }
        $uid = $this->uid();
        $allowed = (int)$doc['user_id'] === $uid || Auth::is('admin');
        if (!$allowed && Auth::is('company') && ($c = current_company())) {
            $allowed = (bool)DB::value('SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.user_id = :u AND j.company_id = :c', ['u' => $doc['user_id'], 'c' => $c['id']]);
        }
        if (!$allowed) {
            abort(403);
        }
        $path = STORAGE_PATH . '/uploads/' . basename($doc['stored_name']);
        if (!is_file($path)) {
            abort(404);
        }
        audit('document.downloaded', 'document', (int)$doc['id']);
        header('Content-Type: ' . ($doc['mime'] ?: 'application/octet-stream'));
        header('Content-Disposition: attachment; filename="' . str_replace('"', '', $doc['original_name']) . '"');
        header('Content-Length: ' . filesize($path));
        header('X-Content-Type-Options: nosniff');
        readfile($path);
        exit;
    }

    /** Messagerie liée à une candidature (candidat ↔ recruteurs de l'entreprise). */
    public function sendMessage(string $id): void
    {
        $a = DB::one('SELECT a.*, j.company_id, j.title FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = :id', ['id' => (int)$id]);
        if (!$a) {
            abort(404);
        }
        $uid = $this->uid();
        $isCandidate = (int)$a['user_id'] === $uid;
        $isRecruiter = Auth::is('company') && current_company() && (int)current_company()['id'] === (int)$a['company_id'];
        if (!$isCandidate && !$isRecruiter) {
            abort(403);
        }
        $body = trim((string)input('body', ''));
        if ($body === '' || mb_strlen($body) > 2000) {
            flash('error', 'Le message doit contenir entre 1 et 2 000 caractères.');
            back();
        }
        DB::insert('messages', ['application_id' => $a['id'], 'sender_id' => $uid, 'body' => $body, 'created_at' => now()]);
        $recipients = $isCandidate ? DB::column('SELECT user_id FROM company_users WHERE company_id = :c', ['c' => $a['company_id']]) : [(int)$a['user_id']];
        foreach ($recipients as $r) {
            NotificationService::notify((int)$r, 'message', 'Nouveau message — ' . $a['title'], excerpt($body, 120), $isCandidate ? '/entreprise/candidatures/' . $a['id'] : '/espace/candidatures/' . $a['id']);
        }
        flash('success', 'Message envoyé. Le destinataire est prévenu.');
        back();
    }
}
