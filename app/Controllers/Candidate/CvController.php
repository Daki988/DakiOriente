<?php
declare(strict_types=1);

namespace App\Controllers\Candidate;

use App\Controllers\Controller;
use App\Core\DB;
use App\Core\Session;
use App\Services\Ai\AiService;
use App\Services\MatchingEngine;
use App\Services\PlanService;
use App\Services\ProfileService;
use App\Services\Uploader;

final class CvController extends Controller
{
    public const TEMPLATES = ['moderne' => 'Moderne', 'classique' => 'Classique', 'creatif' => 'Créatif'];
    private const FREE_LETTERS = 2;

    public function index(): string
    {
        $p = ProfileService::load($this->uid(), true);
        $versions = DB::all('SELECT id, label, template, created_at FROM cv_versions WHERE user_id = :u ORDER BY created_at DESC', ['u' => $this->uid()]);
        $docs = DB::all("SELECT * FROM documents WHERE user_id = :u AND kind = 'cv' ORDER BY created_at DESC", ['u' => $this->uid()]);
        $import = Session::get('cv_import');
        $canTemplates = PlanService::allows($this->user(), 'cv_templates');
        $jobs = DB::all("SELECT j.id, j.title, co.name AS company_name FROM jobs j JOIN companies co ON co.id = j.company_id WHERE j.status = 'published' ORDER BY j.published_at DESC LIMIT 60");
        return $this->app('candidate/cv', compact('p', 'versions', 'docs', 'import', 'canTemplates', 'jobs') + [
            'templates' => self::TEMPLATES, 'title' => 'Mon CV', 'provider' => AiService::providerName(),
            'usage' => AiService::usage(), 'aiEnabled' => AiService::enabled(),
        ]);
    }

    /** Rédaction du CV par l'IA (Claude) : accroche, titre et expériences reformulées, éventuellement ciblées sur une offre. */
    public function aiCv(): void
    {
        if (!AiService::enabled()) {
            flash('warning', 'L\'assistant IA est temporairement désactivé.');
            redirect('/espace/cv');
        }
        $jobId = (int)input('job_id', 0);
        $job = $jobId ? MatchingEngine::loadJob($jobId) : null;
        $p = ProfileService::load($this->uid(), true);
        if (!$p['experiences'] && !$p['skills']) {
            flash('warning', 'Ajoute d\'abord tes expériences et compétences dans ton profil : l\'IA n\'invente rien.');
            redirect('/espace/profil');
        }
        $quota = AiService::quotaReached();
        $content = AiService::cvContent($p, $job);
        DB::update('candidate_profiles', ['cv_ai' => json_encode($content, JSON_UNESCAPED_UNICODE), 'updated_at' => now()], 'user_id = :u', ['u' => $this->uid()]);
        audit('cv.ai_generated', 'user', $this->uid(), ['provider' => $content['provider'], 'job' => $jobId ?: null]);
        flash('success', $content['provider'] === 'Claude'
            ? 'CV rédigé par Claude' . ($job ? ' pour « ' . $job['title'] . ' »' : '') . '. Relis-le : tu peux revenir à ta version à tout moment.'
            : ($quota ? 'Quota IA du mois atteint : CV rédigé par le moteur NEAM.' : 'CV mis en forme par le moteur NEAM.'));
        redirect('/espace/cv');
    }

    public function resetAiCv(): void
    {
        DB::update('candidate_profiles', ['cv_ai' => null], 'user_id = :u', ['u' => $this->uid()]);
        flash('info', 'Ton CV utilise de nouveau les textes de ton profil.');
        redirect('/espace/cv');
    }

    public function template(): void
    {
        $t = (string)input('template');
        if (!isset(self::TEMPLATES[$t])) {
            back();
        }
        if ($t !== 'moderne' && !PlanService::allows($this->user(), 'cv_templates')) {
            flash('warning', 'Les modèles Classique et Créatif sont inclus dès l\'offre Starter (2 000 FCFA/mois).');
            redirect('/espace/cv');
        }
        DB::update('candidate_profiles', ['cv_template' => $t], 'user_id = :u', ['u' => $this->uid()]);
        flash('success', 'Modèle « ' . self::TEMPLATES[$t] . ' » appliqué.');
        redirect('/espace/cv');
    }

