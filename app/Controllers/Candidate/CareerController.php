<?php
declare(strict_types=1);

namespace App\Controllers\Candidate;

use App\Controllers\Controller;
use App\Core\DB;
use App\Services\Ai\AiService;
use App\Services\EmployabilityService;
use App\Services\MatchingEngine;
use App\Services\PlanService;
use App\Services\ProfileService;
use App\Services\RiasecService;

final class CareerController extends Controller
{
    public function recommendations(): string
    {
        $uid = $this->uid();
        $advanced = PlanService::allows($this->user(), 'advanced_recos');
        $recos = MatchingEngine::recommendJobs($uid, $advanced ? 12 : 6);
        $p = ProfileService::load($uid);
        $careers = $p['riasec_code'] ? RiasecService::careers($p['riasec_code'], 4) : [];
        // Trace des recommandations (cahier des charges §9 : traçabilité)
        DB::delete('recommendations', "user_id = :u AND kind = 'job'", ['u' => $uid]);
        foreach ($recos as $r) {
            DB::insert('recommendations', [
                'user_id' => $uid, 'kind' => 'job', 'ref_id' => $r['job']['id'], 'score' => $r['match']['score'],
                'reason' => mb_substr(implode(' | ', $r['match']['strengths']), 0, 500), 'source' => 'regles', 'created_at' => now(),
            ]);
        }
        $favs = DB::column('SELECT job_id FROM favorites WHERE user_id = :u', ['u' => $uid]);
        return $this->app('candidate/recommendations', compact('recos', 'careers', 'p', 'advanced', 'favs') + ['title' => 'Offres pour moi']);
    }

    public function employability(): string
    {
        $e = EmployabilityService::compute($this->uid(), true);
        $history = DB::all('SELECT score, created_at FROM employability_scores WHERE user_id = :u ORDER BY created_at LIMIT 20', ['u' => $this->uid()]);
        $avg = (int)DB::value("SELECT AVG(employability_score) FROM candidate_profiles cp JOIN users u ON u.id = cp.user_id WHERE u.status = 'active'");
        return $this->app('candidate/employability', compact('e', 'history', 'avg') + ['title' => 'Score d\'employabilité', 'charts' => true]);
    }

    public function orientation(): string
    {
        $p = ProfileService::load($this->uid());
        $retake = (bool)input('refaire');
        $careers = $p['riasec_code'] ? RiasecService::careers($p['riasec_code'], 8) : [];
        return $this->app('candidate/orientation', [
            'p' => $p, 'retake' => $retake || !$p['riasec_code'], 'careers' => $careers,
            'questions' => RiasecService::questions(), 'types' => RiasecService::TYPES, 'title' => 'Orientation RIASEC',
        ]);
    }

    public function submitOrientation(): void
    {
        $answers = array_map('intval', (array)($_POST['a'] ?? []));
        if (count($answers) < count(RiasecService::questions())) {
            flash('error', 'Encore un petit effort : réponds à toutes les questions pour obtenir un résultat fiable (' . count($answers) . '/' . count(RiasecService::questions()) . ').');
            back();
        }
        $res = RiasecService::score($answers);
        RiasecService::save($this->uid(), $res);
        ProfileService::refreshCompletion($this->uid());
        audit('riasec.completed', 'user', $this->uid(), ['code' => $res['code']]);
        flash('success', 'Ton profil est ' . $res['code'] . ' ! Lis bien ce que cela dit de toi, puis regarde les métiers recommandés : certains vont sûrement te surprendre.');
        redirect('/espace/orientation');
    }

    public function interview(): string
    {
        $allowed = PlanService::allows($this->user(), 'interview_sim');
        $sessions = DB::all('SELECT s.*, j.title FROM interview_sessions s LEFT JOIN jobs j ON j.id = s.job_id WHERE s.user_id = :u ORDER BY s.created_at DESC', ['u' => $this->uid()]);
        $myJobs = DB::all('SELECT j.id, j.title, co.name AS company_name FROM applications a JOIN jobs j ON j.id = a.job_id JOIN companies co ON co.id = j.company_id WHERE a.user_id = :u ORDER BY a.updated_at DESC', ['u' => $this->uid()]);
        $selected = (int)input('job', 0);
        $preview = AiService::interviewQuestions(ProfileService::load($this->uid()), $selected ? MatchingEngine::loadJob($selected) : null);
        return $this->app('candidate/interview', compact('allowed', 'sessions', 'myJobs', 'selected', 'preview') + ['title' => 'Préparer un entretien']);
    }

    public function startInterview(): void
    {
        if (!PlanService::allows($this->user(), 'interview_sim')) {
            redirect('/abonnement');
        }
        $jobId = (int)input('job_id', 0);
        $job = $jobId ? MatchingEngine::loadJob($jobId) : null;
        $questions = AiService::interviewQuestions(ProfileService::load($this->uid()), $job, true);
        $id = DB::insert('interview_sessions', ['user_id' => $this->uid(), 'job_id' => $job ? $jobId : null, 'questions' => json_encode($questions, JSON_UNESCAPED_UNICODE), 'created_at' => now()]);
        redirect('/espace/entretien/' . $id);
    }

    private function session(int $id): array
    {
        $s = DB::one('SELECT * FROM interview_sessions WHERE id = :id AND user_id = :u', ['id' => $id, 'u' => $this->uid()]);
        if (!$s) {
            abort(404);
        }
        return $s;
    }

    public function interviewSession(string $id): string
    {
        $s = $this->session((int)$id);
        $job = $s['job_id'] ? MatchingEngine::loadJob((int)$s['job_id']) : null;
        return $this->app('candidate/interview_session', [
            's' => $s, 'job' => $job, 'questions' => json_decode($s['questions'], true) ?: [],
            'answers' => json_decode((string)$s['answers'], true) ?: [], 'feedback' => json_decode((string)$s['feedback'], true) ?: [],
            'title' => 'Simulation d\'entretien',
        ]);
    }

    public function answerInterview(string $id): void
    {
        $s = $this->session((int)$id);
        $questions = json_decode($s['questions'], true) ?: [];
        $job = $s['job_id'] ? MatchingEngine::loadJob((int)$s['job_id']) : null;
        $answers = [];
        foreach ($questions as $i => $q) {
            $answers[$i] = mb_substr(trim((string)($_POST['answer'][$i] ?? '')), 0, 3000);
        }
        $feedback = AiService::evaluateAnswers($questions, $answers, $job);
        $total = array_sum(array_column($feedback, 'score'));
        $score = $questions ? (int)round($total / (count($questions) * 10) * 100) : 0;
        DB::update('interview_sessions', [
            'answers' => json_encode($answers, JSON_UNESCAPED_UNICODE), 'feedback' => json_encode($feedback, JSON_UNESCAPED_UNICODE), 'score' => $score,
        ], 'id = :id', ['id' => $s['id']]);
        ProfileService::refreshCompletion($this->uid());
        flash('success', "Simulation analysée : $score / 100. Lis le feedback question par question, retravaille tes réponses et relance l'analyse : c'est en répétant qu'on gagne en aisance.");
        redirect('/espace/entretien/' . $s['id'] . '#feedback');
    }

    public function plan(): string
    {
        $allowed = PlanService::allows($this->user(), 'action_plan');
        $plan = $allowed ? EmployabilityService::actionPlan($this->uid()) : null;
        return $this->app('candidate/plan', compact('allowed', 'plan') + ['title' => 'Plan d\'action 30/60/90 jours']);
    }
}
