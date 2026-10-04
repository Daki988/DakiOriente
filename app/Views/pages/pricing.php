<?php
$groups = ['candidate' => [], 'company' => [], 'school' => []];
foreach ($plans as $p) {
    $groups[$p['audience']][] = $p;
}
$current = user() ? App\Services\PlanService::effectiveCode(user()) : null;
?>
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
            <details class="faq"><summary>Un recruteur peut-il me demander de payer ?</summary><p class="mb-0"><b>Jamais.</b> Postuler est gratuit. Si quelqu'un te demande de l'argent pour une candidature, signale-le immédiatement depuis l'offre.</p></details>
        </div>
    </div>
</section>
