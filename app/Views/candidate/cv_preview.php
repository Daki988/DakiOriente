<?php
/** @var array $p @var array $s @var array $proof @var array $pending @var array $score @var bool $pdfReady @var bool $claudeOn @var ?string $shareUrl */
use App\Services\Cv\CvTemplates;
use App\Services\Cv\Proofreader;

$blocking = $pending['blocking'];
$tips = $pending['tips'];
$ok = !$blocking;
$hl = function (array $i): string {
    // Contexte avec la partie fautive surlignée
    $ctx = e($i['context']);
    $orig = e($i['original']);
    return $orig !== '' && str_contains($ctx, $orig) ? preg_replace('/' . preg_quote($orig, '/') . '/u', '<mark>' . $orig . '</mark>', $ctx, 1) : $ctx;
};
$show = fn(string $t, string $type = '') => e(str_replace(["\u{00A0}", ' '], ['␣', $type === 'typographie' ? '␣' : ' '], $t));
$pdfUrl = url('/espace/cv/pdf', ['inline' => 1, 'v' => substr(md5(($proof['hash'] ?? '') . json_encode($s)), 0, 8)]);
?>
<div class="page-head">
    <div><h1>Aperçu et téléchargement</h1><p>Dernière étape avant d'envoyer ton CV : on relit chaque mot, on vérifie la mise en page, puis tu télécharges ton PDF.</p></div>
    <div class="flex flex-wrap"><a class="btn btn-ghost" href="<?= e(url('/espace/cv')) ?>"><?= icon('chevron-left') ?> Modèles et réglages</a></div>
</div>

<ol class="cv-steps mb-3" aria-label="Étapes">
    <li class="<?= $ok ? 'done' : 'now' ?>"><span><?= $ok ? icon('check') : '1' ?></span> Relecture</li>
    <li class="<?= $ok ? 'done' : '' ?>"><span><?= $ok ? icon('check') : '2' ?></span> Mise en page</li>
    <li class="<?= $ok ? 'now' : '' ?>"><span>3</span> Téléchargement</li>
</ol>

