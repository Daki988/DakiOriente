<?php
declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Controllers\Controller;
use App\Core\DB;
use App\Core\Validator;
use App\Services\MatchingEngine;
use App\Services\NotificationService;
use App\Services\ProfileService;

final class AdminController extends Controller
{
    public static function analytics(): array
    {
        $count = fn(string $sql, array $p = []) => (int)DB::value($sql, $p);
        $since = date('Y-m-d', strtotime('-30 days'));
        $cands = $count("SELECT COUNT(*) FROM users WHERE role = 'candidate'");
        $payingCands = $count("SELECT COUNT(*) FROM users WHERE role = 'candidate' AND plan_code != 'FREE' AND plan_expires_at > :n", ['n' => now()]);
        $revenue30 = $count("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'success' AND created_at >= :d", ['d' => $since]);
        return [
            'users'        => $count('SELECT COUNT(*) FROM users'),
            'candidates'   => $cands,
            'companies'    => $count("SELECT COUNT(*) FROM companies WHERE status = 'verified'"),
            'schools'      => $count('SELECT COUNT(*) FROM schools'),
            'jobs_active'  => $count("SELECT COUNT(*) FROM jobs WHERE status = 'published'"),
            'applications' => $count('SELECT COUNT(*) FROM applications'),
            'placements'   => $count("SELECT COUNT(*) FROM applications WHERE status = 'accepted'"),
            'interviews'   => $count('SELECT COUNT(*) FROM interviews'),
            'new_users_30d' => $count('SELECT COUNT(*) FROM users WHERE created_at >= :d', ['d' => $since]),
            'revenue_30d'  => $revenue30,
            'mrr'          => $revenue30,
            'arpu'         => $payingCands ? (int)round($revenue30 / $payingCands) : 0,
            'conversion_free_paid' => $cands ? round($payingCands / $cands * 100, 1) : 0,
            'profile_completion_avg' => (int)DB::value('SELECT AVG(completion) FROM candidate_profiles'),
            'employability_avg' => (int)DB::value('SELECT AVG(employability_score) FROM candidate_profiles'),
            'match_avg'    => (int)DB::value('SELECT AVG(match_score) FROM applications'),
            'response_rate' => ($a = $count('SELECT COUNT(*) FROM applications')) ? round($count("SELECT COUNT(*) FROM applications WHERE status != 'sent'") / $a * 100, 1) : 0,
            'placement_rate' => $a ? round($count("SELECT COUNT(*) FROM applications WHERE status = 'accepted'") / $a * 100, 1) : 0,
            'reports_open' => $count("SELECT COUNT(*) FROM reports WHERE status = 'open'"),
        ];
    }

    public function dashboard(): string
    {
        $k = self::analytics();
        $ym = fn(string $c) => DB::yearMonth($c);
        $signups = DB::all("SELECT {$ym('created_at')} AS m, role, COUNT(*) AS n FROM users WHERE created_at >= :d GROUP BY m, role ORDER BY m", ['d' => date('Y-m-01', strtotime('-5 months'))]);
        $revenue = DB::all("SELECT {$ym('created_at')} AS m, SUM(amount) AS total FROM payments WHERE status = 'success' AND created_at >= :d GROUP BY m ORDER BY m", ['d' => date('Y-m-01', strtotime('-5 months'))]);
        $apps = DB::all("SELECT {$ym('created_at')} AS m, COUNT(*) AS n FROM applications WHERE created_at >= :d GROUP BY m ORDER BY m", ['d' => date('Y-m-01', strtotime('-5 months'))]);
        $plans = DB::all("SELECT plan_code, COUNT(*) AS n FROM users WHERE role = 'candidate' GROUP BY plan_code ORDER BY n DESC");
        $topSectors = DB::all("SELECT s.name, COUNT(*) AS n FROM jobs j JOIN sectors s ON s.id = j.sector_id WHERE j.status = 'published' GROUP BY s.name ORDER BY n DESC LIMIT 6");
        $pending = [
            'companies' => DB::all("SELECT * FROM companies WHERE status = 'pending' ORDER BY created_at LIMIT 5"),
            'jobs' => DB::all("SELECT j.id, j.title, co.name AS company_name FROM jobs j JOIN companies co ON co.id = j.company_id WHERE j.status = 'pending' ORDER BY j.created_at LIMIT 5"),
            'reports' => DB::all("SELECT * FROM reports WHERE status = 'open' ORDER BY created_at DESC LIMIT 5"),
        ];
        $activity = DB::all('SELECT a.*, u.first_name, u.last_name FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 8');
        return $this->app('admin/dashboard', compact('k', 'signups', 'revenue', 'apps', 'plans', 'topSectors', 'pending', 'activity') + ['title' => 'Back-office NEAM', 'charts' => true]);
    }

