<?php
/** @var array $p @var array $s @var array $score @var array $pending @var array $versions @var array $docs @var ?array $import @var array $jobs */
use App\Services\Cv\CvRenderer;
use App\Services\Cv\CvShare;
use App\Services\Cv\CvTemplates;

$T = CvTemplates::TEMPLATES;
$current = $s['template'];
$shareUrl = !empty($p['cv_public']) && !empty($p['cv_share_token']) ? CvShare::url((string)$p['cv_share_token']) : null;
$blocking = count($pending['blocking']);
?>
<div class="page-head">
    <div><h1>Mon CV</h1><p>Choisis un modèle, personnalise-le, puis télécharge ton PDF après une relecture complète. Ton CV se construit à partir de ton profil et se met à jour tout seul.</p></div>
    <div class="flex flex-wrap">
        <a class="btn btn-ghost" href="<?= e(url('/espace/profil')) ?>"><?= icon('pencil') ?> Modifier le contenu</a>
        <a class="btn btn-cta" href="<?= e(url('/espace/cv/apercu')) ?>"><?= icon('file-down') ?> Aperçu et PDF</a>
    </div>
</div>

<div class="alert alert-info mb-3"><?= icon('gift') ?><div><b>Gratuit pendant la phase de lancement :</b> les <?= count($T) ?> modèles, les palettes, la relecture et le téléchargement en PDF. Profites-en pour soigner ton CV dès maintenant.</div></div>

