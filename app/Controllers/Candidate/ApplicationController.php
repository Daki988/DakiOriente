<?php
declare(strict_types=1);

namespace App\Controllers\Candidate;

use App\Controllers\Controller;
use App\Core\DB;
use App\Services\JobSearch;
use App\Services\MatchingEngine;
use App\Services\NotificationService;
use App\Services\PlanService;
use App\Services\ProfileService;

final class ApplicationController extends Controller
{
    public function toggleFavorite(string $id): void
    {
        $jobId = (int)$id;
        if (!DB::value("SELECT COUNT(*) FROM jobs WHERE id = :id AND status = 'published'", ['id' => $jobId])) {
            abort(404);
        }
        $exists = (bool)DB::value('SELECT COUNT(*) FROM favorites WHERE user_id = :u AND job_id = :j', ['u' => $this->uid(), 'j' => $jobId]);
        if ($exists) {
            DB::delete('favorites', 'user_id = :u AND job_id = :j', ['u' => $this->uid(), 'j' => $jobId]);
        } else {
            DB::insert('favorites', ['user_id' => $this->uid(), 'job_id' => $jobId, 'created_at' => now()]);
        }
        if ($this->wantsJson()) {
            json_response(['favorite' => !$exists]);
        }
        flash('success', $exists ? 'Offre retirée de tes favoris.' : 'Offre ajoutée à tes favoris.');
        back();
    }

    private function loadPublishedJob(int $id): array
    {
        $job = MatchingEngine::loadJob($id);
        if (!$job || $job['status'] !== 'published') {
            abort(404);
        }
        return $job;
    }

    public function applyForm(string $id): string
    {
        $job = $this->loadPublishedJob((int)$id);
        $existing = DB::one('SELECT id FROM applications WHERE job_id = :j AND user_id = :u', ['j' => $job['id'], 'u' => $this->uid()]);
        if ($existing) {
            flash('info', 'Tu as déjà postulé à cette offre.');
            redirect('/espace/candidatures/' . $existing['id']);
        }
        if ($job['apply_mode'] === 'external') {
            redirect($job['external_url']);
        }
        $match = MatchingEngine::forUser($this->uid(), (int)$job['id']);
        $quota = PlanService::applicationQuota($this->user());
        $letterId = (int)input('letter', 0);
        $letter = $letterId ? DB::value('SELECT body FROM cover_letters WHERE id = :id AND user_id = :u', ['id' => $letterId, 'u' => $this->uid()]) : null;
        $letters = DB::all('SELECT id, title FROM cover_letters WHERE user_id = :u ORDER BY created_at DESC LIMIT 10', ['u' => $this->uid()]);
        $p = ProfileService::load($this->uid());
        return $this->app('candidate/apply', compact('job', 'match', 'quota', 'letter', 'letters', 'p') + ['title' => 'Postuler — ' . $job['title']]);
    }

