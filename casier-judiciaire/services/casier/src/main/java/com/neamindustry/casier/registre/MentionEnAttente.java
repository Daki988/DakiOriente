package com.neamindustry.casier.registre;

import java.time.LocalDate;
import java.util.UUID;

import com.neamindustry.casier.commun.TypeMention;

/** Mention à valider par le greffier en chef, avec la condamnation et la fiche concernées. */
public record MentionEnAttente(UUID id, UUID condamnationId, UUID personneId, String nom, String prenoms, LocalDate dateNaissance,
                               TypeMention type, LocalDate dateEffet, String details, String infraction, LocalDate dateDecision,
                               String juridiction, boolean saisieParMoi) {
}
