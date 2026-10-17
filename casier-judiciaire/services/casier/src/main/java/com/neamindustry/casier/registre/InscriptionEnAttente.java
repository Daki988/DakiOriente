package com.neamindustry.casier.registre;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Qualification;

/** DSH-06 : inscription à valider par le greffier en chef (REG-03), avec la fiche concernée. */
public record InscriptionEnAttente(UUID id, UUID personneId, String nom, String prenoms, LocalDate dateNaissance, int version,
                                   UUID remplaceId, String juridiction, LocalDate dateDecision, String numeroDecision,
                                   String infraction, Qualification qualification, List<Peine> peines, String saisiePar,
                                   Instant saisieLe, boolean saisieParMoi) {
}
