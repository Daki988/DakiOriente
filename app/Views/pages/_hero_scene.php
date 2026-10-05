<?php /** @var bool $compact  @var string|null $photo */ ?>
<div class="scene">
    <?php if ($compact): ?>
        <span class="blob blob-blue" style="right:-30px;top:10px;width:62%;height:92%;opacity:.95"></span>
        <span class="blob blob-sun" style="right:46%;bottom:6px;width:90px;height:90px;transform:rotate(25deg)"></span>
        <span class="blob blob-sky" style="right:30%;top:0;width:60px;height:60px"></span>
        <p class="hand-note" style="left:20px;top:22px;font-size:1.45rem">Mon avenir<br>commence ici !</p>
        <svg style="position:absolute;left:120px;top:84px;width:52px;height:40px;color:var(--navy)" viewBox="0 0 52 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 4c10 18 26 26 44 24"/><path d="M38 20l8 8-10 4"/></svg>
        <?php if ($photo): ?>
            <img class="hero-cutout" src="<?= e($photo) ?>" alt="" width="820" height="731" style="right:0;bottom:0;width:68%" fetchpriority="high">
        <?php else: ?>
            <div class="hero-app" style="right:22px;top:26px;width:200px;padding:14px">
                <div class="flex" style="gap:10px"><span class="avatar avatar-sm" style="background:#f59e0b">G</span><div style="line-height:1.2"><b style="font-size:.85rem;color:var(--navy)">Grâce M.</b><br><small class="muted" style="font-size:.7rem">Licence Informatique</small></div></div>
                <div class="flex mt-1" style="gap:10px"><div class="ring ring-sm high" style="--p:81"><b>81</b></div><small style="font-size:.72rem;font-weight:700;color:var(--navy);line-height:1.2">Score<br>d'employabilité</small></div>
                <div class="mt-1" style="font-size:.7rem;font-weight:700;color:var(--muted)">Profil complété à 100 %</div>
                <div class="bar mt-1"><i style="width:100%"></i></div>
            </div>
        <?php endif; ?>
        <div class="float-card" style="left:16px;bottom:18px;font-size:.78rem;padding:9px 12px">
            <span class="ib" style="width:32px;height:32px"><?= icon('target') ?></span>
            <span>96 % de match<br><small class="muted">Stage Dév Web</small></span>
        </div>
    <?php else: ?>
        <span class="blob blob-blue" style="right:2%;top:6%;width:74%;height:86%"></span>
        <span class="blob blob-sky" style="right:58%;top:0;width:120px;height:120px;opacity:.9"></span>
        <span class="blob blob-sun" style="left:6%;bottom:10%;width:150px;height:150px;transform:rotate(30deg)"></span>
        <span class="blob blob-sun" style="right:-2%;bottom:28%;width:70px;height:120px;transform:rotate(-20deg);opacity:.95"></span>
        <span class="blob blob-blue" style="left:-2%;bottom:24%;width:110px;height:180px;transform:rotate(-35deg);opacity:.85"></span>

        <p class="hand-note" style="left:0;top:0">Mon avenir<br>commence ici !</p>
        <svg style="position:absolute;left:30%;top:9%;width:64px;height:54px;color:var(--navy)" viewBox="0 0 64 54" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 4c8 24 26 38 52 38"/><path d="M46 32l10 10-13 5"/></svg>
        <svg style="position:absolute;left:0;top:22%;width:44px;height:44px;color:var(--yellow)" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M22 4v10"/><path d="M6 14l8 6"/><path d="M38 14l-8 6"/></svg>

        <?php if ($photo): ?>
            <img class="hero-cutout" src="<?= e($photo) ?>" alt="" width="820" height="731" style="right:1%;bottom:0;width:90%" fetchpriority="high">
        <?php else: ?>
            <div class="hero-app" style="left:8%;top:24%;width:300px">
                <div class="flex" style="gap:12px">
                    <span class="avatar avatar-lg" style="background:linear-gradient(135deg,#ffb020,#ff7a00)">G</span>
                    <div class="grow" style="line-height:1.25"><b style="color:var(--navy)">Grâce Moussavou</b><br><small class="muted">Étudiante · Libreville</small><br><span class="badge badge-green mt-1"><?= icon('badge-check') ?> Profil vérifié</span></div>
                </div>
                <div class="flex mt-2" style="gap:14px;background:var(--bg);border-radius:14px;padding:12px">
                    <div class="ring high" style="--p:81"><b>81</b></div>
                    <div style="line-height:1.3"><b style="color:var(--navy);font-size:.92rem">Score d'employabilité</b><br><small class="muted">+19 pts en 2 mois</small></div>
                </div>
                <div class="tags mt-2"><span class="tag ok">PHP</span><span class="tag ok">SQL</span><span class="tag ok">HTML / CSS</span><span class="tag miss">+ Git</span></div>
            </div>
        <?php endif; ?>

        <div class="float-card" style="right:0;top:<?= $photo ? '2%' : '6%' ?>"><span class="ib"><?= icon('badge-check') ?></span><span>Offres vérifiées<br>par NEAM</span></div>
        <div class="float-card" style="<?= $photo ? 'left:-4%;top:36%' : 'right:-1%;top:27%' ?>;animation-delay:-2s"><span class="ib" style="background:var(--navy)"><?= icon('gauge') ?></span><span>Score de<br>compatibilité expliqué</span></div>

        <div class="hero-app" style="<?= $photo ? 'left:-5%;bottom:9%;width:270px' : 'right:2%;bottom:4%;width:330px' ?>;padding:14px 16px;animation:floaty 7s ease-in-out infinite;animation-delay:-3s;z-index:2">
            <div class="flex" style="gap:12px">
                <span class="logo-box" style="--s:42px;background:#0057ff">OT</span>
                <div class="grow" style="line-height:1.25;min-width:0"><b style="color:var(--navy);font-size:.9rem">Stage Développeur·se Web</b><br><small class="muted">OkoumeTech · Libreville</small></div>
                <div class="ring ring-sm high" style="--p:96"><b>96</b></div>
            </div>
            <div class="flex mt-1" style="justify-content:space-between"><span class="badge badge-green">Excellent match</span><span class="btn btn-cta btn-sm" style="min-height:30px">Postuler <?= icon('arrow-right') ?></span></div>
        </div>
    <?php endif; ?>
</div>
