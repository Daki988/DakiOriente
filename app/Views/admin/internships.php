<?php
/** @var array $offers @var array $sources @var array $searches @var array $countries @var array $stats @var string $country @var string $show @var array $cfg @var bool $claude */
use App\Services\Internship\OfferWatch;

$names = array_column($countries, 'name', 'code');
$links = ['ok' => ['Lien joignable', 'green'], 'protege' => ['Page protégée', 'amber'], 'non_controle' => ['Non contrôlé', 'gray'], 'mort' => ['Page supprimée', 'red']];
?>
<div class="page-head"><div>
    <h1>Veille des stages</h1>
    <p>Offres de stage réelles publiées hors de Tremplin, utilisées pour préparer les candidats. Seules les sources vérifiées ci-dessous sont interrogées ; chaque offre est contrôlée (présence dans les résultats de recherche, source du pays, stage, date, lien).</p>
</div></div>

<div class="kpi-row mb-3">
    <div class="card"><small class="muted">Offres utilisées</small><b style="font-size:1.6rem;display:block"><?= $stats['offers'] ?></b></div>
    <div class="card"><small class="muted">Offres retirées</small><b style="font-size:1.6rem;display:block"><?= $stats['hidden'] ?></b></div>
    <div class="card"><small class="muted">Recherches en ligne</small><b style="font-size:1.6rem;display:block"><?= $stats['searches'] ?></b></div>
    <div class="card"><small class="muted">Bilans candidats</small><b style="font-size:1.6rem;display:block"><?= $stats['reviews'] ?></b><small class="muted"><?= $stats['candidates'] ?> candidat(s)</small></div>
</div>

<?php if (!$claude): ?><div class="alert alert-warning mb-3"><?= icon('info') ?><div class="small">Claude n'est pas activé : la recherche en ligne est indisponible. Les offres peuvent être ajoutées à la main (formulaire plus bas), avec les mêmes contrôles. La recherche web doit aussi être autorisée dans la console Anthropic de l'organisation.</div></div><?php endif; ?>

<section class="card card-lg mb-3" id="sources">
    <div class="card-title"><h2 style="font-size:1.15rem"><?= icon('shield-check') ?> Sources vérifiées</h2></div>
    <p class="small muted">Vérifie chaque site avant de l'ajouter : offres nominatives d'employeurs identifiés, site actif, aucun paiement demandé aux candidats. La recherche est limitée au domaine et à ses sous-domaines.</p>
    <div class="table-wrap" style="overflow-x:auto"><table class="table small" style="min-width:680px">
        <thead><tr><th>Source</th><th>Domaine</th><th>Type</th><th>Pays</th><th>Offres</th><th>Vérifiée</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($sources as $s): ?>
            <tr class="<?= (int)$s['active'] ? '' : 'muted' ?>">
                <td><b><?= e($s['name']) ?></b><?php if ($s['note']): ?><br><span class="muted"><?= e($s['note']) ?></span><?php endif; ?></td>
                <td><?php if ($s['url']): ?><a href="<?= e($s['url']) ?>" target="_blank" rel="noopener noreferrer"><?= e($s['domain']) ?></a><?php else: ?><?= e($s['domain']) ?><?php endif; ?></td>
                <td><?= e(OfferWatch::KINDS[$s['kind']] ?? $s['kind']) ?></td>
                <td><?= e($s['countries'] === '*' ? 'Tous' : $s['countries']) ?></td>
                <td><?= (int)$s['offers'] ?></td>
                <td><?= $s['verified_at'] ? e(date_fr($s['verified_at'])) : '—' ?></td>
                <td><form method="post" action="<?= e(url('/admin/veille-stages/sources/' . $s['id'] . '/statut')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit"><?= (int)$s['active'] ? 'Suspendre' : 'Réactiver' ?></button></form></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table></div>
    <details class="mt-2"><summary><b>Ajouter ou modifier une source</b></summary>
        <form method="post" action="<?= e(url('/admin/veille-stages/sources')) ?>" class="ext-offer-form mt-2"><?= csrf_field() ?>
            <div class="field"><label for="src-id">Source existante</label><select id="src-id" name="id"><option value="0">Nouvelle source</option><?php foreach ($sources as $s): ?><option value="<?= (int)$s['id'] ?>"><?= e($s['name']) ?></option><?php endforeach; ?></select></div>
            <div class="field"><label for="src-name">Nom</label><input id="src-name" name="name" required maxlength="120"></div>
            <div class="field"><label for="src-domain">Domaine</label><input id="src-domain" name="domain" required placeholder="jobartis.ga"></div>
            <div class="field"><label for="src-url">Page des offres</label><input id="src-url" name="url" type="url" placeholder="https://"></div>
            <div class="field"><label for="src-kind">Type</label><select id="src-kind" name="kind"><?php foreach (OfferWatch::KINDS as $k => $l): ?><option value="<?= $k ?>"><?= e($l) ?></option><?php endforeach; ?></select></div>
            <div class="field"><label for="src-c">Pays (codes, virgules ; * = tous)</label><input id="src-c" name="countries" value="GA"></div>
            <div class="field" style="grid-column:1/-1"><label for="src-note">Note de vérification</label><input id="src-note" name="note" maxlength="255" placeholder="Ce qui a été contrôlé"></div>
            <div><button class="btn btn-primary btn-sm" type="submit"><?= icon('check') ?> Enregistrer comme vérifiée</button></div>
        </form>
    </details>
