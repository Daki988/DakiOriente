package com.neamindustry.casier.preplaintes;

import java.time.LocalDate;

/**
 * Déclaration saisie par la victime.
 *
 * @param service service de police ou de gendarmerie choisi pour signer la plainte
 */
public record NouvellePreplainte(NaturePreplainte nature, LocalDate dateFaits, String heureFaits, String ville, String lieu,
                                 String description, boolean auteurConnu, String auteurInfos, String biens, Long prejudiceFcfa,
                                 Declarant declarant, String service) {

    /** Identité et coordonnées du déclarant ; {@code entreprise} renseignée s'il agit pour une personne morale. */
    public record Declarant(String nom, String prenoms, LocalDate dateNaissance, String telephone, String email, String adresse,
                            String entreprise) {
    }
}
