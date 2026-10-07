<section class="section">
    <div class="container" style="max-width:520px">
        <h1 style="font-size:2rem">Mot de passe oublié</h1>
        <p class="muted">Ça arrive à tout le monde. Indique ton adresse e-mail et nous t'envoyons tout de suite un lien pour en choisir un nouveau.</p>
        <form method="post" action="<?= e(url('/mot-de-passe-oublie')) ?>" class="card card-lg stack">
            <?= csrf_field() ?>
            <div class="field"><label for="email">E-mail</label><input id="email" name="email" type="email" required autocomplete="email"></div>
            <button class="btn btn-primary btn-block" type="submit">Envoyer le lien</button>
        </form>
        <p class="mt-2"><a href="<?= e(url('/connexion')) ?>"><?= icon('chevron-left') ?> Retour à la connexion</a></p>
    </div>
</section>
