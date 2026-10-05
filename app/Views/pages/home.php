<?php
$u = user();
$heroPhoto = null;
foreach (['hero.webp', 'hero.jpg', 'hero.png'] as $f) {
    if (is_file(BASE_PATH . '/public/assets/img/' . $f)) {
        $heroPhoto = asset('img/' . $f);
        break;
    }
}
$defaultCity = '';
?>
<section class="hero">
    <div class="container hero-grid">
        <div class="fade-up">
            <span class="pill">Stages • Emplois • Formations</span>
            <h1 class="hero-title">De je cherche un stage à <span class="accent">je suis prêt <span class="underline-sun">à candidater.</span></span></h1>
            <p class="lead">Tu as le potentiel. Il te manque peut-être juste la bonne méthode. Tremplin te montre les offres faites pour toi, t'explique ce qui te sépare de chacune et t'aide à préparer une candidature qui donne envie de te rencontrer.</p>

            <div class="hero-visual-mobile" aria-hidden="true">
                <?= App\Core\View::partial('pages/_hero_scene', ['compact' => true, 'photo' => $heroPhoto]) ?>
            </div>

        </div>
        <div class="hero-visual" aria-hidden="true">
            <?= App\Core\View::partial('pages/_hero_scene', ['compact' => false, 'photo' => $heroPhoto]) ?>
        </div>
    </div>
    <div class="container hero-search">
            <form class="search-bar" action="<?= e(url('/offres')) ?>" method="get" role="search" aria-label="Rechercher une offre">
            <div class="inputs">
                <label class="field-box">
                    <?= icon('search') ?>
                    <span class="sr-only">Quel stage ou emploi cherches-tu ?</span>
                    <input type="search" name="q" placeholder="Quel stage ou emploi cherches-tu ?" autocomplete="off">
                </label>
                <label class="field-box">
                    <?= icon('map-pin') ?>
                    <span class="sr-only">Lieu</span>
                    <span class="select-wrap">
                        <select name="city">
                            <option value="">Gabon — toutes les villes</option>
                            <?php $country = null; foreach ($cities as $c): ?>
                                <?php if ($c['country'] !== $country): ?><?= $country !== null ? '</optgroup>' : '' ?><optgroup label="<?= e($c['country']) ?>"><?php $country = $c['country']; endif; ?>
                                <option value="<?= (int)$c['id'] ?>"><?= e($c['name']) ?></option>
                            <?php endforeach; ?></optgroup>
                        </select>
                    </span>
                </label>
            </div>
            <button class="btn btn-cta" type="submit">Rechercher <?= icon('arrow-right') ?></button>
        </form>
        <div class="flex flex-wrap mt-2 small" style="gap:8px">
            <span class="muted">Les plus recherchés :</span>
            <?php foreach (['Stage informatique', 'Comptabilité', 'HSE', 'Marketing digital', 'Logistique'] as $s): ?>
                <a class="tag" href="<?= e(url('/offres', ['q' => $s])) ?>"><?= e($s) ?></a>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="container mt-4">
        <div class="features">
            <a class="feature f-blue" href="<?= e(url('/offres')) ?>">
                <span class="fi"><?= icon('search') ?></span>
                <h3>Trouve des offres</h3>
                <p>Stages, emplois et alternances vérifiés, au Gabon et en Afrique.</p>
                <span class="go"><?= icon('chevron-right') ?></span>
            </a>
            <a class="feature f-amber" href="<?= e(url($u ? '/espace/cv' : '/inscription')) ?>">
                <span class="fi"><?= icon('file-text') ?></span>
                <h3>Crée ton CV</h3>
                <p>Un CV clair qui met en valeur ce que tu sais vraiment faire.</p>
                <span class="go"><?= icon('chevron-right') ?></span>
            </a>
            <a class="feature f-violet" href="<?= e(url('/formations')) ?>">
                <span class="fi"><?= icon('graduation-cap') ?></span>
                <h3>Développe tes compétences</h3>
                <p>Les formations qui comblent tes écarts avec les offres.</p>
                <span class="go"><?= icon('chevron-right') ?></span>
            </a>
            <a class="feature f-pink" href="<?= e(url('/entreprises')) ?>">
                <span class="fi"><?= icon('building-2') ?></span>
                <h3>Découvre les entreprises</h3>
                <p>Celles qui recrutent près de chez toi, toutes vérifiées.</p>
                <span class="go"><?= icon('chevron-right') ?></span>
            </a>
        </div>

        <div class="stats-strip launch-strip mt-3">
            <div class="flex" style="gap:14px;align-items:flex-start">
                <span class="launch-badge"><?= icon('rocket') ?></span>
                <div>
                    <b style="color:var(--navy);font-size:1.05rem">Tremplin est en phase de lancement, et c'est le bon moment pour arriver</b>
                    <p class="small muted mb-0"><?= e(setting('launch_message', '') ?: 'Pendant le lancement, tout est gratuit pour les candidats, les entreprises et les écoles. Les premiers inscrits prennent une longueur d\'avance et nous aident à construire la plateforme qui leur ressemble.') ?></p>
                </div>
            </div>
            <div class="stats">
                <div class="stat"><?= icon('badge-check') ?><div><b>100 %</b><span>gratuit pendant le lancement</span></div></div>
                <div class="stat"><?= icon('shield-check') ?><div><b>Offres</b><span>vérifiées par l'équipe NEAM</span></div></div>
                <div class="stat"><?= icon('sparkles') ?><div><b>IA Claude</b><span>pour ton CV, tes lettres et tes entretiens</span></div></div>
            </div>
    </div>
