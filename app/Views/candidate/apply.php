<nav class="breadcrumb"><a href="<?= e(url('/offres/' . $job['id'])) ?>"><?= icon('chevron-left') ?> Retour à l'offre</a></nav>
<div class="page-head">
    <div><h1>Postuler</h1><p><?= e($job['title']) ?> · <?= e($job['company_name']) ?> · <?= e($job['city_name']) ?></p></div>
</div>
<div class="layout-aside">
    <form method="post" action="<?= e(url('/offres/' . $job['id'] . '/postuler')) ?>" class="stack">
        <?= csrf_field() ?>
        <?php if ($match['eliminated']): ?>
            <div class="alert alert-warning"><?= icon('alert-triangle') ?><div><b>Attention :</b> <?= e($match['elimination']) ?> Le recruteur risque de ne pas retenir ta candidature. Tu peux tout de même postuler en expliquant ta motivation.</div></div>
        <?php endif; ?>
        <section class="card card-lg">
            <h2 style="font-size:1.15rem"><?= icon('file-text') ?> Ton dossier</h2>
            <div class="flex" style="background:var(--bg);border-radius:14px;padding:14px">
                <span class="avatar" style="background:<?= e(avatar_color($p['email'])) ?>"><?= e(initials($p['first_name'], $p['last_name'])) ?></span>
                <div class="grow"><b style="color:var(--navy)"><?= e($p['first_name'] . ' ' . $p['last_name']) ?></b><br><small class="muted"><?= e($p['headline']) ?></small></div>
                <a class="btn btn-ghost btn-sm" href="<?= e(url('/espace/cv/imprimer')) ?>" target="_blank"><?= icon('eye') ?> Mon CV</a>
            </div>
            <p class="small muted mt-1 mb-0"><?= icon('shield-check') ?> Le recruteur verra ton profil complet, ton CV et tes coordonnées.</p>
        </section>
        <section class="card card-lg">
            <div class="card-title"><h2 style="font-size:1.15rem"><?= icon('scroll-text') ?> Lettre de motivation</h2><a class="btn btn-soft btn-sm" href="<?= e(url('/espace/lettres?job=' . $job['id'])) ?>"><?= icon('sparkles') ?> Générer avec l'IA</a></div>
            <?php if ($letters): ?><p class="small muted">Tes lettres : <?php foreach ($letters as $l): ?><a href="<?= e(url('/offres/' . $job['id'] . '/postuler?letter=' . $l['id'])) ?>" class="tag" style="margin:2px"><?= e(excerpt($l['title'], 40)) ?></a><?php endforeach; ?></p><?php endif; ?>
            <div class="field"><label for="cover_letter">Message au recruteur <span class="muted">(recommandé)</span></label>
                <textarea id="cover_letter" name="cover_letter" style="min-height:280px" maxlength="6000" placeholder="Madame, Monsieur, …"><?= e($letter ?? '') ?></textarea></div>
        </section>
        <div class="flex between flex-wrap">
            <small class="muted"><?= $quota['limit'] === null ? 'Candidatures illimitées avec ton offre.' : 'Il te reste ' . $quota['remaining'] . ' candidature(s) ce mois-ci sur ' . $quota['limit'] . '.' ?></small>
            <button class="btn btn-cta btn-lg" type="submit" <?= $quota['remaining'] === 0 ? 'disabled' : '' ?>><?= icon('send') ?> Envoyer ma candidature</button>
        </div>
    </form>
    <aside><div class="card card-lg"><?= App\Core\View::partial('partials/match_explain', ['match' => $match, 'compact' => true, 'showActions' => true]) ?></div></aside>
</div>