    public function snapshot(): void
    {
        $p = ProfileService::load($this->uid(), true);
        $label = mb_substr(trim((string)input('label', '')) ?: 'Version du ' . date_fr(now()), 0, 120);
        DB::insert('cv_versions', ['user_id' => $this->uid(), 'label' => $label, 'template' => $p['cv_template'], 'snapshot' => json_encode($p, JSON_UNESCAPED_UNICODE), 'created_at' => now()]);
        flash('success', 'Version « ' . $label . ' » enregistrée dans ton historique.');
        redirect('/espace/cv');
    }

    public function print(): string
    {
        $p = ProfileService::load($this->uid(), true);
        $template = isset(self::TEMPLATES[(string)input('t')]) && (input('t') === 'moderne' || PlanService::allows($this->user(), 'cv_templates')) ? input('t') : $p['cv_template'];
        return \App\Core\View::render('candidate/cv_print', ['p' => $p, 'template' => $template, 'title' => 'CV — ' . $p['first_name'] . ' ' . $p['last_name']], 'bare');
    }

    public function version(string $id): string
    {
        $v = DB::one('SELECT * FROM cv_versions WHERE id = :id AND user_id = :u', ['id' => (int)$id, 'u' => $this->uid()]);
        if (!$v) {
            abort(404);
        }
        $p = json_decode($v['snapshot'], true);
        return \App\Core\View::render('candidate/cv_print', ['p' => $p, 'template' => $v['template'] ?: 'moderne', 'title' => $v['label'], 'versionLabel' => $v['label']], 'bare');
    }

    /** Import d'un CV existant : extraction du texte puis détection des compétences. */
    public function import(): void
    {
        try {
            $f = Uploader::store($_FILES['cv'] ?? [], Uploader::DOCS);
        } catch (\RuntimeException $e) {
            flash('error', $e->getMessage());
            redirect('/espace/cv');
        }
        DB::insert('documents', ['user_id' => $this->uid(), 'kind' => 'cv', 'original_name' => $f['original'], 'stored_name' => $f['stored'], 'mime' => $f['mime'], 'size' => $f['size'], 'created_at' => now()]);
        $text = Uploader::extractText($f['path'], pathinfo($f['stored'], PATHINFO_EXTENSION));
        $skills = $text ? ProfileService::extractSkills($text) : [];
        $mine = DB::column('SELECT skill_id FROM candidate_skills WHERE user_id = :u', ['u' => $this->uid()]);
        $new = array_values(array_filter($skills, fn($s) => !in_array($s['id'], $mine)));
        // Indices complémentaires : e-mail, téléphone, LinkedIn
        preg_match('/[\w.+-]+@[\w-]+\.[\w.]+/', $text, $email);
        preg_match('/(\+?241[\s.]?)?0?[67]\d[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}/', $text, $phone);
        preg_match('#linkedin\.com/in/[\w-]+#i', $text, $li);
        Session::put('cv_import', [
            'file' => $f['original'], 'chars' => mb_strlen($text), 'skills' => $new, 'known' => count($skills) - count($new),
            'email' => $email[0] ?? null, 'phone' => $phone[0] ?? null, 'linkedin' => isset($li[0]) ? 'https://www.' . $li[0] : null,
        ]);
        audit('cv.imported', 'document', null, ['chars' => mb_strlen($text), 'skills' => count($skills)]);
        flash($text ? 'success' : 'warning', $text ? 'CV analysé : ' . count($skills) . ' compétence(s) reconnue(s).' : 'Fichier enregistré, mais le texte n\'a pas pu être extrait (PDF scanné ?). Tu peux compléter ton profil manuellement.');
        redirect('/espace/cv#import');
    }

