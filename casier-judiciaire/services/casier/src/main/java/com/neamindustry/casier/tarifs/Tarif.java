package com.neamindustry.casier.tarifs;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Ligne du référentiel des tarifs.
 *
 * @param acte        code de l'acte, par exemple {@code BULLETIN_N3}
 * @param profil      code du profil de demandeur, par exemple {@code GABONAIS_NE_AU_GABON}
 * @param provisoire  vrai tant que le barème n'est pas fixé par un texte : le portail affiche « tarif provisoire »
 * @param source      origine du montant (texte, barème proposé…)
 */
public record Tarif(UUID id, String acte, String profil, long montantFcfa, LocalDate dateEffet, Statut statut,
                    boolean provisoire, String libelle, String source, String proposePar, String validePar) {

    public enum Statut { PROPOSE, VALIDE, REJETE }
}
