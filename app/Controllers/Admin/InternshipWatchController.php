<?php
declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Controllers\Controller;
use App\Core\DB;
use App\Services\Ai\AiService;
use App\Services\Internship\OfferWatch;

/**
 * Veille des stages : sources vérifiées par pays, offres réelles collectées (Claude ou saisie manuelle),
 * journal des recherches avec les motifs de rejet, réglages de la préparation aux stages.
 */
final class InternshipWatchController extends Controller
{
    public function index(): string
    {
        $country = strtoupper((string)input('pays', ''));
        $show = (string)input('voir', 'visibles');
        $where = [];
        $params = [];
        if (preg_match('/^[A-Z]{2}$/', $country)) {
            $where[] = 'e.country_code = :c';
            $params['c'] = $country;
        }
        $where[] = $show === 'masquees' ? 'e.hidden = 1' : 'e.hidden = 0';
        $offers = DB::all('SELECT e.*, s.name AS source_name FROM external_offers e LEFT JOIN offer_sources s ON s.id = e.source_id WHERE ' . implode(' AND ', $where)
            . ' ORDER BY e.id DESC LIMIT 100', $params);
        $sources = DB::all('SELECT s.*, (SELECT COUNT(*) FROM external_offers e WHERE e.source_id = s.id AND e.hidden = 0) AS offers FROM offer_sources s ORDER BY s.active DESC, s.name');
        $searches = DB::all('SELECT * FROM internship_searches ORDER BY id DESC LIMIT 20');
        $countries = DB::all('SELECT code, name FROM countries WHERE active = 1 ORDER BY name');
        $stats = [
            'offers' => (int)DB::value('SELECT COUNT(*) FROM external_offers WHERE hidden = 0'),
            'hidden' => (int)DB::value('SELECT COUNT(*) FROM external_offers WHERE hidden = 1'),
            'searches' => (int)DB::value('SELECT COUNT(*) FROM internship_searches'),
            'reviews' => (int)DB::value('SELECT COUNT(*) FROM internship_reviews'),
            'candidates' => (int)DB::value('SELECT COUNT(DISTINCT user_id) FROM internship_reviews'),
        ];
        return $this->app('admin/internships', compact('offers', 'sources', 'searches', 'countries', 'stats', 'country', 'show') + [
            'cfg' => OfferWatch::config(), 'claude' => AiService::claudeConfigured(), 'title' => 'Veille des stages',
        ]);
    }

