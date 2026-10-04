<div class="page-head">
    <div><h1>Mon CV</h1><p>Généré automatiquement à partir de ton profil. Modifie ton profil, ton CV se met à jour.</p></div>
    <div class="flex flex-wrap">
        <a class="btn btn-ghost" href="<?= e(url('/espace/profil')) ?>"><?= icon('pencil') ?> Modifier le contenu</a>
        <a class="btn btn-primary" href="<?= e(url('/espace/cv/imprimer')) ?>" target="_blank"><?= icon('file-down') ?> Télécharger en PDF</a>
    </div>
</div>

<div class="layout-aside">
    <div>
        <div class="tabs mb-2" role="tablist" aria-label="Modèles de CV">
            <?php foreach ($templates as $k => $label): $locked = $k !== 'moderne' && !$canTemplates; ?>
                <form method="post" action="<?= e(url('/espace/cv/modele')) ?>" style="display:inline"><?= csrf_field() ?><input type="hidden" name="template" value="<?= e($k) ?>">
                    <button type="submit" class="btn btn-sm <?= $p['cv_template'] === $k ? 'btn-primary' : 'btn-ghost' ?>" aria-pressed="<?= $p['cv_template'] === $k ? 'true' : 'false' ?>"><?= $locked ? icon('lock') : icon('layers') ?> <?= e($label) ?></button>
                </form>
            <?php endforeach; ?>
        </div>
        <div style="background:#e9eef7;border-radius:20px;padding:20px 12px;overflow:hidden">
            <?= App\Core\View::partial('candidate/_cv', ['p' => $p, 'template' => $p['cv_template']]) ?>
        </div>
    </div>

    <aside class="stack">
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
                        <?php foreach ($import['skills'] as $s): ?><label class="check"><input type="checkbox" name="skills[]" value="<?= (int)$s['id'] ?>" checked> <span><?= e($s['name']) ?> <small class="muted"><?= $s['category'] === 'soft' ? '(qualité)' : '' ?></small></span></label><?php endforeach; ?>
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
            <ul class="list"><?php foreach ($versions as $v): ?><li><?= icon('file-text') ?><a class="grow small" href="<?= e(url('/espace/cv/versions/' . $v['id'])) ?>" target="_blank"><b><?= e($v['label']) ?></b><br><span class="muted"><?= e(date_fr($v['created_at'], true)) ?> · <?= e($templates[$v['template']] ?? '') ?></span></a></li><?php endforeach; ?></ul>
        </section>

        <section class="card card-blue">
            <h3><?= icon('scroll-text') ?> Et la lettre ?</h3>
            <p class="small" style="color:#e2ecff">Génère une lettre de motivation adaptée à chaque offre à partir de ce CV.</p>
            <a class="btn btn-cta btn-sm" href="<?= e(url('/espace/lettres')) ?>">Générer une lettre</a>
        </section>
    </aside>
</div>
