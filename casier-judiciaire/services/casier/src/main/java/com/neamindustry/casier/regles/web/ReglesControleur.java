package com.neamindustry.casier.regles.web;

import java.net.URI;
import java.time.LocalDate;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.habilitations.ActeurCourant;
import com.neamindustry.casier.regles.CasDeTest;
import com.neamindustry.casier.regles.JeuDeRegles;
import com.neamindustry.casier.regles.ParametresJuridiques;
import com.neamindustry.casier.regles.ReglesBulletins;

/** ADM-05, ADR 0005 : paramètres juridiques proposés par la direction centrale, validés par un magistrat distinct. */
@RestController
@RequestMapping("/api/v1/regles")
class ReglesControleur {

    record Proposition(@NotNull ReglesBulletins contenu, @NotNull LocalDate dateEffet, @NotNull List<CasDeTest> casDeTest) {
    }

    record Motif(@NotBlank String motif) {
    }

    private final ParametresJuridiques parametres;
    private final ActeurCourant acteur;

    ReglesControleur(ParametresJuridiques parametres, ActeurCourant acteur) {
        this.parametres = parametres;
        this.acteur = acteur;
    }

    @PostMapping
    ResponseEntity<JeuDeRegles> proposer(@Valid @RequestBody Proposition p) {
        JeuDeRegles jeu = parametres.proposer(acteur.obtenir(), p.contenu(), p.dateEffet(), p.casDeTest());
        return ResponseEntity.created(URI.create("/api/v1/regles/" + jeu.id())).body(jeu);
    }

    @PostMapping("/{id}/validation")
    JeuDeRegles valider(@PathVariable UUID id) {
        return parametres.valider(acteur.obtenir(), id);
    }

    @PostMapping("/{id}/rejet")
    ResponseEntity<Void> rejeter(@PathVariable UUID id, @Valid @RequestBody Motif m) {
        parametres.rejeter(acteur.obtenir(), id, m.motif());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    JeuDeRegles jeu(@PathVariable UUID id) {
        acteur.obtenir();
        return parametres.jeu(id);
    }
}