</section>

<section class="card card-lg mb-3" id="recherches">
    <div class="card-title"><h2 style="font-size:1.15rem"><?= icon('search') ?> Recherches en ligne</h2></div>
    <?php if ($claude): ?>
    <form method="post" action="<?= e(url('/admin/veille-stages/rechercher')) ?>" class="flex flex-wrap mb-2" style="gap:8px;align-items:end"><?= csrf_field() ?>
        <div class="field" style="margin:0"><label for="s-c">Pays</label><select id="s-c" name="country_code"><?php foreach ($countries as $c): ?><option value="<?= e($c['code']) ?>" <?= $c['code'] === ($country ?: 'GA') ? 'selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach; ?></select></div>
        <div class="field grow" style="margin:0"><label for="s-q">Stage</label><input id="s-q" name="q" required maxlength="160" placeholder="Ex. : comptabilité"></div>
        <label class="small"><input type="checkbox" name="force" value="1"> Ignorer le cache</label>
        <button class="btn btn-soft btn-sm" type="submit"><?= icon('search') ?> Lancer la recherche</button>
    </form>
    <?php endif; ?>
    <?php if (!$searches): ?><p class="small muted mb-0">Aucune recherche pour l'instant.</p><?php else: ?>
    <div class="table-wrap" style="overflow-x:auto"><table class="table small" style="min-width:680px">
        <thead><tr><th>Date</th><th>Pays</th><th>Stage</th><th>Résultat</th><th>Écartées</th></tr></thead>
        <tbody>
        <?php foreach ($searches as $s): $rej = json_decode((string)$s['rejected'], true) ?: []; ?>
            <tr>
                <td><?= e(time_ago($s['created_at'])) ?></td><td><?= e($s['country_code']) ?></td><td><?= e($s['query']) ?></td>
                <td><span class="badge badge-<?= $s['status'] === 'ok' ? 'green' : 'amber' ?>"><?= e($s['status']) ?></span> <?= (int)$s['kept'] ?> retenue(s) sur <?= (int)$s['found'] ?> proposée(s)<?= $s['message'] ? '<br><span class="muted">' . e($s['message']) . '</span>' : '' ?></td>
                <td><?php if ($rej): ?><details><summary><?= count($rej) ?> motif(s)</summary><ul class="mb-0"><?php foreach ($rej as $r): ?><li><?= e($r['reason']) ?> — <?= e($r['title'] ?: $r['url']) ?></li><?php endforeach; ?></ul></details><?php else: ?>—<?php endif; ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table></div>
    <?php endif; ?>
</section>

<section class="card card-lg mb-3" id="offres">
    <div class="card-title flex flex-wrap" style="justify-content:space-between;gap:8px"><h2 style="font-size:1.15rem"><?= icon('briefcase-business') ?> Offres collectées</h2>
        <form method="get" action="<?= e(url('/admin/veille-stages')) ?>" class="flex" style="gap:6px">
            <select class="input" name="pays" aria-label="Pays"><option value="">Tous les pays</option><?php foreach ($countries as $c): ?><option value="<?= e($c['code']) ?>" <?= $c['code'] === $country ? 'selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach; ?></select>
            <select class="input" name="voir" aria-label="Affichage"><option value="visibles">Utilisées</option><option value="masquees" <?= $show === 'masquees' ? 'selected' : '' ?>>Retirées</option></select>
            <button class="btn btn-ghost btn-sm" type="submit"><?= icon('filter') ?></button>
        </form>
    </div>
    <?php if (!$offers): ?><p class="small muted mb-0">Aucune offre.</p><?php else: ?>
    <div class="table-wrap" style="overflow-x:auto"><table class="table small" style="min-width:680px">
        <thead><tr><th>Offre</th><th>Source</th><th>Date</th><th>Lien</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($offers as $o): [$ll, $lc] = $links[$o['link_status']] ?? ['—', 'gray']; ?>
            <tr>
                <td><a href="<?= e($o['url']) ?>" target="_blank" rel="noopener noreferrer"><b><?= e($o['title']) ?></b></a><br><span class="muted"><?= e(implode(' · ', array_filter([$o['organization'], $o['city'], $names[$o['country_code']] ?? $o['country_code'], $o['provider'] === 'manuel' ? 'saisie manuelle' : 'recherche Claude']))) ?></span>
                    <?php if ($o['hidden_reason']): ?><br><span class="badge badge-gray"><?= e($o['hidden_reason']) ?></span><?php endif; ?></td>
                <td><?= e($o['source_name'] ?? '—') ?></td>
                <td><?= $o['published_at'] ? e(date_fr($o['published_at'])) : '—' ?><?= $o['deadline'] ? '<br><span class="muted">limite : ' . e(date_fr($o['deadline'])) . '</span>' : '' ?><br><span class="muted"><?= e((OfferWatch::STATUSES[$o['offer_status']] ?? ['—'])[0]) ?></span></td>
                <td><span class="badge badge-<?= $lc ?>"><?= e($ll) ?></span><br><span class="muted"><?= $o['checked_at'] ? e(time_ago($o['checked_at'])) : '' ?></span></td>
                <td class="flex" style="gap:4px">
                    <form method="post" action="<?= e(url('/admin/veille-stages/offres/' . $o['id'] . '/verifier')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit" title="Revérifier le lien"><?= icon('refresh-cw') ?></button></form>
                    <form method="post" action="<?= e(url('/admin/veille-stages/offres/' . $o['id'] . '/masquer')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-sm" type="submit"><?= (int)$o['hidden'] ? 'Réutiliser' : 'Retirer' ?></button></form>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table></div>
    <?php endif; ?>
