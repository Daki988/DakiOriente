<?php
declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Controllers\Controller;
use App\Core\Auth;
use App\Core\DB;
use App\Services\MatchingEngine;
use App\Services\ProfileService;
use App\Services\Referential\Curation;
use App\Services\Referential\Loader;
use App\Services\Referential\Normalizer;
use App\Services\Referential\Quality;
use App\Services\Referential\Ref;
use App\Services\Referential\Versions;
use App\Services\Training\LinkChecker;
use App\Services\Training\TrainingCatalog;

/**
 * Back-office des référentiels v1.1 (§11) : curation des fiches, cycle de vie
 * (brouillon → relu par un expert → validé par le responsable → publié dans une version → révision ou archivage),
 * règles du score, versions et jeu de référence, file de curation, tableau de bord qualité et calibrage.
 */
final class ReferentialController extends Controller
{
    public const ROLES = ['responsable' => 'Responsable des référentiels', 'expert' => 'Expert sectoriel', 'curateur' => 'Curateur'];

    /* ------------------------------------------------------------------ Rôles */

    private function role(): ?string
    {
        return Auth::user()['ref_role'] ?? null;
    }

    /** Tant qu'aucun responsable n'est désigné, tout administrateur peut valider (démarrage). */
    private function canValidate(): bool
    {
        $hasLead = (bool)DB::value("SELECT COUNT(*) FROM users WHERE role = 'admin' AND ref_role = 'responsable'");
        return !$hasLead || $this->role() === 'responsable';
    }

    private function canReview(): bool
    {
        return $this->canValidate() || in_array($this->role(), ['expert', 'responsable'], true);
    }

    private function deny(string $what): never
    {
        flash('error', "Action réservée : $what.");
        back();
    }

    private function page(string $view, array $data): string
    {
        return $this->app('admin/ref/' . $view, $data + ['canValidate' => $this->canValidate(), 'canReview' => $this->canReview(), 'myRole' => $this->role()]);
    }

    /* ------------------------------------------------------------------ Vue d'ensemble */

    public function index(): string
    {
        $count = fn(string $table) => array_column(DB::all("SELECT status, COUNT(*) AS n FROM $table GROUP BY status"), 'n', 'status');
        $stats = [
            'metiers' => $count('occupations'), 'competences' => $count('skills'), 'diplomes' => $count('degrees'),
            'formations' => ['total' => (int)DB::value('SELECT COUNT(*) FROM trainings WHERE active = 1 AND platform_id IS NOT NULL'),
                'fresh' => (int)DB::value('SELECT COUNT(*) FROM trainings WHERE active = 1 AND platform_id IS NOT NULL AND verified_at >= :f', ['f' => TrainingCatalog::freshSince()]),
                'linked' => (int)DB::value('SELECT COUNT(DISTINCT training_id) FROM training_skills')],
        ];
        $version = Versions::current();
        $pending = (int)DB::value('SELECT COUNT(*) FROM ref_changes WHERE version_id IS NULL');
        $openCuration = Curation::openCount();
        $pairs = (int)DB::value('SELECT COUNT(*) FROM golden_pairs');
        $team = DB::all("SELECT id, first_name, last_name, email, ref_role FROM users WHERE role = 'admin' ORDER BY first_name");
        return $this->page('index', compact('stats', 'version', 'pending', 'openCuration', 'pairs', 'team') + ['title' => 'Référentiels']);
    }

    public function team(): void
    {
        if (!$this->canValidate()) {
            $this->deny('responsable des référentiels');
        }
        foreach ((array)input('roles', []) as $uid => $role) {
            $role = isset(self::ROLES[$role]) ? $role : null;
            DB::run("UPDATE users SET ref_role = :r WHERE id = :id AND role = 'admin'", ['r' => $role, 'id' => (int)$uid]);
        }
        audit('referentials.team');
        flash('success', 'Équipe de curation mise à jour.');
        redirect('/admin/referentiels#equipe');
    }

    /* ------------------------------------------------------------------ Métiers */

