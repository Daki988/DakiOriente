<?php
declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Controllers\Controller;
use App\Core\DB;
use App\Services\NotificationService;
use App\Services\Training\TrainingCatalog;
use App\Services\Training\TrainingSync;

/** Administration du catalogue de formations : plateformes, synchronisation, import, vérification des certificats. */
final class LearningController extends Controller
{
    public function index(): string
    {
        $platforms = DB::all("SELECT p.*, (SELECT COUNT(*) FROM trainings t WHERE t.platform_id = p.id AND t.active = 1) AS courses,
            (SELECT COUNT(*) FROM trainings t WHERE t.platform_id = p.id AND t.active = 0) AS hidden,
            (SELECT COALESCE(SUM(t.clicks), 0) FROM trainings t WHERE t.platform_id = p.id) AS clicks,
            (SELECT COUNT(DISTINCT ct.user_id) FROM candidate_trainings ct JOIN trainings t ON t.id = ct.training_id WHERE t.platform_id = p.id) AS learners
            FROM learning_platforms p ORDER BY courses DESC");
        $top = DB::all(TrainingCatalog::BASE . ' WHERE t.clicks > 0 ORDER BY t.clicks DESC LIMIT 10');
        $certificates = DB::all("SELECT c.*, u.first_name, u.last_name, u.email, t.title AS training_title, p.name AS platform_name FROM candidate_certificates c
            JOIN users u ON u.id = c.user_id LEFT JOIN trainings t ON t.id = c.training_id LEFT JOIN learning_platforms p ON p.id = t.platform_id
            ORDER BY CASE c.status WHEN 'declare' THEN 0 ELSE 1 END, c.created_at DESC LIMIT 50");
        $stats = [
            'trainings' => (int)DB::value('SELECT COUNT(*) FROM trainings WHERE active = 1 AND platform_id IS NOT NULL'),
            'fr' => (int)DB::value("SELECT COUNT(*) FROM trainings WHERE active = 1 AND platform_id IS NOT NULL AND language = 'fr'"),
            'learners' => (int)DB::value('SELECT COUNT(DISTINCT user_id) FROM candidate_trainings'),
            'completed' => (int)DB::value("SELECT COUNT(*) FROM candidate_trainings WHERE status = 'terminee'"),
            'certificates' => (int)DB::value('SELECT COUNT(*) FROM candidate_certificates'),
            'pending' => (int)DB::value("SELECT COUNT(*) FROM candidate_certificates WHERE status = 'declare'"),
        ];
        return $this->app('admin/learning', compact('platforms', 'top', 'certificates', 'stats') + ['title' => 'Formations & certificats', 'connectors' => array_keys(TrainingSync::CONNECTORS)]);
    }

    /** Synchronisation à la demande (la synchronisation hebdomadaire se fait par tâche planifiée). */
    public function sync(string $slug): void
    {
        if (!isset(TrainingSync::CONNECTORS[$slug])) {
            flash('error', 'Cette plateforme n\'a pas de connecteur automatique : utilise l\'import de fichier.');
            redirect('/admin/formations');
        }
        @set_time_limit(900);
        ignore_user_abort(true);
        try {
            $s = TrainingSync::sync($slug, 6);
            audit('training.sync', 'platform', null, ['slug' => $slug] + $s);
            flash('success', "Synchronisation terminée : {$s['seen']} formations lues, {$s['kept']} gardées ({$s['added']} nouvelles, {$s['updated']} mises à jour, {$s['deactivated']} masquées).");
        } catch (\Throwable $e) {
            flash('error', 'Synchronisation impossible : ' . $e->getMessage());
        }
        redirect('/admin/formations');
    }

    /** Import d'un fichier CSV ou JSON (export d'un programme d'affiliation, sélection manuelle…). */
    public function import(): void
    {
        $slug = (string)input('platform', '');
        $file = $_FILES['file'] ?? null;
        if (!$slug || !$file || ($file['error'] ?? 1) !== UPLOAD_ERR_OK) {
            flash('error', 'Choisis une plateforme et un fichier CSV ou JSON.');
            redirect('/admin/formations');
        }
        $ext = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['csv', 'json'], true) || $file['size'] > 5 * 1024 * 1024) {
            flash('error', 'Format accepté : CSV ou JSON, 5 Mo maximum.');
            redirect('/admin/formations');
        }
        try {
            $s = TrainingSync::import($slug, TrainingSync::readFile($file['tmp_name'], (string)$file['name']), 'import');
            audit('training.import', 'platform', null, ['slug' => $slug] + $s);
            flash('success', "Import terminé : {$s['seen']} lignes lues, {$s['kept']} formations gardées ({$s['added']} nouvelles, {$s['updated']} mises à jour). Les lignes hors français / anglais ou sans compétence reconnue sont ignorées.");
        } catch (\Throwable $e) {
            flash('error', 'Import impossible : ' . $e->getMessage());
        }
        redirect('/admin/formations');
    }

    public function updatePlatform(string $id): void
    {
        DB::update('learning_platforms', [
            'affiliate_param' => mb_substr(trim((string)input('affiliate_param', '')), 0, 120) ?: null,
            'active' => input('active') ? 1 : 0,
        ], 'id = :id', ['id' => (int)$id]);
        flash('success', 'Plateforme mise à jour.');
        redirect('/admin/formations');
    }

    public function toggleTraining(string $id): void
    {
        DB::run('UPDATE trainings SET active = 1 - active WHERE id = :id', ['id' => (int)$id]);
        flash('success', 'Visibilité de la formation modifiée.');
        back();
    }

    public function reviewCertificate(string $id): void
    {
        $c = DB::one('SELECT * FROM candidate_certificates WHERE id = :id', ['id' => (int)$id]) ?? abort(404);
        $status = in_array(input('status'), ['verifie', 'refuse', 'declare'], true) ? (string)input('status') : 'declare';
        $note = mb_substr(trim((string)input('note', '')), 0, 255) ?: null;
        DB::update('candidate_certificates', ['status' => $status, 'review_note' => $note, 'reviewed_at' => now()], 'id = :id', ['id' => $c['id']]);
        if ($status !== 'declare') {
            NotificationService::notify((int)$c['user_id'], 'moderation',
                $status === 'verifie' ? 'Ton certificat est vérifié : ' . $c['title'] : 'Ton certificat n\'a pas pu être vérifié : ' . $c['title'],
                $status === 'verifie' ? 'Il affiche désormais le badge « Vérifié par NEAM » sur ton profil et ton CV. Les recruteurs y feront attention.'
                    : ($note ?: 'Vérifie le lien ou le fichier transmis, puis ajoute-le de nouveau.'),
                '/espace/formations#certificats');
        }
        audit('certificate.' . $status, 'user', (int)$c['user_id'], ['certificate' => $c['id']]);
        flash('success', 'Certificat mis à jour.');
        redirect('/admin/formations#certificats');
    }
}
