<?php
$R = App\Services\Referential\Ref::class;
$roles = App\Controllers\Admin\ReferentialController::ROLES;
$st = fn(array $c, string $k) => (int)($c[$k] ?? 0);
?>
<div class="page-head"><div><h1>Référentiels Tremplin</h1><p>Le référentiel décide, l'IA explique. Cinq référentiels curés, versionnés et validés par des experts rendent chaque score reproductible et explicable.</p></div></div>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'index']) ?>
<div class="ref-stats mb-3">
    <div class="ref-stat"><small>Version en vigueur</small><b><?= $version ? 'v' . (int)$version['number'] : '—' ?></b><small><?= $version ? e(date_fr($version['published_at'])) : 'aucune' ?></small></div>
    <div class="ref-stat"><small>Modifications à publier</small><b><?= (int)$pending ?></b><small>dans le journal de la prochaine version</small></div>
    <div class="ref-stat"><small>File de curation</small><b><?= (int)$openCuration ?></b><small>élément(s) ouvert(s)</small></div>
    <div class="ref-stat"><small>Jeu de référence</small><b><?= (int)$pairs ?></b><small>couple(s) noté(s) par les experts</small></div>
</div>
<div class="grid-2">
    <?php foreach ([
        ['Métiers & Emplois', 'briefcase-business', '/admin/referentiels/metiers', $stats['metiers'], 'Fiches rattachées à ROME 4.0, ESCO et ISCO-08 : appellations locales, compétences requises (niveau, poids), prérequis bloquants, métiers proches. Objectif : 150 fiches validées au lancement.'],
        ['Compétences', 'zap', '/admin/referentiels/competences', $stats['competences'], 'Chaque compétence est définie une seule fois (ESCO, DigComp, CECRL), avec ses synonymes et quatre niveaux observables.'],
        ['Diplômes & Équivalences', 'graduation-cap', '/admin/referentiels/diplomes', $stats['diplomes'], 'Échelle commune N0 à N6 ; diplômes étrangers rattachés au niveau correspondant ou marqués « à vérifier ».'],
    ] as [$t, $ic, $u, $c, $d]): ?>
        <a class="card card-lg list-link" style="display:block" href="<?= e(url($u)) ?>">
            <h2 style="font-size:1.1rem"><?= icon($ic) ?> <?= e($t) ?></h2>
            <p class="small muted"><?= e($d) ?></p>
            <div class="flex flex-wrap" style="gap:6px"><?php foreach ($R::STATUSES as $k => [$l, $col]): ?><span class="badge badge-<?= $col ?>"><?= $st($c, $k) ?> <?= e(mb_strtolower($l)) ?></span><?php endforeach; ?></div>
        </a>
    <?php endforeach; ?>
    <a class="card card-lg list-link" style="display:block" href="<?= e(url('/admin/formations')) ?>">
        <h2 style="font-size:1.1rem"><?= icon('book-open') ?> Formations</h2>
        <p class="small muted">Une formation n'est recommandée que si elle comble un écart précis. Au plus trois par écart ; masquée si non vérifiée depuis 6 mois ; partenaires signalés sans avantage.</p>
        <div class="flex flex-wrap" style="gap:6px"><span class="badge badge-green"><?= (int)$stats['formations']['fresh'] ?> vérifiées &lt; 6 mois</span><span class="badge badge-gray"><?= (int)$stats['formations']['total'] ?> actives</span><span class="badge badge-blue"><?= (int)$stats['formations']['linked'] ?> reliées à des compétences</span></div>
    </a>
</div>
<section class="card card-lg mt-3" id="equipe">
    <h2 style="font-size:1.1rem"><?= icon('users') ?> Équipe de curation</h2>
    <p class="small muted">Cycle de vie d'une fiche : brouillon → relecture par un expert → validation par le responsable → publication dans une version → révision ou archivage. Tant qu'aucun responsable n'est désigné, tout administrateur peut valider.</p>
    <form method="post" action="<?= e(url('/admin/referentiels/equipe')) ?>">
        <?= csrf_field() ?>
        <div class="table-wrap"><table class="table"><thead><tr><th>Administrateur</th><th>Rôle dans les référentiels</th></tr></thead><tbody>
            <?php foreach ($team as $m): ?><tr><td><b><?= e($m['first_name'] . ' ' . $m['last_name']) ?></b><br><small class="muted"><?= e($m['email']) ?></small></td>
                <td><select name="roles[<?= (int)$m['id'] ?>]" class="input" <?= $canValidate ? '' : 'disabled' ?>><option value="">Équipe produit (lecture)</option><?php foreach ($roles as $k => $l): ?><option value="<?= $k ?>" <?= $m['ref_role'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></td></tr><?php endforeach; ?>
        </tbody></table></div>
        <?php if ($canValidate): ?><button class="btn btn-primary btn-sm mt-2" type="submit">Enregistrer l'équipe</button><?php endif; ?>
    </form>
    <p class="small muted mt-2">Les entreprises partenaires signalent leurs besoins en compétences : leurs suggestions arrivent dans la file de curation.</p>
</section>
