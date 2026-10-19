package com.neamindustry.casier.agents.web;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.agents.AnnuaireIndisponible;
import com.neamindustry.casier.agents.CompteAgent;
import com.neamindustry.casier.agents.CompteCree;
import com.neamindustry.casier.agents.GestionAgents;
import com.neamindustry.casier.agents.NouvelAgent;
import com.neamindustry.casier.habilitations.ActeurCourant;

/** Gestion des comptes des agents par l'administrateur de la plateforme. */
@RestController
@RequestMapping("/api/v1/agents")
class AgentsControleur {

    record Creation(@NotBlank String login, @NotBlank String prenom, @NotBlank String nom, @NotBlank String email,
                    @NotBlank String role, String juridiction) {
    }

    record ChangementRole(@NotBlank String role, String juridiction) {
    }

    record Activation(@NotNull Boolean actif, String motif) {
    }

    private final GestionAgents agents;
    private final ActeurCourant acteur;

    AgentsControleur(GestionAgents agents, ActeurCourant acteur) {
        this.agents = agents;
        this.acteur = acteur;
    }

    @GetMapping
    List<CompteAgent> comptes() {
        return agents.comptes(acteur.obtenir());
    }

    @GetMapping("/roles")
    Map<String, String> roles() {
        return agents.rolesAttribuables();
    }

    @PostMapping
    ResponseEntity<CompteCree> creer(@Valid @RequestBody Creation c) {
        CompteCree cree = agents.creer(acteur.obtenir(), new NouvelAgent(c.login(), c.prenom(), c.nom(), c.email(), c.role(), c.juridiction()));
        return ResponseEntity.status(HttpStatus.CREATED).header("Cache-Control", "no-store").body(cree);
    }

    @PostMapping("/{id}/role")
    ResponseEntity<Void> changerRole(@PathVariable String id, @Valid @RequestBody ChangementRole c) {
        agents.changerRole(acteur.obtenir(), id, c.role(), c.juridiction());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activation")
    ResponseEntity<Void> activer(@PathVariable String id, @Valid @RequestBody Activation a) {
        agents.activer(acteur.obtenir(), id, a.actif(), a.motif());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(AnnuaireIndisponible.class)
    ResponseEntity<ProblemDetail> indisponible(AnnuaireIndisponible e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
        p.setTitle("Gestion des agents indisponible");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(p);
    }
}
