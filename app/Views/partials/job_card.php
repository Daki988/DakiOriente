<?php
/** @var array $job  @var array|null $match  @var bool $isFav */
$match ??= null;
$isFav ??= false;
$types = job_types();
$logo = mb_strtoupper(mb_substr($job['company_name'], 0, 1) . (preg_match('/\s(\S)/u', $job['company_name'], $mm) ? $mm[1] : ''));
?>
<article class="job-card <?= !empty($job['featured']) ? 'featured' : '' ?>">
    <span class="logo-box" style="background:<?= e($job['company_color'] ?? '#0057ff') ?>" aria-hidden="true"><?= e($logo) ?></span>
    <div class="body">
        <div class="flex flex-wrap" style="gap:6px;margin-bottom:6px">
            <span class="badge badge-blue"><?= e($types[$job['type']] ?? $job['type']) ?></span>
            <?php if (!empty($job['featured'])): ?><span class="badge badge-yellow"><?= icon('star') ?> À la une</span><?php endif; ?>
            <?php if ((int)$job['remote'] === 2): ?><span class="badge badge-violet">100 % télétravail</span><?php elseif ((int)$job['remote'] === 1): ?><span class="badge badge-sky">Hybride</span><?php endif; ?>
        </div>
        <h3><a href="<?= e(url('/offres/' . $job['id'])) ?>"><?= e($job['title']) ?></a></h3>
        <div class="muted small" style="font-weight:600"><?= e($job['company_name']) ?><?php if (($job['company_status'] ?? '') === 'verified'): ?> <span title="Entreprise vérifiée" style="color:var(--blue)"><?= icon('badge-check') ?></span><?php endif; ?></div>
        <div class="meta">
            <span><?= icon('map-pin') ?><?= e($job['city_name'] ?? '—') ?></span>
            <?php if ($job['salary_max']): ?><span><?= icon('wallet') ?><?= e(money((int)$job['salary_min'], false)) ?>–<?= e(money((int)$job['salary_max'])) ?></span><?php endif; ?>
            <?php if ($job['duration']): ?><span><?= icon('clock') ?><?= e($job['duration']) ?></span><?php endif; ?>
            <span><?= icon('calendar') ?><?= e(time_ago($job['published_at'])) ?></span>
        </div>
        <?php if (!empty($job['summary'])): ?><p class="small muted mb-0"><?= e(excerpt($job['summary'], 120)) ?></p><?php endif; ?>
    </div>
    <div class="side">
        <?php if ($match): ?>
            <div class="text-center">
                <div class="ring ring-sm <?= score_class($match['score']) ?>" style="--p:<?= (int)$match['score'] ?>" role="img" aria-label="Compatibilité <?= (int)$match['score'] ?> %"><b><?= (int)$match['score'] ?><small>%</small></b></div>
                <div class="ring-label">match</div>
            </div>
        <?php endif; ?>
        <?php if (user() && user()['role'] === 'candidate'): ?>
            <form class="fav" method="post" action="<?= e(url('/offres/' . $job['id'] . '/favori')) ?>" data-fav>
                <?= csrf_field() ?>
                <button type="submit" class="fav-btn <?= $isFav ? 'on' : '' ?>" aria-pressed="<?= $isFav ? 'true' : 'false' ?>" aria-label="<?= $isFav ? 'Retirer des favoris' : 'Ajouter aux favoris' ?>"><?= icon('heart') ?></button>
            </form>
        <?php endif; ?>
    </div>
</article>
