<?php
$groups = ['candidate' => [], 'company' => [], 'school' => []];
foreach ($plans as $p) {
    $groups[$p['audience']][] = $p;
}
$current = user() ? App\Services\PlanService::effectiveCode(user()) : null;
?>
<?php if (launch_mode()): ?>
<section class="hero" style="padding:36px 0 20px">
    <div class="container text-center">
        <span class="pill"><?= icon('rocket') ?> Phase de lancement</span>
        <h1 style="font-size:clamp(1.9rem,4vw,2.8rem);margin:14px auto 10px;max-width:none">Tremplin est 100 % gratuit pendant le lancement</h1>
        <p class="muted" style="max-width:640px;margin:0 auto">Pas d'abonnement, pas de moyen de paiement à renseigner, pas de version limitée. Candidats, entreprises et écoles ont accès à tout. Pourquoi ? Parce que nous voulons construire Tremplin avec vous, à partir de vos usages réels. Profitez-en : c'est maintenant que tout se met en place.</p>
        <a class="btn btn-cta btn-lg mt-3" href="<?= e(url(user() ? App\Core\Auth::homeUrl() : '/inscription')) ?>"><?= user() ? 'Aller à mon espace' : 'Créer mon compte gratuitement' ?> <?= icon('arrow-right') ?></a>
    </div>
</section>
<section class="section-sm">
    <div class="container">
        <div class="grid-3">
            <div class="card card-lg"><h3><?= icon('user') ?> Candidats</h3><ul class="explain-list ok"><li><?= icon('check') ?><span>Profil, CV et candidatures illimitées</span></li><li><?= icon('check') ?><span>Score de compatibilité expliqué sur chaque offre</span></li><li><?= icon('check') ?><span>CV, lettres et préparation d'entretien avec l'IA Claude</span></li><li><?= icon('check') ?><span>Orientation RIASEC et plan d'action 30/60/90 jours</span></li></ul></div>
            <div class="card card-lg"><h3><?= icon('building-2') ?> Entreprises</h3><ul class="explain-list ok"><li><?= icon('check') ?><span>Publication d'offres sans limite après vérification</span></li><li><?= icon('check') ?><span>Profils compatibles classés et expliqués</span></li><li><?= icon('check') ?><span>CVthèque, pipeline et statistiques</span></li></ul><a class="btn btn-primary mt-1" href="<?= e(url('/inscription?role=company')) ?>">Publier une offre</a></div>
            <div class="card card-lg"><h3><?= icon('school') ?> Écoles & universités</h3><ul class="explain-list ok"><li><?= icon('check') ?><span>Suivi des étudiants et des stages</span></li><li><?= icon('check') ?><span>Diffusion ciblée d'opportunités</span></li><li><?= icon('check') ?><span>Rapports d'insertion exportables</span></li></ul><a class="btn btn-primary mt-1" href="<?= e(url('/inscription?role=school')) ?>">Créer l'espace établissement</a></div>
        </div>
        <h2 class="mt-4">Questions fréquentes</h2>
        <div class="stack mt-2">
            <details class="faq"><summary>Combien de temps dure la phase de lancement ?</summary><p class="mb-0">Le temps de bien rôder la plateforme avec ses premiers utilisateurs. Pas de mauvaise surprise : la fin sera annoncée à l'avance, par e-mail et sur le site.</p></details>
            <details class="faq"><summary>Devrai-je payer ensuite ?</summary><p class="mb-0">L'essentiel restera gratuit : chercher, postuler, suivre tes candidatures. Si des options payantes arrivent un jour, elles te seront présentées avant et ne seront jamais activées sans ton accord.</p></details>
            <details class="faq"><summary>Pourquoi l'assistant IA est-il limité ?</summary><p class="mb-0">Chaque génération par Claude a un coût réel. Pour que tout le monde en profite, chacun dispose de <?= (int)setting('ai_monthly_limit', 30) ?> générations par mois (lettres, CV, entretiens). C'est largement de quoi préparer plusieurs candidatures soignées. Au-delà, le moteur NEAM prend le relais.</p></details>
            <details class="faq"><summary>Un recruteur peut-il me demander de payer ?</summary><p class="mb-0"><b>Jamais.</b> Postuler est toujours gratuit. Un vrai recruteur ne demande pas d'argent pour étudier une candidature. Si cela t'arrive, signale l'offre : l'équipe NEAM intervient rapidement.</p></details>
            <details class="faq"><summary>Comment vous contacter ?</summary><p class="mb-0">Une question, une idée, un bug ? Écris-nous à <a href="mailto:<?= e(config('mail.from')) ?>"><?= e(config('mail.from')) ?></a>.</p></details>
        </div>
    </div>
