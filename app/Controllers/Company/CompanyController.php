<?php
declare(strict_types=1);

namespace App\Controllers\Company;

use App\Controllers\Controller;
use App\Core\DB;
use App\Core\Validator;
use App\Services\MatchingEngine;
use App\Services\NotificationService;

final class CompanyController extends Controller
{
    protected function company(): array
    {
        return current_company() ?? abort(403);
    }

    /** Offre appartenant à l'entreprise courante (sinon 404 : aucune fuite d'existence). */
    protected function ownJob(int $id): array
    {
        $job = DB::one('SELECT * FROM jobs WHERE id = :id AND company_id = :c', ['id' => $id, 'c' => $this->company()['id']]);
        return $job ?? abort(404);
    }

    public function dashboard(): string
    {
        $c = $this->company();
        $cid = (int)$c['id'];
        $kpi = [
            'active'   => (int)DB::value("SELECT COUNT(*) FROM jobs WHERE company_id = :c AND status = 'published'", ['c' => $cid]),
            'apps'     => (int)DB::value('SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = :c', ['c' => $cid]),
            'new'      => (int)DB::value("SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = :c AND a.status = 'sent'", ['c' => $cid]),
            'views'    => (int)DB::value('SELECT COALESCE(SUM(views),0) FROM jobs WHERE company_id = :c', ['c' => $cid]),
            'hired'    => (int)DB::value("SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = :c AND a.status = 'accepted'", ['c' => $cid]),
            'avgScore' => (int)DB::value('SELECT AVG(a.match_score) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = :c', ['c' => $cid]),
        ];
        $jobs = DB::all(
            "SELECT j.*, ci.name AS city_name,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS apps,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'sent') AS new_apps,
                (SELECT MAX(a.match_score) FROM applications a WHERE a.job_id = j.id) AS best
             FROM jobs j LEFT JOIN cities ci ON ci.id = j.city_id WHERE j.company_id = :c AND j.status IN ('published','pending','draft') ORDER BY j.created_at DESC LIMIT 6",
            ['c' => $cid]
        );
        $topCandidates = DB::all(
            "SELECT a.id, a.match_score, a.status, a.created_at, u.first_name, u.last_name, u.email, cp.headline, j.title
             FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.user_id LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
             WHERE j.company_id = :c AND a.status IN ('sent','viewed','shortlisted') ORDER BY a.match_score DESC LIMIT 5",
            ['c' => $cid]
        );
        $funnel = [];
        foreach (DB::all('SELECT a.status, COUNT(*) AS n FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = :c GROUP BY a.status', ['c' => $cid]) as $r) {
            $funnel[$r['status']] = (int)$r['n'];
        }
        $interviews = DB::all(
            'SELECT i.*, u.first_name, u.last_name, j.title, a.id AS application_id FROM interviews i JOIN applications a ON a.id = i.application_id
             JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.user_id WHERE j.company_id = :c AND i.scheduled_at >= :d ORDER BY i.scheduled_at LIMIT 4',
            ['c' => $cid, 'd' => date('Y-m-d 00:00:00')]
        );
        return $this->app('company/dashboard', compact('c', 'kpi', 'jobs', 'topCandidates', 'funnel', 'interviews') + ['title' => 'Tableau de bord recruteur', 'charts' => true]);
    }

    public function profile(): string
    {
        $c = current_company();
        $sectors = DB::all('SELECT id, name FROM sectors ORDER BY name');
        $cities = DB::all("SELECT ci.id, ci.name, co.name AS country FROM cities ci JOIN countries co ON co.id = ci.country_id ORDER BY co.code = 'GA' DESC, co.name, ci.name");
        $team = $c ? DB::all('SELECT u.first_name, u.last_name, u.email, cu.role FROM company_users cu JOIN users u ON u.id = cu.user_id WHERE cu.company_id = :c', ['c' => $c['id']]) : [];
        return $this->app('company/profile', compact('c', 'sectors', 'cities', 'team') + ['title' => 'Profil entreprise']);
    }

