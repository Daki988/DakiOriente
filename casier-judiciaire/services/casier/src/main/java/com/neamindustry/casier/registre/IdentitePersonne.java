package com.neamindustry.casier.registre;

import java.time.LocalDate;
import java.util.List;

/** Identité de référence d'une personne inscrite (modèle « Personne », section 11). */
public record IdentitePersonne(String nom, String prenoms, LocalDate dateNaissance, String lieuNaissance,
                               String paysNaissance, String nomPere, String nomMere, List<String> nationalites,
                               String numeroCnie, String numeroPasseport, List<String> alias) {

    public IdentitePersonne {
        nationalites = nationalites == null ? List.of() : List.copyOf(nationalites);
        alias = alias == null ? List.of() : List.copyOf(alias);
    }
}
