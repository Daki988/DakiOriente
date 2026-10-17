package com.neamindustry.casier.audit;

import java.time.Instant;

/** Entrée du journal, telle qu'enregistrée et chaînée. */
public record EntreeJournal(long numero, Instant horodatage, EvenementAudit evenement, String empreintePrecedente,
                            String empreinte) {
}
