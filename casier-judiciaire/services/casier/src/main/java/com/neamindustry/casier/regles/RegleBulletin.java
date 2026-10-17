package com.neamindustry.casier.regles;

import java.util.Set;

import com.neamindustry.casier.commun.NaturePeine;
import com.neamindustry.casier.commun.Qualification;

/**
 * Critères d'inscription d'une condamnation sur un type de bulletin. Valeurs à valider par un magistrat.
 *
 * @param qualifications             qualifications retenues
 * @param natures                    natures de peine retenues (une condamnation est retenue si l'une de ses peines l'est)
 * @param inclureNonDefinitives      retenir les décisions non encore définitives
 * @param inclureSursisTotal         retenir les peines entièrement assorties du sursis
 * @param sursisExcluApresAnnees     au-delà de ce délai depuis la décision, une peine avec sursis non révoqué n'est plus retenue ({@code null} : jamais)
 * @param exclureApresRehabilitation ne plus retenir une condamnation réhabilitée
 * @param exclureApresAmnistie       ne plus retenir une condamnation amnistiée
 */
public record RegleBulletin(Set<Qualification> qualifications, Set<NaturePeine> natures, boolean inclureNonDefinitives,
                            boolean inclureSursisTotal, Integer sursisExcluApresAnnees, boolean exclureApresRehabilitation,
                            boolean exclureApresAmnistie) {

    public RegleBulletin {
        qualifications = qualifications == null ? Set.of() : Set.copyOf(qualifications);
        natures = natures == null ? Set.of() : Set.copyOf(natures);
    }
}
