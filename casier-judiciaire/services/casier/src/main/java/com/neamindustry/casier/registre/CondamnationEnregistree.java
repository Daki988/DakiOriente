package com.neamindustry.casier.registre;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Qualification;

/** Condamnation telle qu'inscrite au registre, avec ses mentions. */
public record CondamnationEnregistree(UUID id, UUID personneId, int version, UUID remplaceId, String juridiction,
                                      LocalDate dateDecision, String numeroDecision, String infraction,
                                      Qualification qualification, List<Peine> peines, LocalDate dateDefinitive,
                                      String referencePieceSource, StatutInscription statut, String saisiePar,
                                      Instant saisieLe, String valideePar, Instant valideeLe,
                                      List<MentionEnregistree> mentions) {

    public CondamnationEnregistree {
        peines = List.copyOf(peines);
        mentions = mentions == null ? List.of() : List.copyOf(mentions);
    }

    public boolean definitive() {
        return dateDefinitive != null;
    }
}
