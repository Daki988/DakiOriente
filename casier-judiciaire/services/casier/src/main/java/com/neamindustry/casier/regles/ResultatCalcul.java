package com.neamindustry.casier.regles;

import java.util.List;

import com.neamindustry.casier.commun.TypeBulletin;

/**
 * Contenu calculé d'un bulletin, avec la justification de chaque exclusion (explicabilité).
 *
 * @param type                 type de bulletin
 * @param versionRegles        version du jeu de règles appliqué (traçabilité RG-04)
 * @param retenues             références des condamnations retenues
 * @param exclusions           condamnations écartées et motif
 * @param effacementsAValider  condamnations dont l'échéance d'effacement est atteinte mais non encore validée (RG-11)
 */
public record ResultatCalcul(TypeBulletin type, int versionRegles, List<String> retenues, List<Exclusion> exclusions,
                             List<String> effacementsAValider) {

    public ResultatCalcul {
        retenues = List.copyOf(retenues);
        exclusions = List.copyOf(exclusions);
        effacementsAValider = List.copyOf(effacementsAValider);
    }

    /** Bulletin « néant » : aucune condamnation retenue. */
    public boolean neant() {
        return retenues.isEmpty();
    }

    public record Exclusion(String reference, String motif) {
    }
}
