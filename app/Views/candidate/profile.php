<?php
$levels = education_levels();
$err = errors();
$kinds = ['stage' => 'Stage', 'emploi' => 'Emploi', 'alternance' => 'Alternance', 'projet' => 'Projet', 'benevolat' => 'Bénévolat / associatif'];
$mySkillIds = array_column($p['skills'], 'id');
?>
<div class="page-head">
    <div>
        <h1>Mon profil</h1>
        <p>Ton profil alimente le matching : chaque information compte.</p>
    </div>
    <div class="flex">
        <a class="btn btn-ghost" href="<?= e(url('/espace/cv')) ?>"><?= icon('file-text') ?> Voir mon CV</a>
    </div>
</div>

<div class="layout-aside">
    <div class="stack">
        <form method="post" action="<?= e(url('/espace/profil')) ?>" class="card card-lg" novalidate>
            <?= csrf_field() ?>
            <h2 style="font-size:1.2rem"><?= icon('user') ?> Informations personnelles</h2>
            <div class="form-grid cols-2">
                <div class="field"><label for="first_name">Prénom <span class="req">*</span></label><input id="first_name" name="first_name" required value="<?= e(old('first_name', $p['first_name'])) ?>" autocomplete="given-name"></div>
                <div class="field"><label for="last_name">Nom <span class="req">*</span></label><input id="last_name" name="last_name" required value="<?= e(old('last_name', $p['last_name'])) ?>" autocomplete="family-name"></div>
                <div class="field span-2"><label for="headline">Titre du profil</label><input id="headline" name="headline" maxlength="160" value="<?= e(old('headline', $p['headline'])) ?>" placeholder="Ex. Étudiante en Licence Informatique — développement web"></div>
                <div class="field span-2"><label for="bio">Présentation</label><textarea id="bio" name="bio" maxlength="1500" placeholder="Parle de toi, de ce qui te motive et de ce que tu apportes."><?= e(old('bio', $p['bio'])) ?></textarea><span class="hint">60 caractères minimum pour compter dans la complétion.</span></div>
                <div class="field <?= isset($err['phone']) ? 'has-error' : '' ?>"><label for="phone">Téléphone</label><input id="phone" name="phone" type="tel" value="<?= e(old('phone', $p['phone'])) ?>" autocomplete="tel"><?= error_for('phone') ?></div>
                <div class="field"><label for="birth_date">Date de naissance</label><input id="birth_date" name="birth_date" type="date" value="<?= e(old('birth_date', $p['birth_date'])) ?>"></div>
                <div class="field"><label for="city_id">Ville</label><select id="city_id" name="city_id"><option value="">—</option><?php foreach ($cities as $c): ?><option value="<?= (int)$c['id'] ?>" <?= (int)$p['city_id'] === (int)$c['id'] ? 'selected' : '' ?>><?= e($c['name'] . ' — ' . $c['country']) ?></option><?php endforeach; ?></select></div>
                <div class="field"><label for="mobility">Mobilité</label><select id="mobility" name="mobility"><?php foreach (mobility_labels() as $k => $l): ?><option value="<?= $k ?>" <?= $p['mobility'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
            </div>

            <h2 class="mt-4" style="font-size:1.2rem"><?= icon('graduation-cap') ?> Parcours</h2>
            <div class="form-grid cols-2">
                <div class="field"><label for="education_level">Niveau d'études <span class="req">*</span></label><select id="education_level" name="education_level"><?php foreach ($levels as $k => $l): ?><option value="<?= $k ?>" <?= $p['education_level'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
                <div class="field"><label for="field_of_study">Domaine</label><input id="field_of_study" name="field_of_study" value="<?= e($p['field_of_study']) ?>"></div>
                <div class="field"><label for="experience_months">Expérience totale (mois)</label><input id="experience_months" name="experience_months" type="number" min="0" max="600" value="<?= (int)$p['experience_months'] ?>"><span class="hint">Stages et emplois cumulés.</span></div>
                <div class="field"><label for="certifications">Certifications</label><input id="certifications" name="certifications" value="<?= e($p['certifications']) ?>" placeholder="Ex. TOEIC 750, PIX, CCNA…"><span class="hint">Tes certificats de cours en ligne se relient avec leur lien de vérification dans <a href="<?= e(url('/espace/formations#certificats')) ?>">Mes formations</a>.</span></div>
            </div>

            <h2 class="mt-4" style="font-size:1.2rem"><?= icon('target') ?> Ce que je recherche</h2>
            <div class="form-grid cols-2">
                <div class="field"><label for="desired_job">Métier visé</label><input id="desired_job" name="desired_job" value="<?= e($p['desired_job']) ?>"></div>
                <div class="field"><label for="desired_sector_id">Secteur préféré</label><select id="desired_sector_id" name="desired_sector_id"><option value="">Peu importe</option><?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>" <?= (int)$p['desired_sector_id'] === (int)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
                <div class="field"><label for="desired_salary">Rémunération souhaitée (FCFA / mois)</label><input id="desired_salary" name="desired_salary" type="number" min="0" step="5000" value="<?= e($p['desired_salary']) ?>"></div>
                <div class="field"><label for="availability_date">Disponible à partir du</label><input id="availability_date" name="availability_date" type="date" value="<?= e($p['availability_date']) ?>"></div>
                <div class="span-2">
                    <p class="label">Types d'opportunités</p>
                    <div class="choice-grid"><?php foreach (job_types() as $k => $l): ?><label class="choice"><input type="checkbox" name="types[]" value="<?= e($k) ?>" <?= in_array($k, $p['types_list'], true) ? 'checked' : '' ?>><span><?= e($l) ?></span></label><?php endforeach; ?></div>
                </div>
                <label class="check span-2"><input type="checkbox" name="remote_ok" value="1" <?= $p['remote_ok'] ? 'checked' : '' ?>> <span>Ouvert·e au télétravail</span></label>
            </div>

            <h2 class="mt-4" style="font-size:1.2rem" id="soft"><?= icon('smile') ?> Mes qualités</h2>
            <div class="choice-grid"><?php foreach ($skillsSoft as $s): ?><label class="choice"><input type="checkbox" name="soft[]" value="<?= e($s['name']) ?>" <?= in_array($s['name'], $p['soft_list'], true) ? 'checked' : '' ?>><span><?= e($s['name']) ?></span></label><?php endforeach; ?></div>

            <h2 class="mt-4" style="font-size:1.2rem"><?= icon('globe') ?> Liens & visibilité</h2>
            <div class="form-grid cols-2">
                <div class="field"><label for="linkedin">LinkedIn</label><input id="linkedin" name="linkedin" type="url" value="<?= e($p['linkedin']) ?>" placeholder="https://www.linkedin.com/in/…"><?= error_for('linkedin') ?></div>
                <div class="field"><label for="portfolio">Portfolio / GitHub</label><input id="portfolio" name="portfolio" type="url" value="<?= e($p['portfolio']) ?>"><?= error_for('portfolio') ?></div>
                <label class="check span-2"><input type="checkbox" name="visible_to_recruiters" value="1" <?= $p['visible_to_recruiters'] ? 'checked' : '' ?>> <span>Rendre mon profil visible dans la CVthèque des recruteurs <small class="muted">(sans tes coordonnées)</small></span></label>
            </div>
            <div class="flex mt-3" style="justify-content:flex-end"><button class="btn btn-primary btn-lg" type="submit"><?= icon('check') ?> Enregistrer mon profil</button></div>
        </form>

        <section class="card card-lg" id="competences">
            <div class="card-title"><h2><?= icon('zap') ?> Compétences techniques</h2><span class="badge badge-blue"><?= count(array_filter($p['skills'], fn($s) => $s['category'] === 'tech')) ?></span></div>
            <div class="stack-sm">
                <?php foreach ($p['skills'] as $s): if ($s['category'] !== 'tech') continue; ?>
                    <div class="flex between" style="padding:8px 0;border-bottom:1px solid var(--line-2)">
                        <b style="color:var(--navy);font-size:.93rem"><?= e($s['name']) ?></b>
                        <div class="flex">
                            <span class="level-dots" aria-label="Niveau <?= (int)$s['level'] ?> sur 5"><?php for ($i = 1; $i <= 5; $i++): ?><i class="<?= $i <= $s['level'] ? 'on' : '' ?>"></i><?php endfor; ?></span>
                            <form method="post" action="<?= e(url('/espace/profil/competences/' . $s['id'] . '/supprimer')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-icon btn-sm" type="submit" aria-label="Retirer <?= e($s['name']) ?>"><?= icon('x') ?></button></form>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <form method="post" action="<?= e(url('/espace/profil/competences')) ?>" class="form-grid cols-3 mt-2" style="align-items:end">
                <?= csrf_field() ?>
                <div class="field"><label for="skill_id">Ajouter une compétence</label>
                    <select id="skill_id" name="skill_id"><option value="">Choisir dans la liste…</option><?php foreach ($skillsTech as $s): if (in_array($s['id'], $mySkillIds)) continue; ?><option value="<?= (int)$s['id'] ?>"><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
                <div class="field"><label for="skill_name">…ou la saisir</label><input id="skill_name" name="skill_name" placeholder="Ex. Laravel"></div>
                <div class="field"><label for="level">Niveau</label><select id="level" name="level"><option value="1">1 — Notions</option><option value="2">2 — Débutant</option><option value="3" selected>3 — Intermédiaire</option><option value="4">4 — Confirmé</option><option value="5">5 — Expert</option></select></div>
                <div class="span-3"><button class="btn btn-soft" type="submit"><?= icon('plus') ?> Ajouter</button></div>
            </form>
        </section>

        <section class="card card-lg" id="formations">
            <h2 style="font-size:1.2rem"><?= icon('graduation-cap') ?> Formations</h2>
            <ul class="timeline mt-2">
                <?php foreach ($p['educations'] as $ed): ?>
                    <li><span class="dot done"></span><div class="flex between"><div><b><?= e($ed['degree']) ?><?= $ed['field'] ? ' — ' . e($ed['field']) : '' ?></b><span><?= e($ed['school']) ?> · <?= e($ed['start_year']) ?>–<?= e($ed['end_year']) ?></span></div>
                        <form method="post" action="<?= e(url('/espace/profil/formations/' . $ed['id'] . '/supprimer')) ?>" data-confirm="Supprimer cette formation ?"><?= csrf_field() ?><button class="btn btn-ghost btn-icon btn-sm" type="submit" aria-label="Supprimer"><?= icon('trash-2') ?></button></form></div></li>
                <?php endforeach; ?>
            </ul>
            <details class="faq mt-2"><summary><?= icon('plus') ?> Ajouter une formation</summary>
                <form method="post" action="<?= e(url('/espace/profil/formations')) ?>" class="form-grid cols-2 mt-2">
                    <?= csrf_field() ?>
                    <div class="field"><label for="ed-school">Établissement *</label><input id="ed-school" name="school" required></div>
                    <div class="field"><label for="ed-degree">Diplôme *</label><input id="ed-degree" name="degree" required placeholder="Licence, BTS, Master…"></div>
                    <div class="field"><label for="ed-field">Spécialité</label><input id="ed-field" name="field"></div>
                    <div class="flex"><div class="field grow"><label for="ed-start">Début</label><input id="ed-start" name="start_year" type="number" min="1970" max="2040"></div><div class="field grow"><label for="ed-end">Fin</label><input id="ed-end" name="end_year" type="number" min="1970" max="2040"></div></div>
                    <div class="field span-2"><label for="ed-desc">Détails</label><textarea id="ed-desc" name="description" style="min-height:80px"></textarea></div>
                    <div><button class="btn btn-primary" type="submit">Ajouter</button></div>
                </form>
            </details>
        </section>

        <section class="card card-lg" id="experiences">
            <h2 style="font-size:1.2rem"><?= icon('briefcase-business') ?> Expériences & projets</h2>
            <ul class="timeline mt-2">
                <?php foreach ($p['experiences'] as $x): ?>
                    <li><span class="dot <?= $x['end_date'] ? 'done' : '' ?>"></span><div class="flex between" style="align-items:flex-start"><div><b><?= e($x['title']) ?></b><span><?= e($kinds[$x['kind']] ?? $x['kind']) ?><?= $x['company'] ? ' · ' . e($x['company']) : '' ?> · <?= e(date_fr($x['start_date'])) ?> → <?= $x['end_date'] ? e(date_fr($x['end_date'])) : 'aujourd\'hui' ?></span><?php if ($x['description']): ?><p class="small mt-1 mb-0"><?= e($x['description']) ?></p><?php endif; ?></div>
                        <form method="post" action="<?= e(url('/espace/profil/experiences/' . $x['id'] . '/supprimer')) ?>" data-confirm="Supprimer cette expérience ?"><?= csrf_field() ?><button class="btn btn-ghost btn-icon btn-sm" type="submit" aria-label="Supprimer"><?= icon('trash-2') ?></button></form></div></li>
                <?php endforeach; ?>
            </ul>
            <details class="faq mt-2"><summary><?= icon('plus') ?> Ajouter une expérience ou un projet</summary>
                <form method="post" action="<?= e(url('/espace/profil/experiences')) ?>" class="form-grid cols-2 mt-2">
                    <?= csrf_field() ?>
                    <div class="field"><label for="x-title">Intitulé *</label><input id="x-title" name="title" required></div>
                    <div class="field"><label for="x-kind">Type</label><select id="x-kind" name="kind"><?php foreach ($kinds as $k => $l): ?><option value="<?= $k ?>"><?= e($l) ?></option><?php endforeach; ?></select></div>
                    <div class="field"><label for="x-company">Organisation</label><input id="x-company" name="company"></div>
                    <div class="field"><label for="x-city">Ville</label><input id="x-city" name="city"></div>
                    <div class="field"><label for="x-start">Début</label><input id="x-start" name="start_date" type="date"></div>
                    <div class="field"><label for="x-end">Fin <small class="muted">(vide si en cours)</small></label><input id="x-end" name="end_date" type="date"></div>
                    <div class="field span-2"><label for="x-desc">Ce que tu as fait et le résultat</label><textarea id="x-desc" name="description" placeholder="J'ai… ce qui a permis de…"></textarea><span class="hint">Les compétences citées sont détectées automatiquement.</span></div>
                    <div><button class="btn btn-primary" type="submit">Ajouter</button></div>
                </form>
            </details>
        </section>

        <section class="card card-lg" id="langues">
            <h2 style="font-size:1.2rem"><?= icon('languages') ?> Langues</h2>
            <form method="post" action="<?= e(url('/espace/profil/langues')) ?>" class="stack-sm">
                <?= csrf_field() ?>
                <?php $langs = $p['languages_list']; for ($i = 0; $i < max(3, count($langs) + 1); $i++): $l = $langs[$i] ?? ['name' => '', 'level' => 'B1']; ?>
                    <div class="flex">
                        <div class="field grow"><label class="sr-only" for="ln<?= $i ?>">Langue</label><input id="ln<?= $i ?>" name="lang_name[]" value="<?= e($l['name']) ?>" placeholder="<?= ['Français', 'Anglais', 'Fang, Punu, Espagnol…'][$i] ?? 'Autre langue' ?>"></div>
                        <div class="field" style="width:200px"><label class="sr-only" for="ll<?= $i ?>">Niveau</label><select id="ll<?= $i ?>" name="lang_level[]"><?php foreach (language_levels() as $k => $lab): ?><option value="<?= $k ?>" <?= $l['level'] === $k ? 'selected' : '' ?>><?= $k ?> — <?= e($lab) ?></option><?php endforeach; ?></select></div>
                    </div>
                <?php endfor; ?>
                <div><button class="btn btn-soft" type="submit"><?= icon('check') ?> Enregistrer les langues</button></div>
            </form>
        </section>
    </div>

    <aside class="stack">
        <div class="card card-lg" style="position:sticky;top:90px">
            <div class="flex" style="gap:16px">
                <div class="ring ring-lg <?= score_class($completion['percent']) ?>" style="--p:<?= $completion['percent'] ?>"><b><?= $completion['percent'] ?><small>%</small></b></div>
                <div><h3 class="mb-0">Profil complété</h3><small class="muted">Score d'employabilité : <b><?= (int)$p['employability_score'] ?>/100</b></small></div>
            </div>
            <?php if ($completion['missing']): ?>
                <h4 class="mt-2">Pour aller plus loin</h4>
                <ul class="explain-list gap"><?php foreach ($completion['missing'] as $m): ?><li><?= icon('plus') ?><span class="small"><?= e($m) ?></span></li><?php endforeach; ?></ul>
            <?php else: ?>
                <div class="alert alert-success mt-2 small"><?= icon('circle-check-big') ?><div>Profil complet ! Les recruteurs voient un profil de qualité.</div></div>
            <?php endif; ?>
        </div>
        <div class="card">
            <h3><?= icon('school') ?> Mon établissement</h3>
            <?php if ($school): ?>
                <p class="small mb-0">Rattaché·e à <b><?= e($school['name']) ?></b>. Ton école suit tes stages et t'envoie des opportunités ciblées.</p>
            <?php else: ?>
                <form method="post" action="<?= e(url('/espace/ecole')) ?>" class="stack-sm">
                    <?= csrf_field() ?>
                    <div class="field"><label for="code">Code établissement</label><input id="code" name="code" placeholder="Ex. ISNG2026" style="text-transform:uppercase"></div>
                    <div class="field"><label for="program">Filière</label><input id="program" name="program" placeholder="Ex. Licence Informatique"></div>
                    <button class="btn btn-soft btn-sm" type="submit">Rejoindre</button>
                </form>
            <?php endif; ?>
        </div>
    </aside>
</div>
