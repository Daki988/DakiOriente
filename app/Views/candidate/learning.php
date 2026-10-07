<?php
/** @var array $items  @var array $tracks  @var array $certificates  @var array $linked */
$st = App\Controllers\Candidate\LearningController::STATUS;
$cs = App\Controllers\Candidate\LearningController::CERT_STATUS;
$count = fn($s) => count(array_filter($tracks, fn($r) => $r['status'] === $s));
$verified = count(array_filter($certificates, fn($c) => $c['status'] === 'verifie'));
?>
<div class="page-head">
    <div><h1>Mes formations et certificats</h1><p>Suis tes cours en ligne jusqu'au bout, puis relie tes certificats à ton profil : ils apparaissent sur ton CV, font monter ton score et les recruteurs peuvent les vérifier.</p></div>
    <div class="flex flex-wrap"><a class="btn btn-ghost" href="<?= e(url('/espace/progression')) ?>"><?= icon('trending-up') ?> Mes axes de progression</a><a class="btn btn-primary" href="<?= e(url('/formations')) ?>"><?= icon('search') ?> Trouver une formation</a></div>
</div>
<div class="grid-4 mb-3">
    <div class="kpi"><span class="ki amber"><?= icon('activity') ?></span><div><b><?= $count('en_cours') ?></b><span>En cours</span></div></div>
    <div class="kpi"><span class="ki"><?= icon('bookmark') ?></span><div><b><?= $count('suivie') ?></b><span>À commencer</span></div></div>
    <div class="kpi"><span class="ki green"><?= icon('circle-check-big') ?></span><div><b><?= $count('terminee') ?></b><span>Terminées</span></div></div>
    <div class="kpi"><span class="ki violet"><?= icon('award') ?></span><div><b><?= count($certificates) ?></b><span>Certificat<?= count($certificates) > 1 ? 's' : '' ?><?= $verified ? ' · ' . $verified . ' vérifié' . ($verified > 1 ? 's' : '') : '' ?></span></div></div>