    public function applyImport(): void
    {
        $import = Session::pull('cv_import');
        if (!$import) {
            redirect('/espace/cv');
        }
        $chosen = array_map('intval', (array)($_POST['skills'] ?? []));
        $added = 0;
        foreach ($import['skills'] as $s) {
            if (in_array((int)$s['id'], $chosen, true)) {
                DB::run('DELETE FROM candidate_skills WHERE user_id = :u AND skill_id = :s', ['u' => $this->uid(), 's' => $s['id']]);
                DB::insert('candidate_skills', ['user_id' => $this->uid(), 'skill_id' => $s['id'], 'level' => $s['category'] === 'soft' ? 4 : 3]);
                $added++;
            }
        }
        if (input('use_linkedin') && $import['linkedin']) {
            DB::update('candidate_profiles', ['linkedin' => $import['linkedin']], 'user_id = :u', ['u' => $this->uid()]);
        }
        ProfileService::refreshCompletion($this->uid());
        flash('success', "$added compétence(s) ajoutée(s) à ton profil.");
        redirect('/espace/profil#competences');
    }

    /* ---------- Lettres de motivation ---------- */

    public function letters(): string
    {
        $uid = $this->uid();
        $letters = DB::all('SELECT cl.*, j.title AS job_title FROM cover_letters cl LEFT JOIN jobs j ON j.id = cl.job_id WHERE cl.user_id = :u ORDER BY cl.created_at DESC', ['u' => $uid]);
        $jobs = DB::all("SELECT j.id, j.title, co.name AS company_name FROM jobs j JOIN companies co ON co.id = j.company_id WHERE j.status = 'published' ORDER BY j.published_at DESC LIMIT 60");
        $selectedJob = (int)input('job', 0);
        $usedThisMonth = (int)DB::value('SELECT COUNT(*) FROM cover_letters WHERE user_id = :u AND created_at >= :d', ['u' => $uid, 'd' => date('Y-m-01')]);
        $unlimited = PlanService::allows($this->user(), 'ai_letter');
        return $this->app('candidate/letters', compact('letters', 'jobs', 'selectedJob', 'usedThisMonth', 'unlimited') + [
            'freeLimit' => self::FREE_LETTERS, 'provider' => AiService::providerName(), 'aiEnabled' => AiService::enabled(), 'usage' => AiService::usage(), 'title' => 'Lettres de motivation',
        ]);
    }

    public function generateLetter(): void
    {
        $uid = $this->uid();
        if (!AiService::enabled()) {
            flash('warning', 'L\'assistant IA est temporairement désactivé par l\'équipe NEAM.');
            redirect('/espace/lettres');
        }
        $used = (int)DB::value('SELECT COUNT(*) FROM cover_letters WHERE user_id = :u AND created_at >= :d', ['u' => $uid, 'd' => date('Y-m-01')]);
        if (!PlanService::allows($this->user(), 'ai_letter') && $used >= self::FREE_LETTERS) {
            flash('warning', 'Tu as utilisé tes ' . self::FREE_LETTERS . ' lettres gratuites ce mois-ci. Passe à Starter pour des lettres illimitées.');
            redirect('/abonnement');
        }
        $jobId = (int)input('job_id', 0);
        $job = $jobId ? MatchingEngine::loadJob($jobId) : null;
        $tone = in_array(input('tone'), ['professionnel', 'enthousiaste'], true) ? input('tone') : 'professionnel';
        $p = ProfileService::load($uid, true);
        $body = AiService::coverLetter($p, $job, $tone);
        $id = DB::insert('cover_letters', [
            'user_id' => $uid, 'job_id' => $job ? $jobId : null, 'title' => $job ? 'Lettre — ' . $job['title'] : 'Candidature spontanée',
            'body' => $body, 'source' => 'ia', 'created_at' => now(),
        ]);
        flash('success', 'Lettre générée. Relis-la et personnalise-la avant de l\'envoyer.');
        redirect('/espace/lettres#lettre-' . $id);
    }

    public function deleteLetter(string $id): void
    {
        DB::delete('cover_letters', 'id = :id AND user_id = :u', ['id' => (int)$id, 'u' => $this->uid()]);
        flash('info', 'Lettre supprimée.');
        redirect('/espace/lettres');
    }
}
