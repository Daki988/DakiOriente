package com.neamindustry.casier.registre;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** RG-07 : contestation en cours sur une fiche ; elle bloque l'émission automatique jusqu'à sa clôture. */
public record ContestationOuverte(UUID id, UUID personneId, String nom, String prenoms, LocalDate dateNaissance, String motif,
                                  Instant ouverteLe, boolean ouverteParMoi) {
}
