package com.neamindustry.casier.registre.web;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.commun.TypeMention;
import com.neamindustry.casier.habilitations.ActeurCourant;
import com.neamindustry.casier.identification.ProfilIdentite;
import com.neamindustry.casier.registre.ConsultationRegistre;
import com.neamindustry.casier.registre.FicheCasier;
import com.neamindustry.casier.registre.InscriptionsCasier;
import com.neamindustry.casier.registre.SaisieCondamnation;

/** Registre national (section 10) : saisie, validation à quatre yeux, mentions, contestations, consultation tracée. */
@RestController
@RequestMapping("/api/v1/registre")
class RegistreControleur {

    record Identifiant(UUID id) {
    }

    record Motif(@NotBlank String motif) {
    }

    record Correction(@Valid @NotNull SaisieCondamnation saisie, @NotBlank String motif) {
    }

    record NouvelleMention(@NotNull TypeMention type, @NotNull LocalDate dateEffet, String details) {
    }

    private final InscriptionsCasier inscriptions;
    private final ConsultationRegistre consultation;
    private final ActeurCourant acteur;

    RegistreControleur(InscriptionsCasier inscriptions, ConsultationRegistre consultation, ActeurCourant acteur) {
        this.inscriptions = inscriptions;
        this.consultation = consultation;
        this.acteur = acteur;
    }

    @PostMapping("/condamnations")
    ResponseEntity<Identifiant> saisir(@Valid @RequestBody SaisieCondamnation s) {
        UUID id = inscriptions.saisir(acteur.obtenir(), s);
        return ResponseEntity.created(URI.create("/api/v1/registre/condamnations/" + id)).body(new Identifiant(id));
    }

    /** REG-08 : une correction crée une nouvelle version, soumise à validation. */
    @PostMapping("/condamnations/{id}/corrections")
    ResponseEntity<Identifiant> corriger(@PathVariable UUID id, @Valid @RequestBody Correction c) {
        UUID nouvelle = inscriptions.saisirCorrection(acteur.obtenir(), id, c.saisie(), c.motif());
        return ResponseEntity.created(URI.create("/api/v1/registre/condamnations/" + nouvelle)).body(new Identifiant(nouvelle));
    }

    @PostMapping("/condamnations/{id}/validation")
    ResponseEntity<Void> valider(@PathVariable UUID id) {
        inscriptions.valider(acteur.obtenir(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/condamnations/{id}/rejet")
    ResponseEntity<Void> rejeter(@PathVariable UUID id, @Valid @RequestBody Motif m) {
        inscriptions.rejeter(acteur.obtenir(), id, m.motif());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/condamnations/{id}/mentions")
    ResponseEntity<Identifiant> saisirMention(@PathVariable UUID id, @Valid @RequestBody NouvelleMention m) {
        UUID mention = inscriptions.saisirMention(acteur.obtenir(), id, m.type(), m.dateEffet(), m.details());
        return ResponseEntity.created(URI.create("/api/v1/registre/mentions/" + mention)).body(new Identifiant(mention));
    }

    @PostMapping("/mentions/{id}/validation")
    ResponseEntity<Void> validerMention(@PathVariable UUID id) {
        inscriptions.validerMention(acteur.obtenir(), id);
        return ResponseEntity.noContent().build();
    }

    /** RG-07 : une contestation bloque l'émission automatique jusqu'à sa clôture. */
    @PostMapping("/personnes/{personneId}/contestations")
    ResponseEntity<Identifiant> contester(@PathVariable UUID personneId, @Valid @RequestBody Motif m) {
        return ResponseEntity.status(201).body(new Identifiant(inscriptions.ouvrirContestation(acteur.obtenir(), personneId, m.motif())));
    }

    @PostMapping("/personnes/{personneId}/contestations/{id}/cloture")
    ResponseEntity<Void> clore(@PathVariable UUID personneId, @PathVariable UUID id) {
        inscriptions.cloreContestation(acteur.obtenir(), id, personneId);
        return ResponseEntity.noContent().build();
    }

    /** Consultation tracée : le motif est obligatoire (SEC-07). */
    @GetMapping("/personnes/{personneId}")
    FicheCasier fiche(@PathVariable UUID personneId, @RequestParam String motif) {
        return consultation.fiche(acteur.obtenir(), personneId, motif);
    }

    @GetMapping("/recherche")
    List<ProfilIdentite> rechercher(@RequestParam String nom, @RequestParam(defaultValue = "") String prenoms,
                                    @RequestParam(required = false) LocalDate dateNaissance, @RequestParam(required = false) String cnie,
                                    @RequestParam(required = false) String passeport, @RequestParam String motif) {
        return consultation.rechercher(acteur.obtenir(), nom, prenoms, dateNaissance, cnie, passeport, motif);
    }
}
