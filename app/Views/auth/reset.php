<section class="section">
    <div class="container" style="max-width:520px">
        <h1 style="font-size:2rem">Nouveau mot de passe</h1>
        <form method="post" action="<?= e(url('/reinitialiser/' . $token)) ?>" class="card card-lg stack">
            <?= csrf_field() ?>
            <div class="field"><label for="password">Nouveau mot de passe</label><input id="password" name="password" type="password" required minlength="8" autocomplete="new-password"><span class="hint">8 caractères min., lettres et chiffres.</span><?= error_for('password') ?></div>
            <div class="field"><label for="password_confirmation">Confirmation</label><input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password"></div>
            <button class="btn btn-primary btn-block" type="submit">Enregistrer</button>
        </form>
    </div>
</section>