</div>
<div class="layout-aside">
    <div class="stack">
        <section class="card card-lg">
            <h2 style="font-size:1.15rem"><?= icon('graduation-cap') ?> Mes formations</h2>
            <?php if (!$items): ?>
                <?= App\Core\View::partial('partials/empty', ['icon' => 'graduation-cap', 'heading' => 'Aucune formation suivie pour l\'instant', 'text' => 'Choisis une formation recommandée pour combler tes écarts : quand tu cliques sur « Suivre la formation », elle s\'ajoute ici automatiquement.', 'cta' => ['Voir les formations recommandées', '/espace/progression']]) ?>
            <?php else: ?>
                <ul class="list">
                    <?php foreach ($items as $t): $tr = $tracks[(int)$t['id']] ?? ['status' => 'suivie']; [$sl, $sc] = $st[$tr['status']] ?? $st['suivie']; ?>
                        <li class="goal">
                            <div class="flex between" style="align-items:flex-start;gap:10px">
                                <div class="grow">
                                    <span class="platform-chip" style="--pc:<?= e($t['platform_color']) ?>"><i aria-hidden="true"></i><?= e($t['platform_name']) ?></span>
                                    <b class="reco-title"><a href="<?= e(url('/formations/' . $t['id'])) ?>"><?= e($t['title']) ?></a></b>
                                    <small class="muted"><?= e($t['skills']) ?> · <?= e($t['duration']) ?> · <?= $t['language'] === 'fr' ? 'Français' : 'Anglais' ?></small>
                                </div>
                                <span class="badge badge-<?= $sc ?>"><?= e($sl) ?></span>
                            </div>
                            <div class="flex flex-wrap mt-1" style="gap:6px">
                                <?php foreach ($st as $k => [$label]): if ($k === $tr['status']) continue; ?>
                                    <form method="post" action="<?= e(url('/espace/formations/' . $t['id'] . '/statut')) ?>"><?= csrf_field() ?><input type="hidden" name="status" value="<?= $k ?>"><button class="btn btn-ghost btn-sm" type="submit"><?= $k === 'terminee' ? icon('check') . ' J\'ai terminé' : ($k === 'en_cours' ? icon('activity') . ' Je l\'ai commencée' : 'Remettre à plus tard') ?></button></form>
                                <?php endforeach; ?>
                                <a class="btn btn-soft btn-sm" href="<?= e(url('/formations/' . $t['id'] . '/aller')) ?>" target="_blank" rel="noopener noreferrer">Reprendre sur <?= e($t['platform_name']) ?> <?= icon('external-link') ?></a>
                                <?php if ($tr['status'] === 'terminee' && !in_array($t['id'], $linked)): ?><a class="btn btn-cta btn-sm" href="<?= e(url('/formations/' . $t['id'] . '#certificat')) ?>"><?= icon('award') ?> Relier mon certificat</a><?php endif; ?>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </section>

        <section class="card card-lg" id="certificats">
            <h2 style="font-size:1.15rem"><?= icon('award') ?> Mes certificats</h2>
            <?php if (!$certificates): ?>
                <p class="small muted mb-0">Aucun certificat relié pour l'instant. Une fois un cours terminé, relie ton certificat depuis la page de la formation, ou ajoute ci-contre un certificat obtenu ailleurs.</p>
            <?php else: ?>
                <ul class="list">
                    <?php foreach ($certificates as $c): [$cl, $cc] = $cs[$c['status']] ?? $cs['declare']; ?>
                        <li class="goal">
                            <div class="flex between" style="align-items:flex-start;gap:10px">
                                <div class="grow"><b class="reco-title"><?= e($c['title']) ?></b><small class="muted"><?= e(implode(' · ', array_filter([$c['issuer'], $c['issued_at'] ? 'obtenu le ' . date_fr($c['issued_at']) : null, $c['credential_id'] ? 'n° ' . $c['credential_id'] : null]))) ?></small>
                                    <?php if ($c['status'] === 'refuse' && $c['review_note']): ?><br><small style="color:var(--red)"><?= icon('info') ?> <?= e($c['review_note']) ?></small><?php endif; ?></div>
                                <span class="badge badge-<?= $cc ?>"><?= $c['status'] === 'verifie' ? icon('badge-check') : '' ?><?= e($cl) ?></span>
                            </div>
                            <div class="flex flex-wrap mt-1" style="gap:6px">
                                <?php if ($c['credential_url']): ?><a class="btn btn-ghost btn-sm" href="<?= e($c['credential_url']) ?>" target="_blank" rel="noopener noreferrer">Voir le certificat <?= icon('external-link') ?></a><?php endif; ?>
                                <?php if ($c['document_id']): ?><a class="btn btn-ghost btn-sm" href="<?= e(url('/documents/' . $c['document_id'])) ?>"><?= icon('file-down') ?> Fichier</a><?php endif; ?>
                                <form method="post" action="<?= e(url('/espace/certificats/' . $c['id'] . '/supprimer')) ?>" data-confirm="Retirer ce certificat de ton profil ?"><?= csrf_field() ?><button class="btn btn-ghost btn-icon btn-sm" type="submit" aria-label="Retirer"><?= icon('trash-2') ?></button></form>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </section>
    </div>
    <aside class="stack">
        <section class="card card-lg">
            <h3 style="font-size:1.05rem"><?= icon('plus') ?> Ajouter un certificat obtenu ailleurs</h3>
            <p class="small muted">Coursera, OpenClassrooms, Udemy, une école, un organisme local… Ajoute-le avec son lien de vérification ou son fichier.</p>
            <?= App\Core\View::partial('partials/certificate_form', ['t' => null]) ?>
        </section>
        <section class="card">
            <h3 style="font-size:1rem"><?= icon('badge-check') ?> Pourquoi faire vérifier ?</h3>
            <p class="small mb-0">L'équipe NEAM contrôle le lien ou le fichier de chaque certificat. Un certificat vérifié affiche un badge sur ton profil et ton CV : pour un recruteur, c'est une preuve, plus seulement une déclaration.</p>
        </section>
    </aside>
</div>
