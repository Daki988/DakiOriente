package com.neamindustry.casier.regles;

import static com.neamindustry.casier.commun.NaturePeine.*;
import static com.neamindustry.casier.commun.Qualification.*;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Qualification;
import com.neamindustry.casier.commun.Sursis;
import com.neamindustry.casier.commun.TypeBulletin;
import com.neamindustry.casier.commun.TypeMention;

/**
 * Jeu de règles FICTIF pour les tests : il illustre les mécanismes du moteur et ne préjuge pas
 * du contenu légal des bulletins, qui reste à valider avec un magistrat (section 3, section 30).
 */
public final class ReglesFictives {

    private ReglesFictives() {
    }

    public static ReglesBulletins contenu(boolean effacementAutomatique) {
        return new ReglesBulletins("FICTIF — tests du moteur, sans valeur juridique",
                Map.of(TypeBulletin.B3, new RegleBulletin(EnumSet.of(CRIME, DELIT), EnumSet.of(EMPRISONNEMENT),
                        false, false, 5, true, true)),
                Map.of(CONTRAVENTION, 3, DELIT, 10, CRIME, 20),
                effacementAutomatique,
                Map.of(TypeBulletin.B3, 90));
    }

    public static Peine prison(int mois, Sursis sursis) {
        return new Peine(EMPRISONNEMENT, mois, null, sursis, sursis == Sursis.PARTIEL ? mois / 2 : null);
    }

    public static Peine amende(long fcfa) {
        return new Peine(AMENDE, null, fcfa, Sursis.AUCUN, null);
    }

    public static CondamnationPourCalcul condamnation(String ref, LocalDate date, Qualification q, List<Peine> peines,
                                                      CondamnationPourCalcul.Mention... mentions) {
        return new CondamnationPourCalcul(ref, date, q, peines, true, List.of(mentions));
    }

    public static CondamnationPourCalcul.Mention mention(TypeMention type, LocalDate date) {
        return new CondamnationPourCalcul.Mention(type, date);
    }
}
