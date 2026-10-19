/**
 * Réclamations des usagers : paiement, bulletin non reçu, erreur sur le casier. Le support (R11) les prend en charge et
 * y répond ; l'usager suit la réponse dans son espace. Chaque étape est journalisée ; rien n'est supprimé.
 */
@ApplicationModule(displayName = "Réclamations")
package com.neamindustry.casier.reclamations;

import org.springframework.modulith.ApplicationModule;