    public function saveProfile(): void
    {
        $d = Validator::make($_POST, [
            'name' => 'required|max:160', 'sector_id' => 'required|exists:sectors,id', 'city_id' => 'required|exists:cities,id',
            'size' => 'nullable|in:1-10,11-50,51-250,250+', 'website' => 'nullable|url|max:255', 'email' => 'nullable|email',
            'phone' => 'nullable|phone', 'rccm' => 'nullable|max:60', 'description' => 'nullable|max:3000',
        ])->validateOrBack();
        $c = current_company();
        $data = $d + ['color' => preg_match('/^#[0-9a-f]{6}$/i', (string)input('color')) ? input('color') : ($c['color'] ?? '#0057ff')];
        if ($c) {
            DB::update('companies', $data, 'id = :id', ['id' => $c['id']]);
            audit('company.updated', 'company', (int)$c['id']);
        } else {
            $id = DB::insert('companies', $data + ['slug' => slugify($d['name']) . '-' . substr(bin2hex(random_bytes(2)), 0, 4), 'status' => 'pending', 'created_at' => now()]);
            DB::insert('company_users', ['company_id' => $id, 'user_id' => $this->uid(), 'role' => 'owner']);
        }
        flash('success', 'Profil entreprise enregistré.');
        redirect('/entreprise/profil');
    }

    public function jobs(): string
    {
        $c = $this->company();
        $status = in_array(input('statut'), ['published', 'pending', 'draft', 'archived', 'rejected'], true) ? input('statut') : null;
        $jobs = DB::all(
            "SELECT j.*, ci.name AS city_name, (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS apps,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'sent') AS new_apps
             FROM jobs j LEFT JOIN cities ci ON ci.id = j.city_id WHERE j.company_id = :c" . ($status ? ' AND j.status = :s' : '') . ' ORDER BY j.created_at DESC',
            ['c' => $c['id']] + ($status ? ['s' => $status] : [])
        );
        return $this->app('company/jobs', compact('c', 'jobs', 'status') + ['title' => 'Mes offres']);
    }

    private function formRefs(): array
    {
        return [
            'sectors' => DB::all('SELECT id, name FROM sectors ORDER BY name'),
            'cities'  => DB::all("SELECT ci.id, ci.name, co.name AS country FROM cities ci JOIN countries co ON co.id = ci.country_id ORDER BY co.code = 'GA' DESC, co.name, ci.name"),
            'skills'  => DB::all("SELECT id, name FROM skills WHERE category = 'tech' ORDER BY name"),
            'softs'   => DB::all("SELECT id, name FROM skills WHERE category = 'soft' ORDER BY name"),
        ];
    }

    public function createJob(): string
    {
        $c = $this->company();
        $job = ['type' => 'stage', 'sector_id' => $c['sector_id'], 'city_id' => $c['city_id'], 'remote' => 0, 'education_min' => 3, 'experience_min' => 0, 'positions' => 1, 'apply_mode' => 'internal', 'languages' => 'Français:B2'];
        return $this->app('company/job_form', $this->formRefs() + ['c' => $c, 'job' => $job, 'jobSkills' => [], 'title' => 'Publier une offre']);
    }

    public function editJob(string $id): string
    {
        $job = $this->ownJob((int)$id);
        $jobSkills = DB::all('SELECT skill_id, required, weight FROM job_skills WHERE job_id = :j', ['j' => $job['id']]);
        return $this->app('company/job_form', $this->formRefs() + ['c' => $this->company(), 'job' => $job, 'jobSkills' => $jobSkills, 'title' => 'Modifier l\'offre']);
    }

    private function validated(): array
    {
        $d = Validator::make($_POST, [
            'title' => 'required|min:5|max:190', 'type' => 'required|in:' . implode(',', array_keys(job_types())),
            'sector_id' => 'required|exists:sectors,id', 'city_id' => 'required|exists:cities,id', 'remote' => 'required|in:0,1,2',
            'summary' => 'required|min:20|max:300', 'description' => 'required|min:50|max:6000', 'missions' => 'nullable|max:4000', 'profile' => 'nullable|max:4000',
            'education_min' => 'required|between:0,7', 'experience_min' => 'required|between:0,240',
            'salary_min' => 'nullable|between:0,100000000', 'salary_max' => 'nullable|between:0,100000000',
            'duration' => 'nullable|max:60', 'start_date' => 'nullable|date', 'deadline' => 'nullable|date', 'positions' => 'required|between:1,100',
            'apply_mode' => 'required|in:internal,external', 'external_url' => 'nullable|url|max:255',
        ])->validateOrBack();
        if ($d['apply_mode'] === 'external' && !$d['external_url']) {
            \App\Core\Session::put('_errors', ['external_url' => 'Indique le lien de candidature externe.']);
            back();
        }
        $langs = [];
        foreach ((array)($_POST['lang_name'] ?? []) as $i => $n) {
            $n = trim(str_replace([':', ','], '', (string)$n));
            $l = (string)($_POST['lang_level'][$i] ?? 'B1');
            if ($n !== '' && isset(language_levels()[$l])) {
                $langs[] = "$n:$l";
            }
        }
        $soft = array_values(array_filter(array_map('trim', (array)($_POST['soft'] ?? []))));
        return $d + [
            'languages' => implode(',', $langs), 'soft_skills' => implode(',', array_slice($soft, 0, 6)),
            'education_eliminatory' => input('education_eliminatory') ? 1 : 0, 'slug' => slugify($d['title']),
        ];
    }

