<?php
declare(strict_types=1);

namespace App\Controllers\School;

use App\Controllers\Controller;
use App\Core\DB;
use App\Services\NotificationService;

final class SchoolController extends Controller
{
    private function school(): array
    {
        return current_school() ?? abort(403, 'Aucun établissement rattaché à ce compte.');
    }

    /** Étudiant autorisé : rattaché à l'établissement courant (cloisonnement strict). */
    private function student(int $userId): array
    {
        $s = DB::one('SELECT ss.*, u.first_name, u.last_name, u.email FROM school_students ss JOIN users u ON u.id = ss.user_id WHERE ss.school_id = :s AND ss.user_id = :u', ['s' => $this->school()['id'], 'u' => $userId]);
        return $s ?? abort(404);
    }

    public function dashboard(): string
    {
        $s = $this->school();
        $sid = (int)$s['id'];
        $students = (int)DB::value('SELECT COUNT(*) FROM school_students WHERE school_id = :s', ['s' => $sid]);
        $byStatus = [];
        foreach (DB::all('SELECT status, COUNT(*) AS n FROM internships WHERE school_id = :s GROUP BY status', ['s' => $sid]) as $r) {
            $byStatus[$r['status']] = (int)$r['n'];
        }
        $placed = ($byStatus['placement'] ?? 0) + ($byStatus['convention'] ?? 0) + ($byStatus['en_cours'] ?? 0) + ($byStatus['termine'] ?? 0);
        $apps = (int)DB::value('SELECT COUNT(*) FROM applications a JOIN school_students ss ON ss.user_id = a.user_id WHERE ss.school_id = :s', ['s' => $sid]);
        $avgEmploy = (int)DB::value('SELECT AVG(cp.employability_score) FROM candidate_profiles cp JOIN school_students ss ON ss.user_id = cp.user_id WHERE ss.school_id = :s', ['s' => $sid]);
        $graduates = (int)DB::value('SELECT COUNT(*) FROM school_students WHERE school_id = :s AND graduated = 1', ['s' => $sid]);
        $employed = (int)DB::value('SELECT COUNT(*) FROM school_students WHERE school_id = :s AND graduated = 1 AND employed = 1', ['s' => $sid]);
        $byProgram = DB::all(
            "SELECT COALESCE(ss.program, 'Non renseignée') AS program, COUNT(*) AS n, AVG(cp.employability_score) AS score,
                SUM(CASE WHEN i.status IN ('placement','convention','en_cours','termine') THEN 1 ELSE 0 END) AS placed
             FROM school_students ss LEFT JOIN candidate_profiles cp ON cp.user_id = ss.user_id
             LEFT JOIN internships i ON i.user_id = ss.user_id AND i.school_id = ss.school_id
             WHERE ss.school_id = :s GROUP BY COALESCE(ss.program, 'Non renseignée') ORDER BY n DESC",
            ['s' => $sid]
        );
        $bySector = DB::all(
            "SELECT se.name, COUNT(*) AS n FROM applications a JOIN jobs j ON j.id = a.job_id JOIN sectors se ON se.id = j.sector_id
             JOIN school_students ss ON ss.user_id = a.user_id WHERE ss.school_id = :s GROUP BY se.name ORDER BY n DESC LIMIT 6",
            ['s' => $sid]
        );
        $partners = DB::all('SELECT c.* FROM school_partners sp JOIN companies c ON c.id = sp.company_id WHERE sp.school_id = :s', ['s' => $sid]);
        $companies = DB::all("SELECT id, name FROM companies WHERE status = 'verified' AND id NOT IN (SELECT company_id FROM school_partners WHERE school_id = :s) ORDER BY name", ['s' => $sid]);
        return $this->app('school/dashboard', compact('s', 'students', 'byStatus', 'placed', 'apps', 'avgEmploy', 'graduates', 'employed', 'byProgram', 'bySector', 'partners', 'companies') + ['title' => 'Espace établissement', 'charts' => true]);
    }

    public function students(): string
    {
        $s = $this->school();
        $q = trim((string)input('q', ''));
        $params = ['s' => $s['id']];
        $where = 'ss.school_id = :s';
        if ($q !== '') {
            $where .= ' AND (u.first_name LIKE :q1 OR u.last_name LIKE :q2 OR ss.program LIKE :q3)';
            $params += ['q1' => "%$q%", 'q2' => "%$q%", 'q3' => "%$q%"];
        }
        $students = DB::all(
            "SELECT ss.*, u.id AS uid, u.first_name, u.last_name, u.email, cp.employability_score, cp.completion, cp.headline, i.status AS internship_status,
                (SELECT COUNT(*) FROM applications a WHERE a.user_id = u.id) AS apps
             FROM school_students ss JOIN users u ON u.id = ss.user_id LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
             LEFT JOIN internships i ON i.user_id = u.id AND i.school_id = ss.school_id
             WHERE $where ORDER BY u.last_name",
            $params
        );
        return $this->app('school/students', compact('s', 'students', 'q') + ['title' => 'Étudiants']);
    }

