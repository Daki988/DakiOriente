/**
 * Gestion pénitentiaire : registre des écrous, situation pénale et date de libération prévisible, mouvements (transferts,
 * extractions, permissions) autorisés par une autre personne que le demandeur, libérations, tableau de bord. L'agent n'agit
 * que sur son établissement ; la direction de l'administration pénitentiaire voit l'ensemble. Tout est journalisé ; rien
 * n'est supprimé.
 */
@ApplicationModule(displayName = "Pénitentiaire")
package com.neamindustry.casier.penitentiaire;

import org.springframework.modulith.ApplicationModule;
