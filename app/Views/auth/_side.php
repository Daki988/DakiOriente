<aside class="auth-side">
    <span class="blob" style="right:-80px;top:-60px;width:320px;height:320px;background:rgba(255,255,255,.1)"></span>
    <span class="blob blob-sun" style="right:60px;bottom:-60px;width:200px;height:200px;opacity:.85"></span>
    <div style="position:relative;max-width:460px">
        <span class="footer-logo mb-3" style="display:inline-flex"><img src="<?= e(asset('img/logo.png')) ?>" alt="Tremplin by NEAM" width="80" height="60" style="height:60px"></span>
        <p class="hand" style="font-size:2rem;color:var(--yellow);margin:16px 0 0">Mon avenir commence ici !</p>
        <h2><?= e($heading ?? 'Transformer le potentiel en opportunités.') ?></h2>
        <ul class="explain-list mt-3" style="color:#fff">
            <li><?= icon('circle-check-big') ?><span>Des offres de stages et d'emplois vérifiées au Gabon</span></li>
            <li><?= icon('circle-check-big') ?><span>Un score de compatibilité clair pour chaque offre</span></li>
            <li><?= icon('circle-check-big') ?><span>CV, lettres et préparation d'entretien assistés par l'IA</span></li>
            <li><?= icon('circle-check-big') ?><span>Tes données protégées, jamais revendues</span></li>
        </ul>
    </div>
</aside>