    public function saveSource(): void
    {
        $id = (int)input('id', 0);
        $domain = strtolower(trim((string)input('domain', '')));
        $domain = preg_replace('#^https?://#', '', $domain) ?? '';
        $domain = preg_replace('#^www\.#', '', rtrim(explode('/', $domain)[0], '.')) ?? '';
        $name = trim(mb_substr((string)input('name', ''), 0, 120));
        $countries = strtoupper(preg_replace('/[^A-Za-z*,]/', '', (string)input('countries', 'GA')) ?? 'GA');
        if ($name === '' || !preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $domain)) {
            flash('error', 'Nom et domaine valides requis (ex. : jobartis.ga).');
            redirect('/admin/veille-stages#sources');
        }
        $data = ['name' => $name, 'domain' => $domain, 'url' => mb_substr(trim((string)input('url', '')), 0, 255) ?: null,
            'kind' => isset(OfferWatch::KINDS[input('kind')]) ? (string)input('kind') : 'plateforme', 'countries' => $countries ?: 'GA',
            'note' => mb_substr(trim((string)input('note', '')), 0, 255) ?: null, 'verified_at' => now(), 'verified_by' => $this->uid()];
        if ($id) {
            DB::update('offer_sources', $data, 'id = :id', ['id' => $id]);
        } else {
            DB::insert('offer_sources', $data + ['active' => 1, 'created_at' => now()]);
        }
        audit('internships.source', 'offer_sources', $id ?: null, ['domain' => $domain]);
        flash('success', 'Source enregistrée et marquée vérifiée aujourd\'hui.');
        redirect('/admin/veille-stages#sources');
    }

    public function toggleSource(string $id): void
    {
        DB::run('UPDATE offer_sources SET active = 1 - active WHERE id = :id', ['id' => (int)$id]);
        audit('internships.source_toggle', 'offer_sources', (int)$id);
        flash('success', 'Statut de la source mis à jour (une source suspendue n\'est plus interrogée et ses offres ne sont plus montrées).');
        redirect('/admin/veille-stages#sources');
    }

    /** Saisie manuelle d'une offre réelle repérée par l'équipe (sans clé Claude, ou pour compléter). */
    public function addOffer(): void
    {
        $country = strtoupper((string)input('country_code', 'GA'));
        $it = [
            'url' => (string)input('url'), 'title' => (string)input('title'), 'organization' => input('organization'), 'city' => input('city'),
            'country' => $country, 'published' => (string)input('published', ''), 'deadline' => (string)input('deadline', ''), 'status' => (string)input('status', 'inconnu'), 'is_internship' => true,
            'education' => input('education'), 'duration' => input('duration'), 'skills' => (string)input('skills', ''), 'languages' => (string)input('languages', ''),
            'summary' => input('summary'),
        ];
        $check = OfferWatch::validate($it, $country, OfferWatch::sources($country), null);
        if (!$check['ok']) {
            flash('error', 'Offre refusée : ' . $check['reason'] . '.');
            redirect('/admin/veille-stages#ajout');
        }
        $query = trim((string)input('query', '')) ?: $check['offer']['title'];
        $id = OfferWatch::store($check['offer'], $country, OfferWatch::queryNorm($query), null, 'manuel', $this->uid());
        audit('internships.offer_add', 'external_offers', $id);
        flash($id ? 'success' : 'warning', $id ? 'Offre ajoutée à la préparation aux stages.' : 'Cette offre avait été retirée : elle n\'est pas réintroduite.');
        redirect('/admin/veille-stages');
    }

    public function toggleOffer(string $id): void
    {
        $o = DB::one('SELECT id, hidden FROM external_offers WHERE id = :id', ['id' => (int)$id]);
        if (!$o) {
            abort(404);
        }
        DB::update('external_offers', ['hidden' => (int)$o['hidden'] ? 0 : 1, 'hidden_reason' => (int)$o['hidden'] ? null : (mb_substr(trim((string)input('reason', '')), 0, 160) ?: 'retirée par l\'équipe NEAM')], 'id = :id', ['id' => (int)$id]);
        audit('internships.offer_toggle', 'external_offers', (int)$id);
        flash('success', (int)$o['hidden'] ? 'Offre de nouveau utilisée.' : 'Offre retirée de la préparation aux stages.');
        back();
    }

    public function recheck(string $id): void
    {
        $s = OfferWatch::recheck((int)$id);
        flash($s === 'mort' ? 'warning' : 'success', match ($s) {
            'ok' => 'Lien joignable.', 'protege' => 'Page protégée (connexion ou robot bloqué) : l\'offre est conservée.',
            'mort' => 'Page supprimée : l\'offre est retirée.', default => 'Lien non contrôlable pour l\'instant.',
        });
        back();
    }

    public function search(): void
    {
        $country = strtoupper((string)input('country_code', 'GA'));
        $query = trim(mb_substr((string)input('q', ''), 0, 160));
        if (!preg_match('/^[A-Z]{2}$/', $country) || $query === '') {
            back();
        }
        $hit = \App\Services\Referential\Normalizer::occupation($query);
        // L'équipe peut forcer une nouvelle recherche malgré le cache
        if (input('force')) {
            DB::run("UPDATE internship_searches SET status = 'expire' WHERE country_code = :c AND query_norm = :q AND status = 'ok'", ['c' => $country, 'q' => OfferWatch::queryNorm($query)]);
        }
        $r = OfferWatch::collect($country, $query, $hit && $hit['confidence'] >= 60 ? (int)$hit['id'] : null, $this->uid());
        flash($r['ok'] ? 'success' : 'warning', $r['message']);
        redirect('/admin/veille-stages?pays=' . $country . '#recherches');
    }

    public function settings(): void
    {
        $vals = [
            'stage_offers_max_age' => max(30, min(730, (int)input('max_age_days', 365))),
            'stage_search_cache_days' => max(1, min(60, (int)input('cache_days', 7))),
            'stage_search_max_offers' => max(3, min(15, (int)input('max_offers', 10))),
            'stage_level_cap' => max(1, min(4, (int)input('level_cap', 2))),
        ];
        foreach ($vals as $k => $v) {
            if (DB::value('SELECT 1 FROM settings WHERE skey = :k', ['k' => $k])) {
                DB::update('settings', ['svalue' => (string)$v], 'skey = :k', ['k' => $k]);
            } else {
                DB::insert('settings', ['skey' => $k, 'svalue' => (string)$v]);
            }
        }
        audit('internships.settings', null, null, $vals);
        flash('success', 'Réglages enregistrés.');
        redirect('/admin/veille-stages#reglages');
    }
}
