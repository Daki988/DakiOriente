<?php
/** @var array $platforms  @var array $top  @var array $certificates  @var array $stats  @var array $connectors */
$cs = App\Controllers\Candidate\LearningController::CERT_STATUS;
?>
<div class="page-head"><div><h1>Formations & certificats</h1><p>Catalogue des plateformes de formation en ligne (français et anglais), synchronisation, import et vérification des certificats déclarés par les candidats.</p></div></div>
<div class="grid-4 mb-3">
    <div class="kpi"><span class="ki"><?= icon('graduation-cap') ?></span><div><b><?= $stats['trainings'] ?></b><span>Formations actives · <?= $stats['fr'] ?> en français</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('users') ?></span><div><b><?= $stats['learners'] ?></b><span>Candidats en formation</span></div></div>
    <div class="kpi"><span class="ki green"><?= icon('circle-check-big') ?></span><div><b><?= $stats['completed'] ?></b><span>Formations terminées</span></div></div>
    <div class="kpi"><span class="ki amber"><?= icon('award') ?></span><div><b><?= $stats['certificates'] ?></b><span>Certificats · <?= $stats['pending'] ?> à vérifier</span></div></div>
</div>

<section class="card card-lg mb-3">
    <h2 style="font-size:1.15rem">Plateformes</h2>
    <div class="table-wrap"><table class="table">
        <thead><tr><th>Plateforme</th><th>Source</th><th>Formations</th><th>Clics</th><th>Candidats</th><th class="hide-mobile">Dernière mise à jour</th><th>Paramètres</th></tr></thead>
        <tbody>
        <?php foreach ($platforms as $p): $auto = in_array($p['slug'], $connectors, true); ?>
            <tr>
                <td><span class="platform-chip" style="--pc:<?= e($p['color']) ?>"><i aria-hidden="true"></i><?= e($p['name']) ?></span><?= $p['active'] ? '' : ' <span class="badge badge-gray">masquée</span>' ?><br><a class="small" href="<?= e(url('/formations/plateformes/' . $p['slug'])) ?>" target="_blank">Voir la page</a></td>
                <td class="small"><?= $auto ? '<span class="badge badge-green">API automatique</span>' : '<span class="badge badge-gray">Sélection / import</span>' ?></td>
                <td class="tabular"><?= (int)$p['courses'] ?><?= $p['hidden'] ? ' <small class="muted">(' . (int)$p['hidden'] . ' masquées)</small>' : '' ?></td>
                <td class="tabular"><?= (int)$p['clicks'] ?></td>
                <td class="tabular"><?= (int)$p['learners'] ?></td>
                <td class="small hide-mobile"><?= $p['last_sync_at'] ? e(time_ago($p['last_sync_at'])) : '—' ?></td>
                <td>
                    <form method="post" action="<?= e(url('/admin/formations/plateformes/' . $p['id'])) ?>" class="flex flex-wrap" style="gap:6px">
                        <?= csrf_field() ?>
                        <label class="sr-only" for="aff<?= (int)$p['id'] ?>">Paramètre d'affiliation</label>
                        <input id="aff<?= (int)$p['id'] ?>" name="affiliate_param" class="input" style="min-height:34px;max-width:170px;font-size:.8rem" value="<?= e($p['affiliate_param']) ?>" placeholder="Affiliation (ex. ref=neam)">
                        <label class="check small"><input type="checkbox" name="active" value="1" <?= $p['active'] ? 'checked' : '' ?>> Visible</label>
                        <button class="btn btn-ghost btn-sm" type="submit" aria-label="Enregistrer"><?= icon('check') ?></button>
                    </form>
                    <?php if ($auto): ?><form method="post" action="<?= e(url('/admin/formations/' . $p['slug'] . '/synchroniser')) ?>" class="mt-1"><?= csrf_field() ?><button class="btn btn-soft btn-sm" type="submit" title="Interroge l'API de la plateforme : 1 à 3 minutes"><?= icon('refresh-cw') ?> Synchroniser (1 à 3 min)</button></form><?php endif; ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table></div>
    <p class="small muted mt-2 mb-0"><?= icon('info') ?> Coursera et FUN MOOC se mettent à jour automatiquement via leur API publique (tâche hebdomadaire : <span class="kbd">php bin/sync-trainings.php all</span>). Udemy a fermé son API publique en 2025 : utilise l'export de son programme d'affiliation avec l'import ci-dessous. OpenClassrooms et les autres plateformes s'alimentent aussi par import.</p>
</section>