    private function syncSkills(int $jobId): void
    {
        DB::delete('job_skills', 'job_id = :j', ['j' => $jobId]);
        $seen = [];
        foreach ((array)($_POST['skill_id'] ?? []) as $i => $sid) {
            $sid = (int)$sid;
            if (!$sid || isset($seen[$sid])) {
                continue;
            }
            $seen[$sid] = true;
            DB::insert('job_skills', [
                'job_id' => $jobId, 'skill_id' => $sid,
                'required' => ($_POST['skill_required'][$i] ?? '0') === '1' ? 1 : 0,
                'weight' => max(1, min(5, (int)($_POST['skill_weight'][$i] ?? 3))),
            ]);
        }
    }

    public function storeJob(): void
    {
        $c = $this->company();
        $active = (int)DB::value("SELECT COUNT(*) FROM jobs WHERE company_id = :c AND status IN ('published','pending')", ['c' => $c['id']]);
        if (input('action') !== 'draft' && $active >= (int)$c['job_credits']) {
            flash('warning', 'Vous avez atteint votre quota de ' . $c['job_credits'] . ' offres actives. Archivez une offre ou passez à l\'offre Entreprise Pro.');
            redirect('/abonnement');
        }
        $d = $this->validated();
        $status = input('action') === 'draft' ? 'draft' : ($c['status'] === 'verified' ? 'published' : 'pending');
        $id = DB::transaction(function () use ($d, $c, $status) {
            $id = DB::insert('jobs', $d + [
                'company_id' => $c['id'], 'status' => $status, 'created_by' => $this->uid(),
                'published_at' => $status === 'published' ? now() : null, 'created_at' => now(), 'updated_at' => now(),
            ]);
            $this->syncSkills($id);
            return $id;
        });
        audit('job.created', 'job', $id, ['status' => $status]);
        $this->afterPublish($id, $status);
        redirect($status === 'draft' ? '/entreprise/offres' : '/entreprise/offres/' . $id . '/matching');
    }

    public function updateJob(string $id): void
    {
        $job = $this->ownJob((int)$id);
        $d = $this->validated();
        $c = $this->company();
        $status = $job['status'];
        if (input('action') === 'publish' && in_array($status, ['draft', 'rejected', 'archived'], true)) {
            $status = $c['status'] === 'verified' ? 'published' : 'pending';
        }
        DB::transaction(function () use ($d, $job, $status) {
            DB::update('jobs', $d + ['status' => $status, 'updated_at' => now(), 'published_at' => $status === 'published' ? ($job['published_at'] ?: now()) : $job['published_at']], 'id = :id', ['id' => $job['id']]);
            $this->syncSkills((int)$job['id']);
        });
        MatchingEngine::forget((int)$job['id']);
        audit('job.updated', 'job', (int)$job['id']);
        if ($status !== $job['status']) {
            $this->afterPublish((int)$job['id'], $status);
        } else {
            flash('success', 'Offre mise à jour. Les scores de compatibilité ont été recalculés.');
        }
        redirect('/entreprise/offres');
    }

