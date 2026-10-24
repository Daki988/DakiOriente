package com.neamindustry.casier.preplaintes.web;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.commun.LimiteurDebit;
import com.neamindustry.casier.habilitations.ActeurCourant;
import com.neamindustry.casier.preplaintes.NouvellePreplainte;
import com.neamindustry.casier.preplaintes.Preplainte;
import com.neamindustry.casier.preplaintes.PreplainteDeposee;
import com.neamindustry.casier.preplaintes.ServicePreplaintes;
import com.neamindustry.casier.preplaintes.SuiviPreplainte;

/** Pré-plaintes : dépôt et suivi publics (débit limité), traitement par l'officier de police judiciaire. */
@RestController
class PreplaintesControleur {

    record RendezVous(@NotNull Instant le, @NotBlank String lieu) {
    }

    record Signature(@NotBlank String numeroProcedure) {
    }

    private final ServicePreplaintes preplaintes;
    private final ActeurCourant acteur;
    private final LimiteurDebit limiteur;

    PreplaintesControleur(ServicePreplaintes preplaintes, ActeurCourant acteur, LimiteurDebit limiteur) {
        this.preplaintes = preplaintes;
        this.acteur = acteur;
        this.limiteur = limiteur;
    }

    @PostMapping("/api/public/v1/pre-plaintes")
    ResponseEntity<PreplainteDeposee> deposer(@Valid @RequestBody NouvellePreplainte p, HttpServletRequest requete) {
        if (!limiteur.autoriser(requete.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).header("Cache-Control", "no-store").body(preplaintes.deposer(p));
    }

    @GetMapping("/api/public/v1/pre-plaintes/suivi")
    ResponseEntity<SuiviPreplainte> suivi(@RequestParam String numero, @RequestParam String code, HttpServletRequest requete) {
        if (!limiteur.autoriser(requete.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.ok(preplaintes.suivi(numero, code));
    }

    @GetMapping("/api/v1/pre-plaintes")
    List<Preplainte> file() {
        return preplaintes.file(acteur.obtenir());
    }

    @PostMapping("/api/v1/pre-plaintes/{id}/rendez-vous")
    ResponseEntity<Void> rendezVous(@PathVariable UUID id, @Valid @RequestBody RendezVous r) {
        preplaintes.fixerRendezVous(acteur.obtenir(), id, r.le(), r.lieu());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/pre-plaintes/{id}/signature")
    ResponseEntity<Void> signature(@PathVariable UUID id, @Valid @RequestBody Signature s) {
        preplaintes.constaterSignature(acteur.obtenir(), id, s.numeroProcedure());
        return ResponseEntity.noContent().build();
    }
}
