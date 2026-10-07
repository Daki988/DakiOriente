<?php /** @var string $html @var array $p @var string $token @var bool $pdfReady */ ?>
<div class="cv-public-bar no-print">
    <div class="flex between flex-wrap" style="max-width:860px;margin:0 auto;gap:8px">
        <a href="<?= e(url('/')) ?>" class="flex" style="gap:8px;align-items:center;color:var(--navy);font-weight:700"><img src="<?= e(asset('img/logo-mark.png')) ?>" alt="" width="28" height="28"> CV de <?= e($p['first_name'] . ' ' . $p['last_name']) ?></a>
        <?php if ($pdfReady): ?><a class="btn btn-primary btn-sm" href="<?= e(url('/cv/' . $token . '/pdf')) ?>"><?= icon('file-down') ?> Télécharger le PDF</a>
        <?php else: ?><button class="btn btn-primary btn-sm" type="button" data-print><?= icon('printer') ?> Imprimer</button><?php endif; ?>
    </div>
</div>
<div class="cv-print-wrap" style="padding:24px 12px;max-width:860px;margin:0 auto">
    <div class="cv-fit cv-live" data-cv-fit data-cv-marks><?= $html ?></div>
    <p class="small muted no-print" style="text-align:center;margin-top:16px">CV créé avec <a href="<?= e(url('/')) ?>">Tremplin by NEAM</a> — stages, emplois et formations au Gabon.</p>
</div>
