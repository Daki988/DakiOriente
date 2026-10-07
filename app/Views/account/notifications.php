<?php $icons = ['interview' => 'calendar', 'job_match' => 'target', 'status' => 'eye', 'payment' => 'wallet', 'application' => 'send', 'message' => 'message-square', 'moderation' => 'shield-check', 'security' => 'lock', 'welcome' => 'sparkles', 'reminder' => 'bell', 'internship' => 'school', 'broadcast' => 'send', 'invite' => 'user-plus']; ?>
<div class="page-head">
    <div><h1>Notifications</h1><p>Tes alertes, rappels et messages, au même endroit.</p></div>
    <form method="post" action="<?= e(url('/notifications/lire')) ?>"><?= csrf_field() ?><button class="btn btn-ghost" type="submit"><?= icon('check') ?> Tout marquer comme lu</button></form>
</div>
<?php if (!$items): ?>
    <?= App\Core\View::partial('partials/empty', ['icon' => 'bell', 'heading' => 'Tout est calme pour l\'instant', 'text' => 'Tu seras prévenu·e ici dès qu\'une offre compatible sort ou qu\'un recruteur avance sur ta candidature.']) ?>
<?php else: ?>
    <div class="card"><ul class="list">
        <?php foreach ($items as $n): ?>
            <li class="notif <?= $n['read_at'] ? '' : 'unread' ?>">
                <a class="list-link" href="<?= e(url($n['link'] ?: '/notifications')) ?>">
                    <span class="ni"><?= icon($icons[$n['type']] ?? 'bell') ?></span>
                    <span class="grow"><b style="color:var(--navy);font-size:.93rem"><?= e($n['title']) ?></b><?php if ($n['body']): ?><br><small class="muted"><?= e($n['body']) ?></small><?php endif; ?></span>
                    <small class="muted nowrap"><?= e(time_ago($n['created_at'])) ?></small>
                </a>
            </li>
        <?php endforeach; ?>
    </ul></div>
<?php endif; ?>
