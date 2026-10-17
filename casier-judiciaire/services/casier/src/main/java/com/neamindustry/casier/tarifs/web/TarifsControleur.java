package com.neamindustry.casier.tarifs.web;

import java.net.URI;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.habilitations.ActeurCourant;
import com.neamindustry.casier.tarifs.ReferentielTarifs;
import com.neamindustry.casier.tarifs.Tarif;

/** PUB-09 (lecture publique), ADM-04 (proposition et validation à quatre yeux). */
@RestController
class TarifsControleur {

    /** Vue publique : ni identifiants internes ni auteurs (DON-02). */
    record TarifPublic(String acte, String profil, long montantFcfa, LocalDate dateEffet, boolean provisoire, String libelle,
                       String source) {
    }

    record PropositionTarif(@NotBlank String acte, @NotBlank String profil, @PositiveOrZero long montantFcfa,
                            @NotNull LocalDate dateEffet, boolean provisoire, @NotBlank String libelle, String source) {
    }

    private final ReferentielTarifs referentiel;
    private final ActeurCourant acteur;
    private final Clock horloge;

    TarifsControleur(ReferentielTarifs referentiel, ActeurCourant acteur, Clock horloge) {
        this.referentiel = referentiel;
        this.acteur = acteur;
        this.horloge = horloge;
    }

    @GetMapping("/api/public/v1/tarifs")
    List<TarifPublic> enVigueur() {
        return referentiel.enVigueur(LocalDate.now(horloge)).stream()
                .map(t -> new TarifPublic(t.acte(), t.profil(), t.montantFcfa(), t.dateEffet(), t.provisoire(), t.libelle(), t.source()))
                .toList();
    }

    @GetMapping("/api/v1/tarifs")
    List<Tarif> historique() {
        return referentiel.historique(acteur.obtenir());
    }

    @PostMapping("/api/v1/tarifs")
    ResponseEntity<Tarif> proposer(@Valid @RequestBody PropositionTarif p) {
        Tarif t = referentiel.proposer(acteur.obtenir(), p.acte(), p.profil(), p.montantFcfa(), p.dateEffet(), p.provisoire(),
                p.libelle(), p.source());
        return ResponseEntity.created(URI.create("/api/v1/tarifs/" + t.id())).body(t);
    }

    @PostMapping("/api/v1/tarifs/{id}/validation")
    ResponseEntity<Void> valider(@PathVariable UUID id) {
        referentiel.valider(acteur.obtenir(), id);
        return ResponseEntity.noContent().build();
    }
}
