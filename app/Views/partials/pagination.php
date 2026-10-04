<?php
/** @var int $page  @var int $pages  @var array $query  @var string $path */
if ($pages <= 1) {
    return;
}
$link = fn(int $p) => url($path, array_merge($query, ['page' => $p]));
?>
<nav class="pagination" aria-label="Pagination">
    <?php if ($page > 1): ?><a href="<?= e($link($page - 1)) ?>" aria-label="Page précédente"><?= icon('chevron-left') ?></a><?php endif; ?>
    <?php for ($p = max(1, $page - 2); $p <= min($pages, $page + 2); $p++): ?>
        <?php if ($p === $page): ?><span class="current" aria-current="page"><?= $p ?></span><?php else: ?><a href="<?= e($link($p)) ?>"><?= $p ?></a><?php endif; ?>
    <?php endfor; ?>
    <?php if ($page < $pages): ?><a href="<?= e($link($page + 1)) ?>" aria-label="Page suivante"><?= icon('chevron-right') ?></a><?php endif; ?>
</nav>
