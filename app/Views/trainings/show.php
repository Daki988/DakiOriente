<?php
/** @var array $t  @var array $jobs  @var ?array $platform  @var array $similar  @var ?array $track  @var ?array $certificate */
$cert = App\Services\Training\TrainingCatalog::CERT[$t['certificate']] ?? null;
$lvl = ['debutant' => 'Débutant', 'intermediaire' => 'Intermédiaire', 'avance' => 'Avancé'];
$skills = array_filter(array_map('trim', explode(',', (string)$t['skills'])));
$u = user();
$isCandidate = $u && $u['role'] === 'candidate';
$st = App\Controllers\Candidate\LearningController::STATUS;
$cs = App\Controllers\Candidate\LearningController::CERT_STATUS;
?>
<section class="hero" style="padding:28px 0">
    <div class="container">
        <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="<?= e(url('/formations')) ?>">Se former</a> <?= icon('chevron-right') ?> <a href="<?= e(url('/formations/plateformes/' . $t['platform_slug'])) ?>"><?= e($t['platform_name']) ?></a> <?= icon('chevron-right') ?> <span><?= e(excerpt($t['title'], 40)) ?></span></nav>
        <div class="card card-lg" style="box-shadow:var(--shadow)">
            <div class="flex flex-wrap" style="gap:8px">
                <span class="platform-chip" style="--pc:<?= e($t['platform_color']) ?>"><i aria-hidden="true"></i><?= e($t['platform_name']) ?></span>
                <span class="badge badge-<?= $t['language'] === 'fr' ? 'blue' : 'violet' ?>">Cours en <?= $t['language'] === 'fr' ? 'français' : 'anglais' ?></span>
                <?php if ($cert): ?><span class="badge badge-<?= $cert[1] ?>"><?= e($cert[0]) ?></span><?php endif; ?>
                <?php if ($t['demand']): ?><span class="badge badge-amber"><?= icon('briefcase-business') ?> Demandée dans <?= (int)$t['demand'] ?> offre<?= $t['demand'] > 1 ? 's' : '' ?></span><?php endif; ?>
                <?php if (!$t['active']): ?><span class="badge badge-red">Plus disponible sur la plateforme</span><?php endif; ?>
            </div>
            <h1 style="font-size:clamp(1.4rem,3.2vw,2rem);margin:10px 0 6px"><?= e($t['title']) ?></h1>
            <div class="flex flex-wrap muted" style="gap:8px 20px;font-size:.92rem">
                <?php if ($t['provider'] && $t['provider'] !== $t['platform_name']): ?><span><?= icon('building-2') ?> <?= e($t['provider']) ?></span><?php endif; ?>
                <span><?= icon('clock') ?> <?= e($t['duration']) ?></span>
                <span><?= icon('activity') ?> <?= e($lvl[$t['level']] ?? $t['level']) ?></span>
                <?php if ($t['next_session']): ?><span><?= icon('calendar') ?> <?= $t['next_session'] === 'ouvert' ? 'Inscriptions ouvertes' : 'Prochaine session : ' . e(date_fr($t['next_session'])) ?></span><?php endif; ?>
            </div>
            <div class="flex flex-wrap mt-2" style="gap:10px;align-items:center">
                <?php if ($t['active']): ?><a class="btn btn-cta btn-lg" href="<?= e(url('/formations/' . $t['id'] . '/aller')) ?>" target="_blank" rel="noopener noreferrer">Suivre la formation sur <?= e($t['platform_name']) ?> <?= icon('external-link') ?></a><?php endif; ?>
                <?php if ($isCandidate && $track): ?><span class="badge badge-<?= $st[$track['status']][1] ?>"><?= icon('check') ?> Dans mes formations : <?= e($st[$track['status']][0]) ?></span><?php endif; ?>
            </div>
            <p class="small muted mt-1 mb-0"><?= icon('info') ?> Tu vas suivre ce cours sur <?= e($t['platform_name']) ?>, à leurs conditions. <?= e($platform['pricing_note'] ?? '') ?></p>
        </div>
    </div>
