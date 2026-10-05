<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\DB;
use App\Core\Validator;
use App\Services\JobSearch;
use App\Services\MatchingEngine;

final class PageController extends Controller
{
    public function home(): string
    {
        $latest = JobSearch::search([], 6)['items'];
        $matches = [];
        if (Auth::is('candidate')) {
            foreach (MatchingEngine::recommendJobs(Auth::id(), 6) as $r) {
                $matches[] = $r;
            }
        }
        $sectors = DB::all(
            "SELECT s.*, (SELECT COUNT(*) FROM jobs j WHERE j.sector_id = s.id AND j.status = 'published') AS n
             FROM sectors s ORDER BY n DESC LIMIT 8"
        );
        $companies = DB::all("SELECT c.*, (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'published') AS n FROM companies c WHERE c.status = 'verified' ORDER BY n DESC LIMIT 8");
        $articles = DB::all('SELECT * FROM contents WHERE published = 1 ORDER BY created_at DESC LIMIT 3');
        $cities = $this->cities();
        return $this->view('pages/home', compact('latest', 'matches', 'sectors', 'companies', 'articles', 'cities') + [
            'description' => 'Trouve un stage, un premier emploi ou une alternance au Gabon. Crée ton CV, découvre ton score de compatibilité et postule simplement avec Tremplin by NEAM.',
        ]);
    }

    public function companies(): string
    {
        $q = trim((string)input('q', ''));
        $sector = (int)input('sector', 0);
        $where = ["c.status = 'verified'"];
        $params = [];
        if ($q !== '') {
            $where[] = '(c.name LIKE :q OR c.description LIKE :q2)';
            $params += ['q' => "%$q%", 'q2' => "%$q%"];
        }
        if ($sector) {
            $where[] = 'c.sector_id = :s';
            $params['s'] = $sector;
        }
        $companies = DB::all(
            "SELECT c.*, ci.name AS city_name, s.name AS sector_name,
                (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'published') AS jobs_count
             FROM companies c LEFT JOIN cities ci ON ci.id = c.city_id LEFT JOIN sectors s ON s.id = c.sector_id
             WHERE " . implode(' AND ', $where) . ' ORDER BY jobs_count DESC, c.name',
            $params
        );
        $sectors = DB::all('SELECT * FROM sectors ORDER BY name');
        return $this->view('pages/companies', compact('companies', 'sectors', 'q', 'sector') + ['title' => 'Entreprises qui recrutent']);
    }

    public function company(string $slug): string
    {
        $company = DB::one(
            "SELECT c.*, ci.name AS city_name, s.name AS sector_name FROM companies c
             LEFT JOIN cities ci ON ci.id = c.city_id LEFT JOIN sectors s ON s.id = c.sector_id WHERE c.slug = :s AND c.status = 'verified'",
            ['s' => $slug]
        );
        if (!$company) {
            abort(404);
        }
        $jobs = JobSearch::search(['company' => $company['id']], 50)['items'];
        $hired = (int)DB::value("SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = :c AND a.status = 'accepted'", ['c' => $company['id']]);
        return $this->view('pages/company', compact('company', 'jobs', 'hired') + ['title' => $company['name']]);
    }

    public function trainings(): string
    {
        $q = trim((string)input('q', ''));
        $where = ['1 = 1'];
        $params = [];
        if ($q !== '') {
            $where[] = '(t.title LIKE :q OR sk.name LIKE :q2 OR t.provider LIKE :q3)';
            $params = ['q' => "%$q%", 'q2' => "%$q%", 'q3' => "%$q%"];
        }
        if (input('free')) {
            $where[] = 't.price = 0';
        }
        $trainings = DB::all(
            'SELECT t.*, sk.name AS skill_name, s.name AS sector_name FROM trainings t
             LEFT JOIN skills sk ON sk.id = t.skill_id LEFT JOIN sectors s ON s.id = t.sector_id
             WHERE ' . implode(' AND ', $where) . ' ORDER BY t.price = 0 DESC, t.title',
            $params
        );
        // Formations recommandées à partir des écarts de compétences du candidat
        $recommended = [];
        if (Auth::is('candidate')) {
            $missing = [];
            foreach (MatchingEngine::recommendJobs(Auth::id(), 8) as $r) {
                foreach ($r['match']['missing_skills'] as $s) {
                    $missing[$s['id']] = ($missing[$s['id']] ?? 0) + ($s['required'] ? 2 : 1);
                }
            }
            arsort($missing);
            if ($missing) {
                [$in, $p] = DB::in('s', array_slice(array_keys($missing), 0, 6));
                $recommended = DB::all("SELECT t.*, sk.name AS skill_name FROM trainings t JOIN skills sk ON sk.id = t.skill_id WHERE t.skill_id IN ($in) LIMIT 3", $p);
            }
        }
        return $this->view('pages/trainings', compact('trainings', 'q', 'recommended') + ['title' => 'Se former']);
    }

