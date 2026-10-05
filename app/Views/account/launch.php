<div class="page-head"><div><h1>Accès gratuit</h1><p>Tremplin est en phase de lancement.</p></div></div>
<div class="welcome mb-3">
    <span class="deco"></span><span class="deco2"></span>
    <p class="hand" style="font-size:1.6rem;color:var(--yellow);margin:0">Merci d'être parmi les premiers !</p>
    <h2 style="font-size:1.5rem;margin:6px 0">Toutes les fonctionnalités sont gratuites pendant la phase de lancement</h2>
    <p style="max-width:680px;margin:0">Aucun paiement n'est demandé et aucun moyen de paiement n'est enregistré. Les éventuelles offres payantes seront annoncées à l'avance, par e-mail et sur la plateforme : tu resteras libre de les choisir ou non.</p>
</div>
<div class="grid-3">
    <div class="card"><h3><?= icon('user') ?> Candidats</h3><ul class="explain-list ok small"><li><?= icon('check') ?><span>Candidatures illimitées</span></li><li><?= icon('check') ?><span>CV, lettres et préparation d'entretien avec Claude</span></li><li><?= icon('check') ?><span>Test d'orientation, score d'employabilité, plan d'action</span></li></ul></div>
    <div class="card"><h3><?= icon('building-2') ?> Entreprises</h3><ul class="explain-list ok small"><li><?= icon('check') ?><span>Publication d'offres illimitée après vérification</span></li><li><?= icon('check') ?><span>Matching des profils et CVthèque</span></li><li><?= icon('check') ?><span>Pipeline de recrutement et statistiques</span></li></ul></div>
    <div class="card"><h3><?= icon('school') ?> Écoles</h3><ul class="explain-list ok small"><li><?= icon('check') ?><span>Suivi des étudiants et des stages</span></li><li><?= icon('check') ?><span>Diffusion ciblée d'offres</span></li><li><?= icon('check') ?><span>Rapports d'insertion exportables</span></li></ul></div>
</div>
<p class="small muted mt-3"><?= icon('info') ?> Pour garantir la qualité du service, l'assistant IA est limité à <?= (int)setting('ai_monthly_limit', 30) ?> générations par mois et par utilisateur. Une question ? <a href="mailto:<?= e(config('mail.from')) ?>"><?= e(config('mail.from')) ?></a></p>