    public function invite(): void
    {
        $s = $this->school();
        $emails = array_filter(array_map('trim', preg_split('/[\s,;]+/', (string)input('emails', ''))), fn($e) => filter_var($e, FILTER_VALIDATE_EMAIL));
        foreach (array_slice($emails, 0, 100) as $email) {
            NotificationService::sendEmail($email, $s['name'] . ' t\'invite sur Tremplin',
                "Bonjour,\n\n" . $s['name'] . " utilise Tremplin by NEAM pour accompagner ses étudiants vers les stages et l'emploi.\n\n"
                . "Crée ton compte gratuitement : " . url('/inscription') . "\nCode établissement : " . $s['join_code'] . "\n\nÀ très vite !");
        }
        audit('school.invitations', 'school', (int)$s['id'], ['count' => count($emails)]);
        flash('success', count($emails) . ' invitation(s) envoyée(s) avec le code ' . $s['join_code'] . '.');
        redirect('/ecole/etudiants');
    }

    public function updateStudent(string $id): void
    {
        $st = $this->student((int)$id);
        DB::update('school_students', [
            'program' => mb_substr(trim((string)input('program', '')), 0, 150) ?: null,
            'level' => mb_substr(trim((string)input('level', '')), 0, 40) ?: null,
            'graduated' => input('graduated') ? 1 : 0, 'employed' => input('employed') ? 1 : 0,
        ], 'school_id = :s AND user_id = :u', ['s' => $st['school_id'], 'u' => $st['user_id']]);
        flash('success', 'Fiche de ' . $st['first_name'] . ' mise à jour.');
        back();
    }

    public function internships(): string
    {
        $s = $this->school();
        $rows = DB::all(
            'SELECT i.*, u.first_name, u.last_name, u.email, ss.program FROM internships i JOIN users u ON u.id = i.user_id
             LEFT JOIN school_students ss ON ss.user_id = i.user_id AND ss.school_id = i.school_id WHERE i.school_id = :s ORDER BY i.updated_at DESC',
            ['s' => $s['id']]
        );
        $columns = array_fill_keys(array_keys(internship_statuses()), []);
        foreach ($rows as $r) {
            $columns[$r['status']][] = $r;
        }
        $without = DB::all('SELECT u.id, u.first_name, u.last_name FROM school_students ss JOIN users u ON u.id = ss.user_id WHERE ss.school_id = :s AND u.id NOT IN (SELECT user_id FROM internships WHERE school_id = :s2)', ['s' => $s['id'], 's2' => $s['id']]);
        return $this->app('school/internships', compact('s', 'columns', 'rows', 'without') + ['title' => 'Suivi des stages']);
    }

    public function storeInternship(): void
    {
        $st = $this->student((int)input('user_id', 0));
        DB::insert('internships', ['school_id' => $st['school_id'], 'user_id' => $st['user_id'], 'status' => 'recherche', 'updated_at' => now()]);
        flash('success', 'Suivi de stage créé pour ' . $st['first_name'] . '.');
        redirect('/ecole/stages');
    }

    public function updateInternship(string $id): void
    {
        $s = $this->school();
        $i = DB::one('SELECT * FROM internships WHERE id = :id AND school_id = :s', ['id' => (int)$id, 's' => $s['id']]) ?? abort(404);
        $status = isset(internship_statuses()[input('status')]) ? input('status') : $i['status'];
        $date = fn($v) => $v && strtotime((string)$v) ? date('Y-m-d', strtotime((string)$v)) : null;
        DB::update('internships', [
            'status' => $status, 'company_name' => mb_substr(trim((string)input('company_name', '')), 0, 160) ?: null,
            'tutor' => mb_substr(trim((string)input('tutor', '')), 0, 120) ?: null, 'start_date' => $date(input('start_date')),
            'end_date' => $date(input('end_date')), 'agreement_signed' => input('agreement_signed') || in_array($status, ['convention', 'en_cours', 'termine'], true) ? 1 : 0,
            'updated_at' => now(),
        ], 'id = :id', ['id' => $i['id']]);
        if ($status !== $i['status'] && $status === 'convention') {
            NotificationService::notify((int)$i['user_id'], 'internship', 'Ta convention de stage est validée par ' . $s['name'], 'Tout est en ordre, il ne te reste plus qu\'à briller. Bon stage ! Pense à ajouter cette expérience à ton profil à la fin.', '/espace', true, true);
        }
        audit('internship.updated', 'internship', (int)$i['id'], ['status' => $status]);
        flash('success', 'Suivi de stage mis à jour.');
        redirect('/ecole/stages');
    }

