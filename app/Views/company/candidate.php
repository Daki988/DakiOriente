<nav class="breadcrumb"><a href="<?= e(url('/entreprise/cvtheque')) ?>"><?= icon('chevron-left') ?> CVthèque</a></nav>
<div class="page-head">
    <div class="flex"><span class="avatar avatar-lg" style="background:<?= e(avatar_color($p['email'])) ?>"><?= e(initials($p['first_name'], $p['last_name'])) ?></span>
        <div><h1 style="font-size:1.6rem"><?= e($p['first_name'] . ' ' . mb_substr((string)$p['last_name'], 0, 1) . '.') ?></h1><p><?= e($p['headline']) ?> · <?= e($p['city_name']) ?></p></div></div>
    <?php if ($application): ?><a class="btn btn-primary" href="<?= e(url('/entreprise/candidatures/' . $application['id'])) ?>">Voir sa candidature</a><?php endif; ?>
</div>
<div class="layout-aside">
    <div class="stack">
        <section class="card card-lg" style="background:linear-gradient(180deg,#f5f9ff,#fff)"><h2 style="font-size:1.05rem"><?= icon('sparkles') ?> Synthèse</h2><p class="mb-0"><?= e($summary) ?></p></section>
        <?php if (!$application): ?><div class="alert alert-info"><?= icon('lock') ?><div>Les coordonnées sont masquées tant que ce candidat n'a pas postulé à l'une de vos offres. Invitez-le à postuler : il sera notifié.</div></div><?php endif; ?>
        <section class="card card-lg">
            <h2 style="font-size:1.15rem">Parcours</h2>
            <?php if ($p['bio']): ?><p><?= e($p['bio']) ?></p><?php endif; ?>
            <h3>Compétences</h3>
            <div class="tags"><?php foreach ($p['skills'] as $s): ?><span class="tag"><?= e($s['name']) ?> <span class="level-dots"><?php for ($i = 1; $i <= 5; $i++): ?><i class="<?= $i <= $s['level'] ? 'on' : '' ?>"></i><?php endfor; ?></span></span><?php endforeach; ?></div>
            <h3 class="mt-2">Formation</h3>
            <ul class="timeline"><?php foreach ($p['educations'] as $ed): ?><li><span class="dot done"></span><b><?= e($ed['degree']) ?> <?= e($ed['field']) ?></b><span><?= e($ed['school']) ?> · <?= e($ed['end_year']) ?></span></li><?php endforeach; ?></ul>
            <h3>Expériences</h3>
            <ul class="timeline"><?php foreach ($p['experiences'] as $x): ?><li><span class="dot done"></span><b><?= e($x['title']) ?></b><span><?= e($x['company']) ?> · <?= e(date_fr($x['start_date'])) ?></span><?php if ($x['description']): ?><p class="small mb-0"><?= e($x['description']) ?></p><?php endif; ?></li><?php endforeach; ?></ul>
            <?php if (!empty($p['certificates'])): ?><h3>Certificats et formations en ligne</h3><?= App\Core\View::partial('partials/certificates_list', ['certificates' => $p['certificates'], 'recruiter' => true]) ?><?php endif; ?>
            <p class="small"><b>Langues :</b> <?= e(implode(', ', array_map(fn($l) => $l['name'] . ' ' . $l['level'], $p['languages_list']))) ?> · <b>Disponibilité :</b> <?= e(date_fr($p['availability_date'])) ?> · <b>Mobilité :</b> <?= e(mobility_labels()[$p['mobility']] ?? '') ?></p>
        </section>
    </div>
    <aside class="stack">
        <?php if ($jobs): ?>
            <form method="get" class="card" data-autosubmit><label class="label" for="cj">Compatibilité avec</label><select id="cj" name="job" class="input mt-1"><?php foreach ($jobs as $j): ?><option value="<?= (int)$j['id'] ?>" <?= $jobId === (int)$j['id'] ? 'selected' : '' ?>><?= e($j['title']) ?></option><?php endforeach; ?></select></form>
        <?php endif; ?>
        <?php if ($match): ?>
            <div class="card card-lg"><?= App\Core\View::partial('partials/match_explain', ['match' => $match, 'compact' => true]) ?>
                <?php if (!$application): ?><form method="post" action="<?= e(url('/entreprise/candidats/' . $p['user_id'] . '/inviter')) ?>" class="mt-2"><?= csrf_field() ?><input type="hidden" name="job_id" value="<?= (int)$jobId ?>"><button class="btn btn-cta btn-block" type="submit"><?= icon('send') ?> Inviter à postuler</button></form><?php endif; ?>
            </div>
        <?php endif; ?>
    </aside>
</div>