    /* ---------- Utilisateurs ---------- */

    public function users(): string
    {
        $q = trim((string)input('q', ''));
        $role = in_array(input('role'), ['candidate', 'company', 'school', 'admin'], true) ? input('role') : null;
        [$offset, $page] = $this->paginate(25);
        $where = ['1 = 1'];
        $params = [];
        if ($q !== '') {
            $where[] = '(u.email LIKE :q1 OR u.first_name LIKE :q2 OR u.last_name LIKE :q3 OR u.phone LIKE :q4)';
            $params += ['q1' => "%$q%", 'q2' => "%$q%", 'q3' => "%$q%", 'q4' => "%$q%"];
        }
        if ($role) {
            $where[] = 'u.role = :r';
            $params['r'] = $role;
        }
        $sqlWhere = implode(' AND ', $where);
        $total = (int)DB::value("SELECT COUNT(*) FROM users u WHERE $sqlWhere", $params);
        $users = DB::all("SELECT u.*, cp.completion, cp.employability_score FROM users u LEFT JOIN candidate_profiles cp ON cp.user_id = u.id WHERE $sqlWhere ORDER BY u.created_at DESC LIMIT :lim OFFSET :off", $params + ['lim' => 25, 'off' => $offset]);
        return $this->app('admin/users', compact('users', 'q', 'role', 'total', 'page') + ['pages' => (int)ceil($total / 25), 'title' => 'Utilisateurs']);
    }

    public function updateUser(string $id): void
    {
        $u = DB::one('SELECT * FROM users WHERE id = :id', ['id' => (int)$id]) ?? abort(404);
        if ((int)$u['id'] === $this->uid()) {
            flash('error', 'Vous ne pouvez pas modifier votre propre compte ici.');
            back();
        }
        $data = [];
        if (in_array(input('status'), ['active', 'suspended'], true)) {
            $data['status'] = input('status');
        }
        if (in_array(input('plan_code'), ['FREE', 'STARTER', 'PRO', 'PREMIUM', 'CAREER'], true) && $u['role'] === 'candidate') {
            $data['plan_code'] = input('plan_code');
            $data['plan_expires_at'] = input('plan_code') === 'FREE' ? null : date('Y-m-d H:i:s', strtotime('+30 days'));
        }
        if ($data) {
            DB::update('users', $data + ['updated_at' => now()], 'id = :id', ['id' => $u['id']]);
            if (($data['status'] ?? null) === 'suspended') {
                DB::delete('api_tokens', 'user_id = :u', ['u' => $u['id']]);
            }
            audit('admin.user_updated', 'user', (int)$u['id'], $data);
            flash('success', 'Compte de ' . $u['first_name'] . ' mis à jour.');
        }
        back();
    }

    /* ---------- Modération ---------- */

