package com.neamindustry.casier.preplaintes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Pré-plainte telle que la voit l'officier de police judiciaire. */
public record Preplainte(UUID id, String numero, NaturePreplainte nature, LocalDate dateFaits, String heureFaits, String ville,
                         String lieu, String description, boolean auteurConnu, String auteurInfos, String biens, Long prejudiceFcfa,
                         NouvellePreplainte.Declarant declarant, String service, StatutPreplainte statut, Instant creeLe,
                         Instant expireLe, Instant rendezVousLe, String rendezVousLieu, Instant signeeLe, String numeroProcedure) {
}