<div class="grid-2 mb-3">
    <section class="card card-lg">
        <h2 style="font-size:1.15rem"><?= icon('upload') ?> Importer des formations</h2>
        <form method="post" action="<?= e(url('/admin/formations/import')) ?>" enctype="multipart/form-data" class="stack-sm">
            <?= csrf_field() ?>
            <div class="field"><label for="imp-p">Plateforme</label><select id="imp-p" name="platform" required><?php foreach ($platforms as $p): ?><option value="<?= e($p['slug']) ?>"><?= e($p['name']) ?></option><?php endforeach; ?></select></div>
            <div class="field"><label for="imp-f">Fichier CSV ou JSON</label><input id="imp-f" name="file" type="file" accept=".csv,.json" required></div>
            <button class="btn btn-primary" type="submit"><?= icon('upload') ?> Importer</button>
        </form>
        <p class="small muted mt-2 mb-0">Colonnes : <span class="kbd">title</span>, <span class="kbd">url</span>, <span class="kbd">language</span> (fr ou en), puis facultatives <span class="kbd">partner</span>, <span class="kbd">duration</span>, <span class="kbd">certificate</span> (gratuit, payant, badge, variable), <span class="kbd">level</span>, <span class="kbd">skills</span> (noms du référentiel séparés par des virgules ; détectées automatiquement sinon), <span class="kbd">description</span>. Séparateur « , » ou « ; ».</p>
    </section>
    <section class="card card-lg">
        <h2 style="font-size:1.15rem"><?= icon('bar-chart-3') ?> Formations les plus suivies</h2>
        <?php if (!$top): ?><p class="small muted mb-0">Les clics vers les plateformes apparaîtront ici.</p><?php endif; ?>
        <ul class="list small">
            <?php foreach ($top as $t): ?>
                <li><span class="grow"><a href="<?= e(url('/formations/' . $t['id'])) ?>" target="_blank"><?= e($t['title']) ?></a><br><span class="muted"><?= e($t['platform_name']) ?></span></span><b class="tabular"><?= (int)$t['clicks'] ?> clic<?= $t['clicks'] > 1 ? 's' : '' ?></b>
                    <form method="post" action="<?= e(url('/admin/formations/' . $t['id'] . '/visibilite')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit"><?= $t['active'] ? 'Masquer' : 'Afficher' ?></button></form></li>
            <?php endforeach; ?>
        </ul>
    </section>
</div>

<section class="card card-lg" id="certificats">
    <h2 style="font-size:1.15rem"><?= icon('badge-check') ?> Certificats déclarés par les candidats</h2>
    <?php if (!$certificates): ?><p class="small muted mb-0">Aucun certificat pour l'instant.</p><?php else: ?>
        <div class="table-wrap"><table class="table">
            <thead><tr><th>Candidat</th><th>Certificat</th><th>Preuve</th><th>Statut</th><th>Décision</th></tr></thead>
            <tbody>
            <?php foreach ($certificates as $c): [$cl, $cc] = $cs[$c['status']] ?? $cs['declare']; ?>
                <tr>
                    <td class="small"><b><?= e($c['first_name'] . ' ' . $c['last_name']) ?></b><br><span class="muted"><?= e($c['email']) ?></span></td>
                    <td class="small"><b><?= e($c['title']) ?></b><br><span class="muted"><?= e(implode(' · ', array_filter([$c['issuer'], $c['issued_at'] ? date_fr($c['issued_at']) : null, $c['credential_id']]))) ?></span></td>
                    <td class="small"><?php if ($c['credential_url']): ?><a href="<?= e($c['credential_url']) ?>" target="_blank" rel="noopener noreferrer">Lien <?= icon('external-link') ?></a><?php endif; ?><?php if ($c['document_id']): ?><?= $c['credential_url'] ? '<br>' : '' ?><a href="<?= e(url('/documents/' . $c['document_id'])) ?>">Fichier</a><?php endif; ?></td>
                    <td><span class="badge badge-<?= $cc ?>"><?= e($cl) ?></span></td>
                    <td>
                        <form method="post" action="<?= e(url('/admin/certificats/' . $c['id'])) ?>" class="flex flex-wrap" style="gap:6px">
                            <?= csrf_field() ?>
                            <input name="note" class="input" style="min-height:34px;max-width:160px;font-size:.8rem" placeholder="Motif si refus" aria-label="Motif" value="<?= e($c['review_note']) ?>">
                            <button class="btn btn-success btn-sm" name="status" value="verifie" type="submit">Vérifié</button>
                            <button class="btn btn-danger btn-sm" name="status" value="refuse" type="submit">Refuser</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table></div>
    <?php endif; ?>
</section>
