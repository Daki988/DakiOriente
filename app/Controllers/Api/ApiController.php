<?php
declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\Admin\AdminController;
use App\Controllers\Controller;
use App\Core\ApiToken;
use App\Core\Auth;
use App\Core\DB;
use App\Core\Validator;
use App\Services\Ai\AiService;
use App\Services\JobSearch;
use App\Services\MatchingEngine;
use App\Services\NotificationService;
use App\Services\PlanService;
use App\Services\ProfileService;

/** API REST v1 — JSON, authentification par jeton Bearer (cahier des charges §16). */
final class ApiController extends Controller
{
    private function validate(array $rules): array
    {
        $v = Validator::make(json_input(), $rules);
        if ($v->fails()) {
            json_response(['error' => 'validation', 'fields' => $v->errors()], 422);
        }
        return $v->data();
    }

    private function jobOut(array $j, ?array $match = null): array
    {
        $out = [
            'id' => (int)$j['id'], 'title' => $j['title'], 'type' => $j['type'], 'company' => $j['company_name'],
            'city' => $j['city_name'] ?? null, 'sector' => $j['sector_name'] ?? null, 'remote' => (int)$j['remote'],
            'summary' => $j['summary'], 'salary' => ['min' => $j['salary_min'] ? (int)$j['salary_min'] : null, 'max' => $j['salary_max'] ? (int)$j['salary_max'] : null, 'currency' => 'XAF'],
            'education_min' => (int)$j['education_min'], 'experience_min_months' => (int)$j['experience_min'],
            'deadline' => $j['deadline'], 'published_at' => $j['published_at'], 'url' => url('/offres/' . $j['id']),
        ];
        if ($match) {
            $out['match'] = $this->matchOut($match);
        }
        return $out;
    }

    private function matchOut(array $m): array
    {
        return [
            'score' => $m['score'], 'level' => $m['level'], 'eliminated' => $m['eliminated'], 'elimination_reason' => $m['elimination'],
            'criteria' => $m['criteria'], 'strengths' => $m['strengths'], 'gaps' => $m['gaps'],
            'missing_skills' => array_column($m['missing_skills'], 'name'), 'actions' => array_map(fn($a) => ['text' => $a['text'], 'link' => url($a['link'])], $m['actions']),
        ];
    }

    private function profileOut(array $p): array
    {
        return [
            'id' => (int)$p['user_id'], 'first_name' => $p['first_name'], 'last_name' => $p['last_name'], 'email' => $p['email'], 'phone' => $p['phone'],
            'headline' => $p['headline'], 'bio' => $p['bio'], 'city' => $p['city_name'], 'education_level' => $p['education_level'],
            'field_of_study' => $p['field_of_study'], 'desired_job' => $p['desired_job'], 'desired_types' => $p['types_list'],
            'mobility' => $p['mobility'], 'availability_date' => $p['availability_date'], 'riasec_code' => $p['riasec_code'],
            'employability_score' => (int)$p['employability_score'], 'completion' => (int)$p['completion'], 'plan' => $p['plan_code'],
            'skills' => array_map(fn($s) => ['id' => (int)$s['id'], 'name' => $s['name'], 'category' => $s['category'], 'level' => (int)$s['level']], $p['skills']),
            'languages' => $p['languages_list'], 'educations' => $p['educations'], 'experiences' => $p['experiences'],
        ];
    }