    /** Catalogue des certifications, avec une sélection personnalisée pour le candidat connecté. */
    public function certifications(): string
    {
        $q = trim((string)input('q', ''));
        $domain = (string)input('domaine', '');
        $all = DB::all('SELECT * FROM certifications ORDER BY domain, name');
        $domains = array_values(array_unique(array_column($all, 'domain')));
        $n = normalize($q);
        $certs = array_values(array_filter($all, fn($c) => ($domain === '' || $c['domain'] === $domain)
            && ($n === '' || str_contains(normalize($c['name'] . ' ' . $c['issuer'] . ' ' . $c['skills'] . ' ' . $c['language'] . ' ' . $c['domain']), $n))
            && (!input('gratuit') || $c['cost'] !== 'payant')));
        $forMe = [];
        if (Auth::is('candidate')) {
            foreach (\App\Services\GapAnalysisService::market(Auth::id(), 10)['gaps'] as $g) {
                foreach ($g['recos'] as $r) {
                    if ($r['kind'] === 'certification' && !isset($forMe[$r['id']])) {
                        $forMe[$r['id']] = $r + ['why' => $g['label'], 'count' => $g['count'], 'gain' => $g['avg_gain']];
                    }
                }
            }
            $forMe = array_slice(array_values($forMe), 0, 3);
        }
        return $this->view('pages/certifications', compact('certs', 'domains', 'domain', 'q', 'forMe') + ['title' => 'Certifications']);
    }

    public function training(string $id): string
    {
        $t = DB::one('SELECT t.*, sk.name AS skill_name, s.name AS sector_name FROM trainings t LEFT JOIN skills sk ON sk.id = t.skill_id LEFT JOIN sectors s ON s.id = t.sector_id WHERE t.id = :id', ['id' => (int)$id]);
        if (!$t) {
            abort(404);
        }
        $jobs = $t['skill_id'] ? DB::all(JobSearch::BASE_SELECT . " WHERE j.status = 'published' AND EXISTS (SELECT 1 FROM job_skills js WHERE js.job_id = j.id AND js.skill_id = :s) ORDER BY j.published_at DESC LIMIT 4", ['s' => $t['skill_id']]) : [];
        return $this->view('pages/training', compact('t', 'jobs') + ['title' => $t['title']]);
    }

    public function articles(): string
    {
        $articles = DB::all('SELECT * FROM contents WHERE published = 1 ORDER BY created_at DESC');
        return $this->view('pages/articles', compact('articles') + ['title' => 'Conseils carrière']);
    }

    public function article(string $slug): string
    {
        $a = DB::one('SELECT * FROM contents WHERE slug = :s AND published = 1', ['s' => $slug]);
        if (!$a) {
            abort(404);
        }
        $more = DB::all('SELECT * FROM contents WHERE published = 1 AND id != :id ORDER BY created_at DESC LIMIT 3', ['id' => $a['id']]);
        return $this->view('pages/article', compact('a', 'more') + ['title' => $a['title'], 'description' => $a['excerpt']]);
    }

    public function pricing(): string
    {
        $plans = DB::all('SELECT * FROM plans ORDER BY sort');
        foreach ($plans as &$p) {
            $p['features_list'] = json_decode((string)$p['features'], true) ?: [];
        }
        unset($p);
        return $this->view('pages/pricing', compact('plans') + ['title' => 'Offres et tarifs']);
    }

    public function privacy(): string
    {
        return $this->view('pages/privacy', ['title' => 'Confidentialité et données personnelles']);
    }

    public function apiDocs(): string
    {
        return $this->view('pages/api', ['title' => 'API partenaires']);
    }

    public function report(): void
    {
        $d = Validator::make($_POST, [
            'entity' => 'required|in:job,company,user',
            'entity_id' => 'required|integer',
            'reason' => 'required|min:10|max:1000',
        ])->validateOrBack();
        $id = DB::insert('reports', [
            'user_id' => Auth::id(), 'entity' => $d['entity'], 'entity_id' => (int)$d['entity_id'],
            'subject' => mb_substr((string)input('subject', 'Signalement'), 0, 190), 'reason' => $d['reason'], 'status' => 'open', 'created_at' => now(),
        ]);
        audit('report.created', $d['entity'], (int)$d['entity_id'], ['report' => $id]);
        flash('success', 'Merci, ton signalement a été transmis à l\'équipe NEAM. Il sera traité sous 48 h.');
        back();
    }

    private function cities(): array
    {
        return DB::all("SELECT ci.id, ci.name, co.name AS country FROM cities ci JOIN countries co ON co.id = ci.country_id WHERE co.active = 1 ORDER BY co.code = 'GA' DESC, co.name, ci.name");
    }
}
