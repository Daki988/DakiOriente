<?php $cats = ['cv' => 'CV & candidature', 'entretien' => 'Entretien', 'marche' => 'Marché de l\'emploi', 'stage' => 'Stage', 'conseil' => 'Conseil']; ?>
<a class="card card-hover article-card" href="<?= e(url('/conseils/' . $a['slug'])) ?>">
    <div class="cover" style="background:linear-gradient(135deg, <?= e($a['cover_color']) ?>, <?= e($a['cover_color']) ?>cc)">
        <span class="badge" style="position:absolute;left:16px;top:16px;background:rgba(255,255,255,.92);color:var(--navy)"><?= e($cats[$a['category']] ?? 'Conseil') ?></span>
    </div>
    <div class="inner">
        <h3 class="mb-0" style="font-size:1.05rem"><?= e($a['title']) ?></h3>
        <p class="small muted mb-0"><?= e(excerpt($a['excerpt'], 110)) ?></p>
        <small class="muted mt-1"><?= icon('clock') ?> <?= (int)$a['reading_minutes'] ?> min de lecture</small>
    </div>
</a>
