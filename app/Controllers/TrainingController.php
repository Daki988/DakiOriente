<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\DB;
use App\Services\GapAnalysisService;
use App\Services\JobSearch;
use App\Services\Training\TrainingCatalog;

/** Catalogue public des formations en ligne et pages des plateformes partenaires. */
final class TrainingController extends Controller
{
    public function index(): string
    {
        $f = [
            'q' => trim((string)input('q', '')), 'platform' => (string)input('plateforme', ''), 'lang' => (string)input('langue', ''),
            'skill' => (string)input('competence', ''), 'free' => (bool)input('gratuit'),
        ];
        $all = TrainingCatalog::search($f);
        $page = max(1, (int)input('page', 1));
        $per = 24;
        $trainings = array_slice($all, ($page - 1) * $per, $per);
        $pages = (int)ceil(count($all) / $per);
        $platforms = TrainingCatalog::platforms();
        $skills = DB::column("SELECT DISTINCT s.name FROM skills s JOIN trainings t ON t.skill_id = s.id WHERE t.active = 1 ORDER BY s.name");
        $forMe = [];
        if (Auth::is('candidate') && !array_filter($f)) {
            foreach (GapAnalysisService::market(Auth::id(), 10)['gaps'] as $g) {
                foreach ($g['recos'] as $r) {
                    if ($r['kind'] === 'training' && !isset($forMe[$r['id']])) {
                        $forMe[$r['id']] = $r + ['why' => $g['label'], 'count' => $g['count'], 'gain' => $g['avg_gain']];
                    }
                }
            }
            $forMe = array_slice(array_values($forMe), 0, 3);
        }
        return $this->view('trainings/index', compact('trainings', 'platforms', 'skills', 'f', 'forMe', 'page', 'pages') + [
            'total' => count($all), 'title' => 'Se former', 'mine' => $this->mine(),
        ]);
    }

    public function platforms(): string
    {
        return $this->view('trainings/platforms', ['platforms' => TrainingCatalog::platforms(), 'title' => 'Plateformes de formation']);
    }

    public function platform(string $slug): string
    {
        $p = DB::one('SELECT * FROM learning_platforms WHERE slug = :s AND active = 1', ['s' => $slug]) ?? abort(404);
        $all = TrainingCatalog::search(['platform' => $slug, 'lang' => (string)input('langue', '')]);
        $demanded = array_values(array_filter($all, fn($t) => $t['demand'] > 0));
        // Compétences couvertes par la plateforme, classées par nombre d'offres qui les demandent
        $skills = [];
        foreach ($all as $t) {
            foreach (array_filter(array_map('trim', explode(',', (string)$t['skills']))) as $s) {
                $skills[$s] ??= ['name' => $s, 'courses' => 0, 'demand' => 0];
                $skills[$s]['courses']++;
            }
        }
        foreach ($skills as &$s) {
            $s['demand'] = TrainingCatalog::demand(['skills' => $s['name']]);
        }
        unset($s);
        usort($skills, fn($a, $b) => [$b['demand'], $b['courses']] <=> [$a['demand'], $a['courses']]);
        $learners = (int)DB::value('SELECT COUNT(DISTINCT ct.user_id) FROM candidate_trainings ct JOIN trainings t ON t.id = ct.training_id WHERE t.platform_id = :p', ['p' => $p['id']]);
        $certs = (int)DB::value('SELECT COUNT(*) FROM candidate_certificates c JOIN trainings t ON t.id = c.training_id WHERE t.platform_id = :p', ['p' => $p['id']]);
        return $this->view('trainings/platform', compact('p', 'all', 'demanded', 'skills', 'learners', 'certs') + [
            'title' => $p['name'], 'mine' => $this->mine(), 'lang' => (string)input('langue', ''),
        ]);
    }

    public function show(string $id): string
    {
        $t = TrainingCatalog::find((int)$id) ?? abort(404);
        $t['demand'] = TrainingCatalog::demand($t);
        $jobIds = array_slice(TrainingCatalog::jobIdsFor($t), 0, 40);
        $jobs = [];
        if ($jobIds) {
            [$in, $params] = DB::in('j', $jobIds);
            $jobs = DB::all(JobSearch::BASE_SELECT . " WHERE j.id IN ($in) AND j.status = 'published' ORDER BY j.published_at DESC LIMIT 4", $params);
        }
        $platform = DB::one('SELECT * FROM learning_platforms WHERE id = :id', ['id' => $t['platform_id']]);
        $similar = array_slice(array_values(array_filter(TrainingCatalog::forSkill(trim(explode(',', (string)$t['skills'])[0]), 6), fn($x) => (int)$x['id'] !== (int)$t['id'])), 0, 3);
        $track = null;
        $certificate = null;
        if (Auth::is('candidate')) {
            $track = DB::one('SELECT * FROM candidate_trainings WHERE user_id = :u AND training_id = :t', ['u' => Auth::id(), 't' => $t['id']]);
            $certificate = DB::one('SELECT * FROM candidate_certificates WHERE user_id = :u AND training_id = :t', ['u' => Auth::id(), 't' => $t['id']]);
        }
        return $this->view('trainings/show', compact('t', 'jobs', 'platform', 'similar', 'track', 'certificate') + ['title' => $t['title']]);
    }

    /**
     * Sortie vers la plateforme d'origine : la redirection est comptabilisée (formations les plus suivies)
     * et la formation est ajoutée au suivi du candidat connecté.
     */
    public function go(string $id): void
    {
        $t = TrainingCatalog::find((int)$id) ?? abort(404);
        $p = DB::one('SELECT affiliate_param FROM learning_platforms WHERE id = :id', ['id' => $t['platform_id']]);
        DB::insert('training_clicks', ['training_id' => $t['id'], 'user_id' => Auth::id(), 'created_at' => now()]);
        DB::run('UPDATE trainings SET clicks = clicks + 1 WHERE id = :id', ['id' => $t['id']]);
        if (Auth::is('candidate') && !DB::value('SELECT COUNT(*) FROM candidate_trainings WHERE user_id = :u AND training_id = :t', ['u' => Auth::id(), 't' => $t['id']])) {
            DB::insert('candidate_trainings', ['user_id' => Auth::id(), 'training_id' => $t['id'], 'status' => 'suivie', 'started_at' => null, 'completed_at' => null, 'created_at' => now()]);
        }
        $url = TrainingCatalog::outboundUrl($t, $p['affiliate_param'] ?? null);
        if (!preg_match('#^https://#', $url)) {
            abort(404);
        }
        header('Location: ' . $url, true, 302);
        exit;
    }

    /** Formations suivies par le candidat connecté : [training_id => statut]. */
    private function mine(): array
    {
        if (!Auth::is('candidate')) {
            return [];
        }
        $out = [];
        foreach (DB::all('SELECT training_id, status FROM candidate_trainings WHERE user_id = :u', ['u' => Auth::id()]) as $r) {
            $out[(int)$r['training_id']] = $r['status'];
        }
        return $out;
    }
}
