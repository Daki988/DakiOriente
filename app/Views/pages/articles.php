<section class="hero" style="padding:32px 0">
    <div class="container">
        <span class="eyebrow">Conseils carrière</span>
        <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">Les clés pour décrocher ton stage ou ton emploi</h1>
        <p class="muted" style="max-width:640px">CV, entretien, marché de l'emploi au Gabon : des conseils concrets, testés sur le terrain par l'équipe NEAM. Lis-les avant de postuler, ils font souvent la différence.</p>
    </div>
</section>
<section class="section-sm">
    <div class="container grid-3">
        <?php foreach ($articles as $a): ?><?= App\Core\View::partial('pages/_article_card', ['a' => $a]) ?><?php endforeach; ?>
    </div>
</section>
