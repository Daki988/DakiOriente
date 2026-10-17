package com.neamindustry.casier.demandes;

import java.time.Instant;
import java.util.List;

/** PUB-07 : statut détaillé et frise d'état, sans aucune information sur le contenu du casier (NOT-01). */
public record SuiviDemande(String numeroDossier, StatutDemande statut, String libelle, Instant echeance,
                           String numeroBulletin, List<Etape> frise) {

    public record Etape(Instant horodatage, StatutDemande statut, String libelle) {
    }
}
