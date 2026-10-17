package com.neamindustry.casier.demandes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DSH-01 : demande vue par son auteur dans « Mon espace » : frise, bulletin téléchargeable, avis reçus.
 * Aucune information sur le contenu du casier.
 */
public record DemandeUsager(UUID id, String numeroDossier, StatutDemande statut, String libelle, Instant creeLe, Instant echeance,
                            long montantFcfa, boolean tarifProvisoire, UUID bulletinId, String bulletinNumero,
                            String pieceDemandee, String motifRejet, List<SuiviDemande.Etape> frise, List<Avis> avis) {

    /** Avis envoyé à l'usager (NOT-01 : un lien vers l'espace, jamais le bulletin). */
    public record Avis(Instant horodatage, String canal, String message) {
    }
}