</section>
<?php return; endif; ?>
<section class="hero" style="padding:36px 0 20px">
    <div class="container text-center">
        <span class="eyebrow">Offres & tarifs</span>
        <h1 style="font-size:clamp(1.9rem,4vw,2.8rem);margin:0 auto 10px;max-width:none">Un tremplin pour chaque ambition</h1>
        <p class="muted" style="max-width:620px;margin:0 auto">Commence gratuitement. Passe à la vitesse supérieure quand tu veux, sans engagement. Paiement par <b>Airtel Money</b>, <b>Moov Money</b> ou carte.</p>
    </div>
</section>
<section class="section-sm">
    <div class="container">
        <h2>Candidats</h2>
        <div class="plans mt-2">
            <?php foreach ($groups['candidate'] as $p): ?>
                <div class="plan <?= $p['highlight'] ? 'highlight' : '' ?> <?= $current === $p['code'] ? 'current' : '' ?>">
                    <h3><?= e($p['name']) ?></h3>
                    <small class="muted"><?= e($p['tagline']) ?></small>
                    <div class="price tabular"><?= $p['price'] ? nf($p['price']) : '0' ?> <small>FCFA / mois</small></div>
                    <ul><?php foreach ($p['features_list'] as $f): ?><li><?= icon('check') ?><span><?= e($f) ?></span></li><?php endforeach; ?></ul>
                    <?php if ($current === $p['code']): ?>
                        <span class="btn btn-ghost btn-block is-disabled">Offre actuelle</span>
                    <?php elseif ($p['price'] == 0): ?>
                        <a class="btn btn-ghost btn-block" href="<?= e(url(user() ? '/espace' : '/inscription')) ?>">Commencer</a>
                    <?php else: ?>
                        <a class="btn <?= $p['highlight'] ? 'btn-cta' : 'btn-primary' ?> btn-block" href="<?= e(url(user() ? '/abonnement?plan=' . $p['code'] : '/inscription')) ?>">Choisir <?= e($p['name']) ?></a>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="grid-2 mt-4">
            <div id="entreprises">
                <h2>Entreprises</h2>
                <div class="stack mt-2">
                    <?php foreach ($groups['company'] as $p): ?>
                        <div class="plan <?= $p['highlight'] ? 'highlight' : '' ?>" style="flex-direction:row;flex-wrap:wrap;gap:12px;align-items:center">
                            <div class="grow"><h3><?= e($p['name']) ?></h3><small class="muted"><?= e(implode(' · ', $p['features_list'])) ?></small></div>
                            <div class="price tabular" style="margin:0"><?= $p['price'] ? nf($p['price']) : 'Gratuit' ?> <small><?= $p['price'] ? 'FCFA / mois' : '' ?></small></div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <a class="btn btn-primary mt-2" href="<?= e(url('/inscription?role=company')) ?>">Créer un compte recruteur</a>
            </div>
            <div id="ecoles">
                <h2>Écoles & universités</h2>
                <?php foreach ($groups['school'] as $p): ?>
                    <div class="plan mt-2">
                        <h3><?= e($p['name']) ?></h3>
                        <div class="price tabular"><?= nf($p['price']) ?> <small>FCFA / mois</small></div>
                        <ul><?php foreach ($p['features_list'] as $f): ?><li><?= icon('check') ?><span><?= e($f) ?></span></li><?php endforeach; ?></ul>
                        <a class="btn btn-primary" href="<?= e(url('/inscription?role=school')) ?>">Demander une démo</a>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <h2 class="mt-4">Questions fréquentes</h2>
        <div class="stack mt-2">
            <details class="faq"><summary>Comment payer avec Airtel Money ou Moov Money ?</summary><p class="mb-0">Choisis ton offre, sélectionne ton opérateur et saisis ton numéro. Tu reçois une demande de confirmation sur ton téléphone : valide avec ton code secret. Ton abonnement est activé immédiatement.</p></details>
            <details class="faq"><summary>Puis-je arrêter à tout moment ?</summary><p class="mb-0">Oui. Les abonnements durent 30 jours et ne sont pas reconduits automatiquement : tu choisis de renouveler ou non.</p></details>
            <details class="faq"><summary>Un recruteur peut-il me demander de payer ?</summary><p class="mb-0"><b>Jamais.</b> Postuler est toujours gratuit. Un vrai recruteur ne demande pas d'argent pour étudier une candidature. Si cela t'arrive, signale l'offre : l'équipe NEAM intervient rapidement.</p></details>
        </div>
    </div>
</section>
