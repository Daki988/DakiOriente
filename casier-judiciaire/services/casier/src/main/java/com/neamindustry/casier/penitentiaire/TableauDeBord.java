package com.neamindustry.casier.penitentiaire;

import java.util.List;

/** Indicateurs de l'établissement de l'agent, ou de tous les établissements pour la direction. */
public record TableauDeBord(List<Occupation> etablissements, long prevenus, long condamnes, long liberationsSous30Jours,
                            long mouvementsAAutoriser, long mouvementsDuJour, long enDehors, List<Detenu> prochainesLiberations) {

    /** Population et taux d'occupation d'un établissement. */
    public record Occupation(String code, String nom, String ville, int capacite, long population, int tauxOccupation) {
    }
}
