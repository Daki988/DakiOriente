<section class="section-sm">
    <div class="container" style="max-width:860px">
        <nav class="breadcrumb"><a href="<?= e(url('/conseils')) ?>">Conseils</a> <?= icon('chevron-right') ?> <span><?= e(excerpt($a['title'], 50)) ?></span></nav>
        <div class="article-cover" style="background:linear-gradient(135deg, <?= e($a['cover_color']) ?>, <?= e($a['cover_color']) ?>bb)">
            <span class="blob" style="right:-60px;bottom:-80px;width:240px;height:240px;background:rgba(255,255,255,.18)"></span>
            <h1 style="font-size:clamp(1.7rem,4vw,2.5rem);position:relative"><?= e($a['title']) ?></h1>
            <p style="color:#f1f5ff;margin:0;position:relative"><?= icon('clock') ?> <?= (int)$a['reading_minutes'] ?> min de lecture · <?= e(date_fr($a['created_at'])) ?></p>
        </div>
        <article class="prose mt-3">
            <?php foreach (preg_split("/\n\s*\n/", trim((string)$a['body'])) as $block):
                $lines = explode("\n", trim($block));
                if (count($lines) > 1 && mb_strlen($lines[0]) < 70 && !str_starts_with($lines[0], '-')): ?>
                    <h2><?= e(array_shift($lines)) ?></h2><?= nl2p(implode("\n", $lines)) ?>
                <?php else: ?><?= nl2p($block) ?><?php endif; ?>
            <?php endforeach; ?>
        </article>
        <div class="welcome mt-4">
            <span class="deco"></span>
            <h2>Passe à l'action</h2>
            <p>Mets ces conseils en pratique : ton profil Tremplin calcule ta compatibilité avec chaque offre.</p>
            <a class="btn btn-cta" href="<?= e(url(user() ? \App\Core\Auth::homeUrl() : '/inscription')) ?>">C'est parti <?= icon('arrow-right') ?></a>
        </div>
        <?php if ($more): ?><h2 class="mt-4">À lire aussi</h2><div class="grid-3"><?php foreach ($more as $m): ?><?= App\Core\View::partial('pages/_article_card', ['a' => $m]) ?><?php endforeach; ?></div><?php endif; ?>
    </div>
</section>
