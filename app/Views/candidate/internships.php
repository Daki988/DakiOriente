<?php
/** @var array $p @var string $query @var string $contract @var array $checks @var string $country @var string $countryName @var array $offers @var ?array $review @var array $history
 *  @var array $sources @var ?array $last @var ?array $occupation @var bool $wantsStage @var bool $claude @var bool $fresh @var array $cfg @var array $planned */
use App\Services\Internship\OfferWatch;
use App\Services\Referential\Ref;

use App\Services\Internship\OfferCheck;

$noun = ['stage' => 'stage', 'emploi' => 'emploi', 'tous' => 'stage ou emploi'][$contract];
$nouns = ['stage' => 'offres de stage', 'emploi' => 'offres d\'emploi', 'tous' => 'offres de stage et d\'emploi'][$contract];
$verdicts = array_column(Ref::rules()['thresholds'], 'label', 'key') + ['prerequis' => 'Prérequis manquant'];
$scored = [];
foreach ($review['offers'] ?? [] as $row) {
    $scored[(int)$row['offer']['id']] = $row;
}
?>
<div class="page-head"><div>
    <h1>Préparation sur offres réelles</h1>
    <p>Évalue ton CV sur de vraies <?= e($nouns) ?> publiées au <?= e($countryName) ?> sur des sites vérifiés par NEAM, ou sur une offre que tu as trouvée toi-même (LinkedIn ou autre). Tu sauras ce que demandent ces offres et ce qu'il te reste à préparer avant que des offres du même type paraissent sur Tremplin.</p>
</div></div>

<div class="alert alert-info mb-3"><?= icon('shield-check') ?><div class="small">
    <b>Uniquement des offres réelles.</b> La recherche est limitée aux <?= count($sources) ?> source<?= count($sources) > 1 ? 's' : '' ?> vérifiée<?= count($sources) > 1 ? 's' : '' ?> pour ton pays. Une offre n'est retenue que si sa page existe dans les résultats du moteur de recherche, appartient à l'une de ces sources, est une annonce individuelle (<?= e($noun) ?>) au <?= e($countryName) ?> et date de moins de <?= (int)round($cfg['max_age_days'] / 30) ?> mois quand la date est connue. Ces annonces ne sont pas publiées par Tremplin : elles servent à te préparer. Vérifie toujours l'annonce sur le site d'origine et ne paie jamais pour postuler.
</div></div>

<section class="card card-lg mb-3">
    <form method="get" action="<?= e(url('/espace/preparation-stages')) ?>" class="flex flex-wrap" style="gap:10px;align-items:end">
        <div class="field" style="margin:0"><label for="stage-type">Type d'offres</label>
            <select id="stage-type" name="type"><?php foreach (OfferWatch::CONTRACTS as $k => $l): ?><option value="<?= $k ?>" <?= $k === $contract ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
        <div class="field grow" style="min-width:240px;margin:0"><label for="stage-q">Métier ou domaine recherché</label>
            <input id="stage-q" name="q" value="<?= e($query) ?>" placeholder="Ex. : comptabilité, développeur web, communication" required maxlength="160"></div>
        <div class="field" style="margin:0"><label for="stage-pays">Pays (celui de ton compte)</label><input id="stage-pays" value="<?= e($countryName) ?>" disabled></div>
        <button class="btn btn-ghost" type="submit"><?= icon('eye') ?> Voir les offres déjà repérées</button>
    </form>
    <?php if ($query !== ''): ?>
    <div class="flex flex-wrap mt-2" style="gap:10px;align-items:center">
        <?php if ($claude && !$fresh): ?>
            <form method="post" action="<?= e(url('/espace/preparation-stages/rechercher')) ?>"><?= csrf_field() ?><input type="hidden" name="q" value="<?= e($query) ?>"><input type="hidden" name="type" value="<?= e($contract) ?>">
                <button class="btn btn-primary" type="submit"><?= icon('search') ?> Chercher de nouvelles offres en ligne</button></form>
            <span class="small muted">Recherche par Claude sur les sources vérifiées (1 génération de ton quota).</span>
        <?php elseif ($claude && $fresh): ?>
            <span class="small muted"><?= icon('clock') ?> Recherche en ligne faite <?= e(time_ago($last['created_at'])) ?> pour cette recherche ; prochaine recherche possible à partir du <?= e(date_fr(date('Y-m-d', strtotime((string)$last['created_at']) + 86400 * (int)$cfg['cache_days']))) ?>.</span>
        <?php else: ?>
            <span class="small muted"><?= icon('info') ?> La recherche en ligne utilise Claude, non activé sur cette installation : seules les offres déjà repérées par l'équipe NEAM sont utilisées.</span>
        <?php endif; ?>
        <?php if ($occupation): ?><span class="badge badge-gray" title="Fiche métier utilisée pour évaluer les offres"><?= e($occupation['code'] . ' · ' . $occupation['title']) ?></span><?php endif; ?>
    </div>
    <?php endif; ?>
    <?php if (!$wantsStage && $contract === 'stage'): ?><p class="small muted mt-2 mb-0"><?= icon('lightbulb') ?> Astuce : ajoute « stage » aux types de contrat recherchés dans <a href="<?= e(url('/espace/profil')) ?>">ton profil</a> pour recevoir aussi les offres de stage Tremplin.</p><?php endif; ?>