    public function openapi(): void
    {
        $paths = [];
        $def = fn(string $summary, string $tag, bool $auth = true, array $extra = []) => ['summary' => $summary, 'tags' => [$tag]] + ($auth ? ['security' => [['bearer' => []]]] : []) + $extra + ['responses' => ['200' => ['description' => 'OK'], '401' => ['description' => 'Non authentifié'], '422' => ['description' => 'Erreur de validation']]];
        $body = fn(array $props, array $required = []) => ['requestBody' => ['content' => ['application/json' => ['schema' => ['type' => 'object', 'properties' => $props, 'required' => $required]]]]];
        $s = fn(string $t = 'string') => ['type' => $t];
        $paths['/auth/register']['post'] = $def('Créer un compte candidat', 'Auth', false, $body(['first_name' => $s(), 'last_name' => $s(), 'email' => $s(), 'password' => $s(), 'phone' => $s()], ['first_name', 'last_name', 'email', 'password']));
        $paths['/auth/login']['post'] = $def('Obtenir un jeton', 'Auth', false, $body(['login' => $s(), 'password' => $s()], ['login', 'password']));
        $paths['/jobs']['get'] = $def('Rechercher des offres', 'Offres', false, ['parameters' => array_map(fn($n) => ['name' => $n, 'in' => 'query', 'schema' => $s()], ['q', 'city', 'sector', 'type', 'page'])]);
        $paths['/jobs/{id}']['get'] = $def('Détail d\'une offre', 'Offres', false, ['parameters' => [['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => $s('integer')]]]);
        $paths['/candidates/me']['get'] = $def('Mon profil', 'Candidat');
        $paths['/candidates/me']['patch'] = $def('Mettre à jour mon profil', 'Candidat', true, $body(['headline' => $s(), 'bio' => $s(), 'desired_job' => $s(), 'phone' => $s(), 'availability_date' => $s(), 'skills' => ['type' => 'array', 'items' => ['type' => 'object', 'properties' => ['name' => $s(), 'level' => $s('integer')]]]]));
        $paths['/jobs/{id}/apply']['post'] = $def('Postuler', 'Candidat', true, $body(['cover_letter' => $s()]));
        $paths['/matches']['get'] = $def('Mes scores de compatibilité', 'Matching');
        $paths['/recommendations']['get'] = $def('Recommandations d\'offres et de métiers', 'Matching');
        $paths['/gaps']['get'] = $def('Analyse des écarts avec le marché (gains mesurés, certifications, formations, projets)', 'Matching', true, ['parameters' => [['name' => 'job_id', 'in' => 'query', 'schema' => $s('integer'), 'description' => 'Analyse pour une offre précise'], ['name' => 'limit', 'in' => 'query', 'schema' => $s('integer'), 'description' => 'Nombre d\'offres analysées (5 à 20)']]]);
        $paths['/certifications']['get'] = $def('Catalogue des certifications', 'Formation', false, ['parameters' => array_map(fn($n) => ['name' => $n, 'in' => 'query', 'schema' => $s()], ['q', 'domain'])]);
        $paths['/cv/generate']['post'] = $def('Données structurées du CV', 'IA');
        $paths['/cover-letter/generate']['post'] = $def('Générer une lettre', 'IA', true, $body(['job_id' => $s('integer'), 'tone' => $s()]));
        $paths['/interview/simulate']['post'] = $def('Simulation d\'entretien', 'IA', true, $body(['job_id' => $s('integer'), 'answers' => ['type' => 'array', 'items' => $s()]]));
        $paths['/companies/jobs']['post'] = $def('Publier une offre', 'Entreprise', true, $body(['title' => $s(), 'type' => $s(), 'city_id' => $s('integer'), 'sector_id' => $s('integer'), 'summary' => $s(), 'description' => $s(), 'skills' => ['type' => 'array', 'items' => $s()]], ['title', 'type', 'city_id', 'sector_id', 'summary', 'description']));
        $paths['/companies/candidates/search']['get'] = $def('Candidats compatibles pour une offre', 'Entreprise', true, ['parameters' => [['name' => 'job_id', 'in' => 'query', 'required' => true, 'schema' => $s('integer')], ['name' => 'min_score', 'in' => 'query', 'schema' => $s('integer')]]]);
        $paths['/admin/analytics']['get'] = $def('Indicateurs globaux', 'Admin');
        json_response([
            'openapi' => '3.0.3',
            'info' => ['title' => 'TREMPLIN by NEAM API', 'version' => '1.0.0', 'description' => 'API de la plateforme d\'insertion professionnelle TREMPLIN. Jetons : POST /auth/login puis en-tête Authorization: Bearer <token>.'],
            'servers' => [['url' => url('/api/v1')]],
            'components' => ['securitySchemes' => ['bearer' => ['type' => 'http', 'scheme' => 'bearer']]],
            'paths' => $paths,
        ]);
    }

    public function register(): void
    {
        $in = json_input();
        $in['email'] = mb_strtolower(trim((string)($in['email'] ?? '')));
        $v = Validator::make($in, ['first_name' => 'required|max:80', 'last_name' => 'required|max:80', 'email' => 'required|email|unique:users,email', 'phone' => 'nullable|phone', 'password' => 'required|min:8|strong']);
        if ($v->fails()) {
            json_response(['error' => 'validation', 'fields' => $v->errors()], 422);
        }
        $d = $v->data();
        $id = DB::transaction(function () use ($d) {
            $id = DB::insert('users', ['role' => 'candidate', 'email' => $d['email'], 'phone' => $d['phone'], 'password_hash' => password_hash($d['password'], PASSWORD_DEFAULT), 'first_name' => $d['first_name'], 'last_name' => $d['last_name'], 'created_at' => now(), 'updated_at' => now()]);
            DB::insert('candidate_profiles', ['user_id' => $id, 'updated_at' => now()]);
            return $id;
        });
        audit('api.register', 'user', $id);
        json_response(['token' => ApiToken::issue($id, 'api-register'), 'user' => ['id' => $id, 'role' => 'candidate', 'email' => $d['email']]], 201);
    }

    public function login(): void
    {
        $in = json_input();
        $user = Auth::attempt((string)($in['login'] ?? ''), (string)($in['password'] ?? ''));
        if (!$user || $user['status'] !== 'active') {
            audit('api.auth_failed', null, null, ['login' => mb_substr((string)($in['login'] ?? ''), 0, 60)]);
            json_response(['error' => 'invalid_credentials', 'message' => 'Identifiants incorrects.'], 401);
        }
        audit('api.login', 'user', (int)$user['id']);
        json_response(['token' => ApiToken::issue((int)$user['id']), 'token_type' => 'Bearer', 'expires_in_days' => 30,
            'user' => ['id' => (int)$user['id'], 'role' => $user['role'], 'first_name' => $user['first_name'], 'email' => $user['email']]]);
    }

    public function jobs(): void
    {
        $page = max(1, (int)input('page', 1));
        $res = JobSearch::search(['q' => input('q'), 'city' => input('city'), 'sector' => input('sector'), 'type' => array_filter(explode(',', (string)input('type', '')))], 20, ($page - 1) * 20);
        $p = Auth::is('candidate') ? ProfileService::load(Auth::id()) : null;
        json_response([
            'data' => array_map(fn($j) => $this->jobOut($j, $p ? MatchingEngine::compute($p, MatchingEngine::loadJob((int)$j['id'])) : null), $res['items']),
            'meta' => ['total' => $res['total'], 'page' => $page, 'per_page' => 20, 'pages' => (int)ceil($res['total'] / 20)],
        ]);
    }

    public function job(string $id): void
    {
        $j = JobSearch::find((int)$id);
        if (!$j || $j['status'] !== 'published') {
            json_response(['error' => 'not_found'], 404);
        }
        $full = MatchingEngine::loadJob((int)$id);
        $out = $this->jobOut($j, Auth::is('candidate') ? MatchingEngine::forUser(Auth::id(), (int)$id) : null);
        $out += ['description' => $j['description'], 'missions' => $j['missions'], 'profile' => $j['profile'], 'languages' => $j['languages'], 'soft_skills' => $j['soft_skills'],
            'skills' => array_map(fn($s) => ['name' => $s['name'], 'required' => (bool)$s['required'], 'weight' => (int)$s['weight']], $full['skills'])];
        json_response(['data' => $out]);
    }

    public function me(): void
    {
        json_response(['data' => $this->profileOut(ProfileService::load(Auth::id(), true))]);
    }

    public function updateMe(): void
    {
        $d = $this->validate(['headline' => 'nullable|max:160', 'bio' => 'nullable|max:1500', 'desired_job' => 'nullable|max:150', 'phone' => 'nullable|phone', 'availability_date' => 'nullable|date']);
        $in = json_input();
        $uid = Auth::id();
        $profile = array_filter(['headline' => $d['headline'] ?? null, 'bio' => $d['bio'] ?? null, 'desired_job' => $d['desired_job'] ?? null, 'availability_date' => $d['availability_date'] ?? null], fn($v) => $v !== null);
        if ($profile) {
            DB::update('candidate_profiles', $profile + ['updated_at' => now()], 'user_id = :u', ['u' => $uid]);
        }
        if (!empty($d['phone'])) {
            DB::update('users', ['phone' => $d['phone']], 'id = :id', ['id' => $uid]);
        }
        foreach (array_slice((array)($in['skills'] ?? []), 0, 30) as $s) {
            $name = trim((string)($s['name'] ?? ''));
            if ($name === '') {
                continue;
            }
            $sk = DB::one('SELECT id FROM skills WHERE slug = :s', ['s' => slugify($name)]);
            $sid = $sk ? (int)$sk['id'] : DB::insert('skills', ['name' => mb_substr($name, 0, 120), 'slug' => slugify($name), 'category' => 'tech', 'aliases' => '']);
            DB::run('DELETE FROM candidate_skills WHERE user_id = :u AND skill_id = :s', ['u' => $uid, 's' => $sid]);
            DB::insert('candidate_skills', ['user_id' => $uid, 'skill_id' => $sid, 'level' => max(1, min(5, (int)($s['level'] ?? 3)))]);
        }
        ProfileService::refreshCompletion($uid);
        json_response(['data' => $this->profileOut(ProfileService::load($uid, true))]);
    }

    public function apply(string $id): void
    {
        $job = MatchingEngine::loadJob((int)$id);
        if (!$job || $job['status'] !== 'published' || $job['apply_mode'] !== 'internal') {
            json_response(['error' => 'not_found', 'message' => 'Offre indisponible ou candidature externe.'], 404);
        }
        $uid = Auth::id();
        if (DB::value('SELECT COUNT(*) FROM applications WHERE job_id = :j AND user_id = :u', ['j' => $job['id'], 'u' => $uid])) {
            json_response(['error' => 'already_applied'], 409);
        }
        $quota = PlanService::applicationQuota(Auth::user());
        if ($quota['remaining'] !== null && $quota['remaining'] <= 0) {
            json_response(['error' => 'quota_exceeded', 'message' => 'Limite mensuelle de candidatures atteinte.'], 402);
        }
        $m = MatchingEngine::forUser($uid, (int)$job['id'], true);
        $aid = DB::insert('applications', ['job_id' => $job['id'], 'user_id' => $uid, 'status' => 'sent', 'cover_letter' => mb_substr((string)(json_input()['cover_letter'] ?? ''), 0, 6000) ?: null, 'match_score' => $m['score'], 'match_details' => json_encode($m['criteria'], JSON_UNESCAPED_UNICODE), 'created_at' => now(), 'updated_at' => now()]);
        DB::insert('application_events', ['application_id' => $aid, 'status' => 'sent', 'note' => 'Via API', 'actor_id' => $uid, 'created_at' => now()]);
        foreach (DB::column('SELECT user_id FROM company_users WHERE company_id = :c', ['c' => $job['company_id']]) as $rid) {
            NotificationService::notify((int)$rid, 'application', 'Nouvelle candidature : ' . $job['title'], 'Compatibilité ' . $m['score'] . ' %', '/entreprise/candidatures/' . $aid);
        }
        audit('application.created', 'application', $aid, ['via' => 'api']);
        json_response(['data' => ['id' => $aid, 'status' => 'sent', 'match' => $this->matchOut($m)]], 201);
    }

    public function matches(): void
    {
        $recos = MatchingEngine::recommendJobs(Auth::id(), 20);
        json_response(['data' => array_map(fn($r) => $this->jobOut($r['job'], $r['match']), $recos)]);
    }

    public function recommendations(): void
    {
        $uid = Auth::id();
        $p = ProfileService::load($uid);
        $e = \App\Services\EmployabilityService::compute($uid);
        json_response(['data' => [
            'jobs' => array_map(fn($r) => $this->jobOut($r['job'], $r['match']), MatchingEngine::recommendJobs($uid, 6)),
            'careers' => $p['riasec_code'] ? array_map(fn($c) => ['name' => $c['name'], 'fit' => $c['fit'], 'riasec' => $c['riasec'], 'sector' => $c['sector_name'], 'outlook' => $c['outlook']], \App\Services\RiasecService::careers($p['riasec_code'], 6)) : [],
            'employability' => ['score' => $e['score'], 'label' => $e['label'], 'tips' => $e['tips']],
        ]]);
    }

    public function gaps(): void
    {
        $uid = Auth::id();
        if ($jobId = (int)input('job_id', 0)) {
            $job = MatchingEngine::loadJob($jobId);
            if (!$job || $job['status'] !== 'published') {
                json_response(['error' => 'Offre introuvable'], 404);
            }
            json_response(['data' => \App\Services\GapAnalysisService::forJob(ProfileService::load($uid), $job)]);
        }
        $a = \App\Services\GapAnalysisService::market($uid, max(5, min(20, (int)input('limit', 10))));
        json_response(['data' => $a]);
    }

    public function certifications(): void
    {
        $q = normalize((string)input('q', ''));
        $domain = (string)input('domain', '');
        $rows = array_values(array_filter(DB::all('SELECT * FROM certifications ORDER BY domain, name'), fn($c) => ($domain === '' || $c['domain'] === $domain)
            && ($q === '' || str_contains(normalize($c['name'] . ' ' . $c['issuer'] . ' ' . $c['skills'] . ' ' . $c['language']), $q))));
        json_response(['data' => array_map(fn($c) => [
            'id' => (int)$c['id'], 'name' => $c['name'], 'issuer' => $c['issuer'], 'domain' => $c['domain'],
            'skills' => array_values(array_filter(array_map('trim', explode(',', (string)$c['skills'])))), 'language' => $c['language'],
            'level' => $c['level'], 'format' => $c['format'], 'prep_time' => $c['prep_time'], 'cost' => $c['cost'], 'url' => $c['url'], 'description' => $c['description'],
        ], $rows)]);
    }

    public function cv(): void
    {
        $p = ProfileService::load(Auth::id(), true);
        json_response(['data' => ['template' => $p['cv_template'], 'print_url' => url('/espace/cv/imprimer'), 'cv' => $this->profileOut($p)]]);
    }

    public function coverLetter(): void
    {
        if (!AiService::enabled()) {
            json_response(['error' => 'ai_disabled'], 503);
        }
        $in = json_input();
        $job = !empty($in['job_id']) ? MatchingEngine::loadJob((int)$in['job_id']) : null;
        $tone = in_array($in['tone'] ?? '', ['professionnel', 'enthousiaste'], true) ? $in['tone'] : 'professionnel';
        $body = AiService::coverLetter(ProfileService::load(Auth::id(), true), $job, $tone);
        $id = DB::insert('cover_letters', ['user_id' => Auth::id(), 'job_id' => $job['id'] ?? null, 'title' => $job ? 'Lettre — ' . $job['title'] : 'Candidature spontanée', 'body' => $body, 'source' => 'api', 'created_at' => now()]);
        json_response(['data' => ['id' => $id, 'provider' => AiService::providerName(), 'body' => $body]], 201);
    }

    public function interview(): void
    {
        $in = json_input();
        $job = !empty($in['job_id']) ? MatchingEngine::loadJob((int)$in['job_id']) : null;
        $questions = AiService::interviewQuestions(ProfileService::load(Auth::id()), $job);
        $answers = (array)($in['answers'] ?? []);
        $feedback = $answers ? AiService::evaluateAnswers($questions, $answers, $job) : [];
        $out = [];
        foreach ($questions as $i => $q) {
            $row = ['type' => $q['type'], 'question' => $q['q']];
            if (isset($answers[$i])) {
                $row['feedback'] = $feedback[$i] ?? null;
            }
            $out[] = $row;
        }
        json_response(['data' => ['questions' => $out, 'method' => 'STAR']]);
    }

    public function createJob(): void
    {
        $company = current_company();
        if (!$company) {
            json_response(['error' => 'no_company'], 403);
        }
        $d = $this->validate([
            'title' => 'required|min:5|max:190', 'type' => 'required|in:' . implode(',', array_keys(job_types())), 'city_id' => 'required|exists:cities,id',
            'sector_id' => 'required|exists:sectors,id', 'summary' => 'required|min:20|max:300', 'description' => 'required|min:50|max:6000',
            'education_min' => 'nullable|between:0,7', 'experience_min' => 'nullable|between:0,240', 'salary_min' => 'nullable|integer', 'salary_max' => 'nullable|integer', 'deadline' => 'nullable|date',
        ]);
        $status = $company['status'] === 'verified' ? 'published' : 'pending';
        $id = DB::insert('jobs', [
            'company_id' => $company['id'], 'title' => $d['title'], 'slug' => slugify($d['title']), 'type' => $d['type'], 'city_id' => (int)$d['city_id'], 'sector_id' => (int)$d['sector_id'],
            'summary' => $d['summary'], 'description' => $d['description'], 'education_min' => (int)($d['education_min'] ?? 2), 'experience_min' => (int)($d['experience_min'] ?? 0),
            'salary_min' => $d['salary_min'] ?? null, 'salary_max' => $d['salary_max'] ?? null, 'deadline' => $d['deadline'] ?? null, 'status' => $status,
            'created_by' => Auth::id(), 'published_at' => $status === 'published' ? now() : null, 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (array_slice((array)(json_input()['skills'] ?? []), 0, 15) as $name) {
            $sk = DB::one('SELECT id FROM skills WHERE slug = :s', ['s' => slugify((string)$name)]);
            if ($sk) {
                DB::insert('job_skills', ['job_id' => $id, 'skill_id' => $sk['id'], 'required' => 1, 'weight' => 3]);
            }
        }
        audit('job.created', 'job', $id, ['via' => 'api']);
        if ($status === 'published') {
            NotificationService::jobAlerts($id);
        }
        json_response(['data' => ['id' => $id, 'status' => $status, 'url' => url('/offres/' . $id)]], 201);
    }

    public function searchCandidates(): void
    {
        $company = current_company();
        $job = $company ? DB::one('SELECT id FROM jobs WHERE id = :id AND company_id = :c', ['id' => (int)input('job_id', 0), 'c' => $company['id']]) : null;
        if (!$job) {
            json_response(['error' => 'job_required', 'message' => 'Paramètre job_id (offre de votre entreprise) requis.'], 422);
        }
        $res = MatchingEngine::candidatesForJob((int)$job['id'], 30, ['min_score' => (int)input('min_score', 50)]);
        json_response(['data' => array_map(fn($r) => [
            'candidate_id' => (int)$r['profile']['user_id'], 'name' => $r['profile']['first_name'] . ' ' . mb_substr((string)$r['profile']['last_name'], 0, 1) . '.',
            'headline' => $r['profile']['headline'], 'city' => $r['profile']['city_name'], 'education_level' => $r['profile']['education_level'],
            'skills' => array_column($r['profile']['skills'], 'name'), 'match' => $this->matchOut($r['match']),
        ], $res)]);
    }

    public function analytics(): void
    {
        json_response(['data' => AdminController::analytics(), 'generated_at' => date('c')]);
    }
}
