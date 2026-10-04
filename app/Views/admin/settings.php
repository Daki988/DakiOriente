<div class="page-head"><div><h1>Paramètres de la plateforme</h1><p>IA, alertes, contenus de la page d'accueil et grille tarifaire.</p></div></div>
<form method="post" action="<?= e(url('/admin/parametres')) ?>" class="grid-2">
    <?= csrf_field() ?>
    <section class="card card-lg stack-sm">
        <h2 style="font-size:1.15rem"><?= icon('sparkles') ?> Intelligence artificielle</h2>
        <label class="check"><input type="checkbox" name="ai_enabled" value="1" <?= $values['ai_enabled'] === '1' ? 'checked' : '' ?>> <span><b>Assistant IA activé</b> (lettres, simulation d'entretien, synthèses)</span></label>
        <p class="small muted">Moteur actif : <b><?= e($provider) ?></b>. Pour utiliser Claude : <code class="kbd">AI_PROVIDER=anthropic</code> et <code class="kbd">ANTHROPIC_API_KEY</code> dans <code class="kbd">.env</code>, puis <code class="kbd">composer install</code>. En cas d'indisponibilité, le moteur NEAM à base de règles prend le relais. Le score de matching n'utilise jamais l'IA générative.</p>
        <div class="field"><label for="mat">Seuil d'alerte « offre compatible » (%)</label><input id="mat" name="match_alert_threshold" type="number" min="40" max="95" value="<?= e($values['match_alert_threshold']) ?>"><span class="hint">Candidats alertés et recruteurs notifiés au-dessus de ce score.</span></div>
    </section>
    <section class="card card-lg stack-sm">
        <h2 style="font-size:1.15rem"><?= icon('house') ?> Page d'accueil</h2>
        <div class="form-grid cols-3">
            <div class="field"><label for="s1">Jeunes accompagnés</label><input id="s1" name="stat_youth" value="<?= e($values['stat_youth']) ?>"></div>
            <div class="field"><label for="s2">Offres</label><input id="s2" name="stat_offers" value="<?= e($values['stat_offers']) ?>"></div>
            <div class="field"><label for="s3">Entreprises</label><input id="s3" name="stat_companies" value="<?= e($values['stat_companies']) ?>"></div>
        </div>
        <div class="field"><label for="tt">Témoignage</label><textarea id="tt" name="testimonial_text" style="min-height:80px"><?= e($values['testimonial_text']) ?></textarea></div>
        <div class="field"><label for="ta">Auteur du témoignage</label><input id="ta" name="testimonial_author" value="<?= e($values['testimonial_author']) ?>"></div>
    </section>
    <section class="card card-lg span-2" style="grid-column:1/-1">
        <h2 style="font-size:1.15rem"><?= icon('wallet') ?> Grille tarifaire (FCFA / mois)</h2>
        <div class="grid-4 mt-2">
            <?php foreach ($plans as $p): ?><div class="field"><label for="p-<?= e($p['code']) ?>"><?= e($p['name']) ?> <small class="muted">(<?= e($p['audience']) ?>)</small></label><input id="p-<?= e($p['code']) ?>" type="number" min="0" step="500" name="price[<?= e($p['code']) ?>]" value="<?= (int)$p['price'] ?>"></div><?php endforeach; ?>
        </div>
    </section>
    <div style="grid-column:1/-1"><button class="btn btn-primary btn-lg" type="submit"><?= icon('check') ?> Enregistrer les paramètres</button></div>
</form>
