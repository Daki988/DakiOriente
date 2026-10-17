package com.neamindustry.casier.audit;

/**
 * Résultat de la vérification de la chaîne (DSH-11 « intégrité du journal »).
 *
 * @param integre              vrai si toutes les empreintes sont cohérentes
 * @param entreesVerifiees     nombre d'entrées contrôlées
 * @param premiereAlteration   numéro de la première entrée altérée, sinon {@code null}
 */
public record ResultatIntegrite(boolean integre, long entreesVerifiees, Long premiereAlteration) {
}