    private function afterPublish(int $id, string $status): void
    {
        if ($status === 'published') {
            $n = NotificationService::jobAlerts($id, (int)setting('match_alert_threshold', 70));
            flash('success', 'Offre publiée ! ' . ($n ? "$n candidat(s) très compatible(s) ont été alerté(s)." : 'Découvrez les profils compatibles.'));
        } elseif ($status === 'pending') {
            foreach (DB::column("SELECT id FROM users WHERE role = 'admin'") as $a) {
                NotificationService::notify((int)$a, 'moderation', 'Offre à modérer', 'Une nouvelle offre attend validation.', '/admin/offres?statut=pending', false);
            }
            flash('info', 'Offre enregistrée. Elle sera publiée après vérification de votre entreprise par l\'équipe NEAM (24–48 h).');
        } else {
            flash('success', 'Brouillon enregistré.');
        }
    }

    public function duplicateJob(string $id): void
    {
        $job = $this->ownJob((int)$id);
        $copy = $job;
        unset($copy['id']);
        $copy['title'] = mb_substr($job['title'] . ' (copie)', 0, 190);
        $copy['status'] = 'draft';
        $copy['views'] = 0;
        $copy['featured'] = 0;
        $copy['published_at'] = null;
        $copy['created_at'] = $copy['updated_at'] = now();
        $newId = DB::insert('jobs', $copy);
        foreach (DB::all('SELECT * FROM job_skills WHERE job_id = :j', ['j' => $job['id']]) as $s) {
            DB::insert('job_skills', ['job_id' => $newId, 'skill_id' => $s['skill_id'], 'required' => $s['required'], 'weight' => $s['weight']]);
        }
        audit('job.duplicated', 'job', $newId, ['from' => $job['id']]);
        flash('success', 'Offre dupliquée en brouillon.');
        redirect('/entreprise/offres/' . $newId . '/modifier');
    }

    public function archiveJob(string $id): void
    {
        $job = $this->ownJob((int)$id);
        DB::update('jobs', ['status' => 'archived', 'updated_at' => now()], 'id = :id', ['id' => $job['id']]);
        audit('job.archived', 'job', (int)$job['id']);
        flash('info', 'Offre archivée.');
        redirect('/entreprise/offres');
    }

    public function stats(): string
    {
        $c = $this->company();
        $cid = (int)$c['id'];
        $ym = DB::yearMonth('a.created_at');
        $monthly = DB::all("SELECT $ym AS m, COUNT(*) AS n FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = :c GROUP BY m ORDER BY m", ['c' => $cid]);
        $perJob = DB::all(
            "SELECT j.id, j.title, j.views, j.status, j.published_at,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS apps,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status IN ('shortlisted','interview','accepted')) AS shortlisted,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'accepted') AS hired,
                (SELECT AVG(a.match_score) FROM applications a WHERE a.job_id = j.id) AS avg_score
             FROM jobs j WHERE j.company_id = :c ORDER BY apps DESC",
            ['c' => $cid]
        );
        // Délai moyen de recrutement (envoi → acceptation) et de présélection
        $hireDelays = [];
        $shortDelays = [];
        foreach (DB::all("SELECT a.created_at, e.status, e.created_at AS at FROM applications a JOIN jobs j ON j.id = a.job_id JOIN application_events e ON e.application_id = a.id WHERE j.company_id = :c AND e.status IN ('accepted','shortlisted')", ['c' => $cid]) as $r) {
            $days = max(0, (strtotime($r['at']) - strtotime($r['created_at'])) / 86400);
            if ($r['status'] === 'accepted') {
                $hireDelays[] = $days;
            } else {
                $shortDelays[] = $days;
            }
        }
        $totals = ['views' => array_sum(array_column($perJob, 'views')), 'apps' => array_sum(array_column($perJob, 'apps')), 'short' => array_sum(array_column($perJob, 'shortlisted')), 'hired' => array_sum(array_column($perJob, 'hired'))];
        $delays = ['hire' => $hireDelays ? round(array_sum($hireDelays) / count($hireDelays), 1) : null, 'short' => $shortDelays ? round(array_sum($shortDelays) / count($shortDelays), 1) : null];
        $scoreDist = [0, 0, 0, 0];
        foreach (DB::column('SELECT a.match_score FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = :c', ['c' => $cid]) as $s) {
            $scoreDist[$s >= 85 ? 3 : ($s >= 70 ? 2 : ($s >= 50 ? 1 : 0))]++;
        }
        return $this->app('company/stats', compact('c', 'monthly', 'perJob', 'totals', 'delays', 'scoreDist') + ['title' => 'Statistiques', 'charts' => true]);
    }
}
