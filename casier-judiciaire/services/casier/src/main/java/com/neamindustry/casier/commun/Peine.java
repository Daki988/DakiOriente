package com.neamindustry.casier.commun;

import java.util.Objects;

/**
 * Peine prononcée par une décision.
 *
 * @param nature          nature de la peine
 * @param dureeMois       durée pour une peine privative de liberté ou un travail d'intérêt général, sinon {@code null}
 * @param montantFcfa     montant pour une amende, sinon {@code null}
 * @param sursis          modalité de sursis
 * @param dureeSursisMois partie assortie du sursis lorsque le sursis est partiel
 */
public record Peine(NaturePeine nature, Integer dureeMois, Long montantFcfa, Sursis sursis, Integer dureeSursisMois) {

    public Peine {
        Objects.requireNonNull(nature, "nature");
        sursis = sursis == null ? Sursis.AUCUN : sursis;
    }

    /** Forme canonique stable, utilisée pour les empreintes (REG-09). */
    public String canonique() {
        return nature + ":" + valeur(dureeMois) + ":" + valeur(montantFcfa) + ":" + sursis + ":" + valeur(dureeSursisMois);
    }

    private static String valeur(Object o) {
        return o == null ? "" : o.toString();
    }
}
