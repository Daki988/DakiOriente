<?php
declare(strict_types=1);

namespace App\Controllers\Company;

use App\Core\DB;
use App\Core\Validator;
use App\Services\Ai\AiService;
use App\Services\MatchingEngine;
use App\Services\NotificationService;
use App\Services\ProfileService;

final class RecruitController extends CompanyController
{
    private const MESSAGES = [
        'viewed'      => ['Ta candidature a été lue', 'Le recruteur de %s a consulté ta candidature. C\'est le bon moment pour préparer ton entretien, au cas où.'],
        'shortlisted' => ['Bonne nouvelle : tu es présélectionné·e !', '%s a retenu ta candidature pour la suite. Ton profil a fait la différence : entraîne-toi maintenant à l\'entretien pour transformer l\'essai.'],
        'interview'   => ['Invitation à un entretien', '%s souhaite te rencontrer ! Consulte les détails, puis lance une simulation d\'entretien sur cette offre : 20 minutes d\'entraînement changent tout.'],
        'accepted'    => ['Félicitations, ta candidature est acceptée !', '%s a retenu ta candidature. Le recruteur va te contacter très vite. Tu peux être fier·e de toi !'],
        'rejected'    => ['Réponse à ta candidature', '%s n\'a pas retenu ta candidature cette fois-ci. Ce n\'est pas un jugement sur ta valeur : regarde les axes d\'amélioration proposés, ils te rapprochent de la prochaine offre.'],
    ];

    /** Candidature reçue par l'entreprise courante uniquement (RBAC + cloisonnement). */
    private function ownApplication(int $id): array
    {
        $a = DB::one(
            'SELECT a.*, j.title, j.company_id, j.id AS job_id, u.first_name, u.last_name, u.email, u.phone
             FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.user_id
             WHERE a.id = :id AND j.company_id = :c',
            ['id' => $id, 'c' => $this->company()['id']]
        );
        return $a ?? abort(404);
    }

    public function pipeline(string $id): string
    {
        $job = $this->ownJob((int)$id);
        $apps = DB::all(
            'SELECT a.*, u.first_name, u.last_name, u.email, cp.headline, cp.city_id, ci.name AS city_name, cp.education_level
             FROM applications a JOIN users u ON u.id = a.user_id LEFT JOIN candidate_profiles cp ON cp.user_id = u.id LEFT JOIN cities ci ON ci.id = cp.city_id
             WHERE a.job_id = :j ORDER BY a.match_score DESC',
            ['j' => $job['id']]
        );
        $columns = ['sent' => [], 'viewed' => [], 'shortlisted' => [], 'interview' => [], 'accepted' => [], 'rejected' => []];
        foreach ($apps as $a) {
            $columns[$a['status']][] = $a;
        }
        return $this->app('company/pipeline', compact('job', 'columns', 'apps') + ['title' => 'Candidatures — ' . $job['title']]);
    }

    public function matching(string $id): string
    {
        $job = $this->ownJob((int)$id);
        $filters = ['city_id' => (int)input('city', 0) ?: null, 'education_min' => input('edu', ''), 'min_score' => (int)input('min', 50)];
        $results = MatchingEngine::candidatesForJob((int)$job['id'], 30, $filters);
        $applied = DB::column('SELECT user_id FROM applications WHERE job_id = :j', ['j' => $job['id']]);
        $cities = DB::all("SELECT ci.id, ci.name FROM cities ci JOIN countries co ON co.id = ci.country_id WHERE co.code = 'GA' ORDER BY ci.name");
        return $this->app('company/matching', compact('job', 'results', 'applied', 'filters', 'cities') + ['title' => 'Profils compatibles']);
    }

    public function application(string $id): string
    {
        $a = $this->ownApplication((int)$id);
        if ($a['status'] === 'sent') {
            $this->changeStatus($a, 'viewed', null);
            $a['status'] = 'viewed';
        }
        $p = ProfileService::load((int)$a['user_id']);
        $job = MatchingEngine::loadJob((int)$a['job_id']);
        $match = MatchingEngine::compute($p, $job);
        $summary = AiService::candidateSummary($p, $job);
        $events = DB::all('SELECT e.*, u.first_name FROM application_events e LEFT JOIN users u ON u.id = e.actor_id WHERE e.application_id = :a ORDER BY e.created_at, e.id', ['a' => $a['id']]);
        $interviews = DB::all('SELECT * FROM interviews WHERE application_id = :a ORDER BY scheduled_at', ['a' => $a['id']]);
        $messages = DB::all('SELECT m.*, u.first_name, u.role FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.application_id = :a ORDER BY m.created_at', ['a' => $a['id']]);
        $docs = DB::all('SELECT * FROM documents WHERE user_id = :u ORDER BY created_at DESC', ['u' => $a['user_id']]);
        $others = DB::all('SELECT a.id, u.first_name, u.last_name, a.match_score FROM applications a JOIN users u ON u.id = a.user_id WHERE a.job_id = :j AND a.id != :id ORDER BY a.match_score DESC LIMIT 5', ['j' => $a['job_id'], 'id' => $a['id']]);
        return $this->app('company/application', compact('a', 'p', 'job', 'match', 'summary', 'events', 'interviews', 'messages', 'docs', 'others') + ['title' => $a['first_name'] . ' ' . $a['last_name']]);
    }

