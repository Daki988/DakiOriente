<?php $ist = internship_statuses(); ?>
<div class="page-head"><div><h1>Étudiants</h1><p><?= count($students) ?> étudiant(s) rattaché(s) avec le code <b><?= e($s['join_code']) ?></b>.</p></div></div>
<div class="layout-aside">
    <div>
        <form method="get" class="flex mb-2"><label class="sr-only" for="sq">Rechercher</label><input id="sq" name="q" class="input" value="<?= e($q) ?>" placeholder="Nom, filière…"><button class="btn btn-primary" type="submit"><?= icon('search') ?></button></form>
        <?php if (!$students): ?>
            <?= App\Core\View::partial('partials/empty', ['icon' => 'users', 'heading' => 'Vos étudiants arrivent', 'text' => 'Partagez votre code établissement ou invitez-les par e-mail : dès leur inscription, vous suivez leur recherche de stage ici.']) ?>
        <?php else: ?>
            <div class="table-wrap"><table class="table">
                <thead><tr><th>Étudiant</th><th>Filière</th><th>Employabilité</th><th>Candidatures</th><th>Stage</th><th>Insertion</th></tr></thead>
                <tbody><?php foreach ($students as $st): ?>
                    <tr>
                        <td><div class="flex"><span class="avatar avatar-sm" style="background:<?= e(avatar_color($st['email'])) ?>"><?= e(initials($st['first_name'], $st['last_name'])) ?></span><div><b><?= e($st['first_name'] . ' ' . $st['last_name']) ?></b><br><small class="muted"><?= e($st['email']) ?></small></div></div></td>
                        <td class="small"><?= e($st['program'] ?: '—') ?><br><span class="muted"><?= e($st['level']) ?> · <?= e($st['cohort']) ?></span></td>
                        <td><span class="badge badge-<?= (int)$st['employability_score'] >= 60 ? 'green' : 'amber' ?>"><?= (int)$st['employability_score'] ?>/100</span><br><small class="muted">profil <?= (int)$st['completion'] ?> %</small></td>
                        <td class="tabular"><?= (int)$st['apps'] ?></td>
                        <td><?php if ($st['internship_status']): [$l, $c] = $ist[$st['internship_status']]; ?><span class="badge badge-<?= $c ?>"><?= e($l) ?></span><?php else: ?>—<?php endif; ?></td>
                        <td>
                            <form method="post" action="<?= e(url('/ecole/etudiants/' . $st['uid'])) ?>" class="flex flex-wrap" style="gap:6px">
                                <?= csrf_field() ?>
                                <input type="hidden" name="program" value="<?= e($st['program']) ?>"><input type="hidden" name="level" value="<?= e($st['level']) ?>">
                                <label class="check small"><input type="checkbox" name="graduated" value="1" <?= $st['graduated'] ? 'checked' : '' ?>> Diplômé·e</label>
                                <label class="check small"><input type="checkbox" name="employed" value="1" <?= $st['employed'] ? 'checked' : '' ?>> En emploi</label>
                                <button class="btn btn-ghost btn-sm" type="submit" aria-label="Enregistrer"><?= icon('check') ?></button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?></tbody>
            </table></div>
        <?php endif; ?>
    </div>
    <aside>
        <form method="post" action="<?= e(url('/ecole/etudiants/inviter')) ?>" class="card card-lg stack-sm">
            <?= csrf_field() ?>
            <h3><?= icon('user-plus') ?> Inviter des étudiants</h3>
            <p class="small muted">Collez une liste d'adresses e-mail (séparées par des virgules ou des retours à la ligne). Chacun reçoit votre code établissement.</p>
            <div class="field"><label class="sr-only" for="emails">E-mails</label><textarea id="emails" name="emails" placeholder="etudiant1@mail.ga, etudiant2@mail.ga"></textarea></div>
            <button class="btn btn-primary btn-block" type="submit"><?= icon('send') ?> Envoyer les invitations</button>
        </form>
    </aside>
</div>
