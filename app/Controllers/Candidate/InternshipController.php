<?php
declare(strict_types=1);

namespace App\Controllers\Candidate;

use App\Controllers\Controller;
use App\Core\Auth;
use App\Core\DB;
use App\Services\Ai\AiService;
use App\Services\GapAnalysisService;
use App\Services\Internship\OfferCheck;
use App\Services\Internship\OfferWatch;
use App\Services\Internship\Readiness;
use App\Services\ProfileService;
use App\Services\Referential\Curation;
use App\Services\Referential\Normalizer;
use App\Services\Referential\Ref;

/**
 * Préparation sur offres réelles : évaluer son CV sur des offres de stage ou d'emploi publiées ailleurs dans son pays
 * (sources vérifiées, ou offre collée par le candidat depuis LinkedIn ou un autre site), pour être prêt quand des offres
 * du même type paraîtront sur Tremplin.
 */
final class InternshipController extends Controller
{
    private function country(): array
    {
        $code = strtoupper((string)(Auth::user()['country_code'] ?? 'GA')) ?: 'GA';
        $name = (string)(DB::value('SELECT name FROM countries WHERE code = :c', ['c' => $code]) ?: $code);
        return [$code, $name];
    }

    /** Stage recherché par défaut : saisie, dernier bilan, poste souhaité, premier métier cible. */
    private function defaultQuery(array $p): string
    {
        $last = DB::value('SELECT query FROM internship_reviews WHERE user_id = :u ORDER BY id DESC LIMIT 1', ['u' => $this->uid()]);
        if ($last) {
            return (string)$last;
        }
        if (trim((string)$p['desired_job']) !== '') {
            return trim((string)$p['desired_job']);
        }
        $first = array_filter(explode(',', (string)$p['target_occupations']))[0] ?? null;
        $o = $first ? Ref::occupation((int)$first) : null;
        return $o['title'] ?? '';
    }

    private function occupationFor(string $query): ?int
    {
        $hit = Normalizer::occupation($query);
        return $hit && $hit['confidence'] >= (int)(Ref::rules()['normalization']['confirm'] ?? 60) ? (int)$hit['id'] : null;
    }

    /** Type de contrat demandé, sinon déduit des types recherchés dans le profil. */
    private function contract(array $p): string
    {
        $c = (string)input('type', '');
        if (isset(OfferWatch::CONTRACTS[$c])) {
            return $c;
        }
        $types = (string)$p['desired_types'];
        $stage = str_contains($types, 'stage') || str_contains($types, 'alternance');
        $job = (bool)preg_match('/cdi|cdd|premier_emploi|emploi|interim/', $types);
        return $stage && $job ? 'tous' : ($job ? 'emploi' : 'stage');
    }

    public function index(): string
    {
        $p = ProfileService::load($this->uid(), true);
        [$country, $countryName] = $this->country();
        $contract = $this->contract($p);
        $query = trim((string)input('q', '')) ?: $this->defaultQuery($p);
        $occupationId = $query !== '' ? $this->occupationFor($query) : null;
        $offers = $query !== '' ? OfferWatch::offers($country, $query, $occupationId, 30, $contract) : [];
        $review = null;
        if ($offers) {
            $recent = DB::value('SELECT 1 FROM internship_reviews WHERE user_id = :u AND query = :q AND contract = :k AND created_at >= :d',
                ['u' => $this->uid(), 'q' => mb_substr($query, 0, 160), 'k' => $contract, 'd' => date('Y-m-d H:i:s', time() - 86400)]);
            $review = Readiness::evaluate($this->uid(), $offers, $query, $country, $occupationId, !$recent, $contract);
        }
        $history = DB::all('SELECT query, contract, score, offers, ready, created_at FROM internship_reviews WHERE user_id = :u ORDER BY id DESC LIMIT 6', ['u' => $this->uid()]);
        $checks = DB::all('SELECT id, title, site, contract, score, verdict, created_at FROM offer_checks WHERE user_id = :u ORDER BY id DESC LIMIT 10', ['u' => $this->uid()]);
        $sources = OfferWatch::sources($country);
        $last = $query !== '' ? OfferWatch::lastSearch($country, $query, $contract) : null;
        $occupation = $occupationId ? Ref::occupation($occupationId) : null;
        $wantsStage = str_contains((string)$p['desired_types'], 'stage');
        $planned = DB::column('SELECT label FROM candidate_goals WHERE user_id = :u', ['u' => $this->uid()]);
        return $this->app('candidate/internships', compact('p', 'query', 'contract', 'country', 'countryName', 'offers', 'review', 'history', 'checks', 'sources', 'last', 'occupation', 'wantsStage', 'planned') + [
            'claude' => AiService::claudeConfigured(), 'fresh' => OfferWatch::searchIsFresh($last), 'cfg' => OfferWatch::config(), 'title' => 'Préparation sur offres réelles',
        ]);
    }

