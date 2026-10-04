<?php $st = application_statuses(); ?>
<nav class="breadcrumb"><a href="<?= e(url('/entreprise/offres/' . $a['job_id'] . '/candidatures')) ?>"><?= icon('chevron-left') ?> Pipeline · <?= e($a['title']) ?></a></nav>
<div class="page-head">
    <div class="flex"><span class="avatar avatar-lg" style="background:<?= e(avatar_color($a['email'])) ?>"><?= e(initials($a['first_name'], $a['last_name'])) ?></span>
        <div><h1 style="font-size:1.6rem"><?= e($a['first_name'] . ' ' . $a['last_name']) ?></h1><p><?= e($p['headline']) ?> · <?= e($p['city_name']) ?> · candidature <?= e(time_ago($a['created_at'])) ?></p></div></div>
    <div class="flex flex-wrap"><?= status_badge($a['status']) ?></div>
</div>

<div class="layout-aside">
    <div class="stack">
        <section class="card card-lg" style="border-color:#dfe9fb;background:linear-gradient(180deg,#f5f9ff,#fff)">
            <h2 style="font-size:1.05rem"><?= icon('sparkles') ?> Synthèse du profil</h2>
            <p class="mb-0"><?= e($summary) ?></p>
            <p class="small muted mt-1 mb-0"><?= icon('info') ?> Aide à la décision générée automatiquement — la décision finale vous appartient.</p>
        </section>

        <section class="card card-lg">
            <div class="flex flex-wrap between">
                <h2 style="font-size:1.15rem"><?= icon('user') ?> Coordonnées</h2>
                <div class="flex flex-wrap small"><span><?= icon('mail') ?> <a href="mailto:<?= e($a['email']) ?>"><?= e($a['email']) ?></a></span><?php if ($a['phone']): ?><span><?= icon('phone') ?> <a href="tel:<?= e(str_replace(' ', '', $a['phone'])) ?>"><?= e($a['phone']) ?></a></span><?php endif; ?></div>
            </div>
            <?php if ($a['cover_letter']): ?><h3 class="mt-2">Lettre de motivation</h3><div style="white-space:pre-line;background:var(--bg);border-radius:14px;padding:16px;font-size:.93rem"><?= e($a['cover_letter']) ?></div><?php endif; ?>
            <?php if ($docs): ?><h3 class="mt-2">Documents</h3><ul class="list"><?php foreach ($docs as $d): ?><li><?= icon('file-text') ?><a class="grow" href="<?= e(url('/documents/' . $d['id'])) ?>"><?= e($d['original_name']) ?></a></li><?php endforeach; ?></ul><?php endif; ?>
        </section>

        <details class="card card-lg" open>
            <summary style="cursor:pointer"><h2 style="font-size:1.15rem;display:inline"><?= icon('file-text') ?> CV du candidat</h2></summary>
            <div class="mt-2" style="background:#e9eef7;border-radius:16px;padding:12px;overflow:hidden"><?= App\Core\View::partial('candidate/_cv', ['p' => $p, 'template' => $p['cv_template']]) ?></div>
        </details>

        <section class="card card-lg">
            <h2 style="font-size:1.15rem"><?= icon('message-square') ?> Messages</h2>
            <div class="stack-sm">
                <?php if (!$messages): ?><p class="small muted">Aucun échange.</p><?php endif; ?>
                <?php foreach ($messages as $m): $mine = $m['role'] === 'company'; ?>
                    <div style="max-width:85%;<?= $mine ? 'margin-left:auto;background:var(--sky)' : 'background:var(--bg)' ?>;border-radius:14px;padding:10px 14px"><small class="muted"><b><?= e($m['first_name']) ?></b> · <?= e(time_ago($m['created_at'])) ?></small><div style="white-space:pre-line"><?= e($m['body']) ?></div></div>
                <?php endforeach; ?>
            </div>
            <form method="post" action="<?= e(url('/messages/' . $a['id'])) ?>" class="flex mt-2" style="align-items:flex-end"><?= csrf_field() ?><div class="field grow"><label class="sr-only" for="msg">Message</label><textarea id="msg" name="body" required maxlength="2000" style="min-height:60px" placeholder="Écrire au candidat…"></textarea></div><button class="btn btn-primary" type="submit" aria-label="Envoyer"><?= icon('send') ?></button></form>
        </section>
    </div>

    <aside class="stack">
        <form method="post" action="<?= e(url('/entreprise/candidatures/' . $a['id'] . '/statut')) ?>" class="card stack-sm">
            <?= csrf_field() ?>
            <h3 class="mb-0">Décision</h3>
            <div class="field"><label for="status">Étape</label><select id="status" name="status"><?php foreach ($st as $k => [$l]): if ($k === 'draft') continue; ?><option value="<?= $k ?>" <?= $a['status'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
            <div class="field"><label for="note">Note (historique)</label><input id="note" name="note" maxlength="255"></div>
            <button class="btn btn-primary btn-block" type="submit">Mettre à jour et notifier</button>
        </form>

        <div class="card card-lg"><?= App\Core\View::partial('partials/match_explain', ['match' => $match]) ?></div>

        <form method="post" action="<?= e(url('/entreprise/candidatures/' . $a['id'] . '/entretien')) ?>" class="card stack-sm">
            <?= csrf_field() ?>
            <h3 class="mb-0"><?= icon('calendar') ?> Inviter en entretien</h3>
            <?php foreach ($interviews as $i): ?><div class="alert alert-info small"><?= icon('calendar') ?><div><b><?= e(date_fr($i['scheduled_at'], true)) ?></b> · <?= e($i['location']) ?></div></div><?php endforeach; ?>
            <div class="flex"><div class="field grow"><label for="i-date">Date</label><input id="i-date" name="date" type="date" required min="<?= date('Y-m-d') ?>"></div><div class="field" style="width:120px"><label for="i-time">Heure</label><input id="i-time" name="time" type="time" required value="10:00"></div></div>
            <div class="field"><label for="i-mode">Format</label><select id="i-mode" name="mode"><option value="presentiel">Présentiel</option><option value="visio">Visioconférence</option><option value="telephone">Téléphone</option></select></div>
            <div class="field"><label for="i-loc">Lieu ou lien</label><input id="i-loc" name="location" required maxlength="255"></div>
            <div class="field"><label for="i-note">Consignes</label><textarea id="i-note" name="note" style="min-height:70px"></textarea></div>
            <button class="btn btn-cta btn-block" type="submit">Envoyer l'invitation</button>
        </form>

        <form method="post" action="<?= e(url('/entreprise/candidatures/' . $a['id'] . '/notes')) ?>" class="card stack-sm">
            <?= csrf_field() ?>
            <h3 class="mb-0"><?= icon('lock') ?> Notes internes</h3>
            <fieldset><legend class="sr-only">Évaluation</legend><div class="range-row"><?php for ($r = 1; $r <= 5; $r++): ?><label class="choice"><input type="radio" name="rating" value="<?= $r ?>" <?= (int)$a['rating'] === $r ? 'checked' : '' ?>><span><?= $r ?>★</span></label><?php endfor; ?></div></fieldset>
            <div class="field"><label class="sr-only" for="notes">Notes</label><textarea id="notes" name="notes" placeholder="Visible uniquement par votre équipe"><?= e($a['recruiter_notes']) ?></textarea></div>
            <button class="btn btn-soft btn-block" type="submit">Enregistrer</button>
        </form>

        <section class="card">
            <h3>Historique</h3>
            <ul class="timeline"><?php foreach ($events as $ev): ?><li><span class="dot done"></span><b><?= e($st[$ev['status']][0] ?? $ev['status']) ?></b><span><?= e(date_fr($ev['created_at'], true)) ?><?= $ev['first_name'] ? ' · ' . e($ev['first_name']) : '' ?><?= $ev['note'] ? ' — ' . e($ev['note']) : '' ?></span></li><?php endforeach; ?></ul>
        </section>
        <?php if ($others): ?>
            <section class="card"><h3>Autres candidats</h3><ul class="list"><?php foreach ($others as $o): ?><li><a class="list-link" href="<?= e(url('/entreprise/candidatures/' . $o['id'])) ?>"><span class="grow small"><?= e($o['first_name'] . ' ' . $o['last_name']) ?></span><span class="badge badge-blue"><?= (int)$o['match_score'] ?> %</span></a></li><?php endforeach; ?></ul></section>
        <?php endif; ?>
    </aside>
</div>