    public function occupations(): string
    {
        $q = trim((string)input('q', ''));
        $status = (string)input('statut', '');
        $sector = (int)input('secteur', 0);
        $where = ['1 = 1'];
        $params = [];
        if ($q !== '') {
            $where[] = '(o.title LIKE :q OR o.code LIKE :q2 OR o.rome_code LIKE :q3 OR o.id IN (SELECT occupation_id FROM occupation_labels WHERE label LIKE :q4))';
            $params += ['q' => "%$q%", 'q2' => "%$q%", 'q3' => "%$q%", 'q4' => "%$q%"];
        }
        if (isset(Ref::STATUSES[$status])) {
            $where[] = 'o.status = :st';
            $params['st'] = $status;
        }
        if ($sector) {
            $where[] = 'o.sector_id = :sec';
            $params['sec'] = $sector;
        }
        $rows = DB::all('SELECT o.*, s.name AS sector, (SELECT COUNT(*) FROM occupation_skills os WHERE os.occupation_id = o.id) AS nskills,
            (SELECT COUNT(*) FROM occupation_labels l WHERE l.occupation_id = o.id) AS nlabels,
            (SELECT COUNT(*) FROM jobs j WHERE j.occupation_id = o.id) AS njobs
            FROM occupations o LEFT JOIN sectors s ON s.id = o.sector_id WHERE ' . implode(' AND ', $where) . ' ORDER BY o.code', $params);
        $sectors = DB::all('SELECT id, name FROM sectors ORDER BY name');
        $prefixes = array_unique(array_map(fn($c) => substr($c, 4, 3), DB::column('SELECT code FROM occupations')));
        sort($prefixes);
        $romeDomains = Loader::romeData()['domains'];
        return $this->page('occupations', compact('rows', 'q', 'status', 'sector', 'sectors', 'prefixes', 'romeDomains') + ['title' => 'Référentiel Métiers & Emplois']);
    }

    /** Nouvelle fiche à partir d'une fiche ROME 4.0 (intitulé et appellations repris). */
    public function createOccupation(): void
    {
        $rome = strtoupper(trim((string)input('rome')));
        $prefix = strtoupper(preg_replace('/[^A-Z]/i', '', (string)input('prefix'))) ?: 'GEN';
        $fiche = Loader::romeData()['fiches'][$rome] ?? null;
        if (!$fiche) {
            flash('error', "Code ROME inconnu : « $rome ». Exemple attendu : N1103.");
            back();
        }
        $last = max(array_map(fn($c) => (int)substr($c, 8), DB::column('SELECT code FROM occupations WHERE code LIKE :p', ['p' => 'TRM-' . substr($prefix, 0, 3) . '-%'])) ?: [0]);
        $code = sprintf('TRM-%s-%03d', substr($prefix, 0, 3), $last + 1);
        $id = DB::insert('occupations', ['code' => $code, 'rome_code' => $rome, 'title' => $fiche[0], 'family' => Loader::romeData()['domains'][substr($rome, 0, 3)] ?? null,
            'sector_id' => (int)input('sector_id') ?: null, 'education_min' => 3, 'status' => 'brouillon', 'revision' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $seen = [];
        foreach (array_merge([$fiche[0]], $fiche[1]) as $label) {
            foreach (Normalizer::variants($label) as $v) {
                $n = normalize($v);
                if ($n !== '' && !isset($seen[$n])) {
                    $seen[$n] = true;
                    DB::insert('occupation_labels', ['occupation_id' => $id, 'label' => mb_substr($v, 0, 190), 'norm' => mb_substr($n, 0, 190), 'source' => 'rome']);
                }
            }
        }
        Curation::log('metier', $id, 'creation', "$code créée depuis la fiche ROME $rome ({$fiche[0]})", $this->uid());
        Normalizer::reset();
        flash('success', "Fiche $code créée en brouillon : ajoute les compétences requises, puis fais-la relire.");
        redirect('/admin/referentiels/metiers/' . $id);
    }

    public function occupation(string $id): string
    {
        $o = DB::one('SELECT o.*, s.name AS sector FROM occupations o LEFT JOIN sectors s ON s.id = o.sector_id WHERE o.id = :id', ['id' => (int)$id]);
        if (!$o) {
            abort(404);
        }
        $skills = DB::all('SELECT os.*, s.name, s.category FROM occupation_skills os JOIN skills s ON s.id = os.skill_id WHERE os.occupation_id = :o ORDER BY os.blocking, os.weight DESC', ['o' => $o['id']]);
        $labels = DB::all('SELECT * FROM occupation_labels WHERE occupation_id = :o ORDER BY source DESC, label', ['o' => $o['id']]);
        $allSkills = DB::all("SELECT id, name, category, credential FROM skills WHERE category != 'linguistique' AND status != 'archive' ORDER BY name");
        $sectors = DB::all('SELECT id, name FROM sectors ORDER BY name');
        $jobs = DB::all("SELECT j.id, j.title, co.name AS company, j.occupation_confirmed FROM jobs j JOIN companies co ON co.id = j.company_id WHERE j.occupation_id = :o ORDER BY j.created_at DESC LIMIT 20", ['o' => $o['id']]);
        $history = DB::all("SELECT c.*, u.first_name FROM ref_changes c LEFT JOIN users u ON u.id = c.user_id WHERE c.entity = 'metier' AND c.entity_id = :o ORDER BY c.id DESC LIMIT 20", ['o' => $o['id']]);
        $fields = Ref::data()['fields'];
        return $this->page('occupation', compact('o', 'skills', 'labels', 'allSkills', 'sectors', 'jobs', 'history', 'fields') + ['title' => $o['code'] . ' — ' . $o['title']]);
    }

    public function saveOccupation(string $id): void
    {
        $o = DB::one('SELECT * FROM occupations WHERE id = :id', ['id' => (int)$id]);
        if (!$o) {
            abort(404);
        }
        $langs = [];
        foreach ((array)input('lang_name', []) as $i => $n) {
            $n = trim((string)$n);
            $l = (string)(input('lang_level', [])[$i] ?? 'B1');
            if ($n !== '' && isset(language_levels()[$l])) {
                $langs[$n] = $l;
            }
        }
        $fields = array_values(array_intersect((array)input('fields', []), array_keys(Ref::data()['fields'])));
        $related = array_values(array_filter(array_map('trim', explode(',', strtoupper((string)input('related', ''))))));
        $data = [
            'title' => mb_substr(trim((string)input('title', $o['title'])), 0, 190), 'sector_id' => (int)input('sector_id') ?: null,
            'education_min' => max(0, min(6, (int)input('education_min', $o['education_min']))), 'fields' => implode(',', $fields),
            'languages' => $langs ? json_encode($langs, JSON_UNESCAPED_UNICODE) : null, 'regulated_degree' => trim((string)input('regulated_degree')) ?: null,
            'related' => implode(',', $related), 'description' => trim((string)input('description')) ?: null,
            'isco_code' => preg_match('/^\d{4}$/', (string)input('isco_code')) ? (string)input('isco_code') : $o['isco_code'],
            'esco_uri' => trim((string)input('esco_uri')) ?: null, 'esco_label' => trim((string)input('esco_label')) ?: null,
            'revision' => (int)$o['revision'] + 1, 'updated_at' => now(),
        ];
        if ($data['isco_code'] !== $o['isco_code']) {
            $data['isco_source'] = 'curation';
        }
        // Une fiche validée qui change repart en relecture (révision)
        if ($o['status'] === 'valide') {
            $data['status'] = 'relu';
        }
        DB::update('occupations', $data, 'id = :id', ['id' => $o['id']]);
        DB::delete('occupation_skills', 'occupation_id = :o', ['o' => $o['id']]);
        $seen = [];
        foreach ((array)input('skill_id', []) as $i => $sid) {
            $sid = (int)$sid;
            if (!$sid || isset($seen[$sid])) {
                continue;
            }
            $seen[$sid] = true;
            $blocking = !empty(input('skill_blocking', [])[$i]) ? 1 : 0;
            DB::insert('occupation_skills', ['occupation_id' => $o['id'], 'skill_id' => $sid, 'level' => max(1, min(4, (int)(input('skill_level', [])[$i] ?? 2))),
                'weight' => $blocking ? 0 : max(1, min(100, (int)(input('skill_weight', [])[$i] ?? 10))), 'blocking' => $blocking]);
        }
        foreach ((array)input('remove_label', []) as $lid) {
            DB::delete('occupation_labels', 'id = :id AND occupation_id = :o', ['id' => (int)$lid, 'o' => $o['id']]);
        }
        foreach (array_filter(array_map('trim', preg_split('/\R/', (string)input('new_labels', '')) ?: [])) as $label) {
            $n = normalize($label);
            if ($n !== '' && !DB::value('SELECT 1 FROM occupation_labels WHERE occupation_id = :o AND norm = :n', ['o' => $o['id'], 'n' => $n])) {
                DB::insert('occupation_labels', ['occupation_id' => $o['id'], 'label' => mb_substr($label, 0, 190), 'norm' => mb_substr($n, 0, 190), 'source' => 'local']);
            }
        }
        $total = (int)DB::value('SELECT COALESCE(SUM(weight), 0) FROM occupation_skills WHERE occupation_id = :o', ['o' => $o['id']]);
        Curation::log('metier', (int)$o['id'], 'revision', $o['code'] . ' révisée (révision ' . $data['revision'] . ')', $this->uid());
        Normalizer::reset();
        flash($total === 100 || $total === 0 ? 'success' : 'warning', 'Fiche enregistrée' . ($o['status'] === 'valide' ? ' : elle repasse en relecture avant une nouvelle validation' : '') . '.'
            . ($total && $total !== 100 ? " Les poids des compétences totalisent $total : ils seront ramenés à 100 dans le calcul." : ''));
        redirect('/admin/referentiels/metiers/' . $o['id']);
    }

    public function occupationStatus(string $id): void
    {
        $o = DB::one('SELECT * FROM occupations WHERE id = :id', ['id' => (int)$id]);
        $to = (string)input('status');
        if (!$o || !isset(Ref::STATUSES[$to])) {
            abort(404);
        }
        if ($to === 'relu' && !$this->canReview()) {
            $this->deny('experts sectoriels et responsable des référentiels');
        }
        if (in_array($to, ['valide', 'archive'], true) && !$this->canValidate()) {
            $this->deny('responsable des référentiels');
        }
        if ($to === 'valide' && !(int)DB::value('SELECT COUNT(*) FROM occupation_skills WHERE occupation_id = :o AND blocking = 0', ['o' => $o['id']])) {
            flash('error', 'Une fiche sans compétence requise ne peut pas être validée.');
            back();
        }
        $data = ['status' => $to, 'updated_at' => now()];
        if ($to === 'relu') {
            $data += ['reviewed_by' => $this->uid(), 'reviewed_at' => now()];
        } elseif ($to === 'valide') {
            $data += ['validated_by' => $this->uid(), 'validated_at' => now()];
        }
        DB::update('occupations', $data, 'id = :id', ['id' => $o['id']]);
        Curation::log('metier', (int)$o['id'], 'statut', $o['code'] . ' : ' . Ref::STATUSES[$o['status']][0] . ' → ' . Ref::STATUSES[$to][0], $this->uid());
        flash('success', 'Statut : ' . Ref::STATUSES[$to][0] . '. Le changement prendra effet pour les candidats à la prochaine version publiée.');
        back();
    }

    /* ------------------------------------------------------------------ Compétences et diplômes */

    public function skills(): string
    {
        $q = trim((string)input('q', ''));
        $cat = (string)input('categorie', '');
        $where = ['1 = 1'];
        $params = [];
        if ($q !== '') {
            $where[] = '(name LIKE :q OR aliases LIKE :q2 OR code LIKE :q3)';
            $params += ['q' => "%$q%", 'q2' => "%$q%", 'q3' => "%$q%"];
        }
        if (isset(Ref::CATEGORIES[$cat])) {
            $where[] = 'category = :c';
            $params['c'] = $cat;
        }
        $rows = DB::all('SELECT s.*, (SELECT COUNT(*) FROM occupation_skills os WHERE os.skill_id = s.id) AS nocc,
            (SELECT COUNT(*) FROM training_skills ts WHERE ts.skill_id = s.id) AS ntrain,
            (SELECT COUNT(*) FROM candidate_skills cs WHERE cs.skill_id = s.id) AS ncand
            FROM skills s WHERE ' . implode(' AND ', $where) . ' ORDER BY category, name', $params);
        return $this->page('skills', compact('rows', 'q', 'cat') + ['title' => 'Référentiel Compétences']);
    }

    public function saveSkill(): void
    {
        $id = (int)input('id', 0);
        $name = trim((string)input('name'));
        if ($name === '') {
            flash('error', 'Le nom est obligatoire.');
            back();
        }
        $crit = [];
        foreach ([1, 2, 3, 4] as $l) {
            $t = trim((string)(input('criteria', [])[$l] ?? ''));
            if ($t !== '') {
                $crit[$l] = $t;
            }
        }
        $status = (string)input('status', 'brouillon');
        if ($status === 'valide' && !$this->canValidate() || $status === 'relu' && !$this->canReview()) {
            $this->deny('validation par le responsable, relecture par un expert');
        }
        $data = [
            'name' => mb_substr($name, 0, 120), 'category' => isset(Ref::CATEGORIES[(string)input('category')]) ? (string)input('category') : 'technique',
            'definition' => mb_substr(trim((string)input('definition')), 0, 255) ?: null, 'aliases' => mb_substr(trim((string)input('aliases')), 0, 1000),
            'esco_uri' => trim((string)input('esco_uri')) ?: null, 'framework' => trim((string)input('framework')) ?: null,
            'credential' => input('credential') ? 1 : 0, 'level_criteria' => $crit ? json_encode($crit, JSON_UNESCAPED_UNICODE) : null,
            'status' => isset(Ref::STATUSES[$status]) ? $status : 'brouillon', 'updated_at' => now(),
        ];
        if ($id) {
            DB::run('UPDATE skills SET revision = revision + 1 WHERE id = :id', ['id' => $id]);
            DB::update('skills', $data, 'id = :id', ['id' => $id]);
        } else {
            $n = (int)DB::value("SELECT COUNT(*) FROM skills") + 1;
            $id = DB::insert('skills', $data + ['slug' => slugify($name) . (DB::value('SELECT 1 FROM skills WHERE slug = :s', ['s' => slugify($name)]) ? '-' . $n : ''), 'code' => 'CMP-NEW-' . $n, 'revision' => 1]);
        }
        Curation::log('competence', $id, 'revision', 'Compétence « ' . $data['name'] . ' » : ' . Ref::STATUSES[$data['status']][0], $this->uid());
        Normalizer::reset();
        flash('success', 'Compétence enregistrée.');
        redirect('/admin/referentiels/competences?q=' . urlencode($data['name']));
    }

    public function degrees(): string
    {
        $rows = DB::all('SELECT * FROM degrees ORDER BY level, title');
        $toVerify = DB::all('SELECT e.id, e.degree, e.field, e.school, u.first_name, u.last_name FROM candidate_educations e JOIN users u ON u.id = e.user_id WHERE e.to_verify = 1 ORDER BY e.id DESC LIMIT 30');
        return $this->page('degrees', compact('rows', 'toVerify') + ['title' => 'Référentiel Diplômes & Équivalences']);
    }

    public function saveDegree(): void
    {
        $id = (int)input('id', 0);
        if (input('education_id')) {
            // Rattachement d'un diplôme déclaré par un candidat
            $e = DB::one('SELECT * FROM candidate_educations WHERE id = :id', ['id' => (int)input('education_id')]);
            $d = DB::one('SELECT * FROM degrees WHERE id = :id', ['id' => (int)input('degree_id')]);
            if ($e && $d) {
                DB::update('candidate_educations', ['degree_id' => $d['id'], 'level' => $d['level'], 'to_verify' => 0], 'id = :id', ['id' => $e['id']]);
                if (!(int)$e['in_progress']) {
                    DB::run('UPDATE candidate_profiles SET education_level = :l WHERE user_id = :u AND education_level < :l2', ['l' => $d['level'], 'l2' => $d['level'], 'u' => $e['user_id']]);
                }
                ProfileService::refreshCompletion((int)$e['user_id']);
                flash('success', '« ' . $e['degree'] . ' » rattaché à ' . $d['title'] . ' (' . Ref::degreeLabel((int)$d['level']) . ').');
            }
            redirect('/admin/referentiels/diplomes');
        }
        $data = ['title' => mb_substr(trim((string)input('title')), 0, 190), 'level' => max(0, min(6, (int)input('level'))), 'country' => trim((string)input('country')) ?: null,
            'recognition' => trim((string)input('recognition')) ?: null, 'synonyms' => mb_substr(normalize(str_replace(',', ' , ', (string)input('synonyms'))), 0, 255),
            'to_verify' => input('to_verify') ? 1 : 0, 'status' => isset(Ref::STATUSES[(string)input('status')]) ? (string)input('status') : 'brouillon', 'updated_at' => now()];
        $data['synonyms'] = implode(',', array_filter(array_map('trim', explode(',', $data['synonyms']))));
        if ($data['title'] === '') {
            back();
        }
        $id ? DB::update('degrees', $data, 'id = :id', ['id' => $id]) : $id = DB::insert('degrees', $data);
        Curation::log('diplome', $id, 'revision', 'Diplôme « ' . $data['title'] . ' » (' . Ref::degreeLabel($data['level'], true) . ')', $this->uid());
        flash('success', 'Diplôme enregistré.');
        redirect('/admin/referentiels/diplomes');
    }

    /* ------------------------------------------------------------------ Formations (référentiel) */

    public function saveTraining(string $id): void
    {
        $t = DB::one('SELECT * FROM trainings WHERE id = :id', ['id' => (int)$id]);
        if (!$t) {
            abort(404);
        }
        $data = ['quality' => input('quality') !== '' && input('quality') !== null ? max(1, min(5, (int)input('quality'))) : null, 'partner' => input('partner') ? 1 : 0,
            'recognition' => in_array(input('recognition'), ['diplomante', 'certifiante', 'attestation', 'aucune'], true) ? input('recognition') : $t['recognition'],
            'prerequisites' => mb_substr(trim((string)input('prerequisites')), 0, 255) ?: null, 'price' => max(0, (int)input('price', $t['price']))];
        if (input('verified')) {
            $data += ['verified_at' => now(), 'link_status' => 'ok'];
        }
        DB::update('trainings', $data, 'id = :id', ['id' => $t['id']]);
        DB::delete('training_skills', 'training_id = :t', ['t' => $t['id']]);
        foreach ((array)input('skill_id', []) as $i => $sid) {
            if ((int)$sid) {
                DB::insert('training_skills', ['training_id' => $t['id'], 'skill_id' => (int)$sid, 'level_reached' => max(1, min(4, (int)(input('level_reached', [])[$i] ?? 2)))]);
            }
        }
        Curation::log('formation', (int)$t['id'], 'revision', 'Formation « ' . mb_substr($t['title'], 0, 120) . ' » mise à jour', $this->uid());
        flash('success', 'Fiche formation enregistrée.');
        redirect('/admin/formations?q=' . urlencode($t['title']) . '#t' . $t['id']);
    }

    public function checkLinks(): void
    {
        $r = LinkChecker::run(25);
        flash($r['dead'] ? 'warning' : 'success', sprintf('%d liens vérifiés : %d joignables, %d morts (masqués et envoyés en curation), %d erreurs réseau.', $r['checked'], $r['ok'], $r['dead'], $r['error']));
        back();
    }

    /* ------------------------------------------------------------------ Objectifs & seuils */

    public function rules(): string
    {
        $draft = Ref::draftRules();
        $live = Ref::rules();
        $candidates = DB::all("SELECT u.id, u.first_name, u.last_name FROM users u WHERE u.role = 'candidate' ORDER BY u.first_name LIMIT 300");
        $jobs = DB::all("SELECT id, title FROM jobs WHERE status = 'published' ORDER BY published_at DESC LIMIT 300");
        $sim = null;
        $simDraft = null;
        if (input('candidate') && input('job')) {
            $p = ProfileService::load((int)input('candidate'));
            $j = MatchingEngine::loadJob((int)input('job'));
            if ($p && $j) {
                $sim = MatchingEngine::compute($p, $j);
                $simDraft = Ref::withSnapshot(Ref::build(Ref::version() + 1, $draft), fn() => MatchingEngine::compute($p, $j, false));
            }
        }
        $history = DB::all('SELECT r.*, v.number FROM score_rules r LEFT JOIN ref_versions v ON v.id = r.version_id ORDER BY r.id DESC LIMIT 10');
        return $this->page('rules', compact('draft', 'live', 'candidates', 'jobs', 'sim', 'simDraft', 'history') + ['title' => 'Objectifs & seuils']);
    }

    public function saveRules(): void
    {
        if (!$this->canValidate()) {
            $this->deny('responsable des référentiels');
        }
        $r = Ref::draftRules();
        foreach (array_keys(Ref::DEFAULT_RULES['weights']) as $k) {
            $r['weights'][$k] = max(0, min(100, (int)(input('weights', [])[$k] ?? $r['weights'][$k])));
        }
        if (array_sum($r['weights']) !== 100) {
            flash('error', 'Les poids doivent totaliser 100 (actuellement ' . array_sum($r['weights']) . ').');
            back();
        }
        $mins = (array)input('thresholds', []);
        foreach ($r['thresholds'] as &$t) {
            if ($t['key'] !== 'eloigne' && isset($mins[$t['key']])) {
                $t['min'] = max(1, min(99, (int)$mins[$t['key']]));
            }
        }
        unset($t);
        if (!($r['thresholds'][0]['min'] > $r['thresholds'][1]['min'] && $r['thresholds'][1]['min'] > $r['thresholds'][2]['min'])) {
            flash('error', 'Les seuils doivent être décroissants : adapté > proche > à renforcer.');
            back();
        }
        $r['level_penalty'] = max(0.05, min(1.0, (float)str_replace(',', '.', (string)input('level_penalty', $r['level_penalty']))));
        $r['unproven_cap'] = max(1, min(4, (int)input('unproven_cap', $r['unproven_cap'])));
        $r['employability']['ready'] = max(1, min(100, (int)input('ready', $r['employability']['ready'])));
        $r['employability']['offers'] = max(3, min(30, (int)input('offers', $r['employability']['offers'])));
        $r['golden']['max_mae'] = max(1, min(30, (int)input('max_mae', $r['golden']['max_mae'])));
        $r['golden']['min_pairs'] = max(1, min(500, (int)input('min_pairs', $r['golden']['min_pairs'])));
        $r['normalization']['auto'] = max(50, min(100, (int)input('auto', $r['normalization']['auto'])));
        $r['normalization']['confirm'] = max(30, min($r['normalization']['auto'], (int)input('confirm', $r['normalization']['confirm'])));
        $r['trainings']['per_gap'] = max(1, min(5, (int)input('per_gap', $r['trainings']['per_gap'])));
        DB::delete('score_rules', 'version_id IS NULL');
        DB::insert('score_rules', ['version_id' => null, 'rules' => json_encode($r, JSON_UNESCAPED_UNICODE), 'note' => mb_substr(trim((string)input('note')), 0, 255) ?: 'Brouillon', 'created_by' => $this->uid(), 'created_at' => now()]);
        Curation::log('regles', null, 'revision', 'Règles du score modifiées' . (input('note') ? ' : ' . mb_substr(trim((string)input('note')), 0, 180) : ''), $this->uid());
        flash('success', 'Règles enregistrées en brouillon : elles s\'appliqueront à la prochaine version, après passage du jeu de référence.');
        redirect('/admin/referentiels/regles');
    }

    /* ------------------------------------------------------------------ Versions et jeu de référence */

    public function versions(): string
    {
        $versions = DB::all('SELECT v.*, u.first_name FROM ref_versions v LEFT JOIN users u ON u.id = v.published_by ORDER BY v.number DESC');
        $changes = DB::all('SELECT c.*, u.first_name FROM ref_changes c LEFT JOIN users u ON u.id = c.user_id WHERE c.version_id IS NULL ORDER BY c.id DESC LIMIT 100');
        $live = Versions::evaluate();
        $draft = Versions::evaluate(Ref::build(Ref::version() + 1, Ref::draftRules()));
        $byId = array_column($draft['rows'], null, 'id');
        $candidates = DB::all("SELECT u.id, u.first_name, u.last_name FROM users u WHERE u.role = 'candidate' ORDER BY u.first_name LIMIT 300");
        $jobs = DB::all("SELECT j.id, j.title, co.name AS company FROM jobs j JOIN companies co ON co.id = j.company_id WHERE j.status = 'published' ORDER BY j.published_at DESC LIMIT 300");
        $limits = Ref::draftRules()['golden'];
        return $this->page('versions', compact('versions', 'changes', 'live', 'draft', 'byId', 'candidates', 'jobs', 'limits') + ['title' => 'Versions et jeu de référence']);
    }

    public function publish(): void
    {
        if (!$this->canValidate()) {
            $this->deny('responsable des référentiels');
        }
        $r = Versions::publish($this->uid(), trim((string)input('label', '')), (bool)input('force'));
        audit('referentials.publish', 'ref_version', $r['number'] ?? null, ['mae' => $r['mae'] ?? null, 'pairs' => $r['pairs'] ?? 0]);
        flash($r['ok'] ? 'success' : 'error', $r['message']);
        redirect('/admin/referentiels/versions');
    }

    public function addPair(): void
    {
        $score = (int)input('expert_score', -1);
        if ($score < 0 || $score > 100) {
            flash('error', 'Indique la note de l\'expert entre 0 et 100.');
            back();
        }
        $id = Versions::addPair((int)input('candidate'), (int)input('job'), $score, $this->uid(), (string)input('note', ''));
        flash($id ? 'success' : 'error', $id ? 'Couple ajouté au jeu de référence (profil et offre figés à la date de notation).' : 'Candidat ou offre introuvable.');
        redirect('/admin/referentiels/versions#jeu');
    }

    public function deletePair(string $id): void
    {
        DB::delete('golden_pairs', 'id = :id', ['id' => (int)$id]);
        flash('info', 'Couple retiré du jeu de référence.');
        redirect('/admin/referentiels/versions#jeu');
    }

    /* ------------------------------------------------------------------ File de curation */

    public function curation(): string
    {
        $kind = (string)input('type', '');
        $status = (string)input('statut', 'ouvert');
        $where = ['status = :s'];
        $params = ['s' => in_array($status, ['ouvert', 'traite', 'rejete'], true) ? $status : 'ouvert'];
        if (isset(Curation::KINDS[$kind])) {
            $where[] = 'kind = :k';
            $params['k'] = $kind;
        }
        $items = DB::all('SELECT * FROM curation_queue WHERE ' . implode(' AND ', $where) . ' ORDER BY hits DESC, updated_at DESC LIMIT 100', $params);
        $counts = array_column(DB::all("SELECT kind, COUNT(*) AS n FROM curation_queue WHERE status = 'ouvert' GROUP BY kind"), 'n', 'kind');
        $occupations = DB::all("SELECT id, code, title FROM occupations WHERE status != 'archive' ORDER BY code");
        $skills = DB::all("SELECT id, name FROM skills WHERE status != 'archive' ORDER BY name");
        $degrees = DB::all('SELECT id, title, level FROM degrees ORDER BY level, title');
        return $this->page('curation', compact('items', 'counts', 'kind', 'status', 'occupations', 'skills', 'degrees') + ['title' => 'File de curation']);
    }

    public function handleCuration(string $id): void
    {
        $it = DB::one('SELECT * FROM curation_queue WHERE id = :id', ['id' => (int)$id]);
        if (!$it) {
            abort(404);
        }
        $action = (string)input('action');
        $note = trim((string)input('note', ''));
        $uid = $this->uid();
        switch ($action) {
            case 'attach_occupation':
                $o = DB::one('SELECT id, code, title FROM occupations WHERE id = :id', ['id' => (int)input('occupation_id')]);
                if (!$o) {
                    back();
                }
                $label = Normalizer::clean($it['label']);
                $n = normalize($label);
                if ($n !== '' && !DB::value('SELECT 1 FROM occupation_labels WHERE occupation_id = :o AND norm = :n', ['o' => $o['id'], 'n' => $n])) {
                    DB::insert('occupation_labels', ['occupation_id' => $o['id'], 'label' => mb_substr($label, 0, 190), 'norm' => mb_substr($n, 0, 190), 'source' => 'curation']);
                }
                if ($it['source'] === 'offre' && $it['ref_id']) {
                    DB::run('UPDATE jobs SET occupation_id = :o, occupation_confidence = 100 WHERE id = :j AND (occupation_id IS NULL OR occupation_id != :o2)', ['o' => $o['id'], 'o2' => $o['id'], 'j' => $it['ref_id']]);
                    MatchingEngine::forget((int)$it['ref_id']);
                }
                Curation::log('metier', (int)$o['id'], 'appellation', '« ' . $label . ' » ajoutée aux appellations de ' . $o['code'], $uid);
                Curation::close((int)$it['id'], 'traite', 'Rattachée à ' . $o['code'] . ($note ? ' — ' . $note : ''), $uid);
                Normalizer::reset();
                break;
            case 'attach_skill':
                $s = DB::one('SELECT id, name, aliases FROM skills WHERE id = :id', ['id' => (int)input('skill_id')]);
                if (!$s) {
                    back();
                }
                $alias = mb_strtolower(trim($it['label']));
                DB::update('skills', ['aliases' => trim($s['aliases'] . ',' . $alias, ','), 'updated_at' => now()], 'id = :id', ['id' => $s['id']]);
                Curation::log('competence', (int)$s['id'], 'synonyme', '« ' . $alias . ' » ajouté comme synonyme de ' . $s['name'], $uid);
                Curation::close((int)$it['id'], 'traite', 'Synonyme de « ' . $s['name'] . ' »', $uid);
                Normalizer::reset();
                break;
            case 'create_skill':
                $cat = isset(Ref::CATEGORIES[(string)input('category')]) ? (string)input('category') : 'technique';
                $name = mb_substr(trim((string)input('name', $it['label'])), 0, 120);
                $n = (int)DB::value('SELECT COUNT(*) FROM skills') + 1;
                $sid = DB::insert('skills', ['name' => $name, 'slug' => slugify($name) . '-' . $n, 'category' => $cat, 'aliases' => '', 'code' => 'CMP-NEW-' . $n, 'status' => 'brouillon', 'revision' => 1, 'updated_at' => now()]);
                Curation::log('competence', $sid, 'creation', 'Compétence « ' . $name . ' » créée depuis la file de curation', $uid);
                Curation::close((int)$it['id'], 'traite', 'Compétence créée (brouillon)', $uid);
                Normalizer::reset();
                break;
            case 'attach_degree':
                $d = DB::one('SELECT * FROM degrees WHERE id = :id', ['id' => (int)input('degree_id')]);
                if (!$d) {
                    back();
                }
                $syn = normalize(preg_replace('/\s+—.*$/u', '', $it['label']));
                if ($syn !== '' && !str_contains(',' . $d['synonyms'] . ',', ',' . $syn . ',')) {
                    DB::update('degrees', ['synonyms' => mb_substr(trim($d['synonyms'] . ',' . $syn, ','), 0, 255), 'updated_at' => now()], 'id = :id', ['id' => $d['id']]);
                }
                Curation::log('diplome', (int)$d['id'], 'synonyme', '« ' . $syn . ' » rattaché à ' . $d['title'], $uid);
                Curation::close((int)$it['id'], 'traite', 'Rattaché à ' . $d['title'] . ' (' . Ref::degreeLabel((int)$d['level'], true) . ')', $uid);
                break;
            case 'recheck':
                $t = $it['ref_id'] ? DB::one('SELECT id, url FROM trainings WHERE id = :id', ['id' => $it['ref_id']]) : null;
                $code = $t ? LinkChecker::status((string)$t['url']) : 0;
                if ($t && ($code >= 200 && $code < 400 || in_array($code, [401, 403, 405, 429], true))) {
                    DB::update('trainings', ['verified_at' => now(), 'link_status' => 'ok'], 'id = :id', ['id' => $t['id']]);
                    Curation::close((int)$it['id'], 'traite', "Lien de nouveau joignable (HTTP $code)", $uid);
                } else {
                    flash('warning', "Lien toujours injoignable (HTTP $code) : la formation reste masquée.");
                    back();
                }
                break;
            case 'hide_training':
                if ($it['ref_id']) {
                    DB::update('trainings', ['active' => 0], 'id = :id', ['id' => $it['ref_id']]);
                }
                Curation::close((int)$it['id'], 'traite', 'Formation retirée du catalogue', $uid);
                break;
            case 'done':
                Curation::close((int)$it['id'], 'traite', $note ?: 'Traité', $uid);
                break;
            case 'reject':
                Curation::close((int)$it['id'], 'rejete', $note ?: 'Rejeté', $uid);
                break;
            default:
                back();
        }
        flash('success', 'Élément traité.');
        redirect('/admin/curation' . (input('type') ? '?type=' . urlencode((string)input('type')) : ''));
    }

    /* ------------------------------------------------------------------ Qualité et calibrage */

    public function quality(): string
    {
        $kpis = Quality::indicators();
        $calibration = Quality::calibration();
        $sample = Quality::sample(10);
        $checks = DB::all('SELECT * FROM normalization_checks ORDER BY id DESC LIMIT 15');
        return $this->page('quality', compact('kpis', 'calibration', 'sample', 'checks') + ['title' => 'Qualité et calibrage', 'charts' => true]);
    }

    public function check(): void
    {
        $n = 0;
        foreach ((array)input('raw', []) as $i => $raw) {
            $v = input('correct', [])[$i] ?? '';
            if ($v === '1' || $v === '0') {
                DB::insert('normalization_checks', ['kind' => 'metier', 'raw' => mb_substr((string)$raw, 0, 255), 'ref_code' => mb_substr((string)(input('code', [])[$i] ?? ''), 0, 30),
                    'correct' => (int)$v, 'checker_id' => $this->uid(), 'created_at' => now()]);
                $n++;
            }
        }
        flash('success', "$n contrôle(s) enregistré(s) : la précision de la normalisation est mise à jour.");
        redirect('/admin/qualite#controle');
    }
}
