package com.neamindustry.casier.demandes.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.commun.LimiteurDebit;
import com.neamindustry.casier.demandes.DemandeDeposee;
import com.neamindustry.casier.demandes.DossierAgent;
import com.neamindustry.casier.demandes.NouvelleDemandeB3;
import com.neamindustry.casier.demandes.ServiceDemandes;
import com.neamindustry.casier.demandes.SuiviDemande;
import com.neamindustry.casier.habilitations.ActeurCourant;

/** Parcours de demande du bulletin n°3 (section 8), suivi public (PUB-07) et file de travail des agents (DSH-05). */
@RestController
class DemandesControleur {

    record Motif(@NotBlank String motif) {
    }

    record Piece(@NotBlank String piece) {
    }

    record DecisionIdentite(UUID personneId, @NotBlank String motivation) {
    }

    private final ServiceDemandes demandes;
    private final ActeurCourant acteur;
    private final LimiteurDebit limiteur;

    DemandesControleur(ServiceDemandes demandes, ActeurCourant acteur, LimiteurDebit limiteur) {
        this.demandes = demandes;
        this.acteur = acteur;
        this.limiteur = limiteur;
    }

    /** RG-01 : l'usager connecté par l'identité numérique dépose sa propre demande. */
    @PostMapping("/api/v1/demandes")
    ResponseEntity<DemandeDeposee> deposer(@Valid @RequestBody NouvelleDemandeB3 demande) {
        DemandeDeposee d = demandes.deposer(acteur.obtenir(), demande);
        return ResponseEntity.created(URI.create("/api/v1/demandes/" + d.id())).body(d);
    }

    /** PUB-07 : suivi sans compte ; essais limités par adresse réseau (BUL-09). */
    @GetMapping("/api/public/v1/suivi")
    ResponseEntity<SuiviDemande> suivi(@RequestParam String numero, @RequestParam String code, HttpServletRequest requete) {
        if (!limiteur.autoriser(requete.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.ok(demandes.suivi(numero.trim().toUpperCase(), code));
    }

    @GetMapping("/api/v1/demandes/file")
    List<DossierAgent> fileDeTravail() {
        return demandes.fileDeTravail(acteur.obtenir());
    }

    /** RG-09 : pièce demandée, délai suspendu. */
    @PostMapping("/api/v1/demandes/{id}/demande-piece")
    ResponseEntity<Void> demanderPiece(@PathVariable UUID id, @Valid @RequestBody Piece p) {
        demandes.demanderPiece(acteur.obtenir(), id, p.piece());
        return ResponseEntity.noContent().build();
    }

    /** RG-09 : pièce déposée par l'usager, le délai reprend. */
    @PostMapping("/api/v1/demandes/{id}/piece")
    ResponseEntity<Void> pieceDeposee(@PathVariable UUID id, @Valid @RequestBody Piece p) {
        demandes.pieceDeposee(acteur.obtenir(), id, p.piece());
        return ResponseEntity.noContent().build();
    }

    /** IDT-06 : décision motivée de l'agent sur l'identité ; le contenu du bulletin reste calculé par le moteur. */
    @PostMapping("/api/v1/demandes/{id}/decision-identite")
    VueTraitement deciderIdentite(@PathVariable UUID id, @Valid @RequestBody DecisionIdentite d) {
        return VueTraitement.de(demandes.deciderIdentite(acteur.obtenir(), id, d.personneId(), d.motivation()));
    }

    @PostMapping("/api/v1/demandes/{id}/rejet")
    ResponseEntity<Void> rejeter(@PathVariable UUID id, @Valid @RequestBody Motif m) {
        demandes.rejeter(acteur.obtenir(), id, m.motif());
        return ResponseEntity.noContent().build();
    }
}
