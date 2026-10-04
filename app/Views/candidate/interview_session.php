<nav class="breadcrumb"><a href="<?= e(url('/espace/entretien')) ?>"><?= icon('chevron-left') ?> Préparer un entretien</a></nav>
<div class="page-head">
    <div><h1>Simulation d'entretien</h1><p><?= $job ? e($job['title'] . ' — ' . $job['company_name']) : 'Entretien général' ?></p></div>
    <?php if ($s['score'] !== null): ?><div class="ring ring-lg <?= score_class((int)$s['score']) ?>" style="--p:<?= (int)$s['score'] ?>"><b><?= (int)$s['score'] ?></b></div><?php endif; ?>
</div>
<form method="post" action="<?= e(url('/espace/entretien/' . $s['id'])) ?>" class="stack" id="feedback">
    <?= csrf_field() ?>
    <?php foreach ($questions as $i => $q): $fb = $feedback[$i] ?? null; ?>
        <section class="card card-lg">
            <div class="flex between flex-wrap"><span class="badge badge-blue">Question <?= $i + 1 ?> · <?= e($q['type']) ?></span><?php if ($fb): ?><span class="badge badge-<?= $fb['score'] >= 7 ? 'green' : ($fb['score'] >= 4 ? 'amber' : 'red') ?>"><?= (int)$fb['score'] ?>/10</span><?php endif; ?></div>
            <h2 class="mt-1" style="font-size:1.1rem"><?= e($q['q']) ?></h2>
            <div class="field"><label class="sr-only" for="a<?= $i ?>">Ta réponse</label><textarea id="a<?= $i ?>" name="answer[<?= $i ?>]" maxlength="3000" placeholder="Réponds comme si tu étais face au recruteur…"><?= e($answers[$i] ?? '') ?></textarea></div>
            <?php if ($fb): ?>
                <div class="grid-2 mt-2 small">
                    <ul class="explain-list ok"><?php foreach ($fb['good'] ?: ['—'] as $g): ?><li><?= icon('check') ?><span><?= e($g) ?></span></li><?php endforeach; ?></ul>
                    <ul class="explain-list gap"><?php foreach ($fb['tips'] ?: ['Très bonne réponse !'] as $t): ?><li><?= icon('lightbulb') ?><span><?= e($t) ?></span></li><?php endforeach; ?></ul>
                </div>
            <?php endif; ?>
        </section>
    <?php endforeach; ?>
    <div class="flex" style="justify-content:flex-end"><button class="btn btn-cta btn-lg" type="submit"><?= icon('sparkles') ?> <?= $feedback ? 'Réévaluer mes réponses' : 'Analyser mes réponses' ?></button></div>
</form>
