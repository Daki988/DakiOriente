<?php
declare(strict_types=1);

namespace App\Controllers\Candidate;

use App\Controllers\Controller;
use App\Core\DB;
use App\Services\EmployabilityService;
use App\Services\MatchingEngine;
use App\Services\PlanService;
use App\Services\ProfileService;

final class DashboardController extends Controller
{
    public function index(): string
    {
        $uid = $this->uid();
        $p = ProfileService::load($uid);
        $completion = ProfileService::completion($p);
        $employ = EmployabilityService::compute($uid);
        $recos = MatchingEngine::recommendJobs($uid, 3);
        $apps = DB::all(
            'SELECT a.*, j.title, co.name AS company_name, co.color AS company_color FROM applications a
             JOIN jobs j ON j.id = a.job_id JOIN companies co ON co.id = j.company_id
             WHERE a.user_id = :u ORDER BY a.updated_at DESC LIMIT 4',
            ['u' => $uid]
        );
        $counts = [];
        foreach (DB::all('SELECT status, COUNT(*) AS n FROM applications WHERE user_id = :u GROUP BY status', ['u' => $uid]) as $r) {
            $counts[$r['status']] = (int)$r['n'];
        }
        $interviews = DB::all(
            "SELECT i.*, j.title, co.name AS company_name, a.id AS application_id FROM interviews i
             JOIN applications a ON a.id = i.application_id JOIN jobs j ON j.id = a.job_id JOIN companies co ON co.id = j.company_id
             WHERE a.user_id = :u AND i.scheduled_at >= :now ORDER BY i.scheduled_at LIMIT 3",
            ['u' => $uid, 'now' => date('Y-m-d 00:00:00')]
        );
        $history = DB::all('SELECT score, created_at FROM employability_scores WHERE user_id = :u ORDER BY created_at LIMIT 12', ['u' => $uid]);
        $favorites = (int)DB::value('SELECT COUNT(*) FROM favorites WHERE user_id = :u', ['u' => $uid]);
        $notifications = DB::all('SELECT * FROM notifications WHERE user_id = :u ORDER BY created_at DESC LIMIT 4', ['u' => $uid]);
        $quota = PlanService::applicationQuota($this->user());

        // Prochaine action : la plus impactante d'abord
        $next = match (true) {
            $completion['percent'] < 70 => ['Complète ton profil', reset($completion['missing']) . ' : c\'est l\'action qui fera monter ton score sur toutes les offres à la fois.', '/espace/profil', 'user'],
            !$p['riasec_code'] => ['Passe le test d\'orientation', '10 minutes pour découvrir ce qui te motive et les métiers où tu as toutes tes chances.', '/espace/orientation', 'compass'],
            (bool)$interviews => ['Prépare ton entretien', 'Entretien avec ' . $interviews[0]['company_name'] . ' le ' . date_fr($interviews[0]['scheduled_at'], true) . '. Une simulation maintenant, et tu arriveras serein·e.', '/espace/entretien?job=' . DB::value('SELECT job_id FROM applications WHERE id = :a', ['a' => $interviews[0]['application_id']]), 'mic'],
            (bool)$recos && $recos[0]['match']['score'] >= 70 => ['Postule à ton meilleur match', $recos[0]['job']['title'] . ' : compatible à ' . $recos[0]['match']['score'] . ' %. Avec un score pareil, tu as une vraie carte à jouer.', '/offres/' . $recos[0]['job']['id'], 'send'],
            default => ['Développe une compétence clé', 'Une seule nouvelle compétence peut débloquer plusieurs offres. Les formations recommandées ciblent tes écarts les plus fréquents.', '/formations', 'graduation-cap'],
        };

        $gaps = \App\Services\GapAnalysisService::market($uid, 10);

        return $this->app('candidate/dashboard', compact('p', 'completion', 'employ', 'recos', 'apps', 'counts', 'interviews', 'history', 'favorites', 'notifications', 'next', 'quota', 'gaps') + [
            'title' => 'Mon tableau de bord', 'charts' => true,
        ]);
    }
}
