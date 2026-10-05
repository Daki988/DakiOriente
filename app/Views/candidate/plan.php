<div class="page-head"><div><h1>Mon plan d'action 30 / 60 / 90 jours</h1><p>Construit à partir de tes écarts réels avec les offres qui te correspondent. Une étape à la fois : c'est comme ça qu'on avance pour de bon.</p></div><?php if ($allowed): ?><button class="btn btn-ghost" type="button" data-print><?= icon('printer') ?> Imprimer</button><?php endif; ?></div>
<?php if (!$allowed): ?>
    <?= App\Core\View::partial('partials/locked', ['required' => 'PRO', 'heading' => 'Ton plan d\'action personnalisé', 'text' => 'Un programme concret en 3 étapes, basé sur les compétences les plus demandées dans tes matchs.']) ?>
<?php else: ?>
    <?php if ($plan['missing']): ?><div class="alert alert-info mb-3"><?= icon('target') ?><div>Compétences les plus demandées dans tes meilleurs matchs et qui te manquent : <b><?= e(implode(', ', $plan['missing'])) ?></b>.</div></div><?php endif; ?>
    <div class="grid-3">
        <?php foreach (['30' => ['Jours 1 à 30', 'Fondations', 'blue'], '60' => ['Jours 31 à 60', 'Montée en compétences', 'violet'], '90' => ['Jours 61 à 90', 'Accélération', 'amber']] as $k => [$period, $label, $color]): ?>
            <section class="card card-lg">
                <span class="badge badge-<?= $color ?>"><?= e($period) ?></span>
                <h2 class="mt-1" style="font-size:1.2rem"><?= e($label) ?></h2>
                <ul class="explain-list ok mt-2">
                    <?php foreach ($plan[$k] as $item): ?><li><?= icon('circle-check-big') ?><span><?= e($item) ?></span></li><?php endforeach; ?>
                </ul>
            </section>
        <?php endforeach; ?>
    </div>
<?php endif; ?>
