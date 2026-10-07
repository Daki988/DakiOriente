<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\DB;
use App\Services\JobSearch;
use App\Services\MatchingEngine;
use App\Services\ProfileService;

final class JobController extends Controller
{
    public function index(): string
    {
        $filters = [
            'q'         => trim((string)input('q', '')),
            'city'      => (int)input('city', 0) ?: null,
            'sector'    => (int)input('sector', 0) ?: null,
            'type'      => array_filter((array)($_GET['type'] ?? [])),
            'education' => input('education', ''),
            'remote'    => input('remote') ? 1 : null,
            'beginner'  => input('beginner') ? 1 : null,
            'sort'      => in_array(input('sort'), ['recent', 'salary', 'deadline', 'match'], true) ? input('sort') : 'recent',
        ];
        [$offset, $page] = $this->paginate(12);
        $isCandidate = Auth::is('candidate');

        if ($filters['sort'] === 'match' && $isCandidate) {
            // Tri par compatibilité : calcul sur l'ensemble filtré puis pagination
            $all = JobSearch::search($filters, 300)['items'];
            $p = ProfileService::load(Auth::id());
            $scored = [];
            foreach ($all as $job) {
                $scored[] = ['job' => $job, 'match' => MatchingEngine::compute($p, MatchingEngine::loadJob((int)$job['id']))];
            }
            usort($scored, fn($a, $b) => $b['match']['score'] <=> $a['match']['score']);
            $total = count($scored);
            $results = array_slice($scored, $offset, 12);
        } else {
            $res = JobSearch::search($filters, 12, $offset);
            $total = $res['total'];
            $results = [];
            $p = $isCandidate ? ProfileService::load(Auth::id()) : null;
            foreach ($res['items'] as $job) {
                $results[] = ['job' => $job, 'match' => $p ? MatchingEngine::compute($p, MatchingEngine::loadJob((int)$job['id'])) : null];
            }
        }
        $favs = $isCandidate ? DB::column('SELECT job_id FROM favorites WHERE user_id = :u', ['u' => Auth::id()]) : [];
        $sectors = DB::all('SELECT id, name FROM sectors ORDER BY name');
        $cities = DB::all("SELECT ci.id, ci.name, co.name AS country FROM cities ci JOIN countries co ON co.id = ci.country_id ORDER BY co.code = 'GA' DESC, co.name, ci.name");
        $typeCounts = [];
        foreach (DB::all("SELECT type, COUNT(*) AS n FROM jobs WHERE status = 'published' GROUP BY type") as $r) {
            $typeCounts[$r['type']] = (int)$r['n'];
        }
        return $this->view('jobs/index', compact('filters', 'results', 'total', 'page', 'favs', 'sectors', 'cities', 'typeCounts', 'isCandidate') + [
            'pages' => (int)ceil($total / 12),
            'title' => $filters['q'] ? 'Offres « ' . $filters['q'] . ' »' : 'Offres de stages et d\'emplois',
        ]);
    }

    public function show(string $id): string
    {
        $job = MatchingEngine::loadJob((int)$id);
        $u = Auth::user();
        $own = $job && $u && $u['role'] === 'company' && current_company() && (int)current_company()['id'] === (int)$job['company_id'];
        if (!$job || ($job['status'] !== 'published' && !$own && !Auth::is('admin'))) {
            abort(404);
        }
        // Statistique de vues (une par visiteur et par session)
        $seen = \App\Core\Session::get('seen_jobs', []);
        if (!in_array((int)$id, $seen, true)) {
            DB::run('UPDATE jobs SET views = views + 1 WHERE id = :id', ['id' => (int)$id]);
            DB::insert('job_views', ['job_id' => (int)$id, 'user_id' => Auth::id(), 'created_at' => now()]);
            $seen[] = (int)$id;
            \App\Core\Session::put('seen_jobs', array_slice($seen, -200));
        }
        $company = DB::one('SELECT c.*, ci.name AS city_name FROM companies c LEFT JOIN cities ci ON ci.id = c.city_id WHERE c.id = :id', ['id' => $job['company_id']]);
        $match = null;
        $explanation = null;
        $feedback = null;
        $gapPlan = null;
        $planned = [];
        $application = null;
        $isFav = false;
        if (Auth::is('candidate')) {
            $match = MatchingEngine::forUser(Auth::id(), (int)$id);
            $gapPlan = $match ? \App\Services\GapAnalysisService::forJob(\App\Services\ProfileService::load(Auth::id()), MatchingEngine::loadJob((int)$id), $match) : null;
            $planned = \App\Core\DB::column('SELECT label FROM candidate_goals WHERE user_id = :u', ['u' => Auth::id()]);
            $application = DB::one('SELECT * FROM applications WHERE job_id = :j AND user_id = :u', ['j' => (int)$id, 'u' => Auth::id()]);
            if ($match) {
                // Explication en langage clair (§10) : texte calculé, éventuellement reformulé par Claude (mis en cache)
                $gain = $match['gap_items'] ? MatchingEngine::gain(\App\Services\ProfileService::load(Auth::id()), $job, $match['gap_items'][0]) : null;
                $base = \App\Services\Referential\Explainer::text($match, $job, $gain);
                $cached = json_decode((string)DB::value('SELECT explanation FROM match_scores WHERE user_id = :u AND job_id = :j', ['u' => Auth::id(), 'j' => (int)$id]), true);
                $explanation = is_array($cached) && ($cached['hash'] ?? '') === md5($base . '|' . $match['version']) ? $cached : ['text' => $base, 'provider' => 'Moteur NEAM'];
                $feedback = DB::value('SELECT understood FROM score_feedback WHERE user_id = :u AND job_id = :j AND ref_version = :v', ['u' => Auth::id(), 'j' => (int)$id, 'v' => $match['version']]);
            }
            $isFav = (bool)DB::value('SELECT COUNT(*) FROM favorites WHERE user_id = :u AND job_id = :j', ['u' => Auth::id(), 'j' => (int)$id]);
        }
        $similar = DB::all(JobSearch::BASE_SELECT . " WHERE j.status = 'published' AND j.id != :id AND (j.sector_id = :s OR j.company_id = :c) ORDER BY j.published_at DESC LIMIT 3",
            ['id' => (int)$id, 's' => $job['sector_id'], 'c' => $job['company_id']]);
        $applicants = (int)DB::value('SELECT COUNT(*) FROM applications WHERE job_id = :j', ['j' => (int)$id]);
        return $this->view('jobs/show', compact('job', 'company', 'match', 'application', 'isFav', 'similar', 'applicants', 'own', 'gapPlan', 'planned', 'explanation', 'feedback') + [
            'title' => $job['title'] . ' — ' . $job['company_name'],
            'description' => $job['summary'],
        ]);
    }
}