    private function changeStatus(array $a, string $status, ?string $note): void
    {
        DB::update('applications', ['status' => $status, 'updated_at' => now()], 'id = :id', ['id' => $a['id']]);
        DB::insert('application_events', ['application_id' => $a['id'], 'status' => $status, 'note' => $note, 'actor_id' => $this->uid(), 'created_at' => now()]);
        if (isset(self::MESSAGES[$status])) {
            [$title, $body] = self::MESSAGES[$status];
            NotificationService::notify((int)$a['user_id'], 'status', $title . ' — ' . $a['title'], sprintf($body, $this->company()['name']), '/espace/candidatures/' . $a['id'], $status !== 'viewed', in_array($status, ['interview', 'accepted'], true));
        }
        audit('application.status', 'application', (int)$a['id'], ['status' => $status]);
    }

    public function status(string $id): void
    {
        $a = $this->ownApplication((int)$id);
        $status = (string)input('status');
        if (!isset(application_statuses()[$status]) || $status === 'draft') {
            $this->wantsJson() ? json_response(['error' => 'statut invalide'], 422) : back();
        }
        if ($status !== $a['status']) {
            $this->changeStatus($a, $status, mb_substr((string)input('note', ''), 0, 255) ?: null);
        }
        if ($this->wantsJson()) {
            json_response(['ok' => true, 'status' => $status]);
        }
        flash('success', 'Statut mis à jour : ' . application_statuses()[$status][0] . '. Le candidat est prévenu : une réponse rapide renforce l\'image de votre entreprise.');
        back();
    }

    public function notes(string $id): void
    {
        $a = $this->ownApplication((int)$id);
        $rating = (int)input('rating', 0);
        DB::update('applications', [
            'recruiter_notes' => mb_substr(trim((string)input('notes', '')), 0, 3000) ?: null,
            'rating' => $rating >= 1 && $rating <= 5 ? $rating : null,
        ], 'id = :id', ['id' => $a['id']]);
        flash('success', 'Notes internes enregistrées (visibles uniquement par votre équipe).');
        back();
    }

    public function interview(string $id): void
    {
        $a = $this->ownApplication((int)$id);
        $d = Validator::make($_POST, [
            'date' => 'required|date', 'time' => 'required', 'mode' => 'required|in:presentiel,visio,telephone',
            'location' => 'required|max:255', 'note' => 'nullable|max:1000',
        ])->validateOrBack();
        $at = date('Y-m-d H:i:s', strtotime($d['date'] . ' ' . $d['time']));
        if (strtotime($at) < time()) {
            flash('error', 'La date de l\'entretien doit être dans le futur.');
            back();
        }
        DB::insert('interviews', ['application_id' => $a['id'], 'scheduled_at' => $at, 'mode' => $d['mode'], 'location' => $d['location'], 'note' => $d['note'], 'created_at' => now()]);
        if ($a['status'] !== 'interview') {
            $this->changeStatus($a, 'interview', 'Entretien le ' . date_fr($at, true));
        } else {
            NotificationService::notify((int)$a['user_id'], 'interview', 'Entretien programmé — ' . $a['title'], 'Le ' . date_fr($at, true) . ' · ' . $d['location'] . '. Prépare-toi avec le simulateur d\'entretien de ton espace.', '/espace/candidatures/' . $a['id'], true, true);
        }
        flash('success', 'Entretien programmé le ' . date_fr($at, true) . '. Le candidat a reçu l\'invitation par e-mail et dans son espace.');
        back();
    }

