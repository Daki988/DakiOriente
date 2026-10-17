package com.neamindustry.casier.demandes;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * DSH-05 : ligne de la file de travail du casier, avec compte à rebours des 24 heures.
 *
 * @param alerte vrai quand le délai restant passe sous le seuil d'alerte (DSH-16)
 */
public record DossierAgent(UUID id, String numeroDossier, StatutDemande statut, IdentiteDeclaree identite,
                           ProfilDemandeur profil, String motif, String explicationRapprochement, Instant echeance,
                           Duration restant, boolean alerte, boolean enRetard) {
}
