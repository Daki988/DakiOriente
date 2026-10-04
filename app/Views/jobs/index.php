<?php
$levels = education_levels();
$q = array_filter(['q' => $filters['q'], 'city' => $filters['city'], 'sector' => $filters['sector'], 'type' => $filters['type'], 'education' => $filters['education'], 'remote' => $filters['remote'], 'beginner' => $filters['beginner'], 'sort' => $filters['sort'] !== 'recent' ? $filters['sort'] : null]);
?>
<section class="hero" style="padding:28px 0 24px">
    <div class="container">
        <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="<?= e(url('/')) ?>">Accueil</a> <?= icon('chevron-right') ?> <span>Offres</span></nav>
        <h1 style="font-size:clamp(1.8rem,4vw,2.6rem);margin:0 0 6px">Trouve l'opportunité qui te correspond</h1>
        <p class="muted mb-0"><b class="tabular" style="color:var(--navy)"><?= nf($total) ?></b> offre<?= $total > 1 ? 's' : '' ?> de stages, d'emplois et d'alternances<?= $isCandidate ? ', avec ton score de compatibilité' : '' ?>.</p>
        <form class="search-bar mt-2" action="<?= e(url('/offres')) ?>" method="get" role="search">
            <div class="inputs">
                <label class="field-box"><?= icon('search') ?><span class="sr-only">Mots-clés</span><input type="search" name="q" value="<?= e($filters['q']) ?>" placeholder="Métier, compétence, entreprise…"></label>
                <label class="field-box"><?= icon('map-pin') ?><span class="sr-only">Ville</span>
                    <span class="select-wrap"><select name="city">
                        <option value="">Toutes les villes</option>
                        <?php $country = null; foreach ($cities as $c): ?>
                            <?php if ($c['country'] !== $country): ?><?= $country !== null ? '</optgroup>' : '' ?><optgroup label="<?= e($c['country']) ?>"><?php $country = $c['country']; endif; ?>
                            <option value="<?= (int)$c['id'] ?>" <?= (int)$filters['city'] === (int)$c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option>
                        <?php endforeach; ?></optgroup>
                    </select></span>
                </label>
            </div>
            <?php foreach ((array)$filters['type'] as $t): ?><input type="hidden" name="type[]" value="<?= e($t) ?>"><?php endforeach; ?>
            <button class="btn btn-cta" type="submit">Rechercher <?= icon('arrow-right') ?></button>
        </form>
    </div>
</section>

<section class="section-sm">
    <div class="container layout-aside left">
        <aside>
            <details class="filters" open>
                <summary class="flex between" style="cursor:pointer;list-style:none"><h2 style="font-size:1.05rem;margin:0"><?= icon('sliders-horizontal') ?> Filtres</h2><?php if (count($q) > 1 || ($q && !isset($q['q']))): ?><a class="small" href="<?= e(url('/offres')) ?>">Réinitialiser</a><?php endif; ?></summary>
                <form method="get" action="<?= e(url('/offres')) ?>" class="stack mt-2" data-autosubmit>
                    <input type="hidden" name="q" value="<?= e($filters['q']) ?>">
                    <input type="hidden" name="city" value="<?= e($filters['city']) ?>">
                    <fieldset>
                        <legend class="small">Type d'opportunité</legend>
                        <div class="stack-sm">
                            <?php foreach (job_types() as $k => $label): ?>
                                <label class="check"><input type="checkbox" name="type[]" value="<?= e($k) ?>" <?= in_array($k, (array)$filters['type'], true) ? 'checked' : '' ?>> <span class="grow"><?= e($label) ?></span><small class="muted tabular"><?= $typeCounts[$k] ?? 0 ?></small></label>
                            <?php endforeach; ?>
                        </div>
                    </fieldset>
                    <div class="field">
                        <label for="f-sector">Secteur</label>
                        <select id="f-sector" name="sector"><option value="">Tous les secteurs</option>
                            <?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>" <?= (int)$filters['sector'] === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?>
                        </select>
                    </div>
                    <div class="field">
                        <label for="f-edu">Mon niveau d'études</label>
                        <select id="f-edu" name="education"><option value="">Tous niveaux</option>
                            <?php foreach ($levels as $k => $l): ?><option value="<?= $k ?>" <?= $filters['education'] !== '' && (int)$filters['education'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?>
                        </select>
                        <span class="hint">Affiche les offres accessibles avec ce niveau.</span>
                    </div>
                    <label class="check"><input type="checkbox" name="beginner" value="1" <?= $filters['beginner'] ? 'checked' : '' ?>> <span>Débutants acceptés</span></label>
                    <label class="check"><input type="checkbox" name="remote" value="1" <?= $filters['remote'] ? 'checked' : '' ?>> <span>Télétravail possible</span></label>
                    <div class="field">
                        <label for="f-sort">Trier par</label>
                        <select id="f-sort" name="sort">
                            <option value="recent">Plus récentes</option>
                            <?php if ($isCandidate): ?><option value="match" <?= $filters['sort'] === 'match' ? 'selected' : '' ?>>Meilleure compatibilité</option><?php endif; ?>
                            <option value="salary" <?= $filters['sort'] === 'salary' ? 'selected' : '' ?>>Rémunération</option>
                            <option value="deadline" <?= $filters['sort'] === 'deadline' ? 'selected' : '' ?>>Date limite proche</option>
                        </select>
                    </div>
                    <noscript><button class="btn btn-primary btn-block" type="submit">Appliquer</button></noscript>
                </form>
            </details>
            <?php if (!user()): ?>
                <div class="card card-blue mt-2">
                    <h3><?= icon('target') ?> Ton score de match</h3>
                    <p class="small" style="color:#e2ecff">Crée ton profil pour voir ta compatibilité avec chaque offre et recevoir des alertes.</p>
                    <a class="btn btn-cta btn-sm" href="<?= e(url('/inscription')) ?>">Créer mon profil</a>
                </div>
            <?php endif; ?>
        </aside>

        <div>
            <?php if (!$results): ?>
                <?= App\Core\View::partial('partials/empty', ['icon' => 'search', 'heading' => 'Aucune offre ne correspond', 'text' => 'Essaie d\'élargir ta recherche : moins de filtres, une autre ville ou un mot-clé plus général.', 'cta' => ['Voir toutes les offres', '/offres']]) ?>
            <?php else: ?>
                <div class="stack">
                    <?php foreach ($results as $r): ?>
                        <?= App\Core\View::partial('partials/job_card', ['job' => $r['job'], 'match' => $r['match'], 'isFav' => in_array($r['job']['id'], $favs)]) ?>
                    <?php endforeach; ?>
                </div>
                <?= App\Core\View::partial('partials/pagination', ['page' => $page, 'pages' => $pages, 'query' => $q, 'path' => '/offres']) ?>
            <?php endif; ?>
        </div>
    </div>
</section>
