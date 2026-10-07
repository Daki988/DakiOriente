<div class="page-head"><div><h1>Versions et jeu de référence</h1><p>Chaque publication crée une version numérotée des référentiels avec son journal. Une version n'est mise en production qu'après passage du jeu de référence : l'écart moyen avec les experts doit rester sous <?= (int)$limits['max_mae'] ?> points.</p></div></div>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'versions']) ?>
<?php $fmt = fn($v) => $v === null ? '—' : number_format($v, 1, ',', ' '); ?>
<div class="grid-2 mb-3">
    <section class="card card-lg">
        <h2 style="font-size:1.1rem"><?= icon('layers') ?> Publier une nouvelle version</h2>
        <div class="ref-stats mb-2">
            <div class="ref-stat"><small>Écart moyen, version en vigueur</small><b><?= $fmt($live['mae']) ?></b><small><?= (int)$live['pairs'] ?> couple(s)</small></div>
            <div class="ref-stat"><small>Écart moyen, version à publier</small><b class="<?= $draft['mae'] !== null && $draft['mae'] >= $limits['max_mae'] ? 'kpi-ko' : '' ?>"><?= $fmt($draft['mae']) ?></b><small>maximum <?= (int)$limits['max_mae'] ?> points</small></div>
        </div>
        <p class="small"><b><?= count($changes) ?></b> modification(s) en attente. Jeu de référence : <?= (int)$draft['pairs'] ?> couple(s) sur <?= (int)$limits['min_pairs'] ?> minimum requis<?= $draft['pairs'] < $limits['min_pairs'] ? ' : la publication devra être confirmée explicitement et sera signalée dans le journal' : '' ?>.</p>
        <?php if ($canValidate): ?>
        <form method="post" action="<?= e(url('/admin/referentiels/versions')) ?>" class="stack-sm">
            <?= csrf_field() ?>
            <div class="field"><label for="vl">Libellé</label><input id="vl" name="label" placeholder="Ex. Validation des fiches Logistique et BTP"></div>
            <?php if ($draft['pairs'] < $limits['min_pairs']): ?><label class="check"><input type="checkbox" name="force" value="1"> <span class="small">Publier malgré un jeu de référence incomplet</span></label><?php endif; ?>
            <button class="btn btn-primary" type="submit"><?= icon('send') ?> Publier la version</button>
        </form>
        <?php else: ?><p class="small muted">Seul le responsable des référentiels publie les versions.</p><?php endif; ?>
        <details class="mt-2"><summary class="small"><b>Journal en attente</b></summary><ul class="small mt-1"><?php foreach ($changes as $c): ?><li><?= e($c['summary']) ?> <span class="muted">· <?= e(date_fr($c['created_at'])) ?><?= $c['first_name'] ? ', ' . e($c['first_name']) : '' ?></span></li><?php endforeach; ?></ul></details>
    </section>
    <section class="card card-lg">
        <h2 style="font-size:1.1rem">Versions publiées</h2>
        <ul class="list"><?php foreach ($versions as $v): $s = json_decode((string)$v['stats'], true) ?: []; ?><li style="display:block">
            <b>Version <?= (int)$v['number'] ?></b> — <?= e($v['label']) ?><br>
            <small class="muted"><?= e(date_fr($v['published_at'], true)) ?><?= $v['first_name'] ? ' par ' . e($v['first_name']) : '' ?> · <?= (int)($s['occupations'] ?? 0) ?> fiches dont <?= (int)($s['validated'] ?? 0) ?> validées · jeu de référence : <?= (int)$v['golden_pairs'] ?> couple(s)<?= $v['golden_mae'] !== null ? ', écart ' . e(str_replace('.', ',', $v['golden_mae'])) : '' ?> · empreinte <?= e(substr((string)$v['checksum'], 0, 12)) ?></small>
            <details><summary class="small">Journal</summary><pre class="small" style="white-space:pre-wrap"><?= e($v['changelog']) ?></pre></details></li><?php endforeach; ?></ul>
    </section>
</div>
<section class="card card-lg" id="jeu">
    <h2 style="font-size:1.1rem"><?= icon('target') ?> Jeu de référence</h2>
    <p class="small muted">Couples profil-offre notés par des experts (objectif : 200). Le profil et l'offre sont figés à la date de notation, avec un minimum de données personnelles. Avant toute publication, le moteur les recalcule et compare.</p>
    <form method="post" action="<?= e(url('/admin/referentiels/jeu-de-reference')) ?>" class="form-grid cols-3 mb-3" style="align-items:end">
        <?= csrf_field() ?>
        <div class="field"><label for="gc">Candidat</label><select id="gc" name="candidate"><?php foreach ($candidates as $c): ?><option value="<?= (int)$c['id'] ?>"><?= e($c['first_name'] . ' ' . $c['last_name']) ?></option><?php endforeach; ?></select></div>
        <div class="field"><label for="gj">Offre</label><select id="gj" name="job"><?php foreach ($jobs as $j): ?><option value="<?= (int)$j['id'] ?>"><?= e($j['title'] . ' — ' . $j['company']) ?></option><?php endforeach; ?></select></div>
        <div class="field"><label for="gs">Note de l'expert (0-100)</label><input id="gs" name="expert_score" type="number" min="0" max="100" required></div>
        <div class="field span-2"><label for="gn">Commentaire</label><input id="gn" name="note" maxlength="255"></div>
        <div><button class="btn btn-soft" type="submit"><?= icon('plus') ?> Ajouter le couple</button></div>
    </form>
    <?php if (!$live['rows']): ?><p class="muted small">Aucun couple noté pour l'instant.</p><?php else: ?>
    <div class="table-wrap"><table class="table"><thead><tr><th>Couple</th><th>Expert</th><th>Moteur (en vigueur)</th><th>Moteur (brouillon)</th><th>Écart</th><th></th></tr></thead><tbody>
        <?php foreach ($live['rows'] as $r): $d = $byId[$r['id']] ?? null; ?><tr>
            <td><?= e($r['label']) ?><?= $r['note'] ? '<br><small class="muted">' . e($r['note']) . '</small>' : '' ?></td>
            <td><b><?= (int)$r['expert'] ?></b></td><td><?= (int)$r['engine'] ?></td><td><?= $d ? (int)$d['engine'] : '—' ?></td>
            <td class="<?= abs($r['diff']) >= $limits['max_mae'] ? 'kpi-ko' : 'kpi-ok' ?>"><?= $r['diff'] > 0 ? '+' : '' ?><?= (int)$r['diff'] ?></td>
            <td><form method="post" action="<?= e(url('/admin/referentiels/jeu-de-reference/' . $r['id'] . '/supprimer')) ?>" data-confirm="Retirer ce couple ?"><?= csrf_field() ?><button class="btn btn-ghost btn-icon btn-sm" type="submit" aria-label="Retirer"><?= icon('trash-2') ?></button></form></td></tr><?php endforeach; ?>
    </tbody></table></div><?php endif; ?>
</section>
