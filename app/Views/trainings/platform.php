<?php
/** @var array $p  @var array $all  @var array $demanded  @var array $skills  @var int $learners  @var int $certs  @var array $mine  @var string $lang */
[$pl, $pc] = App\Services\Training\TrainingCatalog::PRICING[$p['pricing']] ?? ['—', 'gray'];
$lines = fn($s) => array_filter(array_map('trim', explode("\n", (string)$s)));
$others = array_values(array_filter($all, fn($t) => $t['demand'] === 0));
?>
<section class="hero" style="padding:32px 0">
    <div class="container">
        <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="<?= e(url('/formations')) ?>">Se former</a> <?= icon('chevron-right') ?> <a href="<?= e(url('/formations/plateformes')) ?>">Plateformes</a> <?= icon('chevron-right') ?> <span><?= e($p['name']) ?></span></nav>
        <div class="flex flex-wrap" style="gap:18px;align-items:center">
            <span class="pt-logo xl" style="--pc:<?= e($p['color']) ?>" aria-hidden="true"><?= e(mb_strtoupper(mb_substr($p['name'], 0, 1))) ?></span>
            <div class="grow" style="min-width:240px">
                <h1 style="font-size:clamp(1.8rem,4vw,2.6rem);margin:0"><?= e($p['name']) ?></h1>
                <p class="muted mb-0"><?= e($p['tagline']) ?></p>
            </div>
            <a class="btn btn-ghost" href="<?= e($p['url']) ?>" target="_blank" rel="noopener noreferrer">Site officiel <?= icon('external-link') ?></a>
        </div>
    </div>
</section>
<section class="section-sm">
    <div class="container layout-aside">
        <div class="stack">
            <section class="card card-lg">
                <h2 style="font-size:1.2rem">Présentation</h2>
                <?= nl2p($p['description']) ?>
                <div class="grid-2 mt-2">
                    <div><h3 style="font-size:1rem"><?= icon('circle-check-big') ?> Points forts</h3><ul class="explain-list ok small"><?php foreach ($lines($p['strengths']) as $l): ?><li><?= icon('check') ?><span><?= e($l) ?></span></li><?php endforeach; ?></ul></div>
                    <div><h3 style="font-size:1rem"><?= icon('lightbulb') ?> Nos conseils</h3><ul class="explain-list gap small"><?php foreach ($lines($p['tips']) as $l): ?><li><?= icon('lightbulb') ?><span><?= e($l) ?></span></li><?php endforeach; ?></ul></div>
                </div>
            </section>

            <section>
                <div class="flex between flex-wrap mb-2" style="gap:10px">
                    <div><h2 style="font-size:1.3rem;margin:0">Les formations demandées par les employeurs</h2><p class="small muted mb-0">Cours de <?= e($p['name']) ?> dont les compétences figurent dans des offres publiées sur Tremplin, de la plus demandée à la moins demandée.</p></div>
                    <form method="get" action="<?= e(url('/formations/plateformes/' . $p['slug'])) ?>" class="flex" data-autosubmit><label class="sr-only" for="pl-lang">Langue</label><select id="pl-lang" name="langue" class="input" style="width:auto"><option value="">Français et anglais</option><option value="fr" <?= $lang === 'fr' ? 'selected' : '' ?>>Français</option><option value="en" <?= $lang === 'en' ? 'selected' : '' ?>>Anglais</option></select><noscript><button class="btn btn-ghost btn-sm">OK</button></noscript></form>
                </div>
                <?php if (!$demanded): ?>
                    <?= App\Core\View::partial('partials/empty', ['icon' => 'briefcase-business', 'heading' => 'Pas encore de formation demandée', 'text' => 'Aucune offre publiée ne demande pour l\'instant les compétences de ces cours.']) ?>
                <?php else: ?>
                    <div class="grid-2"><?php foreach (array_slice($demanded, 0, 12) as $t): ?><?= App\Core\View::partial('partials/training_card', ['t' => $t, 'status' => $mine[(int)$t['id']] ?? null]) ?><?php endforeach; ?></div>
                    <?php if (count($demanded) > 12): ?><a class="btn btn-ghost mt-2" href="<?= e(url('/formations', ['plateforme' => $p['slug']])) ?>">Voir les <?= count($demanded) ?> formations demandées <?= icon('arrow-right') ?></a><?php endif; ?>
                <?php endif; ?>
                <?php if ($others): ?>
                    <details class="faq mt-3"><summary><?= count($others) ?> autre<?= count($others) > 1 ? 's' : '' ?> formation<?= count($others) > 1 ? 's' : '' ?> utiles pour élargir ton profil</summary>
                        <div class="grid-2 mt-2"><?php foreach (array_slice($others, 0, 12) as $t): ?><?= App\Core\View::partial('partials/training_card', ['t' => $t, 'status' => $mine[(int)$t['id']] ?? null]) ?><?php endforeach; ?></div>
                    </details>
                <?php endif; ?>
            </section>
        </div>
        <aside class="stack">
            <section class="card card-lg">
                <h3 style="font-size:1rem">En bref</h3>
                <ul class="list small">
                    <li><span class="grow">Modèle</span><span class="badge badge-<?= $pc ?>"><?= e($pl) ?></span></li>
                    <li><span class="grow">Langues</span><b><?= e(implode(', ', array_map(fn($l) => App\Services\Training\TrainingCatalog::LANG[$l] ?? $l, explode(',', (string)$p['languages'])))) ?></b></li>
                    <li><span class="grow">Formations sur Tremplin</span><b class="tabular"><?= count($all) ?></b></li>
                    <li><span class="grow">Demandées par les employeurs</span><b class="tabular"><?= count($demanded) ?></b></li>
                    <?php if ($learners): ?><li><span class="grow">Candidats Tremplin inscrits</span><b class="tabular"><?= $learners ?></b></li><?php endif; ?>
                    <?php if ($certs): ?><li><span class="grow">Certificats reliés à un profil</span><b class="tabular"><?= $certs ?></b></li><?php endif; ?>
                </ul>
                <p class="small mb-1"><b>Prix :</b> <?= e($p['pricing_note']) ?></p>
                <p class="small mb-0"><b>Certificat :</b> <?= e($p['certificate_note']) ?></p>
            </section>
            <?php if ($skills): ?>
                <section class="card">
                    <h3 style="font-size:1rem"><?= icon('target') ?> Compétences couvertes</h3>
                    <ul class="list small">
                        <?php foreach (array_slice($skills, 0, 10) as $s): ?>
                            <li><a class="grow" href="<?= e(url('/formations', ['plateforme' => $p['slug'], 'competence' => $s['name']])) ?>"><?= e($s['name']) ?></a><span class="muted"><?= (int)$s['courses'] ?> cours</span><?php if ($s['demand']): ?><span class="badge badge-amber"><?= (int)$s['demand'] ?> offre<?= $s['demand'] > 1 ? 's' : '' ?></span><?php endif; ?></li>
                        <?php endforeach; ?>
                    </ul>
                </section>
            <?php endif; ?>
            <section class="card card-blue">
                <h3 style="font-size:1rem;color:#fff"><?= icon('award') ?> Formation terminée ?</h3>
                <p class="small" style="color:#e2ecff">Relie ton certificat à ton profil Tremplin : il apparaît sur ton CV, les recruteurs peuvent le vérifier, et tes compétences sont mises à jour.</p>
                <a class="btn btn-cta btn-sm" href="<?= e(url('/espace/formations#certificats')) ?>">Relier un certificat</a>
            </section>
        </aside>
    </div>
</section>