    public function search(): void
    {
        $query = trim(mb_substr((string)input('q', ''), 0, 160));
        $contract = isset(OfferWatch::CONTRACTS[input('type')]) ? (string)input('type') : 'stage';
        [$country] = $this->country();
        if ($query === '') {
            flash('warning', 'Indique le métier ou le domaine recherché.');
            redirect('/espace/preparation-stages');
        }
        $r = OfferWatch::collect($country, $query, $this->occupationFor($query), $this->uid(), null, $contract);
        flash($r['ok'] ? 'success' : 'warning', $r['message']);
        audit('internships.search', 'internship_searches', null, ['q' => $query, 'country' => $country, 'type' => $contract, 'kept' => $r['kept']]);
        redirect('/espace/preparation-stages?' . http_build_query(['q' => $query, 'type' => $contract]));
    }

    /* ---------- Offre trouvée par le candidat (LinkedIn ou autre site) ---------- */

    public function checkOffer(): void
    {
        [$country] = $this->country();
        $r = OfferCheck::run($this->uid(), $country, (string)input('title', ''), (string)input('offer_text', ''), trim((string)input('url', '')) ?: null);
        flash($r['ok'] ? 'success' : 'warning', $r['message']);
        redirect($r['ok'] ? '/espace/preparation-stages/offres-evaluees/' . $r['id'] : '/espace/preparation-stages#offre-trouvee');
    }

    private function ownCheck(string $id): array
    {
        $c = DB::one('SELECT * FROM offer_checks WHERE id = :id AND user_id = :u', ['id' => (int)$id, 'u' => $this->uid()]);
        if (!$c) {
            abort(404);
        }
        return $c;
    }

    public function showCheck(string $id): string
    {
        $check = $this->ownCheck($id);
        $p = ProfileService::load($this->uid(), true);
        $res = OfferCheck::result($check, $p);
        $gaps = [];
        foreach (array_slice(array_values(array_filter($res['m']['gap_items'] ?? [], fn($g) => $g['type'] !== 'mobility')), 0, 5) as $g) {
            $g['recos'] = in_array($g['type'], ['skill', 'level', 'language', 'education', 'experience'], true)
                ? array_slice(GapAnalysisService::recommendations($g, ['id' => 0]), 0, 3) : [];
            $gaps[] = $g;
        }
        $planned = DB::column('SELECT label FROM candidate_goals WHERE user_id = :u', ['u' => $this->uid()]);
        return $this->app('candidate/offer_check', compact('check', 'res', 'gaps', 'planned') + ['title' => 'Offre évaluée']);
    }

    public function deleteCheck(string $id): void
    {
        $this->ownCheck($id);
        DB::delete('offer_checks', 'id = :id AND user_id = :u', ['id' => (int)$id, 'u' => $this->uid()]);
        flash('success', 'Évaluation supprimée.');
        redirect('/espace/preparation-stages#offre-trouvee');
    }

    public function report(string $id): void
    {
        $o = DB::one('SELECT id, title, url FROM external_offers WHERE id = :id', ['id' => (int)$id]);
        if (!$o) {
            abort(404);
        }
        $reason = trim(mb_substr((string)input('reason', ''), 0, 200)) ?: 'Offre signalée comme douteuse ou erronée';
        Curation::add('offre_stage', $o['title'], 'candidat', (int)$o['id'], null, ['url' => $o['url'], 'reason' => $reason], $this->uid());
        flash('success', 'Merci : l\'équipe NEAM va vérifier cette offre.');
        back();
    }
}
