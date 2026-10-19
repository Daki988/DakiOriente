package com.neamindustry.casier.bulletins.web;

import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.bulletins.BulletinRecu;
import com.neamindustry.casier.bulletins.EmissionBulletins;
import com.neamindustry.casier.habilitations.ActeurCourant;

/** Bulletins reçus, téléchargement (BUL-01) et révocation (BUL-10). */
@RestController
@RequestMapping("/api/v1/bulletins")
class BulletinsControleur {

    record Motif(@NotBlank String motif) {
    }

    private final EmissionBulletins bulletins;
    private final ActeurCourant acteur;

    BulletinsControleur(EmissionBulletins bulletins, ActeurCourant acteur) {
        this.bulletins = bulletins;
        this.acteur = acteur;
    }

    /** DSH-01 : bulletins reçus par l'usager ou l'agent connecté. */
    @GetMapping("/recus")
    List<BulletinRecu> recus() {
        return bulletins.mesBulletins(acteur.obtenir());
    }

    /** BUL-10 : recherche d'un bulletin par son numéro, avant révocation. */
    @GetMapping("/recherche")
    com.neamindustry.casier.bulletins.BulletinTrouve rechercher(@org.springframework.web.bind.annotation.RequestParam String numero) {
        return bulletins.rechercher(acteur.obtenir(), numero);
    }

    /** BUL-01 : bulletin PDF/A scellé, téléchargé par son seul destinataire. */
    @GetMapping("/{id}/pdf")
    ResponseEntity<byte[]> pdf(@PathVariable UUID id) {
        byte[] document = bulletins.telecharger(acteur.obtenir(), id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("bulletin-" + id + ".pdf").build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(document);
    }

    @PostMapping("/{id}/revocation")
    ResponseEntity<Void> revoquer(@PathVariable UUID id, @Valid @RequestBody Motif m) {
        bulletins.revoquer(acteur.obtenir(), id, m.motif());
        return ResponseEntity.noContent().build();
    }
}
