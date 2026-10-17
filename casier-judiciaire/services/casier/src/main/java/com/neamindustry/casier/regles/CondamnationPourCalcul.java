package com.neamindustry.casier.regles;

import java.time.LocalDate;
import java.util.List;

import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Qualification;
import com.neamindustry.casier.commun.TypeMention;

/**
 * Vue d'une condamnation validée, telle que le moteur en a besoin (couche anticorruption : indépendante du stockage du registre).
 *
 * @param reference     identifiant de la condamnation
 * @param dateDecision  date de la décision
 * @param qualification qualification de l'infraction
 * @param peines        peines prononcées
 * @param definitive    caractère définitif
 * @param mentions      mentions validées
 */
public record CondamnationPourCalcul(String reference, LocalDate dateDecision, Qualification qualification,
                                     List<Peine> peines, boolean definitive, List<Mention> mentions) {

    public CondamnationPourCalcul {
        peines = List.copyOf(peines);
        mentions = mentions == null ? List.of() : List.copyOf(mentions);
    }

    /** Mention validée, réduite à son type et sa date d'effet. */
    public record Mention(TypeMention type, LocalDate date) {
    }

    boolean porteMentionAvant(TypeMention type, LocalDate date) {
        return mentions.stream().anyMatch(m -> m.type() == type && !m.date().isAfter(date));
    }
}
