<div class="page-head"><div><h1>Communications</h1><p>E-mails transactionnels, SMS et WhatsApp émis (pilote « <?= e(config('mail.driver')) ?> ») et journal des appels IA.</p></div></div>
<nav class="tabs mb-3"><?php foreach (['' => 'Tous', 'email' => 'E-mail', 'sms' => 'SMS', 'whatsapp' => 'WhatsApp'] as $k => $l): ?><a class="<?= (string)$channel === $k ? 'active' : '' ?>" href="<?= e(url('/admin/communications', ['canal' => $k])) ?>"><?= e($l) ?></a><?php endforeach; ?></nav>
<div class="layout-aside">
    <div class="table-wrap"><table class="table">
        <thead><tr><th>Canal</th><th>Destinataire</th><th>Message</th><th>Statut</th><th>Date</th></tr></thead>
        <tbody><?php foreach ($items as $o): ?>
            <tr><td><span class="badge badge-<?= ['email' => 'blue', 'sms' => 'amber', 'whatsapp' => 'green'][$o['channel']] ?? 'gray' ?>"><?= e($o['channel']) ?></span></td><td class="small"><?= e($o['recipient']) ?></td>
                <td class="small"><b><?= e($o['subject']) ?></b><br><span class="muted"><?= e(excerpt($o['body'], 110)) ?></span></td><td><span class="badge badge-gray"><?= e($o['status']) ?></span></td><td class="small nowrap"><?= e(time_ago($o['created_at'])) ?></td></tr>
        <?php endforeach; ?></tbody>
    </table></div>
    <aside class="card">
        <h3><?= icon('sparkles') ?> Journal IA</h3>
        <p class="small muted">Traçabilité des usages de l'assistant (cahier des charges §9).</p>
        <ul class="list small"><?php foreach ($ai as $a): ?><li><span class="grow"><b><?= e($a['feature']) ?></b> · <?= e($a['provider']) ?><br><span class="muted"><?= e($a['input_summary']) ?> · <?= e($a['first_name'] ?? '—') ?> · <?= e(time_ago($a['created_at'])) ?></span></span></li><?php endforeach; ?></ul>
    </aside>
</div>