    public function companies(): string
    {
        $status = in_array(input('statut'), ['pending', 'verified', 'rejected'], true) ? input('statut') : null;
        $companies = DB::all(
            'SELECT c.*, s.name AS sector_name, ci.name AS city_name, (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) AS jobs_count,
                (SELECT u.email FROM company_users cu JOIN users u ON u.id = cu.user_id WHERE cu.company_id = c.id LIMIT 1) AS owner_email
             FROM companies c LEFT JOIN sectors s ON s.id = c.sector_id LEFT JOIN cities ci ON ci.id = c.city_id'
            . ($status ? ' WHERE c.status = :s' : '') . " ORDER BY c.status = 'pending' DESC, c.created_at DESC",
            $status ? ['s' => $status] : []
        );
        return $this->app('admin/companies', compact('companies', 'status') + ['title' => 'Entreprises']);
    }

    public function moderateCompany(string $id): void
    {
        $c = DB::one('SELECT * FROM companies WHERE id = :id', ['id' => (int)$id]) ?? abort(404);
        $decision = input('decision');
        if (!in_array($decision, ['verified', 'rejected', 'pending'], true)) {
            back();
        }
        DB::update('companies', ['status' => $decision, 'verified_at' => $decision === 'verified' ? now() : null], 'id = :id', ['id' => $c['id']]);
        $published = 0;
        if ($decision === 'verified') {
            // Publication automatique des offres en attente
            foreach (DB::column("SELECT id FROM jobs WHERE company_id = :c AND status = 'pending'", ['c' => $c['id']]) as $jid) {
                DB::update('jobs', ['status' => 'published', 'published_at' => now()], 'id = :id', ['id' => $jid]);
                NotificationService::jobAlerts((int)$jid);
                $published++;
            }
        }
        foreach (DB::column('SELECT user_id FROM company_users WHERE company_id = :c', ['c' => $c['id']]) as $uid) {
            NotificationService::notify((int)$uid, 'moderation',
                $decision === 'verified' ? 'Votre entreprise est vérifiée !' : ($decision === 'rejected' ? 'Vérification de votre entreprise refusée' : 'Vérification remise en attente'),
                $decision === 'verified' ? 'Vos offres sont désormais publiées' . ($published ? " ($published publiée(s))." : '.') : (string)input('note', 'Contactez support@tremplin.ga pour plus d\'informations.'),
                '/entreprise');
        }
        audit('company.' . $decision, 'company', (int)$c['id'], ['note' => input('note')]);
        flash('success', $c['name'] . ' : ' . ['verified' => 'vérifiée', 'rejected' => 'refusée', 'pending' => 'remise en attente'][$decision] . '.');
        back();
    }