</section>

<?php if ($query === ''): ?>
    <div class="empty card card-lg"><?= icon('target') ?><h3>Quel poste vises-tu ?</h3><p class="muted">Indique un métier ou un domaine pour commencer.</p></div>
<?php elseif (!$offers): ?>
    <div class="empty card card-lg"><?= icon('search') ?><h3>Aucune offre réelle repérée pour « <?= e($query) ?> » au <?= e($countryName) ?></h3>
        <p class="muted mb-0"><?= $claude ? 'Lance une recherche en ligne : seules les offres qui passent tous les contrôles seront gardées.' : 'L\'équipe NEAM ajoute régulièrement des offres vérifiées. Reviens bientôt.' ?><?= $last && $last['status'] === 'ok' && !(int)$last['kept'] ? ' La dernière recherche n\'a trouvé aucune offre vérifiable.' : '' ?></p></div>
<?php else: ?>
    <?php if ($review['scored']): $s = (int)$review['score']; ?>
    <div class="grid-2 mb-3">
        <div class="card card-lg">
            <div class="score-hero">
                <div class="ring ring-xl <?= score_class($s) ?>" style="--p:<?= $s ?>"><b><?= $s ?><small>/100</small></b></div>
                <div class="grow">
                    <span class="badge badge-<?= $review['ready'] ? 'green' : ($s >= 55 ? 'blue' : 'amber') ?>"><?= $review['ready'] ? 'Prêt·e pour ce type d\'offre' : 'Préparation en cours' ?></span>
                    <h2 class="mt-1" style="font-size:1.25rem"><?php if ($review['ready']): ?>Ton CV répond déjà à ces offres<?php elseif ($s >= $review['threshold']): ?>Bon score, mais des compétences clés manquent<?php else: ?>Encore <?= max(1, $review['threshold'] - $s) ?> point<?= $review['threshold'] - $s > 1 ? 's' : '' ?> pour être prêt·e<?php endif; ?></h2>
                    <p class="small muted mb-0">Moyenne de tes scores d'adéquation sur <?= (int)$review['scored'] ?> offre<?= $review['scored'] > 1 ? 's' : '' ?> réelle<?= $review['scored'] > 1 ? 's' : '' ?> (seuil : <?= (int)$review['threshold'] ?>). Compétences demandées acquises : <?= (int)$review['skills_ratio'] ?> % (<?= (int)$review['skills_ready'] ?> % requis pour être prêt·e). Mêmes règles que pour les offres Tremplin<?= $contract !== 'emploi' ? ' ; pour un stage, niveau attendu d\'un stagiaire : ' . (int)$cfg['level_cap'] . ' (' . e(Ref::LEVELS[$cfg['level_cap']][0] ?? '') . ')' : '' ?>. Référentiels version <?= (int)$review['version'] ?>.</p>
                    <?php if ($review['scored'] < 3): ?><p class="small mt-1 mb-0"><?= icon('alert-triangle') ?> Échantillon réduit : le bilan sera plus fiable avec davantage d'offres.</p><?php endif; ?>
                </div>
            </div>
        </div>
        <div class="card card-lg">
            <h3><?= icon('list-checks') ?> Ce que demandent ces offres</h3>
            <ul class="list-plain small">
                <?php foreach ($review['demanded'] as $d): $ok = $d['have'] >= $d['expected']; ?>
                    <li class="flex" style="justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid var(--line)">
                        <span><?= icon($ok ? 'check-circle-2' : 'circle-alert') ?> <?= e($d['name']) ?> <span class="muted">· <?= (int)$d['count'] ?> offre<?= $d['count'] > 1 ? 's' : '' ?></span></span>
                        <span class="badge badge-<?= $ok ? 'green' : ($d['have'] ? 'amber' : 'gray') ?>"><?= $d['have'] ? 'niveau ' . (int)$d['have'] : 'absente' ?> / <?= (int)$d['expected'] ?></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </div>

    <?php if ($review['gaps']): ?>
    <section class="card card-lg mb-3">
        <div class="card-title"><h2 style="font-size:1.15rem"><?= icon('route') ?> À préparer en priorité</h2></div>
        <p class="small muted">Écarts classés selon le nombre d'offres concernées et les points perdus. En les comblant maintenant, tu seras prêt·e pour les prochaines offres du même type sur Tremplin.</p>
        <ol class="plan-list">
            <?php foreach ($review['gaps'] as $g): ?>
                <li class="mb-2">
                    <b><?= e($g['gap']['text']) ?></b>
                    <p class="small muted mb-1">Dans <?= (int)$g['count'] ?> offre<?= $g['count'] > 1 ? 's' : '' ?> sur <?= (int)$review['scored'] ?> (<?= (int)$g['share'] ?> %) · environ <?= e(number_format($g['avg_lost'], 1, ',', ' ')) ?> point<?= $g['avg_lost'] >= 2 ? 's' : '' ?> perdu<?= $g['avg_lost'] >= 2 ? 's' : '' ?> par offre</p>
                    <?php if ($g['gap']['type'] === 'cv'): ?><a class="btn btn-ghost btn-sm" href="<?= e(url('/espace/cv')) ?>"><?= icon('file-text') ?> Améliorer mon CV</a><?php endif; ?>
                    <?php if ($g['recos']): ?><ul class="reco-list mt-1"><?php foreach ($g['recos'] as $r): ?><?= App\Core\View::partial('partials/reco_item', ['r' => $r, 'gapKey' => $g['gap']['key'], 'planned' => $planned, 'canPlan' => true]) ?><?php endforeach; ?></ul><?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ol>
    </section>
    <?php endif; ?>

    <?php if ($review['strengths']): ?>
    <section class="card card-lg mb-3">
        <h3><?= icon('star') ?> Tes atouts pour ces offres</h3>
        <ul class="small mb-0"><?php foreach ($review['strengths'] as $st): ?><li><?= e($st['text']) ?> <span class="muted">(<?= (int)$st['count'] ?> offre<?= $st['count'] > 1 ? 's' : '' ?>)</span></li><?php endforeach; ?></ul>
    </section>
    <?php endif; ?>
    <?php endif; ?>

    <h2 class="mb-2" style="font-size:1.15rem"><?= icon('briefcase-business') ?> Offres réelles analysées (<?= count($offers) ?>)</h2>
    <div class="grid-2 mb-3">
    <?php foreach ($offers as $o): $row = $scored[(int)$o['id']] ?? null; $m = $row['m'] ?? null; [$stl, $stc] = OfferWatch::STATUSES[$o['offer_status']] ?? OfferWatch::STATUSES['inconnu']; ?>
        <article class="card">
            <div class="flex" style="gap:12px;align-items:flex-start">
                <?php if ($m): ?><div class="ring ring-sm <?= score_class($m['score']) ?>" style="--p:<?= (int)$m['score'] ?>"><b><?= (int)$m['score'] ?></b></div><?php endif; ?>
                <div class="grow">
                    <h3 class="mb-1" style="font-size:1rem"><?= e($o['title']) ?></h3>
                    <p class="small muted mb-1"><?= e(implode(' · ', array_filter([$o['organization'], $o['city'], $o['duration']]))) ?></p>
                    <div class="flex flex-wrap" style="gap:6px">
                        <span class="badge badge-violet"><?= $o['contract'] === 'stage' ? 'Stage' : 'Emploi' ?></span>
                        <span class="badge badge-<?= e($stc) ?>"><?= e($stl) ?></span>
                        <span class="badge badge-gray"><?= $o['published_at'] ? 'Publiée le ' . e(date_fr($o['published_at'])) : ($o['deadline'] ? 'Date limite : ' . e(date_fr($o['deadline'])) : 'Date non indiquée') ?></span>
                        <?php if ($m): ?><span class="badge badge-<?= e($m['verdict']['color']) ?>"><?= e($m['verdict']['label']) ?></span><?php endif; ?>
                    </div>
                </div>
            </div>
            <?php if ($o['summary']): ?><p class="small mt-2 mb-1"><?= e($o['summary']) ?></p><?php endif; ?>
            <?php if ($m): ?>
                <?php if ($m['gap_items']): ?><p class="small mb-1"><b>Écarts :</b> <?= e(implode(' ; ', array_map(fn($g) => $g['text'], array_slice(array_values(array_filter($m['gap_items'], fn($g) => $g['type'] !== 'mobility')), 0, 2)))) ?></p><?php endif; ?>
                <?php if ($m['strengths']): ?><p class="small mb-1"><b>Atouts :</b> <?= e(implode(' ; ', array_slice($m['strengths'], 0, 2))) ?></p><?php endif; ?>
            <?php else: ?>
                <p class="small muted mb-1"><?= icon('info') ?> Annonce trop peu détaillée pour être notée (aucune compétence ni fiche métier reconnue).</p>
            <?php endif; ?>
            <div class="flex flex-wrap mt-1" style="gap:8px;align-items:center">
                <a class="btn btn-ghost btn-sm" href="<?= e($o['url']) ?>" target="_blank" rel="noopener noreferrer nofollow">Annonce d'origine <?= icon('external-link') ?></a>
                <span class="small muted">Source : <?= e($o['source_name'] ?? '—') ?><?= in_array($o['link_status'], ['protege', 'non_controle'], true) ? ' · lien non contrôlé automatiquement' : '' ?></span>
                <details class="small" style="margin-left:auto"><summary class="muted">Signaler</summary>
                    <form method="post" action="<?= e(url('/espace/preparation-stages/offres/' . $o['id'] . '/signaler')) ?>" class="flex mt-1" style="gap:6px"><?= csrf_field() ?>
                        <input name="reason" placeholder="Offre douteuse, payante, erronée…" maxlength="200" aria-label="Motif"><button class="btn btn-ghost btn-sm" type="submit"><?= icon('flag') ?></button></form>
                </details>
            </div>
        </article>
    <?php endforeach; ?>
    </div>
