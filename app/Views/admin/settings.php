<div class="page-head"><div><h1>Paramètres de la plateforme</h1><p>Phase de lancement, intelligence artificielle, alertes et grille tarifaire.</p></div></div>
<form method="post" action="<?= e(url('/admin/parametres')) ?>" class="grid-2">
    <?= csrf_field() ?>
    <section class="card card-lg stack-sm">
        <h2 style="font-size:1.15rem"><?= icon('rocket') ?> Phase de lancement</h2>
        <label class="check"><input type="checkbox" name="launch_mode" value="1" <?= $values['launch_mode'] === '1' ? 'checked' : '' ?>> <span><b>Mode lancement actif</b> : toutes les fonctionnalités sont gratuites, les quotas et les paiements sont désactivés, la page Tarifs présente l'accès gratuit.</span></label>
        <div class="field"><label for="lm">Message affiché sur l'accueil</label><textarea id="lm" name="launch_message" maxlength="300" style="min-height:90px" placeholder="Pendant cette phase, toutes les fonctionnalités sont gratuites…"><?= e($values['launch_message']) ?></textarea><span class="hint">Laisser vide pour le message par défaut.</span></div>
        <div class="field"><label for="mat">Seuil d'alerte « offre compatible » (%)</label><input id="mat" name="match_alert_threshold" type="number" min="40" max="95" value="<?= e($values['match_alert_threshold']) ?>"><span class="hint">Candidats alertés et recruteurs notifiés au-dessus de ce score.</span></div>
    </section>
    <section class="card card-lg stack-sm">
        <h2 style="font-size:1.15rem"><?= icon('sparkles') ?> Intelligence artificielle</h2>
        <label class="check"><input type="checkbox" name="ai_enabled" value="1" <?= $values['ai_enabled'] === '1' ? 'checked' : '' ?>> <span><b>Assistant IA activé</b> (CV, lettres, préparation d'entretien)</span></label>
        <div class="alert alert-<?= $claude ? 'success' : 'warning' ?> small"><?= icon($claude ? 'circle-check-big' : 'alert-triangle') ?><div>
            <b>Moteur actif : <?= e($provider) ?></b><br>
            Clé API Claude : <?= $keySet ? 'configurée' : '<b>absente</b> (ANTHROPIC_API_KEY dans .env)' ?> · SDK : <?= $sdk ? 'installé' : '<b>absent</b> (composer install)' ?>.
            <?php if (!$claude): ?><br>Tant que Claude n'est pas configuré, le moteur NEAM à base de règles prend le relais.<?php endif; ?>
        </div></div>
        <div class="field"><label for="aml">Générations Claude par utilisateur et par mois</label><input id="aml" name="ai_monthly_limit" type="number" min="0" max="1000" value="<?= e($values['ai_monthly_limit']) ?>"><span class="hint">Maîtrise des coûts : au-delà, le moteur local prend le relais. 0 = Claude désactivé pour les utilisateurs.</span></div>
        <?php if ($aiStats): ?><p class="small mb-0"><b>Ce mois :</b> <?= e(implode(' · ', array_map(fn($r) => $r['feature'] . ' (' . $r['provider'] . ') : ' . $r['n'], $aiStats))) ?></p><?php endif; ?>
        <p class="small muted mb-0">E-mails : pilote « <?= e($mailDriver) ?> », expéditeur <?= e(config('mail.from')) ?>.</p>
    </section>
    <section class="card card-lg" style="grid-column:1/-1">
        <h2 style="font-size:1.15rem"><?= icon('wallet') ?> Grille tarifaire (après la phase de lancement)</h2>
        <p class="small muted">Non appliquée tant que le mode lancement est actif. Prix en FCFA / mois.</p>
        <div class="grid-4 mt-2">
            <?php foreach ($plans as $p): ?><div class="field"><label for="p-<?= e($p['code']) ?>"><?= e($p['name']) ?> <small class="muted">(<?= e($p['audience']) ?>)</small></label><input id="p-<?= e($p['code']) ?>" type="number" min="0" step="500" name="price[<?= e($p['code']) ?>]" value="<?= (int)$p['price'] ?>"></div><?php endforeach; ?>
        </div>
    </section>
    <div style="grid-column:1/-1"><button class="btn btn-primary btn-lg" type="submit"><?= icon('check') ?> Enregistrer les paramètres</button></div>
</form>
