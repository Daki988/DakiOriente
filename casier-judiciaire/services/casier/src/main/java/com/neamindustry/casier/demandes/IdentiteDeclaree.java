package com.neamindustry.casier.demandes;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

/** Identité déclarée par le demandeur, à rapprocher du registre (IDT-01). */
public record IdentiteDeclaree(@NotBlank String nom, @NotBlank String prenoms, @NotNull @Past LocalDate dateNaissance,
                               @NotBlank String lieuNaissance, String paysNaissance, String nomPere, String nomMere,
                               String nationalite, String numeroCnie, String numeroPasseport) {
}
