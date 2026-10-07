<?php
/** @var array $e  @var array $history  @var int $avg  @var array $occupations  @var array $planned */
$chart = ['type' => 'line', 'data' => ['labels' => array_map(fn($h) => date_fr($h['created_at']), $history), 'datasets' => [['label' => 'Mon score', 'data' => array_map(fn($h) => (int)$h['score'], $history)]]], 'options' => ['scales' => ['y' => ['min' => 0, 'max' => 100]]]];
$targetIds = array_column($e['targets'], 'id');
$bySector = [];
foreach ($occupations as $o) {
    $bySector[$o['sector'] ?: 'Autres'][] = $o;
}
$basis = ['offres' => 'les offres publiées les plus proches de tes métiers cibles', 'fiches' => 'les fiches de tes métiers cibles (aucune offre proche publiée pour l\'instant)', 'meilleures' => 'tes offres les plus compatibles, en attendant que tu choisisses tes métiers cibles'][$e['basis']] ?? '';
?>
<div class="page-head"><div><h1>Score d'employabilité</h1><p>Ton score est la moyenne de tes scores d'adéquation sur les <?= count($e['offers']) ?: 10 ?> offres les plus proches du métier que tu vises. À partir de <?= (int)$e['threshold'] ?>, ton profil est jugé prêt pour ce métier.</p></div></div>
<div class="grid-2 mb-3">
    <div class="card card-lg">
        <div class="score-hero">
            <div class="ring ring-xl <?= score_class($e['score']) ?>" style="--p:<?= $e['score'] ?>"><b><?= $e['score'] ?><small>/100</small></b></div>
            <div class="grow">
                <span class="badge badge-<?= $e['ready'] ? 'green' : ($e['score'] >= 55 ? 'blue' : 'amber') ?>"><?= e($e['label']) ?></span>
                <h2 class="mt-1" style="font-size:1.3rem"><?= $e['ready'] ? 'Ton profil est prêt' : 'Encore ' . max(0, (int)$e['threshold'] - $e['score']) . ' point' . ((int)$e['threshold'] - $e['score'] > 1 ? 's' : '') . ' pour être prêt·e' ?></h2>
                <p class="small muted mb-0">Calculé sur <?= e($basis) ?>. Moyenne des candidats Tremplin : <b><?= $avg ?></b>. Référentiels version <?= (int)$e['version'] ?>.</p>
            </div>
        </div>
    </div>
    <div class="card card-lg">
        <h3>Évolution</h3>
        <?php if (count($history) > 1): ?><div class="chart-box sm"><canvas data-chart='<?= e(json_encode($chart)) ?>' role="img" aria-label="Évolution de ton score"></canvas></div>
        <?php else: ?><p class="small muted">Ta courbe apparaîtra à ta prochaine mise à jour de profil.</p><?php endif; ?>
    </div>
</div>

<section class="card card-lg mb-3" id="cibles">
    <div class="card-title"><h2 style="font-size:1.15rem"><?= icon('target') ?> Mes métiers cibles <small class="muted">(1 à 3)</small></h2></div>
    <?php if ($e['inferred']): ?><div class="alert alert-info mb-2"><?= icon('info') ?><div class="small">Nous avons reconnu ton métier visé dans ton profil. Confirme-le ou choisis jusqu'à trois métiers : ton score se calculera sur les offres les plus proches.</div></div><?php endif; ?>
    <?php if ($e['targets']): ?>
        <div class="grid-3 mb-2">
            <?php foreach ($e['targets'] as $t): ?>
                <div class="card" style="box-shadow:none">
                    <span class="badge badge-gray"><?= e($t['code']) ?></span>
                    <h3 class="mt-1 mb-1" style="font-size:1rem"><?= e($t['title']) ?></h3>
                    <div class="flex" style="align-items:center;gap:10px"><div class="ring ring-sm <?= score_class($t['score']) ?>" style="--p:<?= (int)$t['score'] ?>"><b><?= (int)$t['score'] ?></b></div><span class="badge badge-<?= e($t['verdict']['color']) ?>"><?= e($t['verdict']['label']) ?></span></div>
                    <p class="small muted mt-1 mb-1">Écart avec la fiche métier :</p>
                    <ul class="small" style="padding-left:1.1em;margin:0"><?php foreach ($t['gaps'] ?: [['text' => 'Aucun écart sur la fiche métier.']] as $g): ?><li><?= e($g['text']) ?></li><?php endforeach; ?></ul>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
    <form method="post" action="<?= e(url('/espace/metiers-cibles')) ?>" class="stack-sm">
        <?= csrf_field() ?>
        <div class="form-grid cols-3">
            <?php for ($i = 0; $i < 3; $i++): $cur = $targetIds[$i] ?? null; ?>
                <div class="field"><label for="tg<?= $i ?>">Métier <?= $i + 1 ?><?= $i ? ' (facultatif)' : '' ?></label>
                    <select id="tg<?= $i ?>" name="targets[]"><option value="">—</option>
                        <?php foreach ($bySector as $sec => $list): ?><optgroup label="<?= e($sec) ?>"><?php foreach ($list as $o): ?><option value="<?= (int)$o['id'] ?>" <?= (int)$o['id'] === $cur ? 'selected' : '' ?>><?= e($o['title']) ?></option><?php endforeach; ?></optgroup><?php endforeach; ?>
                    </select></div>
            <?php endfor; ?>
        </div>
        <div><button class="btn btn-primary" type="submit"><?= icon('check') ?> Enregistrer mes métiers cibles</button></div>
    </form>