    public function search(): string
    {
        $c = $this->company();
        $q = trim((string)input('q', ''));
        $jobs = DB::all("SELECT id, title FROM jobs WHERE company_id = :c AND status = 'published' ORDER BY created_at DESC", ['c' => $c['id']]);
        $jobId = (int)input('job', 0);
        $job = $jobId ? DB::one('SELECT id FROM jobs WHERE id = :id AND company_id = :c', ['id' => $jobId, 'c' => $c['id']]) : null;
        $where = ["u.role = 'candidate'", "u.status = 'active'", 'cp.visible_to_recruiters = 1'];
        $params = [];
        if ($q !== '') {
            $where[] = "(cp.headline LIKE :q1 OR cp.desired_job LIKE :q2 OR cp.field_of_study LIKE :q3 OR EXISTS (SELECT 1 FROM candidate_skills cs JOIN skills s ON s.id = cs.skill_id WHERE cs.user_id = u.id AND s.name LIKE :q4))";
            $params += ['q1' => "%$q%", 'q2' => "%$q%", 'q3' => "%$q%", 'q4' => "%$q%"];
        }
        if ((int)input('city', 0)) {
            $where[] = 'cp.city_id = :city';
            $params['city'] = (int)input('city');
        }
        if (input('edu', '') !== '') {
            $where[] = 'cp.education_level >= :edu';
            $params['edu'] = (int)input('edu');
        }
        if (input('available')) {
            $where[] = '(cp.availability_date IS NULL OR cp.availability_date <= :avail)';
            $params['avail'] = date('Y-m-d', strtotime('+30 days'));
        }
        $ids = DB::column('SELECT u.id FROM users u JOIN candidate_profiles cp ON cp.user_id = u.id WHERE ' . implode(' AND ', $where) . ' ORDER BY cp.employability_score DESC LIMIT 60', $params);
        $loadedJob = $job ? MatchingEngine::loadJob((int)$job['id']) : null;
        $results = [];
        foreach ($ids as $uid) {
            $p = ProfileService::load((int)$uid);
            $results[] = ['p' => $p, 'match' => $loadedJob ? MatchingEngine::compute($p, $loadedJob) : null];
        }
        if ($loadedJob) {
            usort($results, fn($a, $b) => $b['match']['score'] <=> $a['match']['score']);
        }
        $cities = DB::all("SELECT ci.id, ci.name FROM cities ci JOIN countries co ON co.id = ci.country_id WHERE co.code = 'GA' ORDER BY ci.name");
        return $this->app('company/search', compact('results', 'jobs', 'jobId', 'q', 'cities') + ['title' => 'CVthèque']);
    }

    public function candidate(string $id): string
    {
        $p = ProfileService::load((int)$id);
        if (!$p || !DB::value("SELECT COUNT(*) FROM users u JOIN candidate_profiles cp ON cp.user_id = u.id WHERE u.id = :id AND u.role = 'candidate' AND u.status = 'active'", ['id' => (int)$id])) {
            abort(404);
        }
        $c = $this->company();
        $application = DB::one('SELECT a.id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.user_id = :u AND j.company_id = :c ORDER BY a.created_at DESC', ['u' => (int)$id, 'c' => $c['id']]);
        if (!$application && !(int)$p['visible_to_recruiters']) {
            abort(404);
        }
        $jobs = DB::all("SELECT id, title FROM jobs WHERE company_id = :c AND status = 'published'", ['c' => $c['id']]);
        $jobId = (int)input('job', $jobs[0]['id'] ?? 0);
        $match = $jobId && in_array($jobId, array_column($jobs, 'id')) ? MatchingEngine::compute($p, MatchingEngine::loadJob($jobId)) : null;
        $summary = AiService::candidateSummary($p, $jobId ? MatchingEngine::loadJob($jobId) : null);
        audit('candidate.profile_viewed', 'user', (int)$id);
        return $this->app('company/candidate', compact('p', 'application', 'jobs', 'jobId', 'match', 'summary') + ['title' => $p['first_name'] . ' ' . mb_substr((string)$p['last_name'], 0, 1) . '.']);
    }

    public function invite(string $id): void
    {
        $job = $this->ownJob((int)input('job_id', 0));
        if ($job['status'] !== 'published') {
            flash('error', 'L\'offre doit être publiée pour inviter un candidat.');
            back();
        }
        $cand = DB::one("SELECT id, first_name FROM users WHERE id = :id AND role = 'candidate'", ['id' => (int)$id]);
        if (!$cand) {
            abort(404);
        }
        $m = MatchingEngine::forUser((int)$cand['id'], (int)$job['id']);
        NotificationService::notify((int)$cand['id'], 'invite', $this->company()['name'] . ' t\'invite à postuler !',
            'Le recruteur a repéré ton profil : tu corresponds à ' . $m['score'] . ' % à l\'offre « ' . $job['title'] . ' ». Une invitation directe, c\'est rare : ne la laisse pas passer.', '/offres/' . $job['id'], true, true);
        audit('candidate.invited', 'user', (int)$cand['id'], ['job' => $job['id']]);
        flash('success', $cand['first_name'] . ' a été invité·e à postuler. Une invitation directe est le meilleur moyen d\'attirer un profil qui vous intéresse.');
        back();
    }
}
