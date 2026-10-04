<?php
$types = job_types();
$levels = education_levels();
$u = user();
$logo = mb_strtoupper(mb_substr($job['company_name'], 0, 2));
$daysLeft = $job['deadline'] ? (int)ceil((strtotime($job['deadline']) - time()) / 86400) : null;
$langs = array_filter(array_map('trim', explode(',', (string)$job['languages'])));
?>
<section class="hero" style="padding:24px 0 28px">
    <div class="container">
        <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="<?= e(url('/')) ?>">Accueil</a> <?= icon('chevron-right') ?> <a href="<?= e(url('/offres')) ?>">Offres</a> <?= icon('chevron-right') ?> <span><?= e(excerpt($job['title'], 40)) ?></span></nav>
        <?php if ($job['status'] !== 'published'): ?><div class="alert alert-warning mb-2"><?= icon('info') ?><div>Cette offre n'est pas publiée (statut : <b><?= e($job['status']) ?></b>). Seuls vous et l'équipe NEAM la voyez.</div></div><?php endif; ?>
        <div class="card card-lg" style="box-shadow:var(--shadow)">
            <div class="flex" style="align-items:flex-start;gap:18px;flex-wrap:wrap">
                <span class="logo-box" style="--s:72px;background:<?= e($job['company_color']) ?>"><?= e($logo) ?></span>
                <div class="grow">
                    <div class="flex flex-wrap" style="gap:6px">
                        <span class="badge badge-blue"><?= e($types[$job['type']] ?? $job['type']) ?></span>
                        <?php if ($job['featured']): ?><span class="badge badge-yellow"><?= icon('star') ?> À la une</span><?php endif; ?>
                        <?php if ((int)$job['remote'] === 2): ?><span class="badge badge-violet">100 % télétravail</span><?php elseif ((int)$job['remote'] === 1): ?><span class="badge badge-sky">Hybride</span><?php endif; ?>
                        <?php if ($daysLeft !== null && $daysLeft <= 7 && $daysLeft >= 0): ?><span class="badge badge-red"><?= icon('clock') ?> Clôture dans <?= $daysLeft ?> j</span><?php endif; ?>
                    </div>
                    <h1 style="font-size:clamp(1.5rem,3.4vw,2.2rem);margin:10px 0 6px"><?= e($job['title']) ?></h1>
                    <a href="<?= e(url('/entreprises/' . $job['company_slug'])) ?>" style="font-weight:700"><?= e($job['company_name']) ?></a>
                    <?php if ($job['company_status'] === 'verified'): ?><span class="badge badge-blue"><?= icon('badge-check') ?> Entreprise vérifiée</span><?php endif; ?>
                    <div class="flex flex-wrap muted mt-2" style="gap:8px 20px;font-size:.92rem">
                        <span><?= icon('map-pin') ?> <?= e($job['city_name']) ?></span>
                        <?php if ($job['salary_max']): ?><span><?= icon('wallet') ?> <?= e(money((int)$job['salary_min'], false)) ?> – <?= e(money((int)$job['salary_max'])) ?> / mois</span><?php endif; ?>
                        <?php if ($job['duration']): ?><span><?= icon('clock') ?> <?= e($job['duration']) ?></span><?php endif; ?>
                        <?php if ($job['start_date']): ?><span><?= icon('calendar') ?> Début : <?= e(date_fr($job['start_date'])) ?></span><?php endif; ?>
                        <span><?= icon('users') ?> <?= (int)$job['positions'] ?> poste<?= $job['positions'] > 1 ? 's' : '' ?></span>
                        <span><?= icon('eye') ?> <?= nf($job['views']) ?> vues · <?= $applicants ?> candidature<?= $applicants > 1 ? 's' : '' ?></span>
                    </div>
                </div>
                <div class="flex flex-wrap" style="gap:8px">
                    <?php if ($u && $u['role'] === 'candidate'): ?>
                        <form method="post" action="<?= e(url('/offres/' . $job['id'] . '/favori')) ?>" data-fav><?= csrf_field() ?>
                            <button type="submit" class="fav-btn <?= $isFav ? 'on' : '' ?>" style="width:48px;height:48px" aria-pressed="<?= $isFav ? 'true' : 'false' ?>" aria-label="<?= $isFav ? 'Retirer des favoris' : 'Ajouter aux favoris' ?>"><?= icon('heart') ?></button>
                        </form>
                        <?php if ($application): ?>
                            <a class="btn btn-ghost btn-lg" href="<?= e(url('/espace/candidatures/' . $application['id'])) ?>"><?= icon('check') ?> Ma candidature : <?= e(application_statuses()[$application['status']][0]) ?></a>
                        <?php elseif ($job['apply_mode'] === 'external'): ?>
                            <a class="btn btn-cta btn-lg" href="<?= e($job['external_url']) ?>" target="_blank" rel="noopener noreferrer">Postuler sur le site <?= icon('external-link') ?></a>
                        <?php else: ?>
                            <a class="btn btn-cta btn-lg" href="<?= e(url('/offres/' . $job['id'] . '/postuler')) ?>">Postuler <?= icon('arrow-right') ?></a>
                        <?php endif; ?>
                    <?php elseif (!$u): ?>
                        <a class="btn btn-cta btn-lg" href="<?= e(url('/inscription')) ?>">Postuler <?= icon('arrow-right') ?></a>
                    <?php elseif ($own): ?>
                        <a class="btn btn-primary" href="<?= e(url('/entreprise/offres/' . $job['id'] . '/candidatures')) ?>"><?= icon('kanban') ?> Candidatures</a>
                        <a class="btn btn-ghost" href="<?= e(url('/entreprise/offres/' . $job['id'] . '/modifier')) ?>"><?= icon('pencil') ?> Modifier</a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="section-sm">
    <div class="container layout-aside">
        <div class="stack">
            <article class="card card-lg">
                <h2 style="font-size:1.25rem">L'opportunité</h2>
                <div class="prose" style="font-size:1rem"><?= nl2p($job['description']) ?></div>
                <?php if ($job['missions']): ?><h3 class="mt-3">Tes missions</h3><div class="prose" style="font-size:1rem"><?= nl2p($job['missions']) ?></div><?php endif; ?>
                <?php if ($job['profile']): ?><h3 class="mt-3">Profil recherché</h3><div class="prose" style="font-size:1rem"><?= nl2p($job['profile']) ?></div><?php endif; ?>
            </article>
            <div class="card card-lg">
                <h2 style="font-size:1.25rem">Compétences & exigences</h2>
                <div class="grid-2">
                    <div>
                        <h4>Compétences techniques</h4>
                        <div class="tags">
                            <?php
                            $have = [];
                            if ($match) {
                                $missingIds = array_column($match['missing_skills'], 'id');
                            }
                            foreach ($job['skills'] as $s):
                                $ok = $match ? !in_array($s['id'], $missingIds, false) : null; ?>
                                <span class="tag <?= $ok === true ? 'ok' : ($ok === false ? 'miss' : '') ?>"><?= $ok === true ? icon('check') : ($ok === false ? icon('plus') : '') ?><?= e($s['name']) ?><?= $s['required'] ? ' <b title="Compétence clé">★</b>' : '' ?></span>
                            <?php endforeach; ?>
                        </div>
                        <?php if ($match): ?><p class="small muted mt-1"><?= icon('check') ?> maîtrisée · <?= icon('plus') ?> à acquérir · ★ compétence clé</p><?php endif; ?>
                    </div>
                    <div class="stack-sm small">
                        <div><b>Niveau d'études :</b> <?= e($levels[(int)$job['education_min']] ?? '') ?> minimum<?= $job['education_eliminatory'] ? ' <span class="badge badge-red">obligatoire</span>' : '' ?></div>
                        <div><b>Expérience :</b> <?= $job['experience_min'] ? e(App\Services\MatchingEngine::monthsLabel((int)$job['experience_min'])) : 'Débutant·e accepté·e' ?></div>
                        <?php if ($langs): ?><div><b>Langues :</b> <?= e(implode(', ', array_map(fn($l) => str_replace(':', ' (', $l) . ')', $langs))) ?></div><?php endif; ?>
                        <?php if ($job['soft_skills']): ?><div><b>Qualités :</b> <?= e(str_replace(',', ', ', $job['soft_skills'])) ?></div><?php endif; ?>
                        <?php if ($job['deadline']): ?><div><b>Date limite :</b> <?= e(date_fr($job['deadline'])) ?></div><?php endif; ?>
                        <div><b>Publiée :</b> <?= e(time_ago($job['published_at'])) ?></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="flex" style="align-items:flex-start">
                    <span class="logo-box" style="background:<?= e($company['color']) ?>"><?= e($logo) ?></span>
                    <div class="grow">
                        <h3 class="mb-0"><?= e($company['name']) ?></h3>
                        <small class="muted"><?= e($job['sector_name']) ?> · <?= e($company['city_name']) ?> · <?= e($company['size']) ?> salariés</small>
                        <p class="small mt-1 mb-1"><?= e(excerpt($company['description'], 260)) ?></p>
                        <a class="small" href="<?= e(url('/entreprises/' . $company['slug'])) ?>">Voir l'entreprise et ses offres <?= icon('arrow-right') ?></a>
                    </div>
                </div>
            </div>

            <?php if ($u): ?>
            <details class="faq">
                <summary><?= icon('flag') ?> Signaler cette offre</summary>
                <p class="small muted">Offre suspecte, demande d'argent, discrimination ? L'équipe NEAM vérifie chaque signalement. <b>Un recruteur ne doit jamais te demander de payer.</b></p>
                <form method="post" action="<?= e(url('/signaler')) ?>" class="stack-sm">
                    <?= csrf_field() ?><input type="hidden" name="entity" value="job"><input type="hidden" name="entity_id" value="<?= (int)$job['id'] ?>">
                    <div class="field"><label for="r-subject">Motif</label><select id="r-subject" name="subject"><option>Demande d'argent</option><option>Offre trompeuse</option><option>Contenu discriminatoire</option><option>Autre</option></select></div>
                    <div class="field"><label for="r-reason">Détails</label><textarea id="r-reason" name="reason" required minlength="10" style="min-height:90px"></textarea></div>
                    <button class="btn btn-danger btn-sm" type="submit">Envoyer le signalement</button>
                </form>
            </details>
            <?php endif; ?>
        </div>

        <aside class="stack">
            <?php if ($match): ?>
                <div class="card card-lg" style="position:sticky;top:90px">
                    <?= App\Core\View::partial('partials/match_explain', ['match' => $match, 'showActions' => true]) ?>
                </div>
            <?php elseif (!$u): ?>
                <div class="card card-lg text-center">
                    <div class="ring ring-lg mid" style="--p:0;margin:0 auto"><b>?<small>%</small></b></div>
                    <h3 class="mt-2">Quelle est ta compatibilité ?</h3>
                    <p class="muted small">Crée ton profil en 2 minutes pour découvrir ton score et ce qu'il te manque pour décrocher ce poste.</p>
                    <a class="btn btn-cta btn-block" href="<?= e(url('/inscription')) ?>">Calculer mon score</a>
                    <a class="btn btn-ghost btn-block mt-1" href="<?= e(url('/connexion')) ?>">J'ai déjà un compte</a>
                </div>
            <?php endif; ?>
            <?php if ($similar): ?>
                <div class="card">
                    <h3>Offres similaires</h3>
                    <ul class="list">
                        <?php foreach ($similar as $s): ?>
                            <li><a class="list-link" href="<?= e(url('/offres/' . $s['id'])) ?>"><span class="logo-box" style="--s:40px;background:<?= e($s['company_color']) ?>"><?= e(mb_strtoupper(mb_substr($s['company_name'], 0, 2))) ?></span><span class="grow"><b style="font-size:.9rem;color:var(--navy)"><?= e($s['title']) ?></b><br><small class="muted"><?= e($s['company_name']) ?> · <?= e($s['city_name']) ?></small></span></a></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
        </aside>
    </div>
</section>
