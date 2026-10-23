package com.neamindustry.casier.demandes;

import java.time.Instant;
import java.util.List;

/**
 * Suivi d'un dossier de bout en bout, pour la direction centrale et l'audit : chaque étape avec sa date, la fonction de
 * son auteur (jamais son nom) et le temps écoulé depuis le dépôt.
 *
 * @param delaiDelivranceMinutes temps entre le paiement et la délivrance du bulletin, si délivré
 */
public record ParcoursDossier(String numeroDossier, StatutDemande statut, ProfilDemandeur profil, Instant deposeLe, Instant payeLe,
                              String moyenPaiement, long montantFcfa, String bulletinNumero, Long delaiDelivranceMinutes,
                              List<Etape> etapes) {

    /**
     * @param phase   DEMANDE, PAIEMENT, TRAITEMENT, DELIVRANCE, IMPRESSION ou AUTRE
     * @param minutes minutes écoulées depuis le dépôt du dossier
     */
    public record Etape(Instant horodatage, String phase, String action, String libelle, String acteur, String precision, long minutes) {
    }
}
