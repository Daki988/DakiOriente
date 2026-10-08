<?php
/** @var array $check @var array $res @var array $gaps @var array $planned */
$d = $res['data'];
$m = $res['m'];
$job = $res['job'];
$occ = $job && $job['occupation_id'] ? App\Services\Referential\Ref::occupation((int)$job['occupation_id']) : null;
?>
<div class="page-head"><div>
    <a class="small" href="<?= e(url('/espace/preparation-stages#offre-trouvee')) ?>"><?= icon('chevron-left') ?> Préparation sur offres réelles</a>
    <h1 class="mt-1"><?= e($check['title']) ?></h1>
    <p><?= e(implode(' · ', array_filter([$d['organization'] ?? null, $d['city'] ?? null, $check['contract'] === 'stage' ? 'Stage' : 'Emploi', $check['site'] ? 'Trouvée sur ' . $check['site'] : null]))) ?></p>
</div></div>

<div class="alert alert-info mb-3"><?= icon('info') ?><div class="small">Évaluation calculée à partir du texte que tu as collé le <?= e(date_fr($check['created_at'])) ?>, avec ton profil actuel. Lecture <?= $check['extraction'] === 'claude' ? 'par Claude, contrôlée : seuls les éléments présents dans le texte sont gardés' : 'par les règles du référentiel NEAM' ?>. Elle est privée : personne d'autre ne la voit.<?php if ($check['url']): ?> <a href="<?= e($check['url']) ?>" target="_blank" rel="noopener noreferrer nofollow">Annonce d'origine <?= icon('external-link') ?></a><?php endif; ?></div></div>

<?php if (!$m): ?>
    <div class="empty card card-lg"><?= icon('circle-help') ?><h3>Offre non évaluable</h3><p class="muted mb-0">Aucune compétence ni aucun métier du référentiel n'a été reconnu. Recommence en précisant l'intitulé exact du poste ou en collant la partie « profil recherché » de l'annonce.</p></div>
<?php else: ?>
<div class="grid-2 mb-3">
    <div class="card card-lg">
        <div class="score-hero">
            <div class="ring ring-xl <?= score_class($m['score']) ?>" style="--p:<?= (int)$m['score'] ?>"><b><?= (int)$m['score'] ?><small>/100</small></b></div>
            <div class="grow">
                <span class="badge badge-<?= e($m['verdict']['color']) ?>"><?= e($m['verdict']['label']) ?></span>
                <p class="small mt-1 mb-0"><?= e($m['verdict']['action'] ?? '') ?></p>
                <?php if ($m['blocked']): ?><p class="small mt-1 mb-0"><?= icon('lock') ?> <?= e($m['elimination']) ?></p><?php endif; ?>
                <p class="small muted mt-1 mb-0">Mêmes règles que pour les offres Tremplin<?= $occ ? ' · fiche métier ' . e($occ['code'] . ' ' . $occ['title']) : '' ?>.</p>
            </div>
        </div>
    </div>
    <div class="card card-lg">
        <h3><?= icon('list-checks') ?> Ce que demande l'offre</h3>
        <ul class="list-plain small">
            <?php foreach ($m['skill_items'] as $i): $ok = $i['value'] >= 1; ?>
                <li class="flex" style="justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid var(--line)">
                    <span><?= icon($ok ? 'check-circle-2' : 'circle-alert') ?> <?= e($i['name']) ?></span>
                    <span class="badge badge-<?= $ok ? 'green' : ($i['have'] ? 'amber' : 'gray') ?>"><?= $i['have'] ? 'niveau ' . (int)$i['have'] : 'absente' ?> / <?= (int)$i['expected'] ?></span>
                </li>
            <?php endforeach; ?>
        </ul>
        <p class="small muted mt-1 mb-0"><?= e(implode(' · ', array_filter([
            !empty($d['education']) ? 'Études : ' . $d['education'] : null,
            !empty($d['experience_months']) ? 'Expérience : ' . App\Services\MatchingEngine::monthsLabel((int)$d['experience_months']) : null,
            !empty($d['languages']) ? 'Langues : ' . implode(', ', $d['languages']) : null]))) ?></p>
    </div>
</div>

<section class="card card-lg mb-3">
    <h3><?= icon('sliders-horizontal') ?> Détail par critère</h3>
    <table class="table small"><tbody>
    <?php foreach ($m['criteria'] as $c): ?><tr><td><?= e($c['label']) ?></td><td><?= e(number_format($c['points'], 1, ',', ' ')) ?> / <?= e(number_format($c['weight'], 0, ',', ' ')) ?></td><td class="muted"><?= e($c['detail']) ?></td></tr><?php endforeach; ?>
    </tbody></table>
</section>

<?php if ($gaps): ?>
<section class="card card-lg mb-3">
    <h3><?= icon('route') ?> À préparer pour ce type d'offre</h3>
    <ol class="plan-list">
    <?php foreach ($gaps as $g): ?>
        <li class="mb-2"><b><?= e($g['text']) ?></b> <span class="small muted">· environ <?= e(number_format($g['lost'], 1, ',', ' ')) ?> point(s)</span>
            <?php if ($g['type'] === 'cv'): ?><div><a class="btn btn-ghost btn-sm mt-1" href="<?= e(url('/espace/cv')) ?>"><?= icon('file-text') ?> Améliorer mon CV</a></div><?php endif; ?>
            <?php if ($g['recos']): ?><ul class="reco-list mt-1"><?php foreach ($g['recos'] as $r): ?><?= App\Core\View::partial('partials/reco_item', ['r' => $r, 'gapKey' => $g['key'], 'planned' => $planned, 'canPlan' => true]) ?><?php endforeach; ?></ul><?php endif; ?>
        </li>
    <?php endforeach; ?>
    </ol>
</section>
<?php endif; ?>
<?php endif; ?>

<details class="card mb-3"><summary class="small"><b>Texte collé</b></summary><p class="small mt-2" style="white-space:pre-line"><?= e($check['offer_text']) ?></p></details>
<form method="post" action="<?= e(url('/espace/preparation-stages/offres-evaluees/' . $check['id'] . '/supprimer')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit"><?= icon('trash-2') ?> Supprimer cette évaluation</button></form>