    public function apply(string $id): void
    {
        $job = $this->loadPublishedJob((int)$id);
        $uid = $this->uid();
        if (DB::value('SELECT COUNT(*) FROM applications WHERE job_id = :j AND user_id = :u', ['j' => $job['id'], 'u' => $uid])) {
            flash('info', 'Tu as déjà postulé à cette offre.');
            redirect('/espace/candidatures');
        }
        $quota = PlanService::applicationQuota($this->user());
        if ($quota['remaining'] !== null && $quota['remaining'] <= 0) {
            flash('warning', 'Tu as atteint ta limite de ' . $quota['limit'] . ' candidatures ce mois-ci. Passe à une offre supérieure pour continuer.');
            redirect('/abonnement');
        }
        $letter = trim((string)input('cover_letter', ''));
        if (mb_strlen($letter) > 6000) {
            $letter = mb_substr($letter, 0, 6000);
        }
        $match = MatchingEngine::forUser($uid, (int)$job['id'], true);
        $appId = DB::transaction(function () use ($job, $uid, $letter, $match) {
            $aid = DB::insert('applications', [
                'job_id' => $job['id'], 'user_id' => $uid, 'status' => 'sent', 'cover_letter' => $letter ?: null,
                'match_score' => $match['score'], 'match_details' => json_encode($match['criteria'], JSON_UNESCAPED_UNICODE),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::insert('application_events', ['application_id' => $aid, 'status' => 'sent', 'note' => 'Candidature envoyée', 'actor_id' => $uid, 'created_at' => now()]);
            return $aid;
        });
        $u = $this->user();
        $threshold = (int)setting('match_alert_threshold', 70);
        foreach (DB::column('SELECT user_id FROM company_users WHERE company_id = :c', ['c' => $job['company_id']]) as $rid) {
            NotificationService::notify((int)$rid, 'application',
                ($match['score'] >= $threshold ? '★ Candidature très compatible (' . $match['score'] . ' %) : ' : 'Nouvelle candidature : ') . $job['title'],
                $u['first_name'] . ' ' . mb_substr($u['last_name'], 0, 1) . '. a postulé. ' . $match['level'] . '.',
                '/entreprise/candidatures/' . $appId, $match['score'] >= $threshold);
        }
        NotificationService::notify($uid, 'status', 'Candidature envoyée : ' . $job['title'], 'Tu seras notifié·e à chaque étape. Astuce : prépare déjà ton entretien.', '/espace/candidatures/' . $appId);
        audit('application.created', 'application', $appId, ['job' => $job['id'], 'score' => $match['score']]);
        flash('success', 'Candidature envoyée à ' . $job['company_name'] . ' ! Bonne chance');
        redirect('/espace/candidatures/' . $appId);
    }

    public function index(): string
    {
        $status = (string)input('statut', '');
        $params = ['u' => $this->uid()];
        $where = 'a.user_id = :u';
        if (isset(application_statuses()[$status])) {
            $where .= ' AND a.status = :s';
            $params['s'] = $status;
        }
        $apps = DB::all(
            "SELECT a.*, j.title, j.type, co.name AS company_name, co.color AS company_color, c.name AS city_name,
                (SELECT MIN(i.scheduled_at) FROM interviews i WHERE i.application_id = a.id) AS interview_at
             FROM applications a JOIN jobs j ON j.id = a.job_id JOIN companies co ON co.id = j.company_id LEFT JOIN cities c ON c.id = j.city_id
             WHERE $where ORDER BY a.updated_at DESC",
            $params
        );
        $counts = ['' => (int)DB::value('SELECT COUNT(*) FROM applications WHERE user_id = :u', ['u' => $this->uid()])];
        foreach (DB::all('SELECT status, COUNT(*) AS n FROM applications WHERE user_id = :u GROUP BY status', ['u' => $this->uid()]) as $r) {
            $counts[$r['status']] = (int)$r['n'];
        }
        return $this->app('candidate/applications', compact('apps', 'counts', 'status') + ['title' => 'Mes candidatures']);
    }

    private function own(int $id): array
    {
        $a = DB::one(
            'SELECT a.*, j.title, j.company_id, co.name AS company_name, co.color AS company_color, c.name AS city_name
             FROM applications a JOIN jobs j ON j.id = a.job_id JOIN companies co ON co.id = j.company_id LEFT JOIN cities c ON c.id = j.city_id
             WHERE a.id = :id AND a.user_id = :u',
            ['id' => $id, 'u' => $this->uid()]
        );
        if (!$a) {
            abort(404);
        }
        return $a;
    }

    public function show(string $id): string
    {
        $a = $this->own((int)$id);
        $events = DB::all('SELECT * FROM application_events WHERE application_id = :a ORDER BY created_at, id', ['a' => $a['id']]);
        $interviews = DB::all('SELECT * FROM interviews WHERE application_id = :a ORDER BY scheduled_at', ['a' => $a['id']]);
        $messages = DB::all('SELECT m.*, u.first_name, u.last_name, u.role FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.application_id = :a ORDER BY m.created_at', ['a' => $a['id']]);
        DB::run('UPDATE messages SET read_at = :n WHERE application_id = :a AND sender_id != :u AND read_at IS NULL', ['n' => now(), 'a' => $a['id'], 'u' => $this->uid()]);
        $match = MatchingEngine::forUser($this->uid(), (int)$a['job_id']);
        return $this->app('candidate/application', compact('a', 'events', 'interviews', 'messages', 'match') + ['title' => 'Candidature — ' . $a['title']]);
    }

    public function reminder(string $id): void
    {
        $a = $this->own((int)$id);
        DB::update('applications', ['reminder_at' => date('Y-m-d 09:00:00', strtotime('+7 days'))], 'id = :id', ['id' => $a['id']]);
        NotificationService::notify($this->uid(), 'reminder', 'Rappel programmé : relancer ' . $a['company_name'], 'Le ' . date_fr(date('Y-m-d', strtotime('+7 days'))) . ', pense à relancer poliment le recruteur si tu n\'as pas de réponse.', '/espace/candidatures/' . $a['id'], false);
        flash('success', 'Rappel programmé dans 7 jours.');
        redirect('/espace/candidatures/' . $a['id']);
    }

    public function withdraw(string $id): void
    {
        $a = $this->own((int)$id);
        if (!in_array($a['status'], ['draft', 'sent', 'viewed'], true)) {
            flash('error', 'Cette candidature est déjà en cours de traitement et ne peut plus être retirée.');
            back();
        }
        DB::delete('applications', 'id = :id', ['id' => $a['id']]);
        audit('application.withdrawn', 'application', (int)$a['id']);
        flash('info', 'Candidature retirée.');
        redirect('/espace/candidatures');
    }

    public function favorites(): string
    {
        $jobs = DB::all(JobSearch::BASE_SELECT . ' JOIN favorites f ON f.job_id = j.id WHERE f.user_id = :u ORDER BY f.created_at DESC', ['u' => $this->uid()]);
        $p = ProfileService::load($this->uid());
        $items = array_map(fn($j) => ['job' => $j, 'match' => MatchingEngine::compute($p, MatchingEngine::loadJob((int)$j['id']))], $jobs);
        return $this->app('candidate/favorites', compact('items') + ['title' => 'Mes favoris']);
    }
}
