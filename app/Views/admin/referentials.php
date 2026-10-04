<?php
$labels = ['name' => 'Nom', 'category' => 'Catégorie', 'aliases' => 'Synonymes (virgules)', 'icon' => 'Icône', 'country_id' => 'Pays', 'code' => 'Code ISO', 'currency' => 'Devise', 'phone_prefix' => 'Indicatif', 'riasec' => 'Code RIASEC', 'sector_id' => 'Secteur', 'skills' => 'Compétences', 'education_min' => 'Niveau min. (0-7)', 'outlook' => 'Débouchés', 'title' => 'Titre', 'provider' => 'Organisme', 'skill_id' => 'Compétence', 'duration' => 'Durée', 'price' => 'Prix (FCFA)', 'format' => 'Format'];
$fields = $refs[$tab][1];
?>
<div class="page-head"><div><h1>Référentiels</h1><p>Données paramétrables multi-pays : compétences, métiers, secteurs, villes, pays, formations.</p></div></div>
<nav class="tabs mb-3"><?php foreach ($refs as $k => [$l]): ?><a class="<?= $tab === $k ? 'active' : '' ?>" href="<?= e(url('/admin/referentiels', ['tab' => $k])) ?>"><?= e($l) ?></a><?php endforeach; ?></nav>
<div class="layout-aside">
    <div class="table-wrap"><table class="table">
        <thead><tr><?php foreach ($fields as $f): ?><th><?= e($labels[$f] ?? $f) ?></th><?php endforeach; ?><?php if ($tab === 'skills'): ?><th>Profils</th><?php endif; ?><th></th></tr></thead>
        <tbody><?php foreach ($rows as $r): ?>
            <tr>
                <?php foreach ($fields as $f):
                    $val = match ($f) { 'country_id' => $r['country_name'] ?? $r[$f], 'sector_id' => $r['sector_name'] ?? $r[$f], 'skill_id' => $r['skill_name'] ?? $r[$f], 'price' => money((int)$r[$f]), default => $r[$f] ?? '' }; ?>
                    <td class="small"><?= e(excerpt((string)$val, 60)) ?></td>
                <?php endforeach; ?>
                <?php if ($tab === 'skills'): ?><td class="tabular small"><?= (int)$r['used'] ?></td><?php endif; ?>
                <td><form method="post" action="<?= e(url('/admin/referentiels/supprimer')) ?>" data-confirm="Supprimer cet élément ?"><?= csrf_field() ?><input type="hidden" name="tab" value="<?= e($tab) ?>"><input type="hidden" name="id" value="<?= (int)$r['id'] ?>"><button class="btn btn-ghost btn-icon btn-sm" type="submit" aria-label="Supprimer"><?= icon('trash-2') ?></button></form></td>
            </tr>
        <?php endforeach; ?></tbody>
    </table></div>
    <aside>
        <form method="post" action="<?= e(url('/admin/referentiels')) ?>" class="card card-lg stack-sm" style="position:sticky;top:90px">
            <?= csrf_field() ?><input type="hidden" name="tab" value="<?= e($tab) ?>">
            <h3>Ajouter — <?= e($refs[$tab][0]) ?></h3>
            <?php foreach ($fields as $f): ?>
                <div class="field"><label for="f-<?= $f ?>"><?= e($labels[$f] ?? $f) ?></label>
                    <?php if ($f === 'category'): ?><select id="f-<?= $f ?>" name="category"><option value="tech">Technique</option><option value="soft">Soft skill</option></select>
                    <?php elseif ($f === 'country_id'): ?><select id="f-<?= $f ?>" name="country_id"><?php foreach ($countries as $c): ?><option value="<?= (int)$c['id'] ?>"><?= e($c['name']) ?></option><?php endforeach; ?></select>
                    <?php elseif ($f === 'sector_id'): ?><select id="f-<?= $f ?>" name="sector_id"><?php foreach ($sectors as $c): ?><option value="<?= (int)$c['id'] ?>"><?= e($c['name']) ?></option><?php endforeach; ?></select>
                    <?php elseif ($f === 'skill_id'): ?><select id="f-<?= $f ?>" name="skill_id"><option value="">—</option><?php foreach ($skills as $c): ?><option value="<?= (int)$c['id'] ?>"><?= e($c['name']) ?></option><?php endforeach; ?></select>
                    <?php else: ?><input id="f-<?= $f ?>" name="<?= $f ?>"><?php endif; ?>
                </div>
            <?php endforeach; ?>
            <button class="btn btn-primary btn-block" type="submit"><?= icon('plus') ?> Ajouter</button>
        </form>
    </aside>
</div>
