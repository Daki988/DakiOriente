<?php /** @var array $certificates  @var bool $recruiter */ $recruiter ??= false; ?>
<?php if ($certificates): ?>
    <ul class="list small">
        <?php foreach ($certificates as $c): ?>
            <li>
                <span class="ni" aria-hidden="true" style="color:var(--blue)"><?= icon('award') ?></span>
                <span class="grow"><b style="color:var(--navy)"><?= e($c['title']) ?></b><br><span class="muted"><?= e(implode(' · ', array_filter([$c['issuer'], $c['issued_at'] ? date_fr($c['issued_at']) : null]))) ?></span></span>
                <?php if ($c['status'] === 'verifie'): ?><span class="badge badge-green"><?= icon('badge-check') ?> Vérifié par NEAM</span><?php else: ?><span class="badge badge-sky">Déclaré</span><?php endif; ?>
                <?php if ($c['credential_url']): ?><a class="btn btn-ghost btn-sm" href="<?= e($c['credential_url']) ?>" target="_blank" rel="noopener noreferrer"><?= $recruiter ? 'Vérifier' : 'Voir' ?> <?= icon('external-link') ?></a><?php endif; ?>
            </li>
        <?php endforeach; ?>
    </ul>
<?php endif; ?>
