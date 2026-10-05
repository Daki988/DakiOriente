<div class="page-head"><div><h1>Diffusion ciblée d'offres</h1><p>Recommandez une opportunité à vos étudiants. Une offre conseillée par leur école a plus de chances d'être lue, et de déboucher sur une candidature.</p></div></div>
<form method="post" action="<?= e(url('/ecole/diffusion')) ?>" class="card card-lg stack" style="max-width:760px">
    <?= csrf_field() ?>
    <div class="field"><label for="job_id">Offre à diffuser *</label><select id="job_id" name="job_id" required><option value="">Choisir…</option><?php foreach ($jobs as $j): ?><option value="<?= (int)$j['id'] ?>"><?= e($j['title'] . ' — ' . $j['company_name'] . ' (' . (job_types()[$j['type']] ?? '') . ')') ?></option><?php endforeach; ?></select></div>
    <div class="field"><label for="program">Filière ciblée</label><select id="program" name="program"><option value="">Tous les étudiants</option><?php foreach ($programs as $p): ?><option><?= e($p) ?></option><?php endforeach; ?></select></div>
    <div class="field"><label for="message">Message d'accompagnement</label><textarea id="message" name="message" maxlength="300" placeholder="Ex. Opportunité idéale pour les L3 : date limite vendredi !"></textarea></div>
    <div><button class="btn btn-cta" type="submit"><?= icon('send') ?> Diffuser</button></div>
</form>
