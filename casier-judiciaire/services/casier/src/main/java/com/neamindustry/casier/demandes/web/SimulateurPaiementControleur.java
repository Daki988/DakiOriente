package com.neamindustry.casier.demandes.web;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.demandes.ServiceDemandes;

/** PAY-07, ENV-03 : simulateur de paiement de la démonstration ; absent de la production (propriété désactivée par défaut). */
@RestController
@ConditionalOnProperty(name = "casier.paiement.simulateur", havingValue = "true")
class SimulateurPaiementControleur {

    record PaiementSimule(@NotBlank String numeroDossier, @PositiveOrZero long montantFcfa) {
    }

    private final ServiceDemandes demandes;
    private final Clock horloge;

    SimulateurPaiementControleur(ServiceDemandes demandes, Clock horloge) {
        this.demandes = demandes;
        this.horloge = horloge;
    }

    @PostMapping("/api/public/v1/simulateur-paiement")
    VueTraitement payer(@Valid @RequestBody PaiementSimule p) {
        return VueTraitement.de(demandes.confirmerPaiement(p.numeroDossier(), "SIMULATEUR-" + UUID.randomUUID(), p.montantFcfa(),
                Instant.now(horloge)));
    }
}