</section>

<?php if ($matches): ?>
<section class="section-sm">
    <div class="container">
        <div class="section-head">
            <div><span class="eyebrow">Sélectionnées pour toi</span><h2>Tes meilleurs matchs, <?= e($u['first_name']) ?></h2></div>
            <a class="btn btn-ghost" href="<?= e(url('/espace/recommandations')) ?>">Toutes mes recommandations <?= icon('arrow-right') ?></a>
        </div>
        <div class="grid-2">
            <?php foreach (array_slice($matches, 0, 4) as $r): ?>
                <?= App\Core\View::partial('partials/job_card', ['job' => $r['job'], 'match' => $r['match']]) ?>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<section class="section">
    <div class="container">
        <div class="section-head">
            <div>
                <span class="eyebrow">Ton parcours, étape par étape</span>
                <h2>Bien plus qu'un site d'annonces</h2>
                <p class="muted mb-0" style="max-width:640px">Envoyer des dizaines de CV au hasard, ça ne marche pas. Ce qui marche, c'est de savoir où tu en es, de viser les bonnes offres et de soigner chaque candidature. Tremplin t'accompagne sur ces trois points.</p>
            </div>
        </div>
        <div class="steps">
            <div class="step"><h3>Construis ton profil</h3><p>Compétences, formations, langues, projets : tout compte, même tes projets d'études. Un profil complet, c'est un recruteur qui te trouve.</p></div>
            <div class="step"><h3>Oriente-toi</h3><p>Pas sûr·e de ta voie ? Le test d'orientation révèle ce qui te motive et les métiers où tu as toutes tes chances.</p></div>
            <div class="step"><h3>Matche avec les offres</h3><p>Pour chaque offre, un score de 0 à 100. Tu vois tes points forts, ce qui te manque et comment le rattraper.</p></div>
            <div class="step"><h3>Postule et décroche</h3><p>CV et lettre adaptés à l'offre, suivi de chaque candidature et entraînement à l'entretien. Tu arrives prêt·e.</p></div>
        </div>
    </div>
</section>

<section class="section section-alt">
    <div class="container">
        <div class="section-head">
            <div><span class="eyebrow">Fraîchement publiées</span><h2>Dernières opportunités</h2></div>
            <a class="btn btn-primary" href="<?= e(url('/offres')) ?>">Voir toutes les offres <?= icon('arrow-right') ?></a>
        </div>
        <div class="grid-2">
            <?php foreach ($latest as $job): ?>
                <?= App\Core\View::partial('partials/job_card', ['job' => $job, 'match' => null]) ?>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section">
    <div class="container layout-aside" style="align-items:center">
        <div>
            <span class="eyebrow">Le cœur de Tremplin</span>
            <h2>Un matching qui t'explique tout</h2>
            <p class="muted">La plupart des plateformes te disent « oui » ou « non » sans explication. Tremplin calcule ton score sur 9 critères (compétences, formation, expérience, localisation, langues…) et te dit précisément quoi améliorer. Un écart que tu comprends, c'est un écart que tu peux combler.</p>
            <ul class="explain-list ok mt-2">
                <li><?= icon('check') ?><span><b>Score global de 0 à 100</b> pour chaque offre</span></li>
                <li><?= icon('check') ?><span><b>Points forts et écarts</b> détaillés critère par critère</span></li>
                <li><?= icon('check') ?><span><b>Actions recommandées</b> : formations, projets, conseils</span></li>
                <li><?= icon('check') ?><span><b>Critères éliminatoires</b> distingués des critères pondérés</span></li>
            </ul>
            <a class="btn btn-cta mt-3" href="<?= e(url($u ? '/espace/recommandations' : '/inscription')) ?>">Découvrir mes matchs <?= icon('arrow-right') ?></a>
        </div>
        <div class="card card-lg" style="box-shadow:var(--shadow-lg)">
            <div class="flex mb-2">
                <span class="logo-box" style="background:#0057ff">OT</span>
                <div class="grow"><b style="color:var(--navy)">Stagiaire Développeur·se Web</b><br><small class="muted">OkoumeTech · Libreville</small></div>
                <div class="ring <?= 'high' ?>" style="--p:92"><b>92<small>%</small></b></div>
            </div>
            <div class="criteria">
                <?php foreach ([['Compétences techniques', 94, '5 / 5 compétences maîtrisées'], ['Formation / niveau', 100, 'Licence — requis : Licence'], ['Expérience / projets', 80, '4 mois + 1 projet'], ['Localisation / mobilité', 100, 'Même ville : Libreville'], ['Langues', 70, 'Anglais à renforcer (B1)']] as [$l, $v, $d]): ?>
                    <div class="criterion">
                        <div class="top"><?= e($l) ?> <span><?= $v ?> %</span></div>
                        <div class="bar <?= $v >= 75 ? 'green' : 'sun' ?>"><i data-w="<?= $v ?>"></i></div>
                        <p><?= e($d) ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</section>

