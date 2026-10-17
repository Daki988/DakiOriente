package com.neamindustry.casier.registre;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Qualification;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

/**
 * REG-01 : saisie d'une condamnation à partir de l'extrait de décision.
 *
 * @param personneId          fiche existante (après rapprochement par l'agent, IDT-06), ou {@code null}
 * @param nouvellePersonne    identité de la personne si aucune fiche n'existe
 * @param referencePieceSource référence de l'extrait de décision numérisé, archivé à valeur probante (REG-02)
 */
public record SaisieCondamnation(UUID personneId, @Valid IdentitePersonne nouvellePersonne,
                                 @NotBlank String juridiction, @NotNull @PastOrPresent LocalDate dateDecision,
                                 @NotBlank String numeroDecision, @NotBlank String infraction,
                                 @NotNull Qualification qualification, @NotEmpty List<@NotNull Peine> peines,
                                 LocalDate dateDefinitive, @NotBlank String referencePieceSource) {
}
