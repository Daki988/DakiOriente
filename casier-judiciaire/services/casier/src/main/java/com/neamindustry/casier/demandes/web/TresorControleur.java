package com.neamindustry.casier.demandes.web;

import java.time.Clock;
import java.time.Instant;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.commun.LimiteurDebit;
import com.neamindustry.casier.demandes.ServiceDemandes;

/**
 * Paiement au Trésor public : l'usager paie au guichet du Trésor avec son numéro de dossier, puis saisit l'identifiant
 * de paiement (numéro de quittance) avec son code de suivi. Tant que l'interconnexion avec le Trésor n'existe pas, la
 * quittance est acceptée sur sa seule forme : ce point d'entrée n'est actif qu'en démonstration (propriété dédiée).
 */
@RestController
@ConditionalOnProperty(name = "casier.paiement.tresor-simule", havingValue = "true")
class TresorControleur {

    record PaiementTresor(@NotBlank String numeroDossier, @NotBlank String code,
                          @NotBlank @Pattern(regexp = "[A-Za-z0-9-]{6,30}", message = "Identifiant de paiement invalide.") String quittance) {
    }

    private final ServiceDemandes demandes;
    private final LimiteurDebit limiteur;
    private final Clock horloge;

    TresorControleur(ServiceDemandes demandes, LimiteurDebit limiteur, Clock horloge) {
        this.demandes = demandes;
        this.limiteur = limiteur;
        this.horloge = horloge;
    }

    @PostMapping("/api/public/v1/paiements/tresor")
    ResponseEntity<VueTraitement> payer(@Valid @RequestBody PaiementTresor p, HttpServletRequest requete) {
        if (!limiteur.autoriser(requete.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.ok(VueTraitement.de(demandes.payerAuTresor(p.numeroDossier().trim().toUpperCase(), p.code(),
                p.quittance(), Instant.now(horloge))));
    }
}
