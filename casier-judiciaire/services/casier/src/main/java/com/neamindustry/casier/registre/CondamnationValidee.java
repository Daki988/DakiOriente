package com.neamindustry.casier.registre;

import java.util.UUID;

/** Événement : une inscription (condamnation, correction ou mention) vient d'être validée sur une fiche. */
public record CondamnationValidee(UUID personneId, UUID condamnationId) {
}