</section>
<section class="section-sm">
    <div class="container layout-aside">
        <div class="stack">
            <?php if ($t['description']): ?><section class="card card-lg"><h2 style="font-size:1.15rem">À propos du cours</h2><p class="mb-0"><?= e($t['description']) ?></p></section><?php endif; ?>
            <section class="card card-lg">
                <h2 style="font-size:1.15rem"><?= icon('target') ?> Pourquoi cette formation compte</h2>
                <p class="mb-2">Elle développe <?= count($skills) > 1 ? 'les compétences' : 'la compétence' ?> <b><?= e(App\Services\Ai\AiService::joinFr($skills)) ?></b><?= $t['demand'] ? ', demandée' . (count($skills) > 1 ? 's' : '') . ' dans <b>' . (int)$t['demand'] . ' offre' . ($t['demand'] > 1 ? 's' : '') . ' publiée' . ($t['demand'] > 1 ? 's' : '') . '</b> sur Tremplin.' : '.' ?></p>
                <?php if ($jobs): ?>
                    <div class="stack"><?php foreach ($jobs as $j): ?><?= App\Core\View::partial('partials/job_card', ['job' => $j, 'match' => null]) ?><?php endforeach; ?></div>
                    <a class="btn btn-ghost btn-sm mt-2" href="<?= e(url('/offres', ['q' => reset($skills)])) ?>">Voir les offres <?= icon('arrow-right') ?></a>
                <?php endif; ?>
            </section>
            <?php if ($similar): ?>
                <section><h2 style="font-size:1.15rem">Pour la même compétence</h2><div class="grid-3"><?php foreach (App\Services\Training\TrainingCatalog::withDemand($similar, false) as $s): ?><?= App\Core\View::partial('partials/training_card', ['t' => $s]) ?><?php endforeach; ?></div></section>
            <?php endif; ?>
        </div>
        <aside class="stack">
            <?php if ($isCandidate): ?>
                <section class="card card-lg">
                    <h3 style="font-size:1.05rem"><?= icon('list-checks') ?> Mon suivi</h3>
                    <p class="small muted">Indique où tu en es : Tremplin t'accompagne jusqu'au certificat.</p>
                    <div class="flex flex-wrap" style="gap:6px">
                        <?php foreach ($st as $k => [$label]): ?>
                            <form method="post" action="<?= e(url('/espace/formations/' . $t['id'] . '/statut')) ?>"><?= csrf_field() ?><input type="hidden" name="status" value="<?= $k ?>"><button class="btn btn-sm <?= ($track['status'] ?? '') === $k ? 'btn-primary' : 'btn-ghost' ?>" type="submit" aria-pressed="<?= ($track['status'] ?? '') === $k ? 'true' : 'false' ?>"><?= e($label) ?></button></form>
                        <?php endforeach; ?>
                    </div>
                </section>
                <section class="card card-lg" id="certificat">
                    <h3 style="font-size:1.05rem"><?= icon('award') ?> Mon certificat</h3>
                    <?php if ($certificate): [$cl, $cc] = $cs[$certificate['status']] ?? ['Déclaré', 'sky']; ?>
                        <div class="alert alert-success small"><?= icon('circle-check-big') ?><div><b><?= e($certificate['title']) ?></b><br>Relié à ton profil · <span class="badge badge-<?= $cc ?>"><?= e($cl) ?></span><?php if ($certificate['credential_url']): ?><br><a href="<?= e($certificate['credential_url']) ?>" target="_blank" rel="noopener noreferrer">Voir le certificat <?= icon('external-link') ?></a><?php endif; ?></div></div>
                    <?php else: ?>
                        <p class="small muted">Formation terminée ? Relie ton certificat : il apparaîtra sur ton CV et les recruteurs pourront le vérifier.</p>
                        <?= App\Core\View::partial('partials/certificate_form', ['t' => $t]) ?>
                    <?php endif; ?>
                </section>
            <?php elseif (!$u): ?>
                <section class="card card-lg text-center">
                    <h3>Suis ta progression</h3>
                    <p class="small muted">Crée ton profil gratuit pour suivre cette formation, relier ton certificat et voir les offres qui te correspondent.</p>
                    <a class="btn btn-cta btn-block" href="<?= e(url('/inscription')) ?>">Créer mon profil</a>
                </section>
            <?php endif; ?>
            <?php if ($platform): ?>
                <section class="card">
                    <h3 style="font-size:1rem">À propos de <?= e($platform['name']) ?></h3>
                    <p class="small"><?= e($platform['tagline']) ?>. <?= e($platform['certificate_note']) ?></p>
                    <a class="small" href="<?= e(url('/formations/plateformes/' . $platform['slug'])) ?>">Toutes les formations <?= e($platform['name']) ?> <?= icon('arrow-right') ?></a>
                </section>
            <?php endif; ?>
        </aside>
    </div>
</section>