<?php endif; ?>

<?php if ($history): ?>
<section class="card card-lg mb-3">
    <h3><?= icon('activity') ?> Mes bilans</h3>
    <table class="table small"><thead><tr><th>Recherche</th><th>Offres</th><th>Score</th><th>Date</th></tr></thead><tbody>
    <?php foreach ($history as $h): ?><tr><td><a href="<?= e(url('/espace/preparation-stages', ['q' => $h['query'], 'type' => $h['contract']])) ?>"><?= e($h['query']) ?></a> <span class="muted">· <?= e(OfferWatch::CONTRACTS[$h['contract']] ?? '') ?></span></td><td><?= (int)$h['offers'] ?></td><td><span class="badge badge-<?= (int)$h['ready'] ? 'green' : 'blue' ?>"><?= (int)$h['score'] ?></span></td><td><?= e(date_fr($h['created_at'])) ?></td></tr><?php endforeach; ?>
    </tbody></table>
</section>
<?php endif; ?>

<section class="card card-lg mb-3" id="offre-trouvee">
    <div class="card-title"><h2 style="font-size:1.15rem"><?= icon('link') ?> Évaluer une offre que j'ai trouvée</h2></div>
    <p class="small muted">Tu as vu une offre sur LinkedIn ou un autre site ? Copie son texte ici : ton CV est évalué dessus avec les mêmes règles. Tremplin n'accède pas au site à ta place (LinkedIn n'autorise pas les accès automatisés) ; seul le texte que tu colles est lu, et l'évaluation reste privée.</p>
    <form method="post" action="<?= e(url('/espace/preparation-stages/offre-trouvee')) ?>" class="ext-offer-form"><?= csrf_field() ?>
        <div class="field"><label for="oc-title">Intitulé du poste</label><input id="oc-title" name="title" required maxlength="190" placeholder="Ex. : Comptable junior"></div>
        <div class="field"><label for="oc-url">Lien de l'annonce (facultatif)</label><input id="oc-url" name="url" type="url" maxlength="500" placeholder="https://www.linkedin.com/jobs/view/…"></div>
        <div class="field" style="grid-column:1/-1"><label for="oc-text">Texte de l'annonce</label>
            <textarea id="oc-text" name="offer_text" rows="7" required minlength="<?= OfferCheck::MIN_CHARS ?>" maxlength="<?= OfferCheck::MAX_CHARS ?>" placeholder="Colle ici les missions, le profil recherché, les compétences demandées…"></textarea>
            <span class="hint"><?= $claude ? 'Lecture par Claude, contrôlée : tout élément absent du texte est écarté (1 génération de ton quota).' : 'Lecture par les règles du référentiel NEAM (compétences, diplôme, expérience, langues).' ?></span></div>
        <div><button class="btn btn-primary btn-sm" type="submit"><?= icon('gauge') ?> Évaluer mon CV sur cette offre</button></div>
    </form>
    <?php if ($checks): ?>
    <table class="table small mt-2"><thead><tr><th>Offre</th><th>Site</th><th>Score</th><th>Date</th></tr></thead><tbody>
    <?php foreach ($checks as $c): ?><tr>
        <td><a href="<?= e(url('/espace/preparation-stages/offres-evaluees/' . $c['id'])) ?>"><?= e($c['title']) ?></a> <span class="muted">· <?= $c['contract'] === 'stage' ? 'stage' : 'emploi' ?></span></td>
        <td><?= e($c['site'] ?: '—') ?></td>
        <td><?= $c['score'] !== null ? '<span class="badge badge-blue">' . (int)$c['score'] . '</span> <span class="muted">' . e($verdicts[$c['verdict']] ?? '') . '</span>' : '—' ?></td>
        <td><?= e(date_fr($c['created_at'])) ?></td></tr><?php endforeach; ?>
    </tbody></table>
    <?php endif; ?>
</section>

<p class="small muted"><?= icon('info') ?> Sources vérifiées pour le <?= e($countryName) ?> : <?= e(implode(', ', array_column($sources, 'name'))) ?: 'aucune pour l\'instant' ?>. Les offres viennent de ces sites ; Tremplin n'en est pas l'auteur et ne transmet aucune candidature. LinkedIn n'est jamais interrogé directement : ses annonces ne viennent que des résultats du moteur de recherche ou de ce que tu colles.</p>
