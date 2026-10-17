package com.neamindustry.casier.audit.interne;

import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.commun.Empreintes;

/** SEC-07 : empreinte = SHA-256(empreinte précédente ‖ contenu canonique de l'entrée). */
final class CalculEmpreinte {

    static final String ORIGINE = "0".repeat(64);

    private CalculEmpreinte() {
    }

    static String empreinte(String precedente, long numero, Instant horodatage, EvenementAudit e) {
        String details = new TreeMap<>(e.details()).entrySet().stream()
                .map(Map.Entry::toString)
                .collect(Collectors.joining("\u001E"));
        String contenu = Empreintes.canonique(numero, horodatage, e.acteurId(), e.roles(), e.action(), e.objetType(),
                e.objetId(), e.personneConcernee(), e.finalite(), details);
        return Empreintes.sha256(precedente + "\u001D" + contenu);
    }
}
