<?php
declare(strict_types=1);

namespace App\Controllers\Candidate;

use App\Controllers\Controller;
use App\Core\Auth;
use App\Core\DB;
use App\Services\EmployabilityService;
use App\Services\MatchingEngine;
use App\Services\ProfileService;
use App\Services\Referential\Curation;
use App\Services\Referential\Explainer;
use App\Services\Referential\Ref;

/** Explicabilité côté candidat : compréhension du score, signalement, reformulation, métiers cibles (§8, §10). */
final class MatchController extends Controller
{
    private function job(string $id): array
    {
        $job = MatchingEngine::loadJob((int)$id);
        if (!$job || $job['status'] !== 'published') {
            abort(404);
        }
        return $job;
    }

    /** « As-tu compris ce score ? » : alimente l'indicateur de compréhension (cible ≥ 80 %). */
    public function understood(string $id): void
    {
        $job = $this->job($id);
        DB::delete('score_feedback', 'user_id = :u AND job_id = :j AND ref_version = :v', ['u' => Auth::id(), 'j' => $job['id'], 'v' => Ref::version()]);
        DB::insert('score_feedback', ['user_id' => Auth::id(), 'job_id' => $job['id'], 'understood' => input('understood') === '1' ? 1 : 0, 'ref_version' => Ref::version(), 'created_at' => now()]);
        flash('success', input('understood') === '1' ? 'Merci ! Ton retour nous aide à garder des explications claires.' : 'Merci pour ta franchise. Si un point te semble faux, signale-le : l\'équipe de curation le vérifiera.');
        redirect('/offres/' . $job['id'] . '#adequation');
    }

    /** Une explication jugée erronée part en file de curation (§10). */
    public function report(string $id): void
    {
        $job = $this->job($id);
        $reason = trim((string)input('reason'));
        if (mb_strlen($reason) < 8) {
            flash('error', 'Précise en quelques mots ce qui te semble faux.');
            redirect('/offres/' . $job['id'] . '#adequation');
        }
        $m = MatchingEngine::forUser(Auth::id(), (int)$job['id'], true);
        Curation::add('explication', mb_substr($job['title'] . ' — ' . $reason, 0, 255), 'candidat', (int)$job['id'], null,
            ['reason' => $reason, 'score' => $m['score'] ?? null, 'verdict' => $m['verdict']['key'] ?? null, 'version' => Ref::version(), 'gaps' => array_slice($m['gaps'] ?? [], 0, 3)], Auth::id());
        flash('success', 'Signalement envoyé. Un curateur vérifie le calcul et les référentiels concernés.');
        redirect('/offres/' . $job['id'] . '#adequation');
    }

    /** Reformulation de l'explication par Claude (les éléments calculés ne changent pas). */
    public function rephrase(string $id): void
    {
        $job = $this->job($id);
        $p = ProfileService::load(Auth::id());
        $m = MatchingEngine::forUser(Auth::id(), (int)$job['id'], true);
        $gain = $m['gap_items'] ? MatchingEngine::gain($p, $job, $m['gap_items'][0]) : null;
        $x = Explainer::rephrase(Auth::id(), $m, $job, Explainer::text($m, $job, $gain));
        flash($x['provider'] === 'Claude' ? 'success' : 'info', $x['provider'] === 'Claude' ? 'Explication reformulée par Claude, à partir des éléments calculés.' : 'Claude n\'est pas disponible : l\'explication du moteur NEAM est affichée.');
        redirect('/offres/' . $job['id'] . '#adequation');
    }

    /** Un à trois métiers cibles : le score d'employabilité se calcule sur les offres les plus proches. */
    public function targets(): void
    {
        $max = (int)(Ref::rules()['employability']['max_targets'] ?? 3);
        $ids = array_slice(array_values(array_unique(array_filter(array_map('intval', (array)input('targets', []))))), 0, $max);
        $ids = array_values(array_filter($ids, fn($id) => (bool)DB::value("SELECT id FROM occupations WHERE id = :id AND status != 'archive'", ['id' => $id])));
        DB::update('candidate_profiles', ['target_occupations' => implode(',', $ids) ?: null, 'updated_at' => now()], 'user_id = :u', ['u' => Auth::id()]);
        $e = EmployabilityService::compute(Auth::id(), true);
        flash('success', $ids ? 'Métiers cibles enregistrés. Ton score d\'employabilité est maintenant de ' . $e['score'] . '/100.' : 'Métiers cibles retirés.');
        redirect('/espace/employabilite');
    }

    /** Recherche de fiches métier (autocomplétion). */
    public function searchOccupations(): void
    {
        $q = trim((string)input('q'));
        $rows = [];
        if (mb_strlen($q) >= 2) {
            $m = \App\Services\Referential\Normalizer::occupation($q);
            $like = '%' . $q . '%';
            $rows = DB::all("SELECT DISTINCT o.id, o.code, o.title FROM occupations o JOIN occupation_labels l ON l.occupation_id = o.id
                WHERE o.status != 'archive' AND (o.title LIKE :q OR l.label LIKE :q2) ORDER BY o.title LIMIT 12", ['q' => $like, 'q2' => $like]);
            if ($m && !in_array($m['id'], array_map('intval', array_column($rows, 'id')), true)) {
                array_unshift($rows, ['id' => $m['id'], 'code' => $m['code'], 'title' => $m['title']]);
            }
        }
        json_response(['data' => array_slice($rows, 0, 12)]);
    }
}
