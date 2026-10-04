<?php
$st = application_statuses();
$flow = ['sent', 'viewed', 'shortlisted', 'interview', 'accepted'];
$reached = array_column($events, 'status');
?>
<nav class="breadcrumb"><a href="<?= e(url('/espace/candidatures')) ?>"><?= icon('chevron-left') ?> Mes candidatures</a></nav>
<div class="page-head">
    <div class="flex"><span class="logo-box" style="--s:56px;background:<?= e($a['company_color']) ?>"><?= e(mb_strtoupper(mb_substr($a['company_name'], 0, 2))) ?></span><div><h1 style="font-size:1.6rem"><?= e($a['title']) ?></h1><p><?= e($a['company_name']) ?> · <?= e($a['city_name']) ?> · envoyée <?= e(time_ago($a['created_at'])) ?></p></div></div>
    <div><?= status_badge($a['status']) ?></div>
</div>
<div class="layout-aside">
    <div class="stack">
        <section class="card card-lg">
            <h2 style="font-size:1.15rem">Avancement</h2>
            <ul class="timeline mt-2">
                <?php foreach ($flow as $s):
                    $ev = array_values(array_filter($events, fn($e) => $e['status'] === $s))[0] ?? null;
                    if ($a['status'] === 'rejected' && !$ev) continue; ?>
                    <li><span class="dot <?= $ev ? 'done' : '' ?>"></span><b><?= e($st[$s][0]) ?></b><span><?= $ev ? e(date_fr($ev['created_at'], true)) : 'À venir' ?></span></li>
                <?php endforeach; ?>
                <?php if ($a['status'] === 'rejected'): ?><li><span class="dot" style="border-color:var(--red);background:var(--red)"></span><b>Non retenue</b><span>Ne te décourage pas : chaque candidature te rapproche du bon poste.</span></li><?php endif; ?>
            </ul>
            <?php if ($a['status'] === 'rejected'): ?>
                <div class="alert alert-info mt-2"><?= icon('lightbulb') ?><div>Regarde les écarts identifiés à droite : ils t'indiquent quoi renforcer pour la prochaine fois.</div></div>
            <?php elseif ($a['status'] === 'accepted'): ?>
                <div class="alert alert-success mt-2"><?= icon('trophy') ?><div><b>Félicitations !</b> Le recruteur va te contacter pour la suite. Pense à mettre à jour ton profil avec cette nouvelle expérience.</div></div>
            <?php endif; ?>
        </section>

        <?php foreach ($interviews as $i): ?>
            <section class="card card-navy">
                <h3><?= icon('calendar') ?> Entretien programmé</h3>
                <p style="font-size:1.1rem;color:#fff;margin-bottom:4px"><b><?= e(date_fr($i['scheduled_at'], true)) ?></b></p>
                <p class="mb-1"><?= icon($i['mode'] === 'visio' ? 'globe' : 'map-pin') ?> <?= e($i['mode'] === 'visio' ? 'Visioconférence' : ($i['mode'] === 'telephone' ? 'Téléphone' : 'Présentiel')) ?> — <?= e($i['location']) ?></p>
                <?php if ($i['note']): ?><p class="small mb-2"><?= e($i['note']) ?></p><?php endif; ?>
                <a class="btn btn-cta btn-sm" href="<?= e(url('/espace/entretien?job=' . $a['job_id'])) ?>"><?= icon('mic') ?> Simuler cet entretien</a>
            </section>
        <?php endforeach; ?>

        <section class="card card-lg">
            <h2 style="font-size:1.15rem"><?= icon('message-square') ?> Échanges avec le recruteur</h2>
            <div class="stack-sm mt-2">
                <?php if (!$messages): ?><p class="small muted">Aucun message pour l'instant.</p><?php endif; ?>
                <?php foreach ($messages as $m): $mine = (int)$m['sender_id'] === (int)user()['id']; ?>
                    <div style="max-width:85%;<?= $mine ? 'margin-left:auto;background:var(--sky)' : 'background:var(--bg)' ?>;border-radius:14px;padding:10px 14px">
                        <small class="muted"><b><?= e($mine ? 'Moi' : $m['first_name'] . ' (' . $a['company_name'] . ')') ?></b> · <?= e(time_ago($m['created_at'])) ?></small>
                        <div style="white-space:pre-line"><?= e($m['body']) ?></div>
                    </div>
                <?php endforeach; ?>
            </div>
            <form method="post" action="<?= e(url('/messages/' . $a['id'])) ?>" class="flex mt-2" style="align-items:flex-end">
                <?= csrf_field() ?>
                <div class="field grow"><label class="sr-only" for="msg">Message</label><textarea id="msg" name="body" required maxlength="2000" style="min-height:60px" placeholder="Écrire un message poli et concis…"></textarea></div>
                <button class="btn btn-primary" type="submit" aria-label="Envoyer"><?= icon('send') ?></button>
            </form>
        </section>

        <?php if ($a['cover_letter']): ?>
            <details class="faq"><summary>Ma lettre de motivation</summary><div style="white-space:pre-line" class="small"><?= e($a['cover_letter']) ?></div></details>
        <?php endif; ?>

        <div class="flex flex-wrap">
            <form method="post" action="<?= e(url('/espace/candidatures/' . $a['id'] . '/rappel')) ?>"><?= csrf_field() ?><button class="btn btn-ghost" type="submit"><?= icon('bell') ?> Me rappeler de relancer dans 7 jours</button></form>
            <?php if (in_array($a['status'], ['sent', 'viewed'], true)): ?>
                <form method="post" action="<?= e(url('/espace/candidatures/' . $a['id'] . '/retirer')) ?>" data-confirm="Retirer cette candidature ? Le recruteur ne la verra plus."><?= csrf_field() ?><button class="btn btn-danger" type="submit"><?= icon('x') ?> Retirer ma candidature</button></form>
            <?php endif; ?>
            <a class="btn btn-ghost" href="<?= e(url('/offres/' . $a['job_id'])) ?>"><?= icon('eye') ?> Voir l'offre</a>
        </div>
    </div>
    <aside><div class="card card-lg"><?= App\Core\View::partial('partials/match_explain', ['match' => $match, 'showActions' => true]) ?></div></aside>
</div>
