package com.neamindustry.casier.registre;

import java.util.List;
import java.util.UUID;

/**
 * Fiche de casier d'une personne : condamnations validées en vigueur et motifs de blocage éventuels.
 *
 * @param motifsBlocage raisons pour lesquelles aucun bulletin ne peut être émis sans agent (RG-07)
 */
public record FicheCasier(UUID personneId, IdentitePersonne identite, List<CondamnationEnregistree> condamnations,
                          List<String> motifsBlocage) {

    public FicheCasier {
        condamnations = List.copyOf(condamnations);
        motifsBlocage = List.copyOf(motifsBlocage);
    }

    public boolean bloquee() {
        return !motifsBlocage.isEmpty();
    }
}
