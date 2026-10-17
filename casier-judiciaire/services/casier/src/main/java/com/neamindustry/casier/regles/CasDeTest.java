package com.neamindustry.casier.regles;

import java.time.LocalDate;
import java.util.List;

import com.neamindustry.casier.commun.TypeBulletin;

/**
 * Cas de test joint à un jeu de règles : sans succès de tous les cas, pas de publication (ADM-05).
 * Les cas sont fournis par les greffiers, sur des données anonymisées ou fictives (section 25).
 */
public record CasDeTest(String libelle, TypeBulletin type, LocalDate dateCalcul,
                        List<CondamnationPourCalcul> condamnations, List<String> retenuesAttendues) {

    public CasDeTest {
        condamnations = List.copyOf(condamnations);
        retenuesAttendues = List.copyOf(retenuesAttendues);
    }
}
