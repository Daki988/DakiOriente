<div class="no-print" style="position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--line);padding:10px 16px">
    <div class="flex between flex-wrap" style="max-width:820px;margin:0 auto">
        <a class="btn btn-ghost btn-sm" href="<?= e(url('/espace/cv')) ?>"><?= icon('chevron-left') ?> Retour</a>
        <?php if (!empty($versionLabel)): ?><span class="badge badge-amber"><?= icon('archive') ?> Version archivée : <?= e($versionLabel) ?></span><?php endif; ?>
        <button class="btn btn-primary btn-sm" type="button" data-print><?= icon('printer') ?> Imprimer / Enregistrer en PDF</button>
    </div>
</div>
<div style="padding:24px 12px">
    <?= App\Core\View::partial('candidate/_cv', ['p' => $p, 'template' => $template]) ?>
</div>
