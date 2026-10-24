package com.neamindustry.casier.penitentiaire.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.habilitations.ActeurCourant;
import com.neamindustry.casier.penitentiaire.Detenu;
import com.neamindustry.casier.penitentiaire.Etablissement;
import com.neamindustry.casier.penitentiaire.GestionPenitentiaire;
import com.neamindustry.casier.penitentiaire.Mouvement;
import com.neamindustry.casier.penitentiaire.Saisies;
import com.neamindustry.casier.penitentiaire.TableauDeBord;

/** Système de gestion pénitentiaire : référentiel public, registre des écrous, mouvements, libérations, tableau de bord. */
@RestController
class PenitentiaireControleur {

    record Decision(@NotNull Boolean autoriser, String observation) {
    }

    record Etape(@NotNull @Pattern(regexp = "DEPART|RETOUR|ANNULATION") String etape) {
    }

    private final GestionPenitentiaire gestion;
    private final ActeurCourant acteur;

    PenitentiaireControleur(GestionPenitentiaire gestion, ActeurCourant acteur) {
        this.gestion = gestion;
        this.acteur = acteur;
    }

    @GetMapping("/api/public/v1/penitentiaire/etablissements")
    List<Etablissement> etablissements() {
        return gestion.etablissements();
    }

    @GetMapping("/api/v1/penitentiaire/tableau-de-bord")
    TableauDeBord tableauDeBord() {
        return gestion.tableauDeBord(acteur.obtenir());
    }

    @GetMapping("/api/v1/penitentiaire/detenus")
    List<Detenu> registre(@RequestParam(defaultValue = "") String recherche, @RequestParam(defaultValue = "false") boolean avecLiberes) {
        return gestion.registre(acteur.obtenir(), recherche, avecLiberes);
    }

    @GetMapping("/api/v1/penitentiaire/detenus/{id}")
    Map<String, Object> fiche(@PathVariable UUID id) {
        return gestion.fiche(acteur.obtenir(), id);
    }

    @PostMapping("/api/v1/penitentiaire/detenus")
    ResponseEntity<Detenu> ecrouer(@Valid @RequestBody Saisies.NouvelEcrou e) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gestion.ecrouer(acteur.obtenir(), e));
    }

    @PostMapping("/api/v1/penitentiaire/detenus/{id}/condamnation")
    Detenu condamner(@PathVariable UUID id, @Valid @RequestBody Saisies.Condamnation c) {
        return gestion.condamner(acteur.obtenir(), id, c);
    }

    @PostMapping("/api/v1/penitentiaire/detenus/{id}/liberation")
    Detenu liberer(@PathVariable UUID id, @Valid @RequestBody Saisies.Liberation l) {
        return gestion.liberer(acteur.obtenir(), id, l);
    }

    @GetMapping("/api/v1/penitentiaire/mouvements")
    List<Mouvement> mouvements() {
        return gestion.mouvementsOuverts(acteur.obtenir());
    }

    @PostMapping("/api/v1/penitentiaire/detenus/{id}/mouvements")
    ResponseEntity<Mouvement> demanderMouvement(@PathVariable UUID id, @Valid @RequestBody Saisies.NouveauMouvement m) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gestion.demanderMouvement(acteur.obtenir(), id, m));
    }

    @PostMapping("/api/v1/penitentiaire/mouvements/{id}/decision")
    ResponseEntity<Void> decider(@PathVariable UUID id, @Valid @RequestBody Decision d) {
        gestion.deciderMouvement(acteur.obtenir(), id, d.autoriser(), d.observation());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/penitentiaire/mouvements/{id}/execution")
    ResponseEntity<Void> executer(@PathVariable UUID id, @Valid @RequestBody Etape e) {
        gestion.executerMouvement(acteur.obtenir(), id, e.etape());
        return ResponseEntity.noContent().build();
    }
}