</section>

<section class="card card-lg mb-3" id="ajout">
    <h2 style="font-size:1.15rem"><?= icon('plus') ?> Ajouter une offre réelle</h2>
    <p class="small muted">Pour une annonce repérée par l'équipe sur une source vérifiée. Copie les informations telles qu'elles figurent dans l'annonce ; laisse vide ce qui n'y est pas.</p>
    <form method="post" action="<?= e(url('/admin/veille-stages/offres')) ?>" class="ext-offer-form"><?= csrf_field() ?>
        <div class="field" style="grid-column:1/-1"><label for="o-url">Adresse de l'annonce</label><input id="o-url" name="url" type="url" required placeholder="https://"></div>
        <div class="field"><label for="o-title">Intitulé exact</label><input id="o-title" name="title" required maxlength="190"></div>
        <div class="field"><label for="o-org">Employeur</label><input id="o-org" name="organization" maxlength="160"></div>
        <div class="field"><label for="o-country">Pays</label><select id="o-country" name="country_code"><?php foreach ($countries as $c): ?><option value="<?= e($c['code']) ?>"><?= e($c['name']) ?></option><?php endforeach; ?></select></div>
        <div class="field"><label for="o-city">Ville</label><input id="o-city" name="city" maxlength="100"></div>
        <div class="field"><label for="o-pub">Date de publication</label><input id="o-pub" name="published" type="date"></div>
        <div class="field"><label for="o-dl">Date limite de candidature</label><input id="o-dl" name="deadline" type="date"></div>
        <div class="field"><label for="o-st">Statut</label><select id="o-st" name="status"><?php foreach (OfferWatch::STATUSES as $k => [$l]): ?><option value="<?= $k ?>"><?= e($l) ?></option><?php endforeach; ?></select></div>
        <div class="field"><label for="o-edu">Niveau d'études demandé</label><input id="o-edu" name="education" placeholder="Bac+3 en comptabilité"></div>
        <div class="field"><label for="o-dur">Durée</label><input id="o-dur" name="duration" placeholder="6 mois"></div>
        <div class="field"><label for="o-sk">Compétences demandées (virgules)</label><input id="o-sk" name="skills"></div>
        <div class="field"><label for="o-lg">Langues (virgules)</label><input id="o-lg" name="languages" placeholder="Français, Anglais"></div>
        <div class="field"><label for="o-q">Recherche associée</label><input id="o-q" name="query" placeholder="Ex. : comptabilité (sinon l'intitulé)"></div>
        <div class="field" style="grid-column:1/-1"><label for="o-sum">Missions (résumé fidèle)</label><textarea id="o-sum" name="summary" rows="2" maxlength="600"></textarea></div>
        <div><button class="btn btn-primary btn-sm" type="submit"><?= icon('check') ?> Contrôler et ajouter</button></div>
    </form>
</section>

<section class="card card-lg" id="reglages">
    <h2 style="font-size:1.15rem"><?= icon('sliders-horizontal') ?> Réglages</h2>
    <form method="post" action="<?= e(url('/admin/veille-stages/reglages')) ?>" class="ext-offer-form"><?= csrf_field() ?>
        <div class="field"><label for="r-age">Ancienneté maximale d'une offre datée (jours)</label><input id="r-age" type="number" name="max_age_days" min="30" max="730" value="<?= (int)$cfg['max_age_days'] ?>"></div>
        <div class="field"><label for="r-cache">Délai avant de relancer une même recherche (jours)</label><input id="r-cache" type="number" name="cache_days" min="1" max="60" value="<?= (int)$cfg['cache_days'] ?>"></div>
        <div class="field"><label for="r-max">Offres retenues au plus par recherche</label><input id="r-max" type="number" name="max_offers" min="3" max="15" value="<?= (int)$cfg['max_offers'] ?>"></div>
        <div class="field"><label for="r-cap">Niveau de compétence attendu d'un stagiaire (1 à 4)</label><input id="r-cap" type="number" name="level_cap" min="1" max="4" value="<?= (int)$cfg['level_cap'] ?>"></div>
        <div><button class="btn btn-primary btn-sm" type="submit">Enregistrer</button></div>
    </form>
</section>
