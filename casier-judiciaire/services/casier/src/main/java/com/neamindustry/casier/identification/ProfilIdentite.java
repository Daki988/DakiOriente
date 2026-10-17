package com.neamindustry.casier.identification;

import java.time.LocalDate;
import java.util.List;

/**
 * Données d'identité comparées (IDT-01). Les champs inconnus valent {@code null} et ne pèsent pas dans le score.
 *
 * @param reference identifiant de la fiche (candidat) ou de la demande (demandeur)
 */
public record ProfilIdentite(String reference, String nom, String prenoms, LocalDate dateNaissance, String lieuNaissance,
                             String nomPere, String nomMere, String numeroCnie, String numeroPasseport,
                             List<String> alias) {

    public ProfilIdentite {
        alias = alias == null ? List.of() : List.copyOf(alias);
    }
}
