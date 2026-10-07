<?php
declare(strict_types=1);

namespace App\Services\Training;

/**
 * Source automatique de formations. Chaque élément produit :
 * ['external_id', 'title', 'url', 'language' (fr|en), 'partner', 'duration', 'certificate' (gratuit|payant|aucun),
 *  'description', 'next_session' (Y-m-d|null)]
 */
interface Connector
{
    public function platform(): string;

    /** @return iterable<array> */
    public function fetch(?callable $progress = null): iterable;
}
