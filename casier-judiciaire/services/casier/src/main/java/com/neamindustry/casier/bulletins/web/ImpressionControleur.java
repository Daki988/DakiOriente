package com.neamindustry.casier.bulletins.web;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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

import com.neamindustry.casier.bulletins.BulletinAImprimer;
import com.neamindustry.casier.bulletins.ImpressionBulletins;
import com.neamindustry.casier.habilitations.ActeurCourant;

/** Tableau de bord du validateur : file d'impression, validation, impression sur papier sécurisé. */
@RestController
@RequestMapping("/api/v1/impressions")
class ImpressionControleur {

    record Impression(@NotBlank @Size(max = 40) String feuillet, @Size(max = 500) String motif) {
    }

    private final ImpressionBulletins impressions;
    private final ActeurCourant acteur;

    ImpressionControleur(ImpressionBulletins impressions, ActeurCourant acteur) {
        this.impressions = impressions;
        this.acteur = acteur;
    }

    @GetMapping
    List<BulletinAImprimer> file() {
        return impressions.file(acteur.obtenir());
    }

    @PostMapping("/{id}/validation")
    ResponseEntity<Void> valider(@PathVariable UUID id) {
        impressions.valider(acteur.obtenir(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/impression")
    ResponseEntity<byte[]> imprimer(@PathVariable UUID id, @Valid @RequestBody Impression i) {
        byte[] pdf = impressions.imprimer(acteur.obtenir(), id, i.feuillet(), i.motif());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename("bulletin-" + id + ".pdf").build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(pdf);
    }
}