</section>

<div class="grid-2">
    <section class="card card-lg">
        <h2 style="font-size:1.15rem"><?= icon('route') ?> Plan de progression</h2>
        <p class="small muted">Les écarts à combler, classés par gain estimé sur ton score d'employabilité. Chaque gain est mesuré en relançant le calcul avec l'écart comblé.</p>
        <?php if (!$e['plan']): ?><p class="muted">Aucun écart significatif : concentre-toi sur tes candidatures et ta préparation aux entretiens.</p><?php endif; ?>
        <div class="stack">
            <?php foreach ($e['plan'] as $i => $s): ?>
                <div class="gap-row">
                    <div class="flex between" style="align-items:flex-start;gap:12px">
                        <div class="grow"><span class="gap-rank" style="width:26px;height:26px;display:inline-grid;font-size:.8rem"><?= $i + 1 ?></span>
                            <b style="color:var(--navy)"> <?= e($s['label']) ?></b><br><small class="muted">Demandé dans <?= (int)$s['count'] ?> des <?= (int)$s['of'] ?> offres retenues</small></div>
                        <?php if ($s['gain'] > 0): ?><div class="gap-gain sm"><b>+<?= (int)$s['gain'] ?></b><span>pts</span></div><?php endif; ?>
                    </div>
                    <?php if (!empty($s['recos'])): ?><ul class="reco-list mt-1"><?php foreach ($s['recos'] as $r): ?><?= App\Core\View::partial('partials/reco_item', ['r' => $r, 'gapKey' => $s['key'], 'planned' => $planned, 'canPlan' => true]) ?><?php endforeach; ?></ul><?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
    </section>
    <section class="stack">
        <div class="card card-lg">
            <h2 style="font-size:1.15rem"><?= icon('briefcase-business') ?> Offres prises en compte</h2>
            <?php if (!$e['offers']): ?><p class="small muted">Aucune offre proche publiée pour l'instant : ton score se base sur les fiches de tes métiers cibles.</p><?php endif; ?>
            <ul class="list">
                <?php foreach ($e['offers'] as $o): ?>
                    <li><a class="list-link" href="<?= e(url('/offres/' . $o['id'])) ?>"><span class="ring ring-sm <?= score_class($o['score']) ?>" style="--p:<?= (int)$o['score'] ?>"><b><?= (int)$o['score'] ?></b></span><span class="grow"><b style="font-size:.92rem"><?= e($o['title']) ?></b><br><small class="muted"><?= e($o['company']) ?> · <?= e(['même métier', 'métier proche', 'même famille de métiers'][$o['rank']] ?? 'offre compatible') ?> · <?= e($o['verdict']['label']) ?></small></span><?= icon('chevron-right') ?></a></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <div class="alert alert-info"><?= icon('shield-check') ?><div class="small"><b>Transparence :</b> chaque score d'adéquation est calculé par les règles publiées du référentiel Objectifs & Seuils (compétences 40, diplôme 20, expérience 15, langues 10, qualité du CV 10, localisation 5). Aucune donnée liée au sexe, à l'âge ou à l'origine n'est utilisée.</div></div>
        <div class="flex flex-wrap"><a class="btn btn-primary" href="<?= e(url('/espace/plan')) ?>"><?= icon('route') ?> Mon plan 30/60/90 jours</a><a class="btn btn-ghost" href="<?= e(url('/espace/progression')) ?>"><?= icon('trending-up') ?> Axes de progression</a></div>
    </section>
</div>
