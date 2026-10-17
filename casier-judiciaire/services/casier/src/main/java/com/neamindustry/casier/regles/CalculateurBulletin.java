package com.neamindustry.casier.regles;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Sursis;
import com.neamindustry.casier.commun.TypeBulletin;
import com.neamindustry.casier.commun.TypeMention;

/**
 * Calcul pur du contenu d'un bulletin à partir d'un jeu de règles (RG-04). Sans état ni accès aux données :
 * c'est cette fonction que les cas de test d'un jeu de règles exercent avant publication (ADM-05).
 */
public final class CalculateurBulletin {

    private CalculateurBulletin() {
    }

    public static ResultatCalcul calculer(ReglesBulletins regles, int version, TypeBulletin type,
                                          List<CondamnationPourCalcul> condamnations, LocalDate date) {
        RegleBulletin regle = regles.regle(type);
        List<String> retenues = new ArrayList<>();
        List<ResultatCalcul.Exclusion> exclusions = new ArrayList<>();
        List<String> effacementsAValider = new ArrayList<>();

        for (CondamnationPourCalcul c : condamnations) {
            String motif = motifExclusion(regles, regle, c, date, effacementsAValider);
            if (motif == null) {
                retenues.add(c.reference());
            } else {
                exclusions.add(new ResultatCalcul.Exclusion(c.reference(), motif));
            }
        }
        return new ResultatCalcul(type, version, retenues, exclusions, effacementsAValider);
    }

    private static String motifExclusion(ReglesBulletins regles, RegleBulletin regle, CondamnationPourCalcul c,
                                         LocalDate date, List<String> effacementsAValider) {
        if (c.dateDecision().isAfter(date)) {
            return "Décision postérieure à la date de l'état du casier";
        }
        if (c.porteMentionAvant(TypeMention.EFFACEMENT, date)) {
            return "Condamnation effacée (RG-11)";
        }
        Integer delai = regles.delaiEffacementAnnees().get(c.qualification());
        if (delai != null && !c.dateDecision().plusYears(delai).isAfter(date)) {
            if (regles.effacementAutomatique()) {
                return "Délai d'effacement de " + delai + " ans atteint (RG-11)";
            }
            effacementsAValider.add(c.reference());
        }
        if (!c.definitive() && !regle.inclureNonDefinitives()) {
            return "Décision non définitive";
        }
        if (!regle.qualifications().contains(c.qualification())) {
            return "Qualification " + c.qualification() + " non retenue pour ce bulletin";
        }
        if (regle.exclureApresRehabilitation() && c.porteMentionAvant(TypeMention.REHABILITATION, date)) {
            return "Réhabilitation";
        }
        if (regle.exclureApresAmnistie() && c.porteMentionAvant(TypeMention.AMNISTIE, date)) {
            return "Amnistie";
        }
        boolean sursisRevoque = c.porteMentionAvant(TypeMention.REVOCATION_SURSIS, date);
        boolean unePeineRetenue = c.peines().stream().anyMatch(p -> peineRetenue(regle, c, p, sursisRevoque, date));
        return unePeineRetenue ? null : "Aucune peine retenue pour ce bulletin (nature ou sursis)";
    }

    private static boolean peineRetenue(RegleBulletin regle, CondamnationPourCalcul c, Peine p, boolean sursisRevoque,
                                        LocalDate date) {
        if (!regle.natures().contains(p.nature())) {
            return false;
        }
        if (p.sursis() == Sursis.AUCUN || sursisRevoque) {
            return true;
        }
        if (p.sursis() == Sursis.TOTAL && !regle.inclureSursisTotal()) {
            return false;
        }
        Integer apres = regle.sursisExcluApresAnnees();
        return apres == null || c.dateDecision().plusYears(apres).isAfter(date);
    }
}
