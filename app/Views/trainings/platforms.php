<?php /** @var array $platforms */ $pricing = App\Services\Training\TrainingCatalog::PRICING; ?>
<section class="hero" style="padding:32px 0">
    <div class="container">
        <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="<?= e(url('/formations')) ?>">Se former</a> <?= icon('chevron-right') ?> <span>Plateformes</span></nav>
        <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">Quelle plateforme pour apprendre ?</h1>
        <p class="muted" style="max-width:700px">Chaque plateforme a ses forces : cours gratuits en français, certificats de grandes marques, préparation aux certifications techniques… Voici ce qu'il faut savoir pour choisir, et combien de formations de chacune répondent aux compétences demandées par les employeurs.</p>
    </div>
</section>
<section class="section-sm">
    <div class="container grid-2">
        <?php foreach ($platforms as $p): [$pl, $pc] = $pricing[$p['pricing']] ?? ['—', 'gray']; ?>
            <article class="card card-lg stack-sm platform-card" style="--pc:<?= e($p['color']) ?>">
                <div class="flex" style="gap:14px">
                    <span class="pt-logo lg" aria-hidden="true"><?= e(mb_strtoupper(mb_substr($p['name'], 0, 1))) ?></span>
                    <div class="grow"><h2 class="mb-0" style="font-size:1.2rem"><?= e($p['name']) ?></h2><small class="muted"><?= e($p['tagline']) ?></small></div>
                </div>
                <div class="flex flex-wrap" style="gap:6px">
                    <span class="badge badge-<?= $pc ?>"><?= e($pl) ?></span>
                    <span class="badge badge-gray"><?= e(implode(' · ', array_map(fn($l) => App\Services\Training\TrainingCatalog::LANG[$l] ?? $l, explode(',', (string)$p['languages'])))) ?></span>
                    <span class="badge badge-blue" style="white-space:normal"><?= (int)$p['courses'] ?> formation<?= $p['courses'] > 1 ? 's' : '' ?> sur Tremplin<?= $p['courses_fr'] ? ' dont ' . (int)$p['courses_fr'] . ' en français' : '' ?></span>
                </div>
                <p class="small mb-0"><b>Prix :</b> <?= e($p['pricing_note']) ?></p>
                <p class="small mb-0"><b>Certificat :</b> <?= e($p['certificate_note']) ?></p>
                <div class="flex flex-wrap mt-1" style="gap:8px">
                    <a class="btn btn-primary btn-sm" href="<?= e(url('/formations/plateformes/' . $p['slug'])) ?>">Voir les formations <?= icon('arrow-right') ?></a>
                    <a class="btn btn-ghost btn-sm" href="<?= e($p['url']) ?>" target="_blank" rel="noopener noreferrer">Site officiel <?= icon('external-link') ?></a>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
</section>
