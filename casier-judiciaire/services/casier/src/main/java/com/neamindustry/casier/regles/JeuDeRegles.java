package com.neamindustry.casier.regles;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Version d'un jeu de paramètres juridiques et son cycle de validation (ADM-05). */
public record JeuDeRegles(UUID id, int version, LocalDate dateEffet, Statut statut, String proposePar,
                          Instant proposeLe, String validePar, Instant valideLe, String motifRejet, boolean fictif,
                          ReglesBulletins contenu, List<CasDeTest> casDeTest) {

    public enum Statut { PROPOSE, PUBLIE, REJETE }
}
