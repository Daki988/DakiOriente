package com.neamindustry.casier.demandes;

import java.util.Map;

/** DSH-07, DSH-08 : indicateurs agrégés des demandes, sans donnée nominative (DON-09). */
public record IndicateursDemandes(Map<String, Long> parStatut, long total, long delivrees, long delivreesAutomatiquement,
                                  Double delaiMoyenHeures, long enRetard, long recettesFcfa, Satisfaction satisfaction) {

    /** Avis des usagers : note moyenne sur 5 et nombre d'avis. */
    public record Satisfaction(Double noteMoyenne, long nombreAvis) {
    }
}
