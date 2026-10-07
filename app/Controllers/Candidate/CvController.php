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
use App\Core\View;
use App\Services\Cv\CvPdf;
use App\Services\Cv\CvPhoto;
use App\Services\Cv\CvRenderer;
use App\Services\Cv\CvScore;
use App\Services\Cv\CvShare;
use App\Services\Cv\CvTemplates;
use App\Services\Cv\Proofreader;

final class CvController extends Controller
{
    /** Anciennes clés conservées pour compatibilité (cv_versions, API). */
    public const TEMPLATES = ['moderne' => 'Moderne', 'classique' => 'Classique', 'creatif' => 'Créatif'];
    private const FREE_LETTERS = 2;

    /** Atelier CV : modèles, palette, police, photo, sections et aperçu en direct. */
    public function index(): string
    {
        $uid = $this->uid();
        $p = ProfileService::load($uid, true);
        $s = CvTemplates::settings($p);
        $versions = DB::all('SELECT id, label, template, created_at FROM cv_versions WHERE user_id = :u ORDER BY created_at DESC', ['u' => $uid]);
        $docs = DB::all("SELECT * FROM documents WHERE user_id = :u AND kind = 'cv' ORDER BY created_at DESC", ['u' => $uid]);
        $import = Session::get('cv_import');
        $jobs = DB::all("SELECT j.id, j.title, co.name AS company_name FROM jobs j JOIN companies co ON co.id = j.company_id WHERE j.status = 'published' ORDER BY j.published_at DESC LIMIT 60");
        $proof = Proofreader::check($p);
        $pending = Proofreader::pending($proof, $s['ignored']);
        return $this->app('candidate/cv', compact('p', 's', 'versions', 'docs', 'import', 'jobs', 'pending') + [
            'title' => 'Mon CV', 'provider' => AiService::providerName(), 'usage' => AiService::usage(), 'aiEnabled' => AiService::enabled(),
            'score' => CvScore::compute($p, count($pending['blocking']), $s), 'photoUrl' => CvPhoto::src((int)($p['photo_document_id'] ?? 0)),
        ]);
    }

    public function template(): void
    {
        $t = (string)input('template');
        if (!isset(CvTemplates::TEMPLATES[$t])) {
            back();
        }
        DB::update('candidate_profiles', ['cv_template' => $t], 'user_id = :u', ['u' => $this->uid()]);
        flash('success', 'Modèle « ' . CvTemplates::TEMPLATES[$t]['name'] . ' » appliqué. Palette, police et mise en page s\'ajustent automatiquement : tu peux les personnaliser.');
        redirect('/espace/cv' . (input('from') === 'apercu' ? '/apercu' : '') . '#apercu');
    }

    /** Palette, police, densité, photo, ordre et sections affichées. */
    public function settings(): void
    {
        $uid = $this->uid();
        $p = ProfileService::load($uid, true);
        $c = [];
        if (isset(CvTemplates::PALETTES[(string)input('palette')])) {
            $c['palette'] = (string)input('palette');
        }
        if (isset(CvTemplates::FONTS[(string)input('font')])) {
            $c['font'] = (string)input('font');
        }
        if (in_array(input('density'), array_merge(['auto'], array_keys(CvTemplates::DENSITIES)), true)) {
            $c['density'] = (string)input('density');
        }
        if (in_array(input('order'), ['auto', 'experience', 'formation'], true)) {
            $c['order'] = (string)input('order');
        }
        if (in_array(input('photo_shape'), ['round', 'square'], true)) {
            $c['photo_shape'] = (string)input('photo_shape');
        }
        if (input('photo') !== null && input('photo') !== '') {
            $c['photo'] = in_array(input('photo'), ['1', 'on'], true);
        }
        if (input('max_skills') !== null && input('max_skills') !== '') {
            $c['max_skills'] = max(4, min(16, (int)input('max_skills')));
        }
        if (input('sections_form')) {
            $sections = [];
            foreach (array_keys(CvTemplates::SECTIONS) as $k) {
                $sections[$k] = !empty($_POST['sections'][$k]);
            }
            $c['sections'] = $sections;
            if ($sections['qr'] && empty($p['cv_public'])) {
                CvShare::enable($uid);
                flash('info', 'Ton CV en ligne est activé pour que le QR code fonctionne. Tu peux le désactiver à tout moment.');
            }
        }
        CvTemplates::save($uid, $p, $c);
        if (input('interests') !== null) {
            DB::update('candidate_profiles', ['interests' => mb_substr(trim((string)input('interests')), 0, 255) ?: null], 'user_id = :u', ['u' => $uid]);
        }
        if (is_ajax()) {
            json_response(['ok' => true]);
        }
        flash('success', 'Réglages du CV enregistrés.');
        redirect('/espace/cv' . (input('from') === 'apercu' ? '/apercu' : '') . '#apercu');
    }

