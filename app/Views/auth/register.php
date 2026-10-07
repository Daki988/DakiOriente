<?php
$roles = [
    'candidate' => ['Candidat·e', 'user', 'Je cherche un stage, un emploi, une formation'],
    'company'   => ['Entreprise', 'building-2', 'Je recrute des talents'],
    'school'    => ['École', 'school', 'J\'accompagne mes étudiants'],
];
$err = errors();
$f = fn(string $k) => isset($err[$k]) ? 'has-error' : '';
?>
<div class="auth-wrap">
    <?= App\Core\View::partial('auth/_side', ['heading' => $role === 'company' ? 'Les talents de demain sont déjà là. Trouvez-les.' : ($role === 'school' ? 'Suivez l\'insertion de vos étudiants, sans tableur.' : 'Ton tremplin vers l\'emploi commence ici.')]) ?>
    <div class="auth-form">
        <div class="auth-card" style="max-width:560px">
            <h1 style="font-size:2rem">Créer mon compte</h1>
            <p class="muted"><?= $role === 'candidate' ? 'Gratuit, sans engagement, et ton premier score de compatibilité arrive dès que ton profil est rempli.' : 'Gratuit pendant le lancement, sans engagement.' ?> Déjà inscrit·e ? <a href="<?= e(url('/connexion')) ?>">Se connecter</a></p>

            <nav class="role-switch mb-2" aria-label="Type de compte">
                <?php foreach ($roles as $k => [$label, $ic, $hint]): ?>
                    <a href="<?= e(url('/inscription', ['role' => $k])) ?>" class="choice" <?= $role === $k ? 'aria-current="page"' : '' ?>>
                        <span style="<?= $role === $k ? 'border-color:var(--blue);background:var(--blue-50);color:var(--blue-700)' : '' ?>;flex-direction:column;gap:4px;min-height:76px"><?= icon($ic, 'ic-lg') ?><?= e($label) ?></span>
                    </a>
                <?php endforeach; ?>
            </nav>

            <form method="post" action="<?= e(url('/inscription')) ?>" class="card card-lg" novalidate>
                <?= csrf_field() ?>
                <input type="hidden" name="role" value="<?= e($role) ?>">
                <div class="form-grid cols-2">
                    <?php if ($role !== 'candidate'): ?>
                        <div class="field span-2 <?= $f('org_name') ?>">
                            <label for="org_name"><?= $role === 'company' ? 'Nom de l\'entreprise' : 'Nom de l\'établissement' ?> <span class="req">*</span></label>
                            <input id="org_name" name="org_name" required value="<?= e(old('org_name')) ?>" autocomplete="organization">
                            <?= error_for('org_name') ?>
                        </div>
                        <?php if ($role === 'company'): ?>
                            <div class="field <?= $f('sector_id') ?>">
                                <label for="sector_id">Secteur <span class="req">*</span></label>
                                <select id="sector_id" name="sector_id" required>
                                    <option value="">Choisir…</option>
                                    <?php foreach ($sectors as $s): ?><option value="<?= (int)$s['id'] ?>" <?= (string)old('sector_id') === (string)$s['id'] ? 'selected' : '' ?>><?= e($s['name']) ?></option><?php endforeach; ?>
                                </select>
                                <?= error_for('sector_id') ?>
                            </div>
                            <div class="field">
                                <label for="rccm">N° RCCM</label>
                                <input id="rccm" name="rccm" value="<?= e(old('rccm')) ?>" placeholder="GA-LBV-2024-B-12345">
                                <span class="hint">Facultatif, mais vos offres seront vérifiées et publiées plus vite.</span>
                            </div>
                        <?php endif; ?>
                        <div class="field span-2 <?= $f('city_id') ?>">
                            <label for="city_id">Ville <span class="req">*</span></label>
                            <select id="city_id" name="city_id" required>
                                <option value="">Choisir…</option>
                                <?php foreach ($cities as $c): ?><option value="<?= (int)$c['id'] ?>" <?= (string)old('city_id') === (string)$c['id'] ? 'selected' : '' ?>><?= e($c['name'] . ' — ' . $c['country']) ?></option><?php endforeach; ?>
                            </select>
                            <?= error_for('city_id') ?>
                        </div>
                    <?php endif; ?>
                    <div class="field <?= $f('first_name') ?>">
                        <label for="first_name">Prénom <span class="req">*</span></label>
                        <input id="first_name" name="first_name" required autocomplete="given-name" value="<?= e(old('first_name')) ?>">
                        <?= error_for('first_name') ?>
                    </div>
                    <div class="field <?= $f('last_name') ?>">
                        <label for="last_name">Nom <span class="req">*</span></label>
                        <input id="last_name" name="last_name" required autocomplete="family-name" value="<?= e(old('last_name')) ?>">
                        <?= error_for('last_name') ?>
                    </div>
                    <div class="field <?= $f('email') ?>">
                        <label for="email"><?= $role === 'candidate' ? 'E-mail' : 'E-mail professionnel' ?> <span class="req">*</span></label>
                        <input id="email" name="email" type="email" required autocomplete="email" value="<?= e(old('email')) ?>">
                        <?= error_for('email') ?>
                    </div>
                    <div class="field <?= $f('phone') ?>">
                        <label for="phone">Téléphone</label>
                        <input id="phone" name="phone" type="tel" autocomplete="tel" placeholder="+241 77 12 34 56" value="<?= e(old('phone')) ?>">
                        <?= error_for('phone') ?>
                    </div>
                    <div class="field <?= $f('password') ?>">
                        <label for="password">Mot de passe <span class="req">*</span></label>
                        <div class="input-group"><?= icon('lock') ?><input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" aria-describedby="pw-hint">
                            <button class="icon-btn pw-toggle" type="button" data-pw-toggle aria-label="Afficher le mot de passe" aria-pressed="false"><?= icon('eye') ?></button></div>
                        <span class="hint" id="pw-hint">8 caractères min., lettres et chiffres.</span>
                        <?= error_for('password') ?>
                    </div>
                    <div class="field">
                        <label for="password_confirmation">Confirmation <span class="req">*</span></label>
                        <input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password">
                    </div>
                    <?php if ($role === 'candidate'): ?>
                        <div class="field span-2">
                            <label for="school_code">Code établissement <span class="muted">(facultatif)</span></label>
                            <input id="school_code" name="school_code" value="<?= e(old('school_code')) ?>" placeholder="Ex. ISNG2026" style="text-transform:uppercase">
                            <span class="hint">Ton école te l'a peut-être donné : il lui permet de t'accompagner dans ta recherche de stage.</span>
                        </div>
                    <?php endif; ?>
                    <div class="span-2 stack-sm">
                        <label class="check <?= $f('terms') ?>"><input type="checkbox" name="terms" value="1" required> <span>J'accepte les conditions d'utilisation et la <a href="<?= e(url('/confidentialite')) ?>" target="_blank">politique de confidentialité</a>. <span class="req">*</span></span></label>
                        <?= error_for('terms') ?>
                        <label class="check"><input type="checkbox" name="consent_sms" value="1"> <span>Recevoir mes alertes importantes par SMS / WhatsApp</span></label>
                        <label class="check"><input type="checkbox" name="consent_marketing" value="1"> <span>Recevoir les conseils et actualités Tremplin</span></label>
                    </div>
                </div>
                <button class="btn btn-cta btn-lg btn-block mt-3" type="submit">Créer mon compte gratuitement <?= icon('arrow-right') ?></button>
            </form>
        </div>
    </div>
</div>
