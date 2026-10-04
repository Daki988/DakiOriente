<?php [$l, $c] = ['published' => ['Publiée', 'green'], 'pending' => ['En modération', 'amber'], 'draft' => ['Brouillon', 'gray'], 'archived' => ['Archivée', 'gray'], 'rejected' => ['Refusée', 'red']][$s] ?? [$s, 'gray']; ?>
<span class="badge badge-<?= $c ?>"><?= e($l) ?></span>
