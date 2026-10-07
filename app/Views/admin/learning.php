<?php
/** @var array $platforms  @var array $top  @var array $certificates  @var array $stats  @var array $connectors */
$cs = App\Controllers\Candidate\LearningController::CERT_STATUS;
?>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'formations']) ?>
<div class="page-head"><div><h1>Formations & certificats</h1><p>Catalogue des plateformes de formation en ligne (français et anglais), synchronisation, import et vérification des certificats déclarés par les candidats.</p></div></div>
<div class="grid-4 mb-3">
    <div class="kpi"><span class="ki"><?= icon('graduation-cap') ?></span><div><b><?= $stats['trainings'] ?></b><span>Formations actives · <?= $stats['fr'] ?> en français</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('users') ?></span><div><b><?= $stats['learners'] ?></b><span>Candidats en formation</span></div></div>
    <div class="kpi"><span class="ki green"><?= icon('circle-check-big') ?></span><div><b><?= $stats['completed'] ?></b><span>Formations terminées</span></div></div>
    <div class="kpi"><span class="ki amber"><?= icon('award') ?></span><div><b><?= $stats['certificates'] ?></b><span>Certificats · <?= $stats['pending'] ?> à vérifier</span></div></div>
</div>

<section class="card card-lg mb-3" id="referentiel">
    <h2 style="font-size:1.15rem"><?= icon('database') ?> Référentiel Formations</h2>
    <p class="small muted">Une formation n'est recommandée que pour un écart précis : relie-la aux compétences qu'elle développe et au niveau atteint. <?= (int)$stats['fresh'] ?> / <?= (int)$stats['trainings'] ?> formations actives vérifiées depuis moins de 6 mois (les autres sont masquées). Les formations partenaires sont signalées et n'ont aucun avantage dans le classement.</p>
    <form method="get" class="flex flex-wrap" style="gap:8px;align-items:end"><div class="field grow"><label for="tq">Rechercher une formation</label><input id="tq" name="q" value="<?= e($q) ?>" placeholder="Titre ou organisme"></div><button class="btn btn-soft" type="submit"><?= icon('search') ?> Chercher</button></form>
    <form method="post" action="<?= e(url('/admin/formations/verifier-liens')) ?>" class="mt-1"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit"><?= icon('link') ?> Vérifier 25 liens maintenant</button></form>
    <?php foreach ($found as $t): $rows = $t['ref_skills']; while (count($rows) < count($t['ref_skills']) + 2) { $rows[] = ['skill_id' => '', 'level_reached' => 2]; } ?>
        <details class="gap-row mt-2" id="t<?= (int)$t['id'] ?>"><summary><b><?= e($t['title']) ?></b> <small class="muted"><?= e($t['platform_name']) ?> · <?= e($t['provider']) ?> · <?= $t['verified_at'] ? 'vérifiée le ' . e(date_fr($t['verified_at'])) : 'non vérifiée' ?><?= !(int)$t['active'] ? ' · masquée' : '' ?></small></summary>
            <form method="post" action="<?= e(url('/admin/formations/' . $t['id'] . '/fiche')) ?>" class="form-grid cols-3 mt-2"><?= csrf_field() ?>
                <div class="field"><label>Reconnaissance</label><select name="recognition"><?php foreach (['diplomante' => 'Diplômante', 'certifiante' => 'Certifiante', 'attestation' => 'Attestation', 'aucune' => 'Aucune'] as $k => $l): ?><option value="<?= $k ?>" <?= $t['recognition'] === $k ? 'selected' : '' ?>><?= $l ?></option><?php endforeach; ?></select></div>
                <div class="field"><label>Note de curation (1 à 5)</label><input name="quality" type="number" min="1" max="5" value="<?= e($t['quality']) ?>"></div>
                <div class="field"><label>Coût (FCFA, 0 = gratuit)</label><input name="price" type="number" min="0" value="<?= (int)$t['price'] ?>"></div>
                <div class="field span-2"><label>Prérequis</label><input name="prerequisites" value="<?= e($t['prerequisites']) ?>" maxlength="255"></div>
                <label class="check"><input type="checkbox" name="partner" value="1" <?= (int)$t['partner'] ? 'checked' : '' ?>> <span class="small">Formation partenaire</span></label>
                <div class="span-3"><p class="label">Compétences développées et niveau atteint</p>
                    <?php foreach ($rows as $r): ?><div class="flex mb-1"><select class="input grow" name="skill_id[]" aria-label="Compétence"><option value="">—</option><?php foreach ($allSkills as $s): ?><option value="<?= (int)$s['id'] ?>" <?= (int)$r['skill_id'] === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select>
                        <select class="input" name="level_reached[]" style="width:170px" aria-label="Niveau atteint"><?php foreach (App\Services\Referential\Ref::LEVELS as $k => [$l]): ?><option value="<?= $k ?>" <?= (int)$r['level_reached'] === $k ? 'selected' : '' ?>><?= $k ?> — <?= e($l) ?></option><?php endforeach; ?></select></div><?php endforeach; ?></div>
                <label class="check"><input type="checkbox" name="verified" value="1"> <span class="small">J'ai vérifié le lien et les informations aujourd'hui</span></label>
                <div><button class="btn btn-primary btn-sm" type="submit">Enregistrer la fiche</button> <a class="small" href="<?= e($t['url']) ?>" target="_blank" rel="noopener">Ouvrir le lien</a></div>
            </form></details>
    <?php endforeach; ?>
    <?php if ($q !== '' && !$found): ?><p class="small muted mt-2">Aucune formation trouvée.</p><?php endif; ?>
</section>

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