<div class="layout-aside">
    <div class="stack">
        <!-- Score de qualité -->
        <section class="card card-lg">
            <div class="score-hero">
                <div class="ring ring-lg <?= score_class($score['score']) ?>" style="--p:<?= (int)$score['score'] ?>"><b><?= (int)$score['score'] ?><small>/100</small></b></div>
                <div class="grow" style="min-width:220px">
                    <span class="badge badge-<?= e($score['level'][1]) ?>"><?= e($score['level'][0]) ?></span>
                    <h2 class="mt-1 mb-0" style="font-size:1.2rem">Qualité de ton CV</h2>
                    <p class="small muted mb-0"><?= $blocking ? '<b style="color:var(--red)">' . $blocking . ' faute(s) ou coquille(s) à corriger</b> avant de télécharger. ' : 'Aucune faute bloquante détectée. ' ?>Chaque point gagné rend ton CV plus convaincant.</p>
                </div>
            </div>
            <?php if ($score['todo']): ?>
                <ul class="explain-list gap small mt-2">
                    <?php foreach (array_slice($score['todo'], 0, 3) as $t): ?>
                        <li><?= icon('lightbulb') ?><span><b><?= e($t['label']) ?> (+<?= (int)$t['points'] ?>)</b> — <?= e($t['tip']) ?> <a href="<?= e(url($t['link'])) ?>">Y aller</a></span></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </section>

        <!-- Galerie des modèles -->
        <section class="card card-lg" id="modeles">
            <div class="flex between flex-wrap mb-1" style="gap:8px">
                <h2 class="mb-0" style="font-size:1.15rem"><?= icon('layers') ?> <?= count($T) ?> modèles, avec tes informations</h2>
                <div class="tabs" role="group" aria-label="Filtrer les modèles">
                    <a href="#modeles" class="active" data-cv-cat="">Tous</a>
                    <?php foreach (CvTemplates::CATEGORIES as $c): ?><a href="#modeles" data-cv-cat="<?= e($c) ?>"><?= e($c) ?></a><?php endforeach; ?>
                </div>
            </div>
            <div class="cv-gallery">
                <?php foreach ($T as $k => $t): $ts = CvTemplates::settings($p, $k); ?>
                    <form method="post" action="<?= e(url('/espace/cv/modele')) ?>" class="cv-tcard<?= $k === $current ? ' on' : '' ?>" data-cat="<?= e($t['cat']) ?>">
                        <?= csrf_field() ?><input type="hidden" name="template" value="<?= e($k) ?>">
                        <button type="submit" aria-pressed="<?= $k === $current ? 'true' : 'false' ?>" aria-label="Choisir le modèle <?= e($t['name']) ?>">
                            <span class="cv-fit cv-thumb" data-cv-fit aria-hidden="true"><?= CvRenderer::render($p, $ts, 'thumb') ?></span>
                            <span class="cv-tmeta"><b><?= e($t['name']) ?><?= $k === $current ? ' ' . icon('circle-check-big') : '' ?></b><small><?= e($t['cat']) ?><?= $t['photo'] ? ' · avec photo' : '' ?></small></span>
                        </button>
                    </form>
                <?php endforeach; ?>
            </div>
            <p class="small muted mt-2 mb-0"><?= icon('info') ?> <b><?= e($T[$current]['name']) ?></b> — <?= e($T[$current]['desc']) ?> Idéal pour : <?= e($T[$current]['for']) ?>.</p>
        </section>

        <!-- Aperçu en direct -->
        <section class="card card-lg" id="apercu">
            <div class="flex between flex-wrap mb-2" style="gap:8px">
                <h2 class="mb-0" style="font-size:1.15rem"><?= icon('eye') ?> Aperçu en direct</h2>
                <a class="btn btn-primary btn-sm" href="<?= e(url('/espace/cv/apercu')) ?>"><?= icon('file-check') ?> Relire et télécharger le PDF</a>
            </div>
            <div class="cv-stage"><div class="cv-fit cv-live" data-cv-fit data-cv-marks><?= CvRenderer::render($p, $s) ?></div></div>
            <p class="small muted mt-2 mb-0"><?= icon('info') ?> Les pointillés orange indiquent un changement de page. La mise en page finale (une ou deux pages) est ajustée automatiquement dans le PDF.</p>
        </section>
    </div>

    <aside class="stack">
        <!-- Personnalisation -->
        <form method="post" action="<?= e(url('/espace/cv/reglages')) ?>" class="card stack-sm" data-autosubmit id="style">
            <?= csrf_field() ?>
            <h3 class="mb-0"><?= icon('palette') ?> Couleurs et typographie</h3>
            <fieldset class="cv-swatches"><legend class="small muted">Palette</legend>
                <?php foreach (CvTemplates::PALETTES as $k => $pal): ?>
                    <label class="cv-swatch" title="<?= e($pal['name']) ?>"><input type="radio" name="palette" value="<?= e($k) ?>" <?= $s['palette'] === $k ? 'checked' : '' ?>><span style="background:<?= e($pal['accent']) ?>;box-shadow:inset 0 -9px 0 <?= e($pal['dark']) ?>"></span><span class="sr-only"><?= e($pal['name']) ?></span></label>
                <?php endforeach; ?>
            </fieldset>
            <fieldset><legend class="small muted">Police</legend>
                <div class="cv-fonts">
                    <?php foreach (CvTemplates::FONTS as $k => $f): ?>
                        <label class="cv-font<?= $s['font'] === $k ? ' on' : '' ?>"><input type="radio" name="font" value="<?= e($k) ?>" <?= $s['font'] === $k ? 'checked' : '' ?>><b style="font-family:'<?= e($f['family']) ?>'"><?= e($f['name']) ?></b><small><?= e($f['note']) ?></small></label>
                    <?php endforeach; ?>
                </div>
            </fieldset>
            <div class="form-grid cols-2">
                <div class="field"><label for="cv-density">Mise en page</label><select id="cv-density" name="density"><option value="auto" <?= $s['density'] === 'auto' ? 'selected' : '' ?>>Automatique</option><?php foreach (CvTemplates::DENSITIES as $k => $l): ?><option value="<?= e($k) ?>" <?= $s['density'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
                <div class="field"><label for="cv-order">Ordre</label><select id="cv-order" name="order"><option value="auto" <?= $s['order'] === 'auto' ? 'selected' : '' ?>>Automatique</option><option value="experience" <?= $s['order'] === 'experience' ? 'selected' : '' ?>>Expériences d'abord</option><option value="formation" <?= $s['order'] === 'formation' ? 'selected' : '' ?>>Formation d'abord</option></select></div>
            </div>
            <div class="field"><label for="cv-skills">Compétences affichées</label><select id="cv-skills" name="max_skills"><?php foreach ([6, 8, 10, 12, 16] as $n): ?><option value="<?= $n ?>" <?= $s['max_skills'] === $n ? 'selected' : '' ?>><?= $n ?> au maximum</option><?php endforeach; ?></select></div>
            <noscript><button class="btn btn-primary btn-sm" type="submit">Appliquer</button></noscript>
            <p class="small muted mb-0">« Automatique » : on resserre ou on aère pour un rendu propre sur une page quand c'est possible, sinon deux pages lisibles.</p>
        </form>

        <!-- Photo -->
        <section class="card" id="photo">
            <h3><?= icon('image') ?> Photo</h3>
            <div class="flex" style="gap:14px;align-items:center">
                <?php if ($photoUrl): ?><img class="cv-photo-prev <?= $s['photo_shape'] === 'square' ? 'sq' : '' ?>" src="<?= e($photoUrl) ?>" alt="Ta photo de CV" width="84" height="84">
                <?php else: ?><span class="cv-photo-prev empty" aria-hidden="true"><?= icon('user') ?></span><?php endif; ?>
                <p class="small muted mb-0">Fond uni, visage bien éclairé, tenue professionnelle. Au Gabon, la photo est courante sur un CV ; pour les grands groupes internationaux, le modèle ATS s'en passe.</p>
            </div>
            <form method="post" action="<?= e(url('/espace/cv/photo')) ?>" enctype="multipart/form-data" class="stack-sm mt-2">
                <?= csrf_field() ?>
                <div class="field"><label for="cv-photo-file" class="sr-only">Photo</label><input id="cv-photo-file" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required class="input" style="padding:10px"><span class="hint">JPG, PNG ou WebP, 5 Mo max. Recadrée au carré automatiquement.</span></div>
                <button class="btn btn-soft btn-sm" type="submit"><?= icon('upload') ?> <?= $photoUrl ? 'Remplacer la photo' : 'Ajouter ma photo' ?></button>
            </form>
            <?php if ($photoUrl): ?>
                <form method="post" action="<?= e(url('/espace/cv/reglages')) ?>" class="flex flex-wrap mt-2" style="gap:12px" data-autosubmit>
                    <?= csrf_field() ?><input type="hidden" name="photo" value="0">
                    <label class="check"><input type="checkbox" name="photo" value="1" <?= $s['show_photo'] ? 'checked' : '' ?> <?= $current === 'ats' ? 'disabled' : '' ?>> <span>Afficher sur le CV<?= $current === 'ats' ? ' (pas sur le modèle ATS)' : '' ?></span></label>
                    <label class="sr-only" for="cv-shape">Forme</label>
                    <select id="cv-shape" name="photo_shape" class="input" style="width:auto;min-height:36px"><option value="round" <?= $s['photo_shape'] === 'round' ? 'selected' : '' ?>>Ronde</option><option value="square" <?= $s['photo_shape'] === 'square' ? 'selected' : '' ?>>Carrée</option></select>
                </form>
                <form method="post" action="<?= e(url('/espace/cv/photo/supprimer')) ?>" class="mt-1" data-confirm="Supprimer ta photo ?"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit"><?= icon('trash-2') ?> Supprimer la photo</button></form>
            <?php endif; ?>
        </section>

        <!-- Sections -->
        <form method="post" action="<?= e(url('/espace/cv/reglages')) ?>" class="card stack-sm" id="sections">
            <?= csrf_field() ?><input type="hidden" name="sections_form" value="1">
            <h3 class="mb-0"><?= icon('list-checks') ?> Sections affichées</h3>
            <?php foreach (CvTemplates::SECTIONS as $k => $label): ?>
                <label class="check"><input type="checkbox" name="sections[<?= e($k) ?>]" value="1" <?= !empty($s['sections'][$k]) ? 'checked' : '' ?>> <span><?= e($label) ?></span></label>
            <?php endforeach; ?>
            <div class="field"><label for="cv-int">Centres d'intérêt</label><input id="cv-int" name="interests" maxlength="255" value="<?= e($p['interests'] ?? '') ?>" placeholder="Ex. football, bénévolat, photographie"><span class="hint">Séparés par des virgules. Un engagement associatif dit beaucoup de toi.</span></div>
            <button class="btn btn-soft btn-sm" type="submit">Enregistrer</button>
        </form>

        <!-- IA -->
        <form method="post" action="<?= e(url('/espace/cv/ia')) ?>" class="card card-blue stack-sm" id="ia">
            <?= csrf_field() ?>
            <h3 class="mb-0"><?= icon('sparkles') ?> Rédiger mon CV avec l'IA</h3>
            <p class="small mb-0" style="color:#e2ecff">Claude rédige ton accroche et reformule tes expériences en points forts, à partir de ton profil (sans rien inventer). Tu peux le cibler sur une offre.</p>
            <label class="sr-only" for="cv-job">Offre ciblée</label>
            <select id="cv-job" name="job_id" class="input"><option value="">CV général</option><?php foreach ($jobs as $j): ?><option value="<?= (int)$j['id'] ?>"><?= e($j['title'] . ' — ' . $j['company_name']) ?></option><?php endforeach; ?></select>
            <button class="btn btn-cta btn-block" type="submit" <?= $aiEnabled ? '' : 'disabled' ?>><?= icon('sparkles') ?> <?= !empty($p['cv_ai_data']) ? 'Régénérer' : 'Générer' ?> mon CV</button>
            <small style="color:#e2ecff">Moteur : <?= e($provider) ?> · <?= (int)$usage['remaining'] ?>/<?= (int)$usage['limit'] ?> générations IA restantes ce mois</small>
        </form>
        <?php if (!empty($p['cv_ai_data'])): $ai = $p['cv_ai_data']; ?>
            <section class="card">
                <h3><?= icon('circle-check-big') ?> Version rédigée par <?= e($ai['provider']) ?></h3>
                <p class="small muted">Générée <?= e(time_ago($ai['generated_at'] ?? null)) ?><?= !empty($ai['job']) ? ' pour « ' . e($ai['job']) . ' »' : '' ?>. Ton profil d'origine n'est pas modifié.</p>
                <?php if (!empty($ai['skills_tip'])): ?><div class="alert alert-info small"><?= icon('lightbulb') ?><div><?= e($ai['skills_tip']) ?></div></div><?php endif; ?>
                <form method="post" action="<?= e(url('/espace/cv/ia/reinitialiser')) ?>" class="mt-1"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit"><?= icon('refresh-cw') ?> Revenir aux textes de mon profil</button></form>
            </section>
        <?php endif; ?>

        <!-- CV en ligne -->
        <section class="card" id="partage">
            <h3><?= icon('link') ?> CV en ligne</h3>
            <?php if ($shareUrl): ?>
                <p class="small muted">Lien privé, non référencé par les moteurs de recherche. Vu <b><?= (int)$p['cv_views'] ?></b> fois.</p>
                <div class="flex" style="gap:6px"><label class="sr-only" for="cv-share">Lien</label><input id="cv-share" class="input" readonly value="<?= e($shareUrl) ?>" style="min-height:38px;font-size:.85rem"><button class="btn btn-soft btn-sm" type="button" data-copy="cv-share"><?= icon('copy') ?></button></div>
                <div class="flex flex-wrap mt-1" style="gap:6px">
                    <a class="btn btn-ghost btn-sm" href="<?= e($shareUrl) ?>" target="_blank" rel="noopener"><?= icon('external-link') ?> Ouvrir</a>
                    <form method="post" action="<?= e(url('/espace/cv/partage')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="regenerate"><button class="btn btn-ghost btn-sm" type="submit"><?= icon('refresh-cw') ?> Nouveau lien</button></form>
                    <form method="post" action="<?= e(url('/espace/cv/partage')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="disable"><button class="btn btn-ghost btn-sm" type="submit">Désactiver</button></form>
                </div>
                <p class="small muted mt-1 mb-0">Astuce : coche « QR code » dans les sections pour l'imprimer sur ton CV.</p>
            <?php else: ?>
                <p class="small muted">Partage ton CV par un simple lien (WhatsApp, e-mail), toujours à jour, avec téléchargement du PDF. Tu peux le désactiver à tout moment.</p>
                <form method="post" action="<?= e(url('/espace/cv/partage')) ?>"><?= csrf_field() ?><input type="hidden" name="action" value="enable"><button class="btn btn-soft btn-sm" type="submit"><?= icon('link') ?> Activer mon CV en ligne</button></form>
            <?php endif; ?>
        </section>

        <section class="card" id="import">
            <h3><?= icon('upload') ?> Importer mon CV existant</h3>
            <p class="small muted">PDF, DOCX ou TXT (5 Mo max). Nous détectons tes compétences pour compléter ton profil automatiquement.</p>
            <form method="post" action="<?= e(url('/espace/cv/import')) ?>" enctype="multipart/form-data" class="stack-sm">
                <?= csrf_field() ?>
                <div class="field"><label for="cv" class="sr-only">Fichier</label><input id="cv" name="cv" type="file" accept=".pdf,.docx,.txt" required class="input" style="padding:10px"></div>
                <button class="btn btn-soft btn-block" type="submit"><?= icon('sparkles') ?> Analyser mon CV</button>
            </form>
            <?php if ($import): ?>
                <div class="divider"></div>
                <h4>Résultat de l'analyse — <?= e($import['file']) ?></h4>
                <?php if ($import['skills']): ?>
                    <form method="post" action="<?= e(url('/espace/cv/import/appliquer')) ?>" class="stack-sm">
                        <?= csrf_field() ?>
                        <p class="small muted mb-0"><?= count($import['skills']) ?> nouvelle(s) compétence(s) détectée(s)<?= $import['known'] ? ', ' . $import['known'] . ' déjà dans ton profil' : '' ?> :</p>
                        <?php foreach ($import['skills'] as $sk): ?><label class="check"><input type="checkbox" name="skills[]" value="<?= (int)$sk['id'] ?>" checked> <span><?= e($sk['name']) ?> <small class="muted"><?= $sk['category'] === 'comportementale' ? '(qualité)' : '' ?></small></span></label><?php endforeach; ?>
                        <?php if ($import['linkedin']): ?><label class="check"><input type="checkbox" name="use_linkedin" value="1" checked> <span>Ajouter mon LinkedIn : <?= e($import['linkedin']) ?></span></label><?php endif; ?>
                        <button class="btn btn-primary btn-sm" type="submit">Ajouter à mon profil</button>
                    </form>
                <?php else: ?>
                    <p class="small muted">Aucune nouvelle compétence détectée (<?= (int)$import['chars'] ?> caractères analysés).</p>
                <?php endif; ?>
            <?php endif; ?>
            <?php if ($docs): ?>
                <div class="divider"></div>
                <h4>Mes documents</h4>
                <ul class="list"><?php foreach ($docs as $d): ?><li><?= icon('file-text') ?><a class="grow small" href="<?= e(url('/documents/' . $d['id'])) ?>"><?= e($d['original_name']) ?></a><small class="muted"><?= e(time_ago($d['created_at'])) ?></small></li><?php endforeach; ?></ul>
            <?php endif; ?>
        </section>

        <section class="card">
            <h3><?= icon('archive') ?> Historique des versions</h3>
            <form method="post" action="<?= e(url('/espace/cv/version')) ?>" class="flex mb-1">
                <?= csrf_field() ?>
                <label class="sr-only" for="vlabel">Nom de la version</label>
                <input id="vlabel" name="label" class="input" placeholder="Ex. CV stage banque" style="min-height:40px">
                <button class="btn btn-soft btn-sm" type="submit">Sauvegarder</button>
            </form>
            <?php if (!$versions): ?><p class="small muted mb-0">Enregistre une version pour garder une trace de chaque CV envoyé.</p><?php endif; ?>
            <ul class="list"><?php foreach ($versions as $v): ?><li><?= icon('file-text') ?><a class="grow small" href="<?= e(url('/espace/cv/versions/' . $v['id'])) ?>" target="_blank"><b><?= e($v['label']) ?></b><br><span class="muted"><?= e(date_fr($v['created_at'], true)) ?> · <?= e($T[$v['template']]['name'] ?? '') ?></span></a></li><?php endforeach; ?></ul>
        </section>

        <section class="card card-blue">
            <h3><?= icon('scroll-text') ?> Et la lettre ?</h3>
            <p class="small" style="color:#e2ecff">Génère une lettre de motivation adaptée à chaque offre, à partir de ce CV.</p>
            <a class="btn btn-cta btn-sm" href="<?= e(url('/espace/lettres')) ?>">Générer une lettre</a>
        </section>
    </aside>
</div>
