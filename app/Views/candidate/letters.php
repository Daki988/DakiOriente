<div class="page-head">
    <div><h1>Lettres de motivation</h1><p>Rédigées à partir de ton profil et adaptées à l'offre visée. Tu gardes toujours la main sur le texte final.</p></div>
</div>
<div class="layout-aside">
    <div class="stack">
        <?php if (!$letters): ?>
            <?= App\Core\View::partial('partials/empty', ['icon' => 'scroll-text', 'heading' => 'Aucune lettre pour l\'instant', 'text' => 'Choisis une offre à droite et génère ta première lettre personnalisée.']) ?>
        <?php endif; ?>
        <?php foreach ($letters as $l): ?>
            <article class="card card-lg" id="lettre-<?= (int)$l['id'] ?>">
                <div class="card-title">
                    <div><h2 style="font-size:1.05rem"><?= e($l['title']) ?></h2><small class="muted"><?= e(date_fr($l['created_at'], true)) ?> · <?= $l['source'] === 'ia' ? 'générée avec l\'assistant' : 'rédigée' ?></small></div>
                    <div class="flex">
                        <button class="btn btn-ghost btn-sm" type="button" data-copy="lt-<?= (int)$l['id'] ?>"><?= icon('copy') ?> Copier</button>
                        <?php if ($l['job_id']): ?><a class="btn btn-soft btn-sm" href="<?= e(url('/offres/' . $l['job_id'] . '/postuler?letter=' . $l['id'])) ?>"><?= icon('send') ?> Postuler</a><?php endif; ?>
                        <form method="post" action="<?= e(url('/espace/lettres/' . $l['id'] . '/supprimer')) ?>" data-confirm="Supprimer cette lettre ?"><?= csrf_field() ?><button class="btn btn-ghost btn-icon btn-sm" type="submit" aria-label="Supprimer"><?= icon('trash-2') ?></button></form>
                    </div>
                </div>
                <div id="lt-<?= (int)$l['id'] ?>" style="white-space:pre-line;background:var(--bg);border-radius:14px;padding:18px;font-size:.95rem;line-height:1.7"><?= e($l['body']) ?></div>
            </article>
        <?php endforeach; ?>
    </div>
    <aside>
        <form method="post" action="<?= e(url('/espace/lettres')) ?>" class="card card-lg stack" style="position:sticky;top:90px">
            <?= csrf_field() ?>
            <h3><?= icon('sparkles') ?> Nouvelle lettre</h3>
            <div class="field"><label for="job_id">Pour l'offre</label>
                <select id="job_id" name="job_id"><option value="">Candidature spontanée</option><?php foreach ($jobs as $j): ?><option value="<?= (int)$j['id'] ?>" <?= $selectedJob === (int)$j['id'] ? 'selected' : '' ?>><?= e($j['title'] . ' — ' . $j['company_name']) ?></option><?php endforeach; ?></select></div>
            <fieldset><legend class="label">Ton</legend>
                <div class="range-row">
                    <label class="choice"><input type="radio" name="tone" value="professionnel" checked><span>Professionnel</span></label>
                    <label class="choice"><input type="radio" name="tone" value="enthousiaste"><span>Enthousiaste</span></label>
                </div>
            </fieldset>
            <?php if (!$aiEnabled): ?><div class="alert alert-warning small"><?= icon('info') ?><div>L'assistant est temporairement désactivé.</div></div><?php endif; ?>
            <button class="btn btn-cta btn-block" type="submit" <?= $aiEnabled ? '' : 'disabled' ?>><?= icon('sparkles') ?> Générer ma lettre</button>
            <p class="small muted mb-0"><?= icon('info') ?> Moteur : <?= e($provider) ?>. <?= launch_mode() ? 'Gratuit pendant la phase de lancement · ' . (int)$usage['remaining'] . '/' . (int)$usage['limit'] . ' générations IA restantes ce mois.' : ($unlimited ? 'Lettres illimitées avec ton abonnement.' : 'Offre Free : ' . max(0, $freeLimit - $usedThisMonth) . ' / ' . $freeLimit . ' lettres restantes ce mois.') ?></p>
        </form>
    </aside>
</div>
