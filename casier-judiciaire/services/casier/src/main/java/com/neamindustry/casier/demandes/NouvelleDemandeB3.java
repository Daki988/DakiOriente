package com.neamindustry.casier.demandes;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** Dépôt d'une demande de bulletin n°3 par la personne concernée (RG-01). */
public record NouvelleDemandeB3(@Valid @NotNull IdentiteDeclaree identite, @NotNull ProfilDemandeur profil,
                                @Pattern(regexp = "\\+?[0-9 ]{8,16}") String telephone, @Email String email) {
}
