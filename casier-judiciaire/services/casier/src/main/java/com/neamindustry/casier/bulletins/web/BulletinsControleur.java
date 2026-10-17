package com.neamindustry.casier.bulletins.web;

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

import com.neamindustry.casier.bulletins.BulletinDelivre;
import com.neamindustry.casier.bulletins.ContenuBulletin;
import com.neamindustry.casier.bulletins.EmissionBulletins;
import com.neamindustry.casier.bulletins.IdentiteSurBulletin;
import com.neamindustry.casier.habilitations.ActeurCourant;

/** Bulletin n°2 (RG-02), consultation du n°1 (RG-03) et révocation (BUL-10). */
@RestController
@RequestMapping("/api/v1/bulletins")
class BulletinsControleur {

    record DemandeB2(UUID personneId, @Valid @NotNull IdentiteSurBulletin identite, @NotBlank String finalite) {
    }

    record Motif(@NotBlank String motif) {
    }

    private final EmissionBulletins bulletins;
    private final ActeurCourant acteur;

    BulletinsControleur(EmissionBulletins bulletins, ActeurCourant acteur) {
        this.bulletins = bulletins;
        this.acteur = acteur;
    }

    /** RG-02 : l'administration habilitée reçoit le bulletin scellé, pour une finalité autorisée. */
    @PostMapping("/b2")
    BulletinDelivre delivrerB2(@Valid @RequestBody DemandeB2 d) {
        return bulletins.delivrerB2(acteur.obtenir(), d.personneId(), d.identite(), d.finalite());
    }

    /** RG-03 : consultation du bulletin n°1 par un magistrat, rattachée à un numéro de procédure. */
    @GetMapping("/b1")
    ContenuBulletin consulterB1(@RequestParam UUID personne, @RequestParam String procedure) {
        return bulletins.consulterB1(acteur.obtenir(), personne, procedure);
    }

    @PostMapping("/{id}/revocation")
    ResponseEntity<Void> revoquer(@PathVariable UUID id, @Valid @RequestBody Motif m) {
        bulletins.revoquer(acteur.obtenir(), id, m.motif());
        return ResponseEntity.noContent().build();
    }
}
