<div class="auth-wrap">
    <?= App\Core\View::partial('auth/_side', ['heading' => 'Content de te revoir !']) ?>
    <div class="auth-form">
        <div class="auth-card">
            <h1 style="font-size:2rem">Connexion</h1>
            <p class="muted">Tes offres compatibles t'attendent. Pas encore de compte ? <a href="<?= e(url('/inscription')) ?>">Inscris-toi gratuitement</a>, ça prend 2 minutes.</p>
            <form method="post" action="<?= e(url('/connexion')) ?>" class="card card-lg stack" novalidate>
                <?= csrf_field() ?>
                <div class="field <?= isset(errors()['login']) ? 'has-error' : '' ?>">
                    <label for="login">E-mail ou téléphone</label>
                    <div class="input-group"><?= icon('mail') ?><input id="login" name="login" type="text" inputmode="email" autocomplete="username" required value="<?= e(old('login')) ?>" aria-describedby="err-login"></div>
                    <?= error_for('login') ?>
                </div>
                <div class="field">
                    <div class="flex between"><label for="password">Mot de passe</label><a class="small" href="<?= e(url('/mot-de-passe-oublie')) ?>">Oublié ?</a></div>
                    <div class="input-group"><?= icon('lock') ?><input id="password" name="password" type="password" autocomplete="current-password" required>
                        <button class="icon-btn pw-toggle" type="button" data-pw-toggle aria-label="Afficher le mot de passe" aria-pressed="false"><?= icon('eye') ?></button></div>
                </div>
                <button class="btn btn-primary btn-lg btn-block" type="submit">Se connecter <?= icon('arrow-right') ?></button>
            </form>

            <?php if (config('app.demo')): ?>
                <div class="demo-box mt-3">
                    <b><?= icon('sparkles') ?> Comptes de démonstration</b>
                    <p class="muted small mb-1">Explore chaque espace en un clic (mot de passe : <span class="kbd">Tremplin2026!</span>)</p>
                    <div class="grid-2" style="gap:8px">
                        <?php foreach ([['candidat@tremplin.ga', 'Candidate · Grâce', 'user'], ['recruteur@tremplin.ga', 'Recruteur · OkoumeTech', 'building-2'], ['ecole@tremplin.ga', 'École · ISNG', 'school'], ['admin@tremplin.ga', 'Admin NEAM', 'shield-check']] as [$em, $lab, $ic]): ?>
                            <form method="post" action="<?= e(url('/connexion')) ?>">
                                <?= csrf_field() ?>
                                <input type="hidden" name="login" value="<?= e($em) ?>"><input type="hidden" name="password" value="Tremplin2026!">
                                <button type="submit" class="btn btn-ghost btn-sm btn-block"><?= icon($ic) ?> <?= e($lab) ?></button>
                            </form>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
