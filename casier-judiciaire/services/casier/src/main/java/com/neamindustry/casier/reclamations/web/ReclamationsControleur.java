package com.neamindustry.casier.reclamations.web;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.habilitations.ActeurCourant;
import com.neamindustry.casier.reclamations.CategorieReclamation;
import com.neamindustry.casier.reclamations.Reclamation;
import com.neamindustry.casier.reclamations.ServiceReclamations;

/** Réclamations : dépôt et suivi par l'usager, traitement par le support. */
@RestController
class ReclamationsControleur {

    record NouvelleReclamation(@NotNull CategorieReclamation categorie, String numeroDossier, @NotBlank String message) {
    }

    record Reponse(@NotBlank String reponse) {
    }

    private final ServiceReclamations reclamations;
    private final ActeurCourant acteur;

    ReclamationsControleur(ServiceReclamations reclamations, ActeurCourant acteur) {
        this.reclamations = reclamations;
        this.acteur = acteur;
    }

    @PostMapping("/api/v1/usager/reclamations")
    ResponseEntity<Reclamation> deposer(@Valid @RequestBody NouvelleReclamation r) {
        return ResponseEntity.status(201).body(reclamations.deposer(acteur.obtenir(), r.categorie(), r.numeroDossier(), r.message()));
    }

    @GetMapping("/api/v1/usager/reclamations")
    List<Reclamation> mesReclamations() {
        return reclamations.mesReclamations(acteur.obtenir());
    }

    @GetMapping("/api/v1/reclamations")
    List<Reclamation> file() {
        return reclamations.file(acteur.obtenir());
    }

    @PostMapping("/api/v1/reclamations/{id}/prise-en-charge")
    ResponseEntity<Void> prendreEnCharge(@PathVariable UUID id) {
        reclamations.prendreEnCharge(acteur.obtenir(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/reclamations/{id}/reponse")
    ResponseEntity<Void> repondre(@PathVariable UUID id, @Valid @RequestBody Reponse r) {
        reclamations.repondre(acteur.obtenir(), id, r.reponse());
        return ResponseEntity.noContent().build();
    }
}
