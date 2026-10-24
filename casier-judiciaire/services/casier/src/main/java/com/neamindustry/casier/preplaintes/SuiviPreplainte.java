package com.neamindustry.casier.preplaintes;

import java.time.Instant;

/** Suivi public d'une pré-plainte, sans le détail des faits. */
public record SuiviPreplainte(String numero, StatutPreplainte statut, Instant deposeeLe, Instant expireLe, String service,
                              Instant rendezVousLe, String rendezVousLieu, Instant signeeLe) {
}