    public function photo(): void
    {
        try {
            CvPhoto::store($this->uid(), $_FILES['photo'] ?? [], ['zoom' => input('zoom'), 'x' => input('x') !== null && input('x') !== '' ? (float)input('x') : null, 'y' => input('y') !== null && input('y') !== '' ? (float)input('y') : null]);
            $p = ProfileService::load($this->uid(), true);
            CvTemplates::save($this->uid(), $p, ['photo' => true]);
            audit('cv.photo', 'user', $this->uid());
            flash('success', 'Photo ajoutée : recadrée au carré et allégée. Les données cachées de l\'image (dont la localisation) ont été supprimées.');
        } catch (\RuntimeException $e) {
            flash('error', $e->getMessage());
        }
        redirect('/espace/cv#photo');
    }

    public function deletePhoto(): void
    {
        CvPhoto::remove($this->uid());
        flash('info', 'Photo supprimée de ton CV.');
        redirect('/espace/cv#photo');
    }

    /** Aperçu avant téléchargement : relecture obligatoire, mise en page vérifiée, PDF page par page. */
    public function preview(): string
    {
        $uid = $this->uid();
        $p = ProfileService::load($uid, true);
        $s = CvTemplates::settings($p);
        $proof = Proofreader::check($p, (bool)input('claude', '1'));
        $pending = Proofreader::pending($proof, $s['ignored']);
        $p = ProfileService::load($uid, true);
        return $this->app('candidate/cv_preview', compact('p', 's', 'proof', 'pending') + [
            'title' => 'Aperçu et téléchargement du CV', 'pdfReady' => CvPdf::available(),
            'score' => CvScore::compute($p, count($pending['blocking']), $s),
            'claudeOn' => AiService::claudeConfigured(), 'quota' => AiService::usage(),
            'shareUrl' => !empty($p['cv_public']) && !empty($p['cv_share_token']) ? CvShare::url((string)$p['cv_share_token']) : null,
        ]);
    }

    /** Actions de relecture : corriger, tout corriger, conserver volontairement, réafficher, relancer. */
    public function proof(): void
    {
        $uid = $this->uid();
        $p = ProfileService::load($uid, true);
        $s = CvTemplates::settings($p);
        $result = Proofreader::check($p);
        $action = (string)input('action');
        $ids = array_map('strval', (array)($_POST['ids'] ?? []));
        if (input('id')) {
            $ids[] = (string)input('id');
        }
        $byId = [];
        foreach ($result['issues'] as $i) {
            $byId[$i['id']] = $i;
        }
        switch ($action) {
            case 'apply':
            case 'apply_all':
                $todo = $action === 'apply_all'
                    ? array_values(array_filter($result['issues'], fn($i) => $i['type'] !== 'style' && !in_array($i['id'], $s['ignored'], true) && ($i['severity'] !== 'tip' || input('with_tips'))))
                    : array_values(array_intersect_key($byId, array_flip($ids)));
                $n = 0;
                // Plusieurs passes : une correction peut en révéler une autre (ex. espaces multiples)
                for ($pass = 0; $pass < 3 && $todo; $pass++) {
                    $n += Proofreader::apply($uid, $todo);
                    if ($action !== 'apply_all') {
                        break;
                    }
                    $fresh = Proofreader::check(ProfileService::load($uid, true));
                    $todo = array_values(array_filter($fresh['issues'], fn($i) => $i['type'] !== 'style' && $i['severity'] !== 'tip' && $i['source'] === 'NEAM' && !in_array($i['id'], $s['ignored'], true)));
                }
                ProfileService::refreshCompletion($uid);
                audit('cv.proofread_applied', 'user', $uid, ['count' => $n]);
                flash('success', $n ? "$n correction(s) appliquée(s) à ton profil et à ton CV." : 'Rien à corriger : le texte a peut-être déjà été modifié.');
                break;
            case 'ignore':
                CvTemplates::save($uid, $p, ['ignored' => array_values(array_unique(array_merge($s['ignored'], $ids)))]);
                flash('info', 'Remarque conservée telle quelle : elle ne bloquera plus le téléchargement.');
                break;
            case 'restore':
                CvTemplates::save($uid, $p, ['ignored' => []]);
                flash('info', 'Les remarques conservées sont de nouveau affichées.');
                break;
            case 'recheck':
                Proofreader::check($p, true, true);
                flash('success', 'Relecture relancée.');
                break;
        }
        // La relecture est recalculée sur le texte corrigé (sans nouvel appel à Claude)
        Proofreader::check(ProfileService::load($uid, true));
        redirect('/espace/cv/apercu#relecture');
    }

