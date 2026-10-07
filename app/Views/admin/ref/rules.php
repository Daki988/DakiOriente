<?php $R = App\Services\Referential\Ref::class; $th = array_column($draft['thresholds'], null, 'key'); ?>
<div class="page-head"><div><h1>Référentiel Objectifs & Seuils</h1><p>Les poids du score et les seuils qui déclenchent chaque action. Les modifications sont enregistrées en brouillon et s'appliquent à la prochaine version, après passage du jeu de référence.</p></div></div>
<?= App\Core\View::partial('admin/ref/_tabs', ['current' => 'regles']) ?>
<div class="layout-aside">
<form method="post" action="<?= e(url('/admin/referentiels/regles')) ?>" class="card card-lg stack">
    <?= csrf_field() ?>
    <h2 style="font-size:1.1rem">Pondération du score d'adéquation (total 100)</h2>
    <div class="form-grid cols-3">
        <?php foreach ($R::CRITERIA as $k => [$l, $d]): ?><div class="field"><label for="w-<?= $k ?>"><?= e($l) ?> <small class="muted">(en vigueur : <?= (int)$live['weights'][$k] ?>)</small></label><input id="w-<?= $k ?>" name="weights[<?= $k ?>]" type="number" min="0" max="100" value="<?= (int)$draft['weights'][$k] ?>"><span class="hint"><?= e($d) ?></span></div><?php endforeach; ?>
    </div>
    <h2 style="font-size:1.1rem">Seuils d'action</h2>
    <div class="form-grid cols-3">
        <?php foreach (['adapte', 'proche', 'renforcer'] as $k): ?><div class="field"><label for="t-<?= $k ?>"><?= e($th[$k]['label']) ?> à partir de</label><input id="t-<?= $k ?>" name="thresholds[<?= $k ?>]" type="number" min="1" max="99" value="<?= (int)$th[$k]['min'] ?>"><span class="hint"><?= e($th[$k]['action']) ?></span></div><?php endforeach; ?>
    </div>
    <p class="small muted mb-0">En dessous : « <?= e($th['eloigne']['label']) ?> » (<?= e(mb_strtolower($th['eloigne']['action'])) ?>). Un prérequis manquant donne toujours « Prérequis manquant », quel que soit le score.</p>
    <h2 style="font-size:1.1rem">Règles de calcul</h2>
    <div class="form-grid cols-3">
        <div class="field"><label for="lp">Perte par niveau manquant</label><input id="lp" name="level_penalty" value="<?= e((string)$draft['level_penalty']) ?>"><span class="hint">0,35 dans le cahier des charges</span></div>
        <div class="field"><label for="uc">Niveau maximal sans preuve</label><input id="uc" name="unproven_cap" type="number" min="1" max="4" value="<?= (int)$draft['unproven_cap'] ?>"></div>
        <div class="field"><label for="pg">Formations par écart (max.)</label><input id="pg" name="per_gap" type="number" min="1" max="5" value="<?= (int)$draft['trainings']['per_gap'] ?>"></div>
        <div class="field"><label for="rd">Seuil « prêt » (employabilité)</label><input id="rd" name="ready" type="number" min="1" max="100" value="<?= (int)$draft['employability']['ready'] ?>"></div>
        <div class="field"><label for="of">Offres proches prises en compte</label><input id="of" name="offers" type="number" min="3" max="30" value="<?= (int)$draft['employability']['offers'] ?>"></div>
        <div class="field"><label for="au">Rattachement automatique dès (confiance %)</label><input id="au" name="auto" type="number" min="50" max="100" value="<?= (int)$draft['normalization']['auto'] ?>"></div>
        <div class="field"><label for="cf">Confirmation demandée dès (%)</label><input id="cf" name="confirm" type="number" min="30" max="100" value="<?= (int)$draft['normalization']['confirm'] ?>"><span class="hint">En dessous : file de curation</span></div>
        <div class="field"><label for="mm">Écart maximal avec les experts</label><input id="mm" name="max_mae" type="number" min="1" max="30" value="<?= (int)$draft['golden']['max_mae'] ?>"></div>
        <div class="field"><label for="mp">Couples minimum du jeu de référence</label><input id="mp" name="min_pairs" type="number" min="1" max="500" value="<?= (int)$draft['golden']['min_pairs'] ?>"></div>
    </div>
    <div class="field"><label for="note">Motif de la modification (journal)</label><input id="note" name="note" maxlength="255" placeholder="Ex. recalibrage trimestriel : les profils « proches » obtiennent autant d'entretiens que les « adaptés »"></div>
    <div><?php if ($canValidate): ?><button class="btn btn-primary" type="submit"><?= icon('check') ?> Enregistrer le brouillon</button><?php else: ?><p class="small muted">Seul le responsable des référentiels peut modifier les règles.</p><?php endif; ?></div>
</form>
<aside class="stack">
    <section class="card card-lg">
        <h2 style="font-size:1.1rem">Simulation</h2>
        <p class="small muted">Compare le score en vigueur et le score avec les règles en brouillon.</p>
        <form method="get" class="stack-sm">
            <select class="input" name="candidate" aria-label="Candidat"><?php foreach ($candidates as $c): ?><option value="<?= (int)$c['id'] ?>" <?= (int)input('candidate') === (int)$c['id'] ? 'selected' : '' ?>><?= e($c['first_name'] . ' ' . $c['last_name']) ?></option><?php endforeach; ?></select>
            <select class="input" name="job" aria-label="Offre"><?php foreach ($jobs as $j): ?><option value="<?= (int)$j['id'] ?>" <?= (int)input('job') === (int)$j['id'] ? 'selected' : '' ?>><?= e($j['title']) ?></option><?php endforeach; ?></select>
            <button class="btn btn-soft btn-sm" type="submit">Simuler</button>
        </form>
        <?php if ($sim): ?>
            <p class="mt-2 mb-1"><b>En vigueur :</b> <?= (int)$sim['score'] ?>/100 — <?= e($sim['verdict']['label']) ?></p>
            <p class="mb-2"><b>Brouillon :</b> <?= (int)$simDraft['score'] ?>/100 — <?= e($simDraft['verdict']['label']) ?></p>
            <?= App\Core\View::partial('partials/match_explain', ['match' => $sim, 'compact' => true]) ?>
        <?php endif; ?>
    </section>
    <section class="card card-lg">
        <h2 style="font-size:1.1rem">Historique des règles</h2>
        <ul class="list"><?php foreach ($history as $h): ?><li class="small"><span class="grow"><?= $h['number'] ? 'Version ' . (int)$h['number'] : 'Brouillon' ?> · <?= e($h['note']) ?><br><small class="muted"><?= e(date_fr($h['created_at'], true)) ?></small></span></li><?php endforeach; ?></ul>
    </section>
</aside>
</div>