<section class="section section-alt">
    <div class="container">
        <div class="section-head"><div><span class="eyebrow">Explore</span><h2>Les secteurs qui recrutent</h2></div></div>
        <div class="grid-4">
            <?php foreach ($sectors as $s): ?>
                <a class="card card-hover flex" href="<?= e(url('/offres', ['sector' => $s['id']])) ?>">
                    <span class="kpi" style="border:0;padding:0;background:none"><span class="ki"><?= icon($s['icon']) ?></span></span>
                    <span class="grow"><b style="color:var(--navy)"><?= e($s['name']) ?></b><br><small class="muted"><?= (int)$s['n'] ?> offre<?= $s['n'] > 1 ? 's' : '' ?></small></span>
                    <?= icon('chevron-right') ?>
                </a>
            <?php endforeach; ?>
        </div>

        <div class="section-head mt-4"><div><h2>Ils recrutent sur Tremplin</h2></div><a class="btn btn-ghost" href="<?= e(url('/entreprises')) ?>">Toutes les entreprises</a></div>
        <div class="grid-4">
            <?php foreach ($companies as $c): ?>
                <a class="card card-hover flex" href="<?= e(url('/entreprises/' . $c['slug'])) ?>">
                    <span class="logo-box" style="background:<?= e($c['color']) ?>"><?= e(mb_strtoupper(mb_substr($c['name'], 0, 2))) ?></span>
                    <span class="grow"><b style="color:var(--navy)"><?= e($c['name']) ?></b><br><small class="muted"><?= (int)$c['n'] ?> offre<?= $c['n'] > 1 ? 's' : '' ?> active<?= $c['n'] > 1 ? 's' : '' ?></small></span>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section">
    <div class="container grid-2">
        <div class="card card-lg card-navy">
            <span class="badge badge-yellow mb-2"><?= icon('building-2') ?> Recruteurs</span>
            <h2>Trouvez les bons profils, sans trier 200 CV</h2>
            <p>Vos candidats arrivent classés par compatibilité, avec les raisons du classement. Vous concentrez votre temps sur les profils qui comptent et vous suivez chaque recrutement de bout en bout. Gratuit pendant le lancement.</p>
            <a class="btn btn-cta" href="<?= e(url('/inscription?role=company')) ?>">Publier une offre</a>
        </div>
        <div class="card card-lg card-blue">
            <span class="badge" style="background:rgba(255,255,255,.18);color:#fff"><?= icon('school') ?> Écoles & universités</span>
            <h2 class="mt-2">Suivez l'insertion de vos étudiants</h2>
            <p>Qui a trouvé son stage, qui cherche encore, quelle filière s'insère le mieux : vous le voyez en un coup d'œil. Diffusez les bonnes offres aux bons étudiants et exportez vos rapports d'insertion.</p>
            <a class="btn" style="background:#fff;color:var(--blue)" href="<?= e(url('/inscription?role=school')) ?>">Créer l'espace établissement</a>
        </div>
    </div>
</section>

<?php if ($articles): ?>
<section class="section section-alt">
    <div class="container">
        <div class="section-head"><div><span class="eyebrow">Conseils</span><h2>Booste ta carrière</h2></div><a class="btn btn-ghost" href="<?= e(url('/conseils')) ?>">Tous les conseils</a></div>
        <div class="grid-3">
            <?php foreach ($articles as $a): ?><?= App\Core\View::partial('pages/_article_card', ['a' => $a]) ?><?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<section class="section">
    <div class="container">
        <div class="welcome text-center" style="padding:48px 24px">
            <span class="deco"></span><span class="deco2"></span>
            <p class="hand" style="font-size:2rem;color:#fff;margin:0">Mon avenir commence ici !</p>
            <h2 style="font-size:clamp(1.6rem,3.5vw,2.4rem)">Prêt·e à passer à l'étape suivante ?</h2>
            <p style="max-width:560px;margin:0 auto 20px">L'inscription prend 2 minutes et elle est gratuite. Dès que ton profil est rempli, tu sais quelles offres sont faites pour toi et comment augmenter tes chances.</p>
            <a class="btn btn-cta btn-lg" href="<?= e(url($u ? \App\Core\Auth::homeUrl() : '/inscription')) ?>"><?= $u ? 'Aller à mon espace' : 'Je crée mon compte' ?> <?= icon('arrow-right') ?></a>
        </div>
    </div>
</section>