    public function broadcast(): string
    {
        $s = $this->school();
        $jobs = DB::all("SELECT j.id, j.title, co.name AS company_name, j.type FROM jobs j JOIN companies co ON co.id = j.company_id WHERE j.status = 'published' ORDER BY j.published_at DESC LIMIT 80");
        $programs = DB::column('SELECT DISTINCT program FROM school_students WHERE school_id = :s AND program IS NOT NULL ORDER BY program', ['s' => $s['id']]);
        return $this->app('school/broadcast', compact('s', 'jobs', 'programs') + ['title' => 'Diffusion d\'offres']);
    }

    public function sendBroadcast(): void
    {
        $s = $this->school();
        $job = DB::one("SELECT j.id, j.title, co.name AS company_name FROM jobs j JOIN companies co ON co.id = j.company_id WHERE j.id = :id AND j.status = 'published'", ['id' => (int)input('job_id', 0)]);
        if (!$job) {
            flash('error', 'Choisis une offre publiée.');
            back();
        }
        $program = (string)input('program', '');
        $params = ['s' => $s['id']];
        $sql = 'SELECT user_id FROM school_students WHERE school_id = :s';
        if ($program !== '') {
            $sql .= ' AND program = :p';
            $params['p'] = $program;
        }
        $ids = DB::column($sql, $params);
        $message = mb_substr(trim((string)input('message', '')), 0, 300);
        foreach ($ids as $uid) {
            NotificationService::notify((int)$uid, 'broadcast', $s['short_name'] . ' te recommande : ' . $job['title'], ($message ?: 'Ton établissement a sélectionné cette opportunité pour toi. Regarde ton score de compatibilité.') . ' — ' . $job['company_name'], '/offres/' . $job['id']);
        }
        audit('school.broadcast', 'job', (int)$job['id'], ['recipients' => count($ids)]);
        flash('success', 'Offre diffusée à ' . count($ids) . ' étudiant(s). Une recommandation de l\'école compte beaucoup aux yeux des étudiants.');
        redirect('/ecole/diffusion');
    }

    public function addPartner(): void
    {
        $s = $this->school();
        $cid = (int)input('company_id', 0);
        if (DB::value("SELECT COUNT(*) FROM companies WHERE id = :c AND status = 'verified'", ['c' => $cid]) && !DB::value('SELECT COUNT(*) FROM school_partners WHERE school_id = :s AND company_id = :c', ['s' => $s['id'], 'c' => $cid])) {
            DB::insert('school_partners', ['school_id' => $s['id'], 'company_id' => $cid, 'created_at' => now()]);
            foreach (DB::column('SELECT user_id FROM company_users WHERE company_id = :c', ['c' => $cid]) as $r) {
                NotificationService::notify((int)$r, 'partner', $s['name'] . ' vous propose un partenariat', 'Accédez en priorité aux étudiants de l\'établissement et recrutez vos futurs talents dès leur formation.', '/entreprise', true);
            }
            flash('success', 'Partenariat enregistré.');
        }
        redirect('/ecole');
    }

    /** Export CSV du rapport d'insertion (compatible Excel). */
    public function export(): void
    {
        $s = $this->school();
        $rows = DB::all(
            "SELECT u.last_name, u.first_name, u.email, ss.program, ss.level, ss.cohort, cp.employability_score, cp.completion,
                i.status, i.company_name, i.start_date, i.end_date, i.agreement_signed, ss.graduated, ss.employed,
                (SELECT COUNT(*) FROM applications a WHERE a.user_id = u.id) AS applications
             FROM school_students ss JOIN users u ON u.id = ss.user_id LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
             LEFT JOIN internships i ON i.user_id = u.id AND i.school_id = ss.school_id WHERE ss.school_id = :s ORDER BY u.last_name",
            ['s' => $s['id']]
        );
        audit('school.export', 'school', (int)$s['id']);
        send_csv('rapport-insertion-' . slugify($s['short_name'] ?: $s['name']) . '-' . date('Y-m-d') . '.csv',
            ['Nom', 'Prénom', 'E-mail', 'Filière', 'Niveau', 'Promotion', 'Employabilité', 'Profil %', 'Statut stage', 'Entreprise', 'Début', 'Fin', 'Convention', 'Diplômé', 'En emploi', 'Candidatures'],
            array_map(fn($r) => [$r['last_name'], $r['first_name'], $r['email'], $r['program'], $r['level'], $r['cohort'], $r['employability_score'], $r['completion'],
                internship_statuses()[$r['status']][0] ?? '', $r['company_name'], $r['start_date'], $r['end_date'], $r['agreement_signed'] ? 'Oui' : 'Non', $r['graduated'] ? 'Oui' : 'Non', $r['employed'] ? 'Oui' : 'Non', $r['applications']], $rows));
    }
}
