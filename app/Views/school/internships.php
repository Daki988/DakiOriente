<?php $ist = internship_statuses(); ?>
<div class="page-head"><div><h1>Suivi des stages</h1><p>Recherche → candidature → placement → convention → stage → fin.</p></div>
    <?php if ($without): ?>
        <form method="post" action="<?= e(url('/ecole/stages')) ?>" class="flex"><?= csrf_field() ?><label class="sr-only" for="wu">Étudiant</label><select id="wu" name="user_id" class="input"><?php foreach ($without as $w): ?><option value="<?= (int)$w['id'] ?>"><?= e($w['first_name'] . ' ' . $w['last_name']) ?></option><?php endforeach; ?></select><button class="btn btn-primary" type="submit"><?= icon('plus') ?> Suivre</button></form>
    <?php endif; ?>
</div>
<div class="kanban">
    <?php foreach ($columns as $status => $cards): ?>
        <section class="col" aria-label="<?= e($ist[$status][0]) ?>">
            <div class="col-head"><span><?= e($ist[$status][0]) ?></span><span class="badge badge-<?= $ist[$status][1] ?>"><?= count($cards) ?></span></div>
            <?php foreach ($cards as $i): ?>
                <details class="k-card" style="cursor:default">
                    <summary style="list-style:none;cursor:pointer">
                        <div class="name"><?= e($i['first_name'] . ' ' . $i['last_name']) ?></div>
                        <small class="muted"><?= e($i['program'] ?: '') ?><?= $i['company_name'] ? ' · ' . e($i['company_name']) : '' ?></small>
                        <?php if ($i['start_date']): ?><br><small class="muted"><?= icon('calendar') ?> <?= e(date_fr($i['start_date'])) ?> → <?= e(date_fr($i['end_date'])) ?></small><?php endif; ?>
                        <?php if ($i['agreement_signed']): ?><br><span class="badge badge-green mt-1"><?= icon('check') ?> Convention</span><?php endif; ?>
                    </summary>
                    <form method="post" action="<?= e(url('/ecole/stages/' . $i['id'])) ?>" class="stack-sm mt-1">
                        <?= csrf_field() ?>
                        <select name="status" class="input" aria-label="Statut"><?php foreach ($ist as $k => [$l]): ?><option value="<?= $k ?>" <?= $i['status'] === $k ? 'selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
                        <input name="company_name" class="input" value="<?= e($i['company_name']) ?>" placeholder="Entreprise" aria-label="Entreprise">
                        <input name="tutor" class="input" value="<?= e($i['tutor']) ?>" placeholder="Tuteur" aria-label="Tuteur">
                        <div class="flex" style="gap:6px"><input type="date" name="start_date" class="input" value="<?= e($i['start_date']) ?>" aria-label="Début"><input type="date" name="end_date" class="input" value="<?= e($i['end_date']) ?>" aria-label="Fin"></div>
                        <label class="check small"><input type="checkbox" name="agreement_signed" value="1" <?= $i['agreement_signed'] ? 'checked' : '' ?>> Convention signée</label>
                        <button class="btn btn-soft btn-sm" type="submit">Enregistrer</button>
                    </form>
                </details>
            <?php endforeach; ?>
        </section>
    <?php endforeach; ?>
</div>