    /** PDF : aperçu (inline) ou téléchargement, autorisé quand la relecture est terminée. */
    public function pdf(): void
    {
        $uid = $this->uid();
        $p = ProfileService::load($uid, true);
        $s = CvTemplates::settings($p);
        $inline = (bool)input('inline');
        if (!$inline) {
            $pending = Proofreader::pending(Proofreader::check($p), $s['ignored']);
            if ($pending['blocking']) {
                flash('warning', count($pending['blocking']) . ' remarque(s) de relecture à traiter avant le téléchargement : corrige-les en un clic, ou conserve ton texte s\'il est volontaire.');
                redirect('/espace/cv/apercu#relecture');
            }
        }
        if (!CvPdf::available()) {
            redirect('/espace/cv/imprimer' . ($inline ? '' : '?print=1'));
        }
        $r = CvPdf::build($p, $s);
        if (!$inline) {
            DB::run('UPDATE candidate_profiles SET cv_downloads = cv_downloads + 1 WHERE user_id = :u', ['u' => $uid]);
            audit('cv.downloaded', 'user', $uid, ['template' => $s['template'], 'pages' => $r['pages']]);
        }
        CvPdf::send($r['pdf'], CvPdf::filename($p), !$inline);
    }

    /** CV en ligne : activer, désactiver, nouveau lien. */
    public function share(): void
    {
        $uid = $this->uid();
        match ((string)input('action')) {
            'disable' => CvShare::disable($uid),
            'regenerate' => CvShare::regenerate($uid),
            default => CvShare::enable($uid),
        };
        flash('success', match ((string)input('action')) {
            'disable' => 'CV en ligne désactivé : le lien et le QR code ne fonctionnent plus.',
            'regenerate' => 'Nouveau lien créé. L\'ancien lien (et les QR codes déjà imprimés) ne fonctionnent plus.',
            default => 'Ton CV en ligne est activé. Partage le lien ou ajoute le QR code sur ton CV imprimé.',
        });
        redirect((input('from') === 'apercu' ? '/espace/cv/apercu' : '/espace/cv') . '#partage');
    }

    public function snapshot(): void
    {
        $p = ProfileService::load($this->uid(), true);
        $label = mb_substr(trim((string)input('label', '')) ?: 'Version du ' . date_fr(now()), 0, 120);
        DB::insert('cv_versions', ['user_id' => $this->uid(), 'label' => $label, 'template' => $p['cv_template'], 'snapshot' => json_encode($p, JSON_UNESCAPED_UNICODE), 'created_at' => now()]);
        flash('success', 'Version « ' . $label . ' » enregistrée dans ton historique.');
        redirect('/espace/cv');
    }

    /** Version imprimable (repli si la génération PDF n'est pas disponible sur le serveur). */
    public function print(): string
    {
        $p = ProfileService::load($this->uid(), true);
        $s = CvTemplates::settings($p, isset(CvTemplates::TEMPLATES[(string)input('t')]) ? (string)input('t') : null);
        return View::render('candidate/cv_print', ['html' => CvRenderer::render($p, $s), 'title' => 'CV — ' . $p['first_name'] . ' ' . $p['last_name'], 'autoPrint' => (bool)input('print')], 'bare');
    }

    public function version(string $id): string
    {
        $v = DB::one('SELECT * FROM cv_versions WHERE id = :id AND user_id = :u', ['id' => (int)$id, 'u' => $this->uid()]);
        if (!$v) {
            abort(404);
        }
        $p = json_decode($v['snapshot'], true);
        $s = CvTemplates::settings($p, $v['template'] ?: 'moderne');
        return View::render('candidate/cv_print', ['html' => CvRenderer::render($p, $s), 'title' => $v['label'], 'versionLabel' => $v['label']], 'bare');
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
                DB::insert('candidate_skills', ['user_id' => $this->uid(), 'skill_id' => $s['id'], 'level' => 3, 'proof' => 'aucune', 'source' => 'cv', 'confidence' => 100, 'confirmed' => 1, 'updated_at' => now()]);
                $added++;
            }
        }
        if (input('use_linkedin') && $import['linkedin']) {
            DB::update('candidate_profiles', ['linkedin' => $import['linkedin']], 'user_id = :u', ['u' => $this->uid()]);
        }
        ProfileService::refreshCompletion($this->uid());
        flash('success', "$added compétence(s) ajoutée(s) à ton profil. Tes scores de compatibilité viennent d'être recalculés.");
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
        flash('success', 'Ta lettre est prête. Relis-la et ajoute une touche personnelle, par exemple un détail sur l\'entreprise : c\'est ce qui la rendra unique.');
        redirect('/espace/lettres#lettre-' . $id);
    }

    public function deleteLetter(string $id): void
    {
        DB::delete('cover_letters', 'id = :id AND user_id = :u', ['id' => (int)$id, 'u' => $this->uid()]);
        flash('info', 'Lettre supprimée.');
        redirect('/espace/lettres');
    }
}