<div class="layout-aside">
    <div class="stack">
        <section class="card card-lg" id="relecture">
            <div class="flex between flex-wrap" style="gap:8px">
                <h2 class="mb-0" style="font-size:1.2rem"><?= icon('spell-check') ?> Relecture <?= $ok ? '<span class="badge badge-green">' . icon('check') . ' Terminée</span>' : '<span class="badge badge-amber">' . count($blocking) . ' à traiter</span>' ?></h2>
                <small class="muted">Par <?= e($proof['provider']) ?> · <?= e(time_ago($proof['checked_at'] ?? null)) ?></small>
            </div>
            <?php if ($ok): ?>
                <div class="alert alert-success mt-2"><?= icon('circle-check-big') ?><div><b>Aucune faute bloquante.</b> Orthographe, majuscules et ponctuation sont propres<?= $tips ? ' ; quelques conseils facultatifs ci-dessous pour aller plus loin' : '' ?>. Tu peux télécharger ton CV.</div></div>
            <?php else: ?>
                <p class="small muted mt-1">Chaque remarque doit être traitée : <b>Corriger</b> applique la correction dans ton profil (et donc dans tous tes CV) ; <b>Garder</b> conserve ton texte s'il est volontaire (nom propre, sigle…).</p>
                <form method="post" action="<?= e(url('/espace/cv/relecture')) ?>" class="mb-2"><?= csrf_field() ?><input type="hidden" name="action" value="apply_all"><button class="btn btn-primary" type="submit"><?= icon('wand-sparkles') ?> Tout corriger (<?= count($blocking) ?>)</button></form>
                <ul class="proof-list">
                    <?php foreach ($blocking as $i): ?>
                        <li class="proof-item sev-<?= e($i['severity']) ?>">
                            <div class="flex between flex-wrap" style="gap:6px"><span class="badge badge-<?= $i['severity'] === 'error' ? 'red' : 'amber' ?>"><?= e(Proofreader::TYPES[$i['type']] ?? $i['type']) ?></span><small class="muted"><?= e($i['label']) ?><?= $i['source'] === 'Claude' ? ' · Claude' : '' ?></small></div>
                            <p class="proof-ctx"><?= $hl($i) ?></p>
                            <p class="proof-fix"><del><?= $show($i['original'], $i['type']) ?></del> <?= icon('arrow-right') ?> <ins><?= $show($i['suggestion'], $i['type']) ?></ins></p>
                            <p class="small muted mb-1"><?= e($i['message']) ?></p>
                            <div class="flex flex-wrap" style="gap:6px">
                                <form method="post" action="<?= e(url('/espace/cv/relecture')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="apply"><input type="hidden" name="id" value="<?= e($i['id']) ?>"><button class="btn btn-success btn-sm" type="submit"><?= icon('check') ?> Corriger</button></form>
                                <form method="post" action="<?= e(url('/espace/cv/relecture')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="ignore"><input type="hidden" name="id" value="<?= e($i['id']) ?>"><button class="btn btn-ghost btn-sm" type="submit">Garder mon texte</button></form>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
            <?php if ($tips): ?>
                <details class="mt-2" <?= $ok ? 'open' : '' ?>>
                    <summary class="small"><b><?= count($tips) ?> conseil(s) facultatif(s)</b> — typographie fine et rédaction</summary>
                    <ul class="proof-list mt-1">
                        <?php foreach ($tips as $i): ?>
                            <li class="proof-item sev-tip">
                                <div class="flex between flex-wrap" style="gap:6px"><span class="badge badge-sky"><?= e(Proofreader::TYPES[$i['type']] ?? $i['type']) ?></span><small class="muted"><?= e($i['label']) ?></small></div>
                                <?php if ($i['type'] !== 'style'): ?><p class="proof-fix"><del><?= $show($i['original'], $i['type']) ?></del> <?= icon('arrow-right') ?> <ins><?= $show($i['suggestion'], $i['type']) ?></ins></p><?php endif; ?>
                                <p class="small muted mb-1"><?= e($i['message']) ?></p>
                                <div class="flex flex-wrap" style="gap:6px">
                                    <?php if ($i['type'] !== 'style'): ?><form method="post" action="<?= e(url('/espace/cv/relecture')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="apply"><input type="hidden" name="id" value="<?= e($i['id']) ?>"><button class="btn btn-soft btn-sm" type="submit">Appliquer</button></form><?php endif; ?>
                                    <form method="post" action="<?= e(url('/espace/cv/relecture')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="ignore"><input type="hidden" name="id" value="<?= e($i['id']) ?>"><button class="btn btn-ghost btn-sm" type="submit">Masquer</button></form>
                                </div>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </details>
            <?php endif; ?>
            <div class="flex flex-wrap mt-2" style="gap:8px">
                <?php if ($pending['ignored']): ?><form method="post" action="<?= e(url('/espace/cv/relecture')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="restore"><button class="btn btn-ghost btn-sm" type="submit"><?= icon('undo-2') ?> Réafficher <?= (int)$pending['ignored'] ?> remarque(s) conservée(s)</button></form><?php endif; ?>
                <?php if ($claudeOn): ?><form method="post" action="<?= e(url('/espace/cv/relecture')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="recheck"><button class="btn btn-ghost btn-sm" type="submit" <?= $quota['remaining'] > 0 ? '' : 'disabled' ?>><?= icon('sparkles') ?> Relancer la relecture par Claude</button></form><?php endif; ?>
            </div>
            <?php if (!$claudeOn): ?><p class="small muted mt-1 mb-0"><?= icon('info') ?> Relecture par le moteur NEAM : fautes fréquentes, accents, majuscules, ponctuation et typographie. Avec la clé Claude, la grammaire et les accords sont aussi vérifiés en contexte.</p><?php endif; ?>
        </section>

        <section class="card card-lg">
            <div class="flex between flex-wrap mb-2" style="gap:8px">
                <h2 class="mb-0" style="font-size:1.2rem"><?= icon('file-text') ?> Ton CV tel qu'il sera imprimé</h2>
                <span class="badge badge-blue" id="pdf-pages" aria-live="polite">Mise en page…</span>
            </div>
            <?php if ($pdfReady): ?>
                <div class="pdf-viewer" id="pdf-viewer" data-src="<?= e($pdfUrl) ?>" data-worker="<?= e(asset('vendor/pdfjs/pdf.worker.min.js')) ?>" data-lib="<?= e(asset('vendor/pdfjs/pdf.min.js')) ?>">
                    <div class="pdf-loading"><span class="spinner" aria-hidden="true"></span> Génération du PDF…</div>
                </div>
                <p class="small muted mt-2 mb-0"><?= icon('info') ?> Cet aperçu est exactement le fichier PDF que tu vas télécharger. <a href="<?= e($pdfUrl) ?>" target="_blank" rel="noopener">Ouvrir le PDF dans un nouvel onglet</a></p>
            <?php else: ?>
                <div class="alert alert-info"><?= icon('info') ?><div>La génération PDF côté serveur n'est pas installée : utilise la version imprimable, puis « Enregistrer au format PDF ». <a href="<?= e(url('/espace/cv/imprimer')) ?>" target="_blank">Ouvrir la version imprimable</a></div></div>
            <?php endif; ?>
        </section>
    </div>

    <aside class="stack">
        <section class="card card-lg cv-dl <?= $ok ? 'ready' : '' ?>">
            <h3><?= icon('file-down') ?> Télécharger mon CV</h3>
            <?php if ($ok): ?>
                <p class="small">PDF au format A4, texte sélectionnable et lisible par les logiciels de tri des recruteurs. <b>Gratuit pendant la phase de lancement.</b></p>
                <a class="btn btn-cta btn-block btn-lg" href="<?= e(url('/espace/cv/pdf')) ?>"><?= icon('file-down') ?> Télécharger le PDF</a>
            <?php else: ?>
                <p class="small">Encore <b><?= count($blocking) ?> remarque(s)</b> de relecture à traiter. Un recruteur écarte vite un CV avec des fautes : ça vaut la minute que ça prend.</p>
                <button class="btn btn-cta btn-block btn-lg" type="button" disabled aria-disabled="true"><?= icon('lock') ?> Télécharger le PDF</button>
                <a class="small" href="#relecture">Traiter les remarques</a>
            <?php endif; ?>
            <p class="small muted mt-2 mb-0">Modèle <b><?= e(CvTemplates::get($s['template'])['name']) ?></b> · palette <?= e(CvTemplates::PALETTES[$s['palette']]['name']) ?> · <?= e(CvTemplates::FONTS[$s['font']]['name']) ?></p>
        </section>

        <form method="post" action="<?= e(url('/espace/cv/reglages')) ?>" class="card stack-sm" data-autosubmit>
            <?= csrf_field() ?><input type="hidden" name="from" value="apercu">
            <h3 class="mb-0"><?= icon('layout-template') ?> Mise en page</h3>
            <div class="field"><label for="pv-density">Densité</label><select id="pv-density" name="density" class="input"><option value="auto" <?= $s['density'] === 'auto' ? 'selected' : '' ?>>Automatique (recommandé)</option><?php foreach (CvTemplates::DENSITIES as $k => $l): ?><option value="<?= e($k) ?>" <?= $s['density'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
            <p class="small muted mb-0" id="pdf-layout-tip">En mode automatique, ton CV tient sur une page dès que c'est possible sans rendre le texte trop petit ; sinon il passe proprement sur deux pages. Les blocs de la colonne latérale qui ne tiennent pas sont déplacés pour que rien ne soit coupé.</p>
        </form>

        <form method="post" action="<?= e(url('/espace/cv/modele')) ?>" class="card stack-sm" data-autosubmit>
            <?= csrf_field() ?><input type="hidden" name="from" value="apercu">
            <h3 class="mb-0"><?= icon('layers') ?> Changer de modèle</h3>
            <label class="sr-only" for="pv-tpl">Modèle</label>
            <select id="pv-tpl" name="template" class="input"><?php foreach (CvTemplates::CATEGORIES as $c): ?><optgroup label="<?= e($c) ?>"><?php foreach (CvTemplates::TEMPLATES as $k => $t): if ($t['cat'] !== $c) continue; ?><option value="<?= e($k) ?>" <?= $s['template'] === $k ? 'selected' : '' ?>><?= e($t['name']) ?></option><?php endforeach; ?></optgroup><?php endforeach; ?></select>
        </form>

        <section class="card">
            <div class="flex" style="gap:12px;align-items:center">
                <div class="ring <?= score_class($score['score']) ?>" style="--p:<?= (int)$score['score'] ?>"><b><?= (int)$score['score'] ?></b></div>
                <div><b>Qualité du CV</b><br><span class="small muted"><?= e($score['level'][0]) ?></span></div>
            </div>
            <?php if ($score['todo']): ?><ul class="explain-list gap small mt-2"><?php foreach (array_slice($score['todo'], 0, 3) as $t): ?><li><?= icon('lightbulb') ?><span><b><?= e($t['label']) ?></b> (+<?= (int)$t['points'] ?>) <a href="<?= e(url($t['link'])) ?>">Améliorer</a></span></li><?php endforeach; ?></ul><?php endif; ?>
        </section>

        <section class="card" id="partage">
            <h3><?= icon('link') ?> Partager mon CV en ligne</h3>
            <?php if ($shareUrl): ?>
                <div class="flex" style="gap:6px"><label class="sr-only" for="pv-share">Lien</label><input id="pv-share" class="input" readonly value="<?= e($shareUrl) ?>" style="min-height:38px;font-size:.85rem"><button class="btn btn-soft btn-sm" type="button" data-copy="pv-share"><?= icon('copy') ?></button></div>
                <p class="small muted mt-1 mb-0">Vu <?= (int)$p['cv_views'] ?> fois · <?= (int)$p['cv_downloads'] ?> téléchargement(s) de ton PDF.</p>
            <?php else: ?>
                <p class="small muted">Un lien privé vers ton CV toujours à jour, idéal pour WhatsApp.</p>
                <form method="post" action="<?= e(url('/espace/cv/partage')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="enable"><input type="hidden" name="from" value="apercu"><button class="btn btn-soft btn-sm" type="submit"><?= icon('link') ?> Activer</button></form>
            <?php endif; ?>
        </section>
    </aside>
</div>
<?php if ($pdfReady): ?>
<script type="module">
// Aperçu fidèle : le PDF généré est affiché page par page (pdf.js), sur ordinateur comme sur mobile.
const box = document.getElementById('pdf-viewer');
const badge = document.getElementById('pdf-pages');
try {
    const pdfjs = await import(box.dataset.lib);
    pdfjs.GlobalWorkerOptions.workerSrc = box.dataset.worker;
    const doc = await pdfjs.getDocument({ url: box.dataset.src, isEvalSupported: false }).promise;
    box.innerHTML = '';
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const width = Math.min(box.clientWidth, 900);
        const vp = page.getViewport({ scale: (width / base.width) * ratio });
        const wrap = document.createElement('div'); wrap.className = 'pdf-page';
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        canvas.style.width = width + 'px'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Page ' + n + ' du CV');
        const label = document.createElement('span'); label.textContent = 'Page ' + n + ' / ' + doc.numPages;
        wrap.append(canvas, label); box.append(wrap);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    }
    badge.textContent = doc.numPages === 1 ? '1 page' : doc.numPages + ' pages';
    badge.className = 'badge badge-' + (doc.numPages <= 2 ? 'green' : 'amber');
    if (doc.numPages > 2) {
        document.getElementById('pdf-layout-tip').textContent = 'Ton CV dépasse deux pages : choisis la densité « Compacte », masque une section (centres d\'intérêt, qualités) ou resserre les descriptions les plus anciennes.';
    }
} catch (e) {
    box.innerHTML = '<p class="small">Aperçu indisponible sur ce navigateur. <a href="' + box.dataset.src + '" target="_blank" rel="noopener">Ouvrir le PDF</a></p>';
    badge.textContent = 'PDF prêt';
}
</script>
<?php endif; ?>
