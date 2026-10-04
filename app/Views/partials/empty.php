<div class="empty">
    <span class="ei"><?= icon($icon ?? 'search') ?></span>
    <h3><?= e($heading ?? 'Rien à afficher pour le moment') ?></h3>
    <?php if (!empty($text)): ?><p><?= e($text) ?></p><?php endif; ?>
    <?php if (!empty($cta)): ?><a class="btn btn-primary" href="<?= e(url($cta[1])) ?>"><?= e($cta[0]) ?></a><?php endif; ?>
</div>
