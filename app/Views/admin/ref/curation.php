<?php
$K = App\Services\Referential\Curation::KINDS;
$R = App\Services\Referential\Ref::class;
?>
<div class="page-head"><div><h1>File de curation</h1><p>Appellations inconnues, compétences non reconnues, diplômes à vérifier, explications signalées par les candidats, liens de formation morts : rien n'est ignoré, chaque élément est traité par un curateur.</p></div></div>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'curation']) ?>
<nav class="tabs mb-3">
    <a class="<?= $kind === '' ? 'active' : '' ?>" href="<?= e(url('/admin/curation', ['statut' => $status])) ?>">Tout (<?= array_sum($counts) ?>)</a>
    <?php foreach ($K as $k => [$l]): ?><a class="<?= $kind === $k ? 'active' : '' ?>" href="<?= e(url('/admin/curation', ['type' => $k, 'statut' => $status])) ?>"><?= e($l) ?> (<?= (int)($counts[$k] ?? 0) ?>)</a><?php endforeach; ?>
</nav>
<p class="small"><?php foreach (['ouvert' => 'Ouverts', 'traite' => 'Traités', 'rejete' => 'Rejetés'] as $k => $l): ?><a class="badge badge-<?= $status === $k ? 'blue' : 'gray' ?>" href="<?= e(url('/admin/curation', ['type' => $kind, 'statut' => $k])) ?>"><?= $l ?></a> <?php endforeach; ?></p>
<?php if (!$items): ?><?= App\Core\View::partial('partials/empty', ['icon' => 'check', 'title' => 'File vide', 'text' => 'Aucun élément dans cette catégorie.']) ?><?php endif; ?>
<div class="stack">
<?php foreach ($items as $it): [$kl, $ki] = $K[$it['kind']] ?? [$it['kind'], 'info']; $sug = json_decode((string)$it['suggestion'], true) ?: []; $ctx = json_decode((string)$it['context'], true) ?: []; ?>
    <article class="card">
        <div class="flex between" style="gap:12px;align-items:flex-start">
            <div class="grow">
                <span class="badge badge-gray"><?= icon($ki) ?> <?= e($kl) ?></span> <?php if ((int)$it['hits'] > 1): ?><span class="badge badge-amber"><?= (int)$it['hits'] ?> occurrences</span><?php endif; ?>
                <h3 class="mt-1 mb-0" style="font-size:1rem"><?= e($it['label']) ?></h3>
                <small class="muted">Source : <?= e($it['source']) ?><?= $it['ref_id'] && $it['source'] === 'offre' ? ' · <a href="' . e(url('/offres/' . $it['ref_id'])) . '">offre n° ' . (int)$it['ref_id'] . '</a>' : '' ?> · <?= e(time_ago($it['created_at'])) ?></small>
                <?php if ($sug): ?><p class="small mb-0 mt-1"><?= icon('lightbulb') ?> Suggestion : <?= e(implode(' · ', array_filter([$sug['code'] ?? ($sug['rome'] ?? null), $sug['title'] ?? ($sug['fiche'] ?? ($sug['name'] ?? null)), isset($sug['confidence']) ? 'confiance ' . $sug['confidence'] . ' %' : null, isset($sug['choisi_par']) ? 'choisi par le recruteur' : null]))) ?></p><?php endif; ?>
                <?php if (!empty($ctx['reason'])): ?><p class="small mb-0 mt-1"><b>Motif :</b> <?= e($ctx['reason']) ?> <span class="muted">(score <?= (int)($ctx['score'] ?? 0) ?>, version <?= (int)($ctx['version'] ?? 0) ?>)</span></p><?php endif; ?>
                <?php if (!empty($ctx['url'])): ?><p class="small mb-0 mt-1"><a href="<?= e($ctx['url']) ?>" target="_blank" rel="noopener noreferrer"><?= e($ctx['url']) ?></a><?= isset($ctx['http']) ? ' · HTTP ' . (int)$ctx['http'] : '' ?></p><?php endif; ?>
                <?php if ($it['resolution']): ?><p class="small mb-0 mt-1"><?= icon('check') ?> <?= e($it['resolution']) ?></p><?php endif; ?>
            </div>
        </div>
        <?php if ($it['status'] === 'ouvert'): $act = url('/admin/curation/' . $it['id']); $tk = csrf_field() . '<input type="hidden" name="type" value="' . e($kind) . '">'; ?>
        <div class="flex flex-wrap mt-2" style="gap:8px;align-items:end">
            <?php if ($it['kind'] === 'appellation'): ?>
                <form method="post" action="<?= e($act) ?>" class="flex" style="gap:6px"><?= $tk ?><input type="hidden" name="action" value="attach_occupation">
                    <select class="input" name="occupation_id" aria-label="Fiche métier"><?php foreach ($occupations as $o): ?><option value="<?= (int)$o['id'] ?>" <?= ($sug['code'] ?? '') === $o['code'] ? 'selected' : '' ?>><?= e($o['code'] . ' — ' . $o['title']) ?></option><?php endforeach; ?></select>
                    <button class="btn btn-soft btn-sm" type="submit">Ajouter comme appellation</button></form>
                <?php if (!empty($sug['rome'])): ?><a class="btn btn-ghost btn-sm" href="<?= e(url('/admin/referentiels/metiers', ['q' => $sug['rome']])) ?>">Fiche ROME <?= e($sug['rome']) ?></a><?php endif; ?>
            <?php elseif ($it['kind'] === 'competence'): ?>
                <form method="post" action="<?= e($act) ?>" class="flex" style="gap:6px"><?= $tk ?><input type="hidden" name="action" value="attach_skill">
                    <select class="input" name="skill_id" aria-label="Compétence"><?php foreach ($skills as $s): ?><option value="<?= (int)$s['id'] ?>" <?= ($sug['name'] ?? '') === $s['name'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select>
                    <button class="btn btn-soft btn-sm" type="submit">Synonyme de…</button></form>
                <form method="post" action="<?= e($act) ?>" class="flex" style="gap:6px"><?= $tk ?><input type="hidden" name="action" value="create_skill"><input type="hidden" name="name" value="<?= e($it['label']) ?>">
                    <select class="input" name="category" aria-label="Catégorie"><?php foreach ($R::CATEGORIES as $k => [$l]): ?><option value="<?= $k ?>"><?= e($l) ?></option><?php endforeach; ?></select>
                    <button class="btn btn-ghost btn-sm" type="submit">Créer la compétence</button></form>
            <?php elseif ($it['kind'] === 'diplome'): ?>
                <form method="post" action="<?= e($act) ?>" class="flex" style="gap:6px"><?= $tk ?><input type="hidden" name="action" value="attach_degree">
                    <select class="input" name="degree_id" aria-label="Diplôme"><?php foreach ($degrees as $d): ?><option value="<?= (int)$d['id'] ?>" <?= (int)($sug['id'] ?? 0) === (int)$d['id'] ? 'selected' : '' ?>><?= e($R::degreeLabel((int)$d['level'], true) . ' — ' . $d['title']) ?></option><?php endforeach; ?></select>
                    <button class="btn btn-soft btn-sm" type="submit">Rattacher (synonyme)</button></form>
                <a class="btn btn-ghost btn-sm" href="<?= e(url('/admin/referentiels/diplomes')) ?>">Diplômes déclarés</a>
            <?php elseif ($it['kind'] === 'lien'): ?>
                <form method="post" action="<?= e($act) ?>"><?= $tk ?><input type="hidden" name="action" value="recheck"><button class="btn btn-soft btn-sm" type="submit">Revérifier le lien</button></form>
                <form method="post" action="<?= e($act) ?>"><?= $tk ?><input type="hidden" name="action" value="hide_training"><button class="btn btn-ghost btn-sm" type="submit">Retirer la formation</button></form>
            <?php elseif ($it['kind'] === 'offre_stage'): ?>
                <form method="post" action="<?= e($act) ?>"><?= $tk ?><input type="hidden" name="action" value="hide_offer"><button class="btn btn-soft btn-sm" type="submit">Retirer l'offre de la préparation</button></form>
                <a class="btn btn-ghost btn-sm" href="<?= e(url('/admin/veille-stages')) ?>">Veille des stages</a>
            <?php endif; ?>
            <form method="post" action="<?= e($act) ?>" class="flex" style="gap:6px"><?= $tk ?>
                <input class="input" name="note" placeholder="Résolution (facultatif)" aria-label="Résolution" style="min-width:200px">
                <button class="btn btn-ghost btn-sm" name="action" value="done" type="submit"><?= icon('check') ?> Traité</button>
                <button class="btn btn-ghost btn-sm" name="action" value="reject" type="submit"><?= icon('x') ?> Rejeter</button></form>
        </div>
        <?php endif; ?>
    </article>
<?php endforeach; ?>
</div>
