<?php
declare(strict_types=1);

namespace App\Services\Ai;

/** Fournisseur de génération de texte (remplaçable sans toucher au produit — cahier des charges §14). */
interface AiProvider
{
    public function name(): string;

    /** Retourne le texte généré, ou null si le fournisseur ne peut pas répondre (le service bascule alors en local). */
    public function complete(string $system, string $prompt, int $maxTokens = 2000): ?string;
}
