<?php
declare(strict_types=1);

namespace App\Controllers\Candidate;

use App\Controllers\Controller;
use App\Core\DB;
use App\Services\EmployabilityService;
use App\Services\NotificationService;
use App\Services\ProfileService;
use App\Services\Training\TrainingCatalog;
use App\Services\Uploader;

/** Suivi des formations en ligne et certificats obtenus, reliés au profil du candidat. */
final class LearningController extends Controller
{
    public const STATUS = ['suivie' => ['À commencer', 'gray'], 'en_cours' => ['En cours', 'amber'], 'terminee' => ['Terminée', 'green']];
    public const CERT_STATUS = ['declare' => ['Déclaré', 'sky'], 'verifie' => ['Vérifié par NEAM', 'green'], 'refuse' => ['Non vérifié', 'red']];

    public function index(): string
    {
        $uid = $this->uid();
        $items = DB::all(TrainingCatalog::BASE . ' JOIN candidate_trainings ct ON ct.training_id = t.id WHERE ct.user_id = :u ORDER BY CASE ct.status WHEN \'en_cours\' THEN 0 WHEN \'suivie\' THEN 1 ELSE 2 END, ct.created_at DESC', ['u' => $uid]);
        $tracks = [];
        foreach (DB::all('SELECT * FROM candidate_trainings WHERE user_id = :u', ['u' => $uid]) as $r) {
            $tracks[(int)$r['training_id']] = $r;
        }
        $certificates = DB::all('SELECT c.*, t.title AS training_title, p.name AS platform_name FROM candidate_certificates c
            LEFT JOIN trainings t ON t.id = c.training_id LEFT JOIN learning_platforms p ON p.id = t.platform_id
            WHERE c.user_id = :u ORDER BY c.created_at DESC', ['u' => $uid]);
        $linked = array_column($certificates, 'training_id');
        $platforms = DB::all('SELECT name FROM learning_platforms WHERE active = 1 ORDER BY name');
        return $this->app('candidate/learning', compact('items', 'tracks', 'certificates', 'linked', 'platforms') + ['title' => 'Mes formations et certificats']);
    }

    public function status(string $id): void
    {
        $uid = $this->uid();
        $t = TrainingCatalog::find((int)$id) ?? abort(404);
        $status = isset(self::STATUS[input('status')]) ? (string)input('status') : 'suivie';
        $row = DB::one('SELECT * FROM candidate_trainings WHERE user_id = :u AND training_id = :t', ['u' => $uid, 't' => $t['id']]);
        $data = ['status' => $status, 'started_at' => in_array($status, ['en_cours', 'terminee'], true) ? ($row['started_at'] ?? now()) : null, 'completed_at' => $status === 'terminee' ? now() : null];
        if ($row) {
            DB::update('candidate_trainings', $data, 'id = :id', ['id' => $row['id']]);
        } else {
            DB::insert('candidate_trainings', $data + ['user_id' => $uid, 'training_id' => $t['id'], 'created_at' => now()]);
        }
        if ($status === 'terminee') {
            $added = self::raiseSkills($uid, (string)$t['skills'], 2);
            ProfileService::refreshCompletion($uid);
            EmployabilityService::compute($uid, true);
            flash('success', 'Bravo, formation terminée !' . ($added ? ' Ton profil a été mis à jour : ' . implode(', ', $added) . '.' : '')
                . ' Tu as obtenu un certificat ? Relie-le maintenant : c\'est lui que les recruteurs pourront vérifier.');
            redirect('/formations/' . $t['id'] . '#certificat');
        }
        flash('success', $status === 'en_cours' ? 'C\'est parti ! Un peu chaque jour, et tu iras au bout.' : 'Formation ajoutée à ton suivi.');
        back();
    }

    /** Relier un certificat obtenu (sur une plateforme du catalogue ou ailleurs) au profil. */
    public function addCertificate(): void
    {
        $uid = $this->uid();
        $trainingId = (int)input('training_id', 0) ?: null;
        $t = $trainingId ? TrainingCatalog::find($trainingId) : null;
        $title = mb_substr(trim((string)input('title', $t['title'] ?? '')), 0, 190);
        $issuer = mb_substr(trim((string)input('issuer', $t['platform_name'] ?? '')), 0, 160);
        $url = trim((string)input('credential_url', ''));
        $date = (string)input('issued_at', '');
        $errors = [];
        if ($title === '') {
            $errors['title'] = 'Indique l\'intitulé du certificat.';
        }
        if ($url !== '' && (!filter_var($url, FILTER_VALIDATE_URL) || !preg_match('#^https://#i', $url))) {
            $errors['credential_url'] = 'Le lien doit commencer par https:// (copie-le depuis la page de ton certificat).';
        }
        if ($date !== '' && (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $date > date('Y-m-d'))) {
            $errors['issued_at'] = 'La date d\'obtention ne peut pas être dans le futur.';
        }
        $hasFile = !empty($_FILES['file']['name']);
        if ($url === '' && !$hasFile) {
            $errors['credential_url'] = 'Ajoute le lien de vérification ou le fichier de ton certificat : c\'est ce qui le rend crédible.';
        }
        if ($errors) {
            flash('error', reset($errors));
            back();
        }
        $docId = null;
        if ($hasFile) {
            try {
                $f = Uploader::store($_FILES['file'], ['pdf' => 'application/pdf'] + Uploader::IMAGES);
            } catch (\RuntimeException $e) {
                flash('error', $e->getMessage());
                back();
            }
            $docId = DB::insert('documents', ['user_id' => $uid, 'kind' => 'certificat', 'original_name' => $f['original'], 'stored_name' => $f['stored'], 'mime' => $f['mime'], 'size' => $f['size'], 'created_at' => now()]);
        }
        DB::insert('candidate_certificates', [
            'user_id' => $uid, 'training_id' => $t['id'] ?? null, 'certification_id' => (int)input('certification_id', 0) ?: null,
            'title' => $title, 'issuer' => $issuer ?: null, 'issued_at' => $date ?: null, 'credential_url' => $url ?: null,
            'credential_id' => mb_substr(trim((string)input('credential_id', '')), 0, 120) ?: null, 'document_id' => $docId,
            'status' => 'declare', 'created_at' => now(),
        ]);
        $added = [];
        if ($t) {
            $row = DB::one('SELECT id FROM candidate_trainings WHERE user_id = :u AND training_id = :t', ['u' => $uid, 't' => $t['id']]);
            $done = ['status' => 'terminee', 'completed_at' => now()];
            $row ? DB::update('candidate_trainings', $done, 'id = :id', ['id' => $row['id']])
                : DB::insert('candidate_trainings', $done + ['user_id' => $uid, 'training_id' => $t['id'], 'started_at' => null, 'created_at' => now()]);
            $added = self::raiseSkills($uid, (string)$t['skills'], 3);
        }
        ProfileService::refreshCompletion($uid);
        EmployabilityService::compute($uid, true);
        foreach (DB::column("SELECT id FROM users WHERE role = 'admin' AND status = 'active'") as $admin) {
            NotificationService::notify((int)$admin, 'moderation', 'Certificat à vérifier : ' . $title, 'Déclaré par un candidat' . ($issuer ? ' · ' . $issuer : ''), '/admin/formations#certificats', false);
        }
        audit('certificate.added', 'user', $uid, ['title' => $title]);
        flash('success', 'Certificat relié à ton profil ! Il apparaît sur ton CV et les recruteurs peuvent le vérifier.'
            . ($added ? ' Compétences mises à jour : ' . implode(', ', $added) . '.' : '') . ' L\'équipe NEAM le vérifiera pour lui ajouter le badge « Vérifié ».');
        redirect('/espace/formations#certificats');
    }

    public function deleteCertificate(string $id): void
    {
        $c = DB::one('SELECT * FROM candidate_certificates WHERE id = :id AND user_id = :u', ['id' => (int)$id, 'u' => $this->uid()]) ?? abort(404);
        DB::delete('candidate_certificates', 'id = :id', ['id' => $c['id']]);
        flash('info', 'Certificat retiré de ton profil.');
        redirect('/espace/formations#certificats');
    }

    /** Compétences de la formation portées au niveau minimum indiqué. Retourne les compétences modifiées. */
    public static function raiseSkills(int $uid, string $skills, int $min): array
    {
        $changed = [];
        foreach (array_filter(array_map('trim', explode(',', $skills))) as $name) {
            $sid = DB::value('SELECT id FROM skills WHERE name = :n', ['n' => $name]);
            if (!$sid) {
                continue;
            }
            $lvl = DB::value('SELECT level FROM candidate_skills WHERE user_id = :u AND skill_id = :s', ['u' => $uid, 's' => $sid]);
            if ($lvl === null || $lvl === false) {
                DB::insert('candidate_skills', ['user_id' => $uid, 'skill_id' => $sid, 'level' => $min]);
                $changed[] = $name;
            } elseif ((int)$lvl < $min) {
                DB::update('candidate_skills', ['level' => $min], 'user_id = :u AND skill_id = :s', ['u' => $uid, 's' => $sid]);
                $changed[] = $name;
            }
        }
        return $changed;
    }
}
