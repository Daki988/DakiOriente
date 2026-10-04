<?php $st = application_statuses(); ?>
<nav class="breadcrumb"><a href="<?= e(url('/entreprise/offres')) ?>"><?= icon('chevron-left') ?> Mes offres</a></nav>
<div class="page-head">
    <div><h1 style="font-size:1.6rem"><?= e($job['title']) ?></h1><p><?= count($apps) ?> candidature(s) · classées par compatibilité · glissez-déposez les cartes pour changer d'étape</p></div>
    <div class="flex flex-wrap"><a class="btn btn-ghost" href="<?= e(url('/offres/' . $job['id'])) ?>"><?= icon('eye') ?> Voir l'offre</a><a class="btn btn-primary" href="<?= e(url('/entreprise/offres/' . $job['id'] . '/matching')) ?>"><?= icon('sparkles') ?> Trouver des profils</a></div>
</div>
<?php if (!$apps): ?>
    <?= App\Core\View::partial('partials/empty', ['icon' => 'users', 'heading' => 'Pas encore de candidature', 'text' => 'Invitez les profils les plus compatibles à postuler depuis l\'onglet Matching.', 'cta' => ['Voir les profils compatibles', '/entreprise/offres/' . $job['id'] . '/matching']]) ?>
<?php else: ?>
<div class="kanban" data-kanban>
    <?php foreach ($columns as $status => $cards): ?>
        <section class="col" data-status="<?= e($status) ?>" aria-label="<?= e($st[$status][0]) ?>">
            <div class="col-head"><span><?= icon($st[$status][2]) ?> <?= e($st[$status][0]) ?></span><span class="badge badge-<?= $st[$status][1] ?> n"><?= count($cards) ?></span></div>
            <div class="col-body">
                <?php foreach ($cards as $a): ?>
                    <article class="k-card" data-id="<?= (int)$a['id'] ?>">
                        <div class="flex" style="gap:10px">
                            <span class="avatar avatar-sm" style="background:<?= e(avatar_color($a['email'])) ?>"><?= e(initials($a['first_name'], $a['last_name'])) ?></span>
                            <div class="grow" style="min-width:0"><div class="name"><a href="<?= e(url('/entreprise/candidatures/' . $a['id'])) ?>"><?= e($a['first_name'] . ' ' . $a['last_name']) ?></a></div><small class="muted"><?= e(excerpt($a['headline'], 46)) ?></small></div>
                            <div class="ring ring-sm <?= score_class((int)$a['match_score']) ?>" style="--p:<?= (int)$a['match_score'] ?>;--s:42px"><b><?= (int)$a['match_score'] ?></b></div>
                        </div>
                        <div class="flex between mt-1 small muted">
                            <span><?= icon('map-pin') ?> <?= e($a['city_name'] ?: '—') ?></span>
                            <span><?= $a['rating'] ? str_repeat('★', (int)$a['rating']) : '' ?> <?= e(time_ago($a['created_at'])) ?></span>
                        </div>
                        <form method="post" action="<?= e(url('/entreprise/candidatures/' . $a['id'] . '/statut')) ?>" class="flex mt-1" style="gap:6px">
                            <?= csrf_field() ?>
                            <label class="sr-only" for="s<?= (int)$a['id'] ?>">Étape</label>
                            <select id="s<?= (int)$a['id'] ?>" name="status" class="input" style="min-height:34px;padding:4px 30px 4px 10px;font-size:.82rem"><?php foreach ($st as $k => [$l]): if ($k === 'draft') continue; ?><option value="<?= $k ?>" <?= $a['status'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
                            <button class="btn btn-soft btn-sm" type="submit" aria-label="Appliquer"><?= icon('check') ?></button>
                        </form>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endforeach; ?>
</div>
<?php endif; ?>
