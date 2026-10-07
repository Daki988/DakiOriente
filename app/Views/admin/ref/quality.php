<?php
$fmt = fn($k) => $k['value'] === null ? 'non mesurable' : str_replace('.', ',', (string)$k['value']) . ($k['unit'] === '%' ? ' %' : ($k['unit'] ? ' ' . $k['unit'] : ''));
$labels = array_map(fn($b) => $b['label'], array_values($calibration));
$chart = ['type' => 'bar', 'data' => ['labels' => $labels, 'datasets' => [
    ['label' => 'Taux d\'entretien (%)', 'data' => array_map(fn($b) => round($b['interview_rate'] * 100, 1), array_values($calibration))],
    ['label' => 'Taux d\'embauche (%)', 'data' => array_map(fn($b) => round($b['hire_rate'] * 100, 1), array_values($calibration))],
]], 'options' => ['scales' => ['y' => ['min' => 0, 'max' => 100]]]];
?>
<div class="page-head"><div><h1>Qualité et calibrage</h1><p>La robustesse se mesure. Ces indicateurs sont calculés sur les données réelles de la plateforme et revus chaque mois ; « non mesurable » signifie que les données nécessaires n'existent pas encore.</p></div></div>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'qualite']) ?>
<section class="card card-lg mb-3">
    <h2 style="font-size:1.1rem"><?= icon('gauge') ?> Tableau de bord qualité</h2>
    <div class="kpi-row small muted" style="font-weight:700"><span>Indicateur</span><span>Définition et mesure</span><span>Valeur</span><span>Cible</span></div>
    <?php foreach ($kpis as $k): ?>
        <div class="kpi-row">
            <b style="color:var(--navy)"><?= e($k['label']) ?></b>
            <span class="small"><?= e($k['definition']) ?><br><span class="muted"><?= e($k['detail']) ?></span></span>
            <span class="kpi-val <?= $k['ok'] === null ? 'kpi-na' : ($k['ok'] ? 'kpi-ok' : 'kpi-ko') ?>"><?= e($fmt($k)) ?></span>
            <span class="small"><?= e($k['target']) ?></span>
        </div>
    <?php endforeach; ?>
</section>
<div class="grid-2">
    <section class="card card-lg">
        <h2 style="font-size:1.1rem"><?= icon('trending-up') ?> Calibrage par les résultats</h2>
        <p class="small muted">Par tranche de verdict (score au moment de la candidature) : entretiens et embauches obtenus. Un seuil est ajusté si une tranche ne produit pas les résultats attendus, par exemple si les profils « adaptés » n'obtiennent pas nettement plus d'entretiens que les profils « proches ». Revue trimestrielle dès 6 mois de données.</p>
        <div class="table-wrap"><table class="table"><thead><tr><th>Tranche</th><th>Candidatures</th><th>Entretiens</th><th>Embauches</th></tr></thead><tbody>
            <?php foreach ($calibration as $b): ?><tr><td><b><?= e($b['label']) ?></b> <small class="muted">≥ <?= (int)$b['min'] ?></small></td><td><?= (int)$b['apps'] ?></td><td><?= (int)$b['interviews'] ?> <small class="muted">(<?= round($b['interview_rate'] * 100) ?> %)</small></td><td><?= (int)$b['hired'] ?> <small class="muted">(<?= round($b['hire_rate'] * 100) ?> %)</small></td></tr><?php endforeach; ?>
        </tbody></table></div>
        <div class="chart-box sm mt-2"><canvas data-chart='<?= e(json_encode($chart)) ?>' role="img" aria-label="Taux d'entretien et d'embauche par tranche de verdict"></canvas></div>
        <a class="btn btn-ghost btn-sm mt-2" href="<?= e(url('/admin/referentiels/regles')) ?>"><?= icon('sliders-horizontal') ?> Ajuster les seuils</a>
    </section>
    <section class="card card-lg" id="controle">
        <h2 style="font-size:1.1rem"><?= icon('list-checks') ?> Contrôle d'échantillon</h2>
        <p class="small muted">Vérifie ces rattachements automatiques d'offres à une fiche métier : la précision de la normalisation en découle (cible ≥ 90 %).</p>
        <form method="post" action="<?= e(url('/admin/qualite/controle')) ?>" class="stack-sm">
            <?= csrf_field() ?>
            <?php foreach ($sample as $i => $s): ?>
                <div class="gap-row"><input type="hidden" name="raw[<?= $i ?>]" value="<?= e($s['raw']) ?>"><input type="hidden" name="code[<?= $i ?>]" value="<?= e($s['code']) ?>">
                    <b class="small"><?= e($s['raw']) ?></b> → <span class="small"><?= e($s['code'] . ' ' . $s['label']) ?></span> <small class="muted">(<?= (int)$s['confidence'] ?> %)</small>
                    <div class="flex" style="gap:12px"><label class="check"><input type="radio" name="correct[<?= $i ?>]" value="1"> <span class="small">Correct</span></label><label class="check"><input type="radio" name="correct[<?= $i ?>]" value="0"> <span class="small">Incorrect</span></label></div></div>
            <?php endforeach; ?>
            <?php if ($sample): ?><button class="btn btn-soft btn-sm" type="submit">Enregistrer les contrôles</button><?php else: ?><p class="small muted">Aucune offre rattachée à contrôler.</p><?php endif; ?>
        </form>
        <form method="post" action="<?= e(url('/admin/formations/verifier-liens')) ?>" class="mt-3"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit"><?= icon('link') ?> Vérifier 25 liens de formation maintenant</button><p class="small muted mb-0">À planifier chaque nuit : <code>php bin/verifier-formations.php</code></p></form>
    </section>
</div>
