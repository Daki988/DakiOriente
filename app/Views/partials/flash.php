<?php
$flashes = App\Core\Session::pull('_flash', []);
$icons = ['success' => 'circle-check-big', 'error' => 'circle-alert', 'info' => 'info', 'warning' => 'alert-triangle'];
?>
<div class="toasts" aria-live="polite">
    <?php foreach ($flashes as $f): ?>
        <div class="alert alert-<?= e($f['type']) ?> toast" role="<?= $f['type'] === 'error' ? 'alert' : 'status' ?>">
            <?= icon($icons[$f['type']] ?? 'info') ?>
            <div class="grow"><?= e($f['message']) ?></div>
            <button type="button" class="link-btn" aria-label="Fermer"><?= icon('x') ?></button>
        </div>
    <?php endforeach; ?>
</div>
