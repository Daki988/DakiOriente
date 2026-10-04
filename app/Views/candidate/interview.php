<div class="page-head"><div><h1>Préparer un entretien</h1><p>Entraîne-toi sur des questions adaptées à l'offre visée et reçois un feedback immédiat (méthode STAR).</p></div></div>
<div class="layout-aside">
    <div class="stack">
        <?php if ($allowed): ?>
            <form method="post" action="<?= e(url('/espace/entretien')) ?>" class="card card-lg">
                <?= csrf_field() ?>
                <h2 style="font-size:1.15rem"><?= icon('mic') ?> Nouvelle simulation</h2>
                <div class="field"><label for="job_id">Offre visée</label>
                    <select id="job_id" name="job_id"><option value="">Entretien général</option><?php foreach ($myJobs as $j): ?><option value="<?= (int)$j['id'] ?>" <?= $selected === (int)$j['id'] ? 'selected' : '' ?>><?= e($j['title'] . ' — ' . $j['company_name']) ?></option><?php endforeach; ?></select>
                    <span class="hint">Les questions techniques s'adaptent aux compétences demandées par l'offre.</span></div>
                <button class="btn btn-cta mt-2" type="submit"><?= icon('rocket') ?> Démarrer la simulation</button>
            </form>
        <?php else: ?>
            <?= App\Core\View::partial('partials/locked', ['required' => 'PREMIUM', 'heading' => 'Simulateur d\'entretien', 'text' => 'Réponds aux questions comme en vrai et reçois une analyse détaillée de chaque réponse.']) ?>
        <?php endif; ?>
        <section class="card card-lg">
            <h2 style="font-size:1.15rem">Aperçu des questions<?= $selected ? ' pour cette offre' : '' ?></h2>
            <ol style="display:grid;gap:10px;padding-left:1.2em">
                <?php foreach ($preview as $q): ?><li><span class="badge badge-gray"><?= e($q['type']) ?></span> <?= e($q['q']) ?></li><?php endforeach; ?>
            </ol>
        </section>
    </div>
    <aside class="stack">
        <div class="card card-lg">
            <h3>La méthode STAR</h3>
            <ul class="explain-list ok small">
                <li><b style="color:var(--blue)">S</b><span><b>Situation</b> — le contexte (où, quand)</span></li>
                <li><b style="color:var(--blue)">T</b><span><b>Tâche</b> — ce qu'on attendait de toi</span></li>
                <li><b style="color:var(--blue)">A</b><span><b>Action</b> — ce que TU as fait (« j'ai… »)</span></li>
                <li><b style="color:var(--blue)">R</b><span><b>Résultat</b> — l'impact, si possible chiffré</span></li>
            </ul>
        </div>
        <div class="card">
            <h3>Mes simulations</h3>
            <?php if (!$sessions): ?><p class="small muted mb-0">Aucune simulation pour l'instant.</p><?php endif; ?>
            <ul class="list"><?php foreach ($sessions as $s): ?><li><a class="list-link" href="<?= e(url('/espace/entretien/' . $s['id'])) ?>"><span class="grow small"><b><?= e($s['title'] ?: 'Entretien général') ?></b><br><span class="muted"><?= e(date_fr($s['created_at'])) ?></span></span><?php if ($s['score'] !== null): ?><span class="badge badge-<?= $s['score'] >= 70 ? 'green' : 'amber' ?>"><?= (int)$s['score'] ?>/100</span><?php else: ?><span class="badge badge-gray">À compléter</span><?php endif; ?></a></li><?php endforeach; ?></ul>
        </div>
    </aside>
</div>