    public function jobs(): string
    {
        $status = in_array(input('statut'), ['pending', 'published', 'archived', 'rejected', 'draft'], true) ? input('statut') : null;
        $q = trim((string)input('q', ''));
        $where = ['1 = 1'];
        $params = [];
        if ($status) {
            $where[] = 'j.status = :s';
            $params['s'] = $status;
        }
        if ($q !== '') {
            $where[] = '(j.title LIKE :q1 OR co.name LIKE :q2)';
            $params += ['q1' => "%$q%", 'q2' => "%$q%"];
        }
        $jobs = DB::all(
            'SELECT j.*, co.name AS company_name, co.status AS company_status, ci.name AS city_name,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS apps,
                (SELECT COUNT(*) FROM reports r WHERE r.entity = \'job\' AND r.entity_id = j.id AND r.status = \'open\') AS reports
             FROM jobs j JOIN companies co ON co.id = j.company_id LEFT JOIN cities ci ON ci.id = j.city_id
             WHERE ' . implode(' AND ', $where) . " ORDER BY j.status = 'pending' DESC, reports DESC, j.created_at DESC LIMIT 200",
            $params
        );
        return $this->app('admin/jobs', compact('jobs', 'status', 'q') + ['title' => 'Offres']);
    }

    public function moderateJob(string $id): void
    {
        $job = DB::one('SELECT * FROM jobs WHERE id = :id', ['id' => (int)$id]) ?? abort(404);
        $action = (string)input('decision');
        $data = match ($action) {
            'approve'  => ['status' => 'published', 'published_at' => $job['published_at'] ?: now(), 'moderation_note' => null],
            'reject'   => ['status' => 'rejected', 'moderation_note' => mb_substr((string)input('note', 'Non conforme à la charte'), 0, 255)],
            'archive'  => ['status' => 'archived'],
            'feature'  => ['featured' => $job['featured'] ? 0 : 1],
            default    => null,
        };
        if (!$data) {
            back();
        }
        DB::update('jobs', $data + ['updated_at' => now()], 'id = :id', ['id' => $job['id']]);
        MatchingEngine::forget((int)$job['id']);
        if ($action === 'approve' && $job['status'] !== 'published') {
            NotificationService::jobAlerts((int)$job['id']);
        }
        if (in_array($action, ['approve', 'reject'], true)) {
            foreach (DB::column('SELECT user_id FROM company_users WHERE company_id = :c', ['c' => $job['company_id']]) as $uid) {
                NotificationService::notify((int)$uid, 'moderation', ($action === 'approve' ? 'Offre publiée : ' : 'Offre refusée : ') . $job['title'], $data['moderation_note'] ?? 'Votre offre est en ligne.', '/entreprise/offres');
            }
        }
        audit('job.' . $action, 'job', (int)$job['id'], ['note' => $data['moderation_note'] ?? null]);
        flash('success', 'Action « ' . $action . ' » appliquée à « ' . $job['title'] . ' ».');
        back();
    }

    /* ---------- Référentiels ---------- */

    private const REFS = [
        'skills'       => ['Compétences', ['name', 'category', 'aliases']],
        'sectors'      => ['Secteurs', ['name', 'icon']],
        'cities'       => ['Villes', ['name', 'country_id']],
        'countries'    => ['Pays', ['code', 'name', 'currency', 'phone_prefix']],
        'job_families' => ['Métiers', ['name', 'riasec', 'sector_id', 'skills', 'education_min', 'outlook']],
        'trainings'    => ['Formations', ['title', 'provider', 'skill_id', 'duration', 'price', 'format']],
    ];

    public function referentials(): string
    {
        $tab = isset(self::REFS[input('tab')]) ? input('tab') : 'skills';
        $rows = match ($tab) {
            'skills' => DB::all('SELECT s.*, (SELECT COUNT(*) FROM candidate_skills cs WHERE cs.skill_id = s.id) AS used FROM skills s ORDER BY s.category, s.name'),
            'cities' => DB::all('SELECT ci.*, co.name AS country_name FROM cities ci JOIN countries co ON co.id = ci.country_id ORDER BY co.name, ci.name'),
            'job_families' => DB::all('SELECT jf.*, s.name AS sector_name FROM job_families jf LEFT JOIN sectors s ON s.id = jf.sector_id ORDER BY jf.name'),
            'trainings' => DB::all('SELECT t.*, s.name AS skill_name FROM trainings t LEFT JOIN skills s ON s.id = t.skill_id ORDER BY t.title'),
            default => DB::all("SELECT * FROM $tab ORDER BY name"),
        };
        $countries = DB::all('SELECT id, name FROM countries ORDER BY name');
        $sectors = DB::all('SELECT id, name FROM sectors ORDER BY name');
        $skills = DB::all("SELECT id, name FROM skills WHERE category = 'tech' ORDER BY name");
        return $this->app('admin/referentials', compact('tab', 'rows', 'countries', 'sectors', 'skills') + ['refs' => self::REFS, 'title' => 'Référentiels']);
    }

    public function saveReferential(): void
    {
        $tab = (string)input('tab');
        if (!isset(self::REFS[$tab])) {
            abort(400);
        }
        $data = [];
        foreach (self::REFS[$tab][1] as $f) {
            $v = trim((string)input($f, ''));
            $data[$f] = $v === '' ? null : mb_substr($v, 0, 255);
        }
        if (empty($data[self::REFS[$tab][1][0]])) {
            flash('error', 'Le premier champ est obligatoire.');
            back();
        }
        if (in_array($tab, ['skills', 'sectors'], true)) {
            $data['slug'] = slugify($data['name']);
            if (DB::value("SELECT COUNT(*) FROM $tab WHERE slug = :s", ['s' => $data['slug']])) {
                flash('error', 'Cet élément existe déjà.');
                back();
            }
        }
        if ($tab === 'skills') {
            $data['category'] = in_array($data['category'], ['tech', 'soft'], true) ? $data['category'] : 'tech';
        }
        if ($tab === 'countries') {
            $data['code'] = mb_strtoupper(mb_substr((string)$data['code'], 0, 2));
            $data['currency'] ??= 'FCFA';
        }
        if ($tab === 'trainings') {
            $data['price'] = (int)($data['price'] ?? 0);
        }
        $id = DB::insert($tab, $data);
        audit('referential.created', $tab, $id, ['name' => $data[self::REFS[$tab][1][0]]]);
        flash('success', self::REFS[$tab][0] . ' : élément ajouté.');
        redirect('/admin/referentiels?tab=' . $tab);
    }

    public function deleteReferential(): void
    {
        $tab = (string)input('tab');
        if (!isset(self::REFS[$tab])) {
            abort(400);
        }
        try {
            DB::delete($tab, 'id = :id', ['id' => (int)input('id')]);
            audit('referential.deleted', $tab, (int)input('id'));
            flash('info', 'Élément supprimé.');
        } catch (\PDOException) {
            flash('error', 'Impossible de supprimer : cet élément est utilisé (offres, profils…).');
        }
        redirect('/admin/referentiels?tab=' . $tab);
    }

    /* ---------- Matching ---------- */

    public function matching(): string
    {
        $sectorId = (int)input('sector', 0) ?: null;
        $weights = MatchingEngine::weights($sectorId);
        $raw = [];
        foreach (DB::all('SELECT criterion, weight FROM matching_weights WHERE ' . ($sectorId ? 'sector_id = :s' : 'sector_id IS NULL'), $sectorId ? ['s' => $sectorId] : []) as $r) {
            $raw[$r['criterion']] = (int)$r['weight'];
        }
        $sectors = DB::all('SELECT s.id, s.name, (SELECT COUNT(*) FROM matching_weights w WHERE w.sector_id = s.id) AS custom FROM sectors s ORDER BY s.name');
        // Calibrage : score moyen des candidatures acceptées vs refusées (qualité du matching)
        $quality = [
            'accepted' => (int)DB::value("SELECT AVG(match_score) FROM applications WHERE status = 'accepted'"),
            'shortlisted' => (int)DB::value("SELECT AVG(match_score) FROM applications WHERE status IN ('shortlisted','interview')"),
            'rejected' => (int)DB::value("SELECT AVG(match_score) FROM applications WHERE status = 'rejected'"),
        ];
        // Simulation sur un couple candidat/offre
        $sim = null;
        $candidates = DB::all("SELECT u.id, u.first_name, u.last_name FROM users u WHERE u.role = 'candidate' ORDER BY u.first_name LIMIT 50");
        $jobs = DB::all("SELECT id, title FROM jobs WHERE status = 'published' ORDER BY title");
        if (input('cand') && input('job')) {
            $p = ProfileService::load((int)input('cand'));
            $j = MatchingEngine::loadJob((int)input('job'));
            $sim = $p && $j ? MatchingEngine::compute($p, $j) : null;
        }
        return $this->app('admin/matching', compact('sectorId', 'weights', 'raw', 'sectors', 'quality', 'sim', 'candidates', 'jobs') + ['criteria' => MatchingEngine::CRITERIA, 'title' => 'Moteur de matching']);
    }

    public function saveMatching(): void
    {
        $sectorId = (int)input('sector_id', 0) ?: null;
        $where = $sectorId ? 'sector_id = :s' : 'sector_id IS NULL';
        $params = $sectorId ? ['s' => $sectorId] : [];
        if (input('reset') && $sectorId) {
            DB::delete('matching_weights', $where, $params);
            audit('matching.weights_reset', 'sector', $sectorId);
            flash('info', 'Ce secteur utilise de nouveau les poids par défaut.');
            redirect('/admin/matching?sector=' . $sectorId);
        }
        $new = [];
        foreach (array_keys(MatchingEngine::CRITERIA) as $k) {
            $new[$k] = max(0, min(100, (int)($_POST['w'][$k] ?? 0)));
        }
        if (array_sum($new) <= 0) {
            flash('error', 'La somme des poids doit être positive.');
            back();
        }
        DB::transaction(function () use ($where, $params, $new, $sectorId) {
            DB::delete('matching_weights', $where, $params);
            foreach ($new as $k => $w) {
                DB::insert('matching_weights', ['sector_id' => $sectorId, 'criterion' => $k, 'weight' => $w]);
            }
        });
        audit('matching.weights_updated', 'sector', $sectorId, $new);
        flash('success', 'Poids enregistrés (total ' . array_sum($new) . ', normalisé à 100). Les scores sont recalculés en temps réel.');
        redirect('/admin/matching' . ($sectorId ? '?sector=' . $sectorId : ''));
    }

    /* ---------- Paiements & contenus ---------- */

    public function payments(): string
    {
        $payments = DB::all('SELECT p.*, u.first_name, u.last_name, u.email FROM payments p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC LIMIT 150');
        $coupons = DB::all('SELECT * FROM coupons ORDER BY code');
        $totals = [
            'success' => (int)DB::value("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'success'"),
            'count' => (int)DB::value("SELECT COUNT(*) FROM payments WHERE status = 'success'"),
            'failed' => (int)DB::value("SELECT COUNT(*) FROM payments WHERE status = 'failed'"),
            'active_subs' => (int)DB::value("SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND expires_at > :n", ['n' => now()]),
        ];
        $byMethod = DB::all("SELECT method, COUNT(*) AS n, SUM(amount) AS total FROM payments WHERE status = 'success' GROUP BY method");
        return $this->app('admin/payments', compact('payments', 'coupons', 'totals', 'byMethod') + ['methods' => \App\Services\PaymentService::METHODS, 'title' => 'Paiements']);
    }

    public function saveCoupon(): void
    {
        $d = Validator::make($_POST, ['code' => 'required|max:30', 'percent' => 'required|between:1,100', 'max_uses' => 'required|between:1,100000', 'expires_at' => 'nullable|date'])->validateOrBack();
        $code = mb_strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $d['code']));
        DB::delete('coupons', 'code = :c', ['c' => $code]);
        DB::insert('coupons', ['code' => $code, 'percent' => (int)$d['percent'], 'max_uses' => (int)$d['max_uses'], 'uses' => 0, 'expires_at' => $d['expires_at'], 'active' => 1]);
        audit('coupon.saved', 'coupon', null, ['code' => $code]);
        flash('success', "Code promo $code enregistré.");
        redirect('/admin/paiements');
    }

    public function contents(): string
    {
        $contents = DB::all('SELECT * FROM contents ORDER BY created_at DESC');
        $edit = input('edit') ? DB::one('SELECT * FROM contents WHERE id = :id', ['id' => (int)input('edit')]) : null;
        return $this->app('admin/contents', compact('contents', 'edit') + ['title' => 'Contenus éditoriaux']);
    }

    public function saveContent(): void
    {
        if (input('delete')) {
            DB::delete('contents', 'id = :id', ['id' => (int)input('delete')]);
            audit('content.deleted', 'content', (int)input('delete'));
            flash('info', 'Article supprimé.');
            redirect('/admin/contenus');
        }
        $d = Validator::make($_POST, ['title' => 'required|max:190', 'category' => 'required|in:cv,entretien,marche,stage,conseil', 'excerpt' => 'nullable|max:300', 'body' => 'required|min:50'])->validateOrBack();
        $data = $d + [
            'cover_color' => preg_match('/^#[0-9a-f]{6}$/i', (string)input('cover_color')) ? input('cover_color') : '#0057ff',
            'published' => input('published') ? 1 : 0, 'reading_minutes' => max(1, (int)ceil(str_word_count($d['body']) / 200)),
        ];
        if ($id = (int)input('id', 0)) {
            DB::update('contents', $data, 'id = :id', ['id' => $id]);
        } else {
            $slug = slugify($d['title']);
            if (DB::value('SELECT COUNT(*) FROM contents WHERE slug = :s', ['s' => $slug])) {
                $slug .= '-' . date('His');
            }
            $id = DB::insert('contents', $data + ['slug' => $slug, 'created_at' => now()]);
        }
        audit('content.saved', 'content', $id);
        flash('success', 'Article enregistré.');
        redirect('/admin/contenus');
    }

    /* ---------- Signalements, communications, audit ---------- */

    public function reports(): string
    {
        $reports = DB::all(
            "SELECT r.*, u.first_name, u.last_name, u.email,
                CASE r.entity WHEN 'job' THEN (SELECT title FROM jobs WHERE id = r.entity_id) WHEN 'company' THEN (SELECT name FROM companies WHERE id = r.entity_id) ELSE NULL END AS target
             FROM reports r LEFT JOIN users u ON u.id = r.user_id ORDER BY r.status = 'open' DESC, r.created_at DESC"
        );
        return $this->app('admin/reports', compact('reports') + ['title' => 'Signalements & tickets']);
    }

    public function updateReport(string $id): void
    {
        $r = DB::one('SELECT * FROM reports WHERE id = :id', ['id' => (int)$id]) ?? abort(404);
        $status = in_array(input('status'), ['open', 'in_progress', 'resolved', 'rejected'], true) ? input('status') : $r['status'];
        DB::update('reports', ['status' => $status, 'admin_note' => mb_substr((string)input('admin_note', ''), 0, 1000) ?: null], 'id = :id', ['id' => $r['id']]);
        if (input('suspend_job') && $r['entity'] === 'job') {
            DB::update('jobs', ['status' => 'archived', 'moderation_note' => 'Suspendue suite à un signalement'], 'id = :id', ['id' => $r['entity_id']]);
            audit('job.suspended', 'job', (int)$r['entity_id']);
        }
        if ($r['user_id'] && $status === 'resolved') {
            NotificationService::notify((int)$r['user_id'], 'moderation', 'Ton signalement a été traité', 'Merci de contribuer à la sécurité de Tremplin.', null, false);
        }
        audit('report.' . $status, 'report', (int)$r['id']);
        flash('success', 'Signalement mis à jour.');
        back();
    }

    public function outbox(): string
    {
        $channel = in_array(input('canal'), ['email', 'sms', 'whatsapp'], true) ? input('canal') : null;
        $items = DB::all('SELECT * FROM outbox' . ($channel ? ' WHERE channel = :c' : '') . ' ORDER BY created_at DESC LIMIT 200', $channel ? ['c' => $channel] : []);
        $ai = DB::all('SELECT a.*, u.first_name FROM ai_logs a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 30');
        return $this->app('admin/outbox', compact('items', 'channel', 'ai') + ['title' => 'Communications']);
    }

    public function audit(): string
    {
        $q = trim((string)input('q', ''));
        $logs = DB::all(
            'SELECT a.*, u.first_name, u.last_name, u.role FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id'
            . ($q !== '' ? ' WHERE a.action LIKE :q' : '') . ' ORDER BY a.created_at DESC LIMIT 300',
            $q !== '' ? ['q' => "%$q%"] : []
        );
        return $this->app('admin/audit', compact('logs', 'q') + ['title' => 'Journal d\'audit']);
    }

    public function settings(): string
    {
        $keys = ['ai_enabled', 'match_alert_threshold', 'stat_youth', 'stat_offers', 'stat_companies', 'testimonial_text', 'testimonial_author'];
        $values = [];
        foreach ($keys as $k) {
            $values[$k] = setting($k, '');
        }
        $plans = DB::all('SELECT * FROM plans ORDER BY sort');
        return $this->app('admin/settings', compact('values', 'plans') + ['title' => 'Paramètres', 'provider' => \App\Services\Ai\AiService::providerName()]);
    }

    public function saveSettings(): void
    {
        $values = [
            'ai_enabled' => input('ai_enabled') ? '1' : '0',
            'match_alert_threshold' => (string)max(40, min(95, (int)input('match_alert_threshold', 70))),
        ];
        foreach (['stat_youth', 'stat_offers', 'stat_companies', 'testimonial_text', 'testimonial_author'] as $k) {
            $values[$k] = mb_substr(trim((string)input($k, '')), 0, 300);
        }
        foreach ($values as $k => $v) {
            DB::delete('settings', 'skey = :k', ['k' => $k]);
            DB::insert('settings', ['skey' => $k, 'svalue' => $v]);
        }
        foreach ((array)($_POST['price'] ?? []) as $code => $price) {
            DB::update('plans', ['price' => max(0, (int)$price)], 'code = :c', ['c' => (string)$code]);
        }
        audit('settings.updated', null, null, $values);
        flash('success', 'Paramètres enregistrés.');
        redirect('/admin/parametres');
    }

    /** Exports CSV (compatibles Excel/XLSX à l'ouverture). */
    public function export(string $type): void
    {
        audit('admin.export', $type);
        $date = date('Y-m-d');
        match ($type) {
            'utilisateurs' => send_csv("tremplin-utilisateurs-$date.csv", ['ID', 'Rôle', 'Prénom', 'Nom', 'E-mail', 'Téléphone', 'Offre', 'Statut', 'Inscription', 'Dernière connexion'],
                array_map(fn($r) => array_values($r), DB::all('SELECT id, role, first_name, last_name, email, phone, plan_code, status, created_at, last_login_at FROM users ORDER BY id'))),
            'offres' => send_csv("tremplin-offres-$date.csv", ['ID', 'Titre', 'Entreprise', 'Type', 'Ville', 'Statut', 'Vues', 'Candidatures', 'Publiée'],
                array_map(fn($r) => array_values($r), DB::all('SELECT j.id, j.title, co.name, j.type, ci.name AS city, j.status, j.views, (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id), j.published_at FROM jobs j JOIN companies co ON co.id = j.company_id LEFT JOIN cities ci ON ci.id = j.city_id ORDER BY j.id'))),
            'candidatures' => send_csv("tremplin-candidatures-$date.csv", ['ID', 'Offre', 'Entreprise', 'Prénom', 'Nom', 'Score', 'Statut', 'Date'],
                array_map(fn($r) => array_values($r), DB::all("SELECT a.id, j.title, co.name, u.first_name, u.last_name, a.match_score, a.status, a.created_at FROM applications a JOIN jobs j ON j.id = a.job_id JOIN companies co ON co.id = j.company_id JOIN users u ON u.id = a.user_id ORDER BY a.id"))),
            'paiements' => send_csv("tremplin-paiements-$date.csv", ['Référence', 'Utilisateur', 'Offre', 'Montant', 'Remise', 'Moyen', 'Statut', 'Date'],
                array_map(fn($r) => array_values($r), DB::all('SELECT p.reference, u.email, p.plan_code, p.amount, p.discount, p.method, p.status, p.created_at FROM payments p JOIN users u ON u.id = p.user_id ORDER BY p.id'))),
            'kpi' => send_csv("tremplin-kpi-$date.csv", ['Indicateur', 'Valeur'], array_map(fn($k, $v) => [$k, $v], array_keys(self::analytics()), self::analytics())),
            default => abort(404),
        };
    }
}
