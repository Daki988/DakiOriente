package com.neamindustry.casier.registre;

import java.time.LocalDate;
import java.util.UUID;

import com.neamindustry.casier.commun.TypeMention;

/** Mention postérieure à une condamnation (REG-03), soumise au même circuit de validation. */
public record MentionEnregistree(UUID id, UUID condamnationId, TypeMention type, LocalDate dateEffet, String details,
                                 StatutInscription statut, String saisiePar, String valideePar) {
}
