<?php $cands = array_column($candidates, null, 'id'); ?>
<div class="page-head"><div><h1>Moteur de matching</h1><p>Poids configurables par secteur, recalibrables à partir des résultats réels. Les poids sont normalisés à 100.</p></div></div>
<div class="grid-3 mb-3">
    <div class="kpi"><span class="ki green"><?= icon('trophy') ?></span><div><b><?= $quality['accepted'] ?> %</b><span>Score moyen des candidatures acceptées</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('star') ?></span><div><b><?= $quality['shortlisted'] ?> %</b><span>… présélectionnées / entretien</span></div></div>
    <div class="kpi"><span class="ki amber"><?= icon('circle-x') ?></span><div><b><?= $quality['rejected'] ?> %</b><span>… refusées</span></div></div>
</div>
<p class="small muted mb-3"><?= icon('info') ?> Un écart net entre acceptées et refusées indique un matching discriminant. Si l'écart se réduit, recalibrez les poids du secteur concerné.</p>
<div class="layout-aside">
    <form method="post" action="<?= e(url('/admin/matching')) ?>" class="card card-lg">
        <?= csrf_field() ?>
        <input type="hidden" name="sector_id" value="<?= (int)$sectorId ?>">
        <div class="card-title"><h2><?= $sectorId ? 'Poids du secteur' : 'Poids par défaut (tous secteurs)' ?></h2><?php if ($sectorId && !$raw): ?><span class="badge badge-gray">Hérite du défaut</span><?php endif; ?></div>
        <div class="table-wrap"><table class="table">
            <thead><tr><th>Critère</th><th>Poids saisi</th><th>Poids effectif</th></tr></thead>
            <tbody><?php foreach ($criteria as $k => [$label, $default]): ?>
                <tr><td><b><?= e($label) ?></b><br><small class="muted">Référence cahier des charges : <?= $default ?> %</small></td>
                    <td><label class="sr-only" for="w-<?= $k ?>">Poids <?= e($label) ?></label><input id="w-<?= $k ?>" class="input" type="number" min="0" max="100" name="w[<?= $k ?>]" value="<?= (int)($raw[$k] ?? round($weights[$k])) ?>" style="max-width:110px"></td>
                    <td style="min-width:140px"><div class="bar"><i data-w="<?= round($weights[$k] * 2) ?>"></i></div><small class="tabular"><?= number_format($weights[$k], 1, ',', '') ?> %</small></td></tr>
            <?php endforeach; ?></tbody>
        </table></div>
        <div class="flex mt-2"><button class="btn btn-primary" type="submit"><?= icon('check') ?> Enregistrer les poids</button>
            <?php if ($sectorId && $raw): ?><button class="btn btn-ghost" type="submit" name="reset" value="1">Revenir au défaut</button><?php endif; ?></div>
        <p class="small muted mt-2 mb-0">Critère éliminatoire : le niveau d'étude marqué « obligatoire » par le recruteur plafonne le score à 25 %, indépendamment des poids.</p>
    </form>
    <aside class="stack">
        <div class="card">
            <h3>Secteur</h3>
            <ul class="list small">
                <li><a class="list-link" href="<?= e(url('/admin/matching')) ?>"><span class="grow"><b>Défaut (tous secteurs)</b></span><?= !$sectorId ? icon('check') : '' ?></a></li>
                <?php foreach ($sectors as $s): ?><li><a class="list-link" href="<?= e(url('/admin/matching', ['sector' => $s['id']])) ?>"><span class="grow"><?= e($s['name']) ?></span><?= $s['custom'] ? '<span class="badge badge-blue">personnalisé</span>' : '' ?><?= (int)$sectorId === (int)$s['id'] ? icon('check') : '' ?></a></li><?php endforeach; ?>
            </ul>
        </div>
        <form method="get" class="card stack-sm">
            <h3 class="mb-0"><?= icon('target') ?> Simulateur</h3>
            <?php if ($sectorId): ?><input type="hidden" name="sector" value="<?= (int)$sectorId ?>"><?php endif; ?>
            <select name="cand" class="input" aria-label="Candidat"><?php foreach ($candidates as $c): ?><option value="<?= (int)$c['id'] ?>" <?= (int)input('cand') === (int)$c['id'] ? 'selected' : '' ?>><?= e($c['first_name'] . ' ' . $c['last_name']) ?></option><?php endforeach; ?></select>
            <select name="job" class="input" aria-label="Offre"><?php foreach ($jobs as $j): ?><option value="<?= (int)$j['id'] ?>" <?= (int)input('job') === (int)$j['id'] ? 'selected' : '' ?>><?= e($j['title']) ?></option><?php endforeach; ?></select>
            <button class="btn btn-soft btn-sm" type="submit">Calculer</button>
            <?php if ($sim): ?><div class="mt-1"><?= App\Core\View::partial('partials/match_explain', ['match' => $sim]) ?></div><?php endif; ?>
        </form>
    </aside>
</div>
