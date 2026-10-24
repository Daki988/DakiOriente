package com.neamindustry.casier.preplaintes;

import java.time.Instant;

/** Récépissé : numéro et code de suivi (montré une seule fois), date limite de signature. */
public record PreplainteDeposee(String numero, String code, Instant expireLe, String service) {
}
