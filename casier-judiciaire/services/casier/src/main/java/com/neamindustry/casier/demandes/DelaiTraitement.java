package com.neamindustry.casier.demandes;

import java.time.Duration;
import java.time.Instant;

/**
 * RG-09 : le délai court à partir du paiement confirmé et du dossier complet ; il est suspendu pendant
 * l'attente d'une pièce demandée à l'usager, puis reprend pour la durée restante.
 */
public final class DelaiTraitement {

    private DelaiTraitement() {
    }

    public static Instant echeanceInitiale(Instant debut, Duration delai) {
        return debut.plus(delai);
    }

    /** À la reprise, l'échéance est repoussée de la durée de la suspension. */
    public static Instant apresSuspension(Instant echeance, Instant suspenduDepuis, Instant reprise) {
        Duration suspension = Duration.between(suspenduDepuis, reprise);
        return suspension.isNegative() ? echeance : echeance.plus(suspension);
    }

    /** Durée restante ; figée pendant une suspension. Négative si le délai est dépassé. */
    public static Duration restant(Instant echeance, Instant suspenduDepuis, Instant maintenant) {
        Instant reference = suspenduDepuis != null ? suspenduDepuis : maintenant;
        return Duration.between(reference, echeance);
    }

    public static boolean alerte(Duration restant, Duration seuil) {
        return restant.compareTo(seuil) <= 0;
    }
}
