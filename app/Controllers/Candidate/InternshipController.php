<?php
declare(strict_types=1);

namespace App\Controllers\Candidate;

use App\Controllers\Controller;
use App\Core\Auth;
use App\Core\DB;
use App\Services\Ai\AiService;
use App\Services\Internship\OfferWatch;
use App\Services\Internship\Readiness;
use App\Services\ProfileService;
use App\Services\Referential\Curation;
use App\Services\Referential\Normalizer;
use App\Services\Referential\Ref;

/**
 * Préparation aux stages : évaluer son CV sur des offres de stage réelles publiées ailleurs dans son pays,
 * pour être prêt quand des offres du même type paraîtront sur Tremplin.
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

    public function index(): string
    {
        $p = ProfileService::load($this->uid(), true);
        [$country, $countryName] = $this->country();
        $query = trim((string)input('q', '')) ?: $this->defaultQuery($p);
        $occupationId = $query !== '' ? $this->occupationFor($query) : null;
        $offers = $query !== '' ? OfferWatch::offers($country, $query, $occupationId) : [];
        $review = null;
        if ($offers) {
            $recent = DB::value('SELECT 1 FROM internship_reviews WHERE user_id = :u AND query = :q AND created_at >= :d',
                ['u' => $this->uid(), 'q' => mb_substr($query, 0, 160), 'd' => date('Y-m-d H:i:s', time() - 86400)]);
            $review = Readiness::evaluate($this->uid(), $offers, $query, $country, $occupationId, !$recent);
        }
        $history = DB::all('SELECT query, score, offers, ready, created_at FROM internship_reviews WHERE user_id = :u ORDER BY id DESC LIMIT 6', ['u' => $this->uid()]);
        $sources = OfferWatch::sources($country);
        $last = $query !== '' ? OfferWatch::lastSearch($country, $query) : null;
        $occupation = $occupationId ? Ref::occupation($occupationId) : null;
        $wantsStage = str_contains((string)$p['desired_types'], 'stage');
        $planned = DB::column('SELECT label FROM candidate_goals WHERE user_id = :u', ['u' => $this->uid()]);
        return $this->app('candidate/internships', compact('p', 'query', 'country', 'countryName', 'offers', 'review', 'history', 'sources', 'last', 'occupation', 'wantsStage', 'planned') + [
            'claude' => AiService::claudeConfigured(), 'fresh' => OfferWatch::searchIsFresh($last), 'cfg' => OfferWatch::config(), 'title' => 'Préparation aux stages',
        ]);
    }

    public function search(): void
    {
        $query = trim(mb_substr((string)input('q', ''), 0, 160));
        [$country] = $this->country();
        if ($query === '') {
            flash('warning', 'Indique le stage que tu recherches (métier ou domaine).');
            redirect('/espace/preparation-stages');
        }
        $r = OfferWatch::collect($country, $query, $this->occupationFor($query), $this->uid());
        flash($r['ok'] ? 'success' : 'warning', $r['message']);
        audit('internships.search', 'internship_searches', null, ['q' => $query, 'country' => $country, 'kept' => $r['kept']]);
        redirect('/espace/preparation-stages?q=' . urlencode($query));
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
