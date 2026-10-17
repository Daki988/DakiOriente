package com.neamindustry.casier.bulletins;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.TypeBulletin;
import com.neamindustry.casier.commun.TypeMention;

/**
 * Instantané du contenu d'un bulletin (BUL-02) : il ne change plus après émission.
 *
 * @param etatDuCasierAu date et heure de l'état du casier reflété (RG-05)
 * @param versionRegles  version du jeu de règles appliqué (RG-04)
 * @param referenceRegles référence et statut du jeu de règles (« fictif — à valider » en démonstration)
 */
public record ContenuBulletin(TypeBulletin type, Instant etatDuCasierAu, IdentiteSurBulletin identite,
                              List<Ligne> condamnations, int versionRegles, String referenceRegles) {

    public ContenuBulletin {
        condamnations = List.copyOf(condamnations);
    }

    public boolean neant() {
        return condamnations.isEmpty();
    }

    /** Condamnation reproduite sur le bulletin. */
    public record Ligne(String juridiction, LocalDate dateDecision, String numeroDecision, String infraction,
                        List<Peine> peines, List<MentionPortee> mentions) {
    }

    public record MentionPortee(TypeMention type, LocalDate date) {
    }
}
