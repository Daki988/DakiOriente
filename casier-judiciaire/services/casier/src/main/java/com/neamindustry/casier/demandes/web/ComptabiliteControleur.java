package com.neamindustry.casier.demandes.web;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.demandes.Comptabilite;
import com.neamindustry.casier.habilitations.ActeurCourant;

/** Tableau du comptable : paiements, synthèse, rapprochement avec un relevé, export. */
@RestController
@RequestMapping("/api/v1/comptabilite")
class ComptabiliteControleur {

    private final Comptabilite comptabilite;
    private final ActeurCourant acteur;

    ComptabiliteControleur(Comptabilite comptabilite, ActeurCourant acteur) {
        this.comptabilite = comptabilite;
        this.acteur = acteur;
    }

    @GetMapping("/paiements")
    List<Comptabilite.PaiementEncaisse> paiements(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                                                  @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au) {
        return comptabilite.paiements(acteur.obtenir(), du, au);
    }

    @GetMapping("/synthese")
    Comptabilite.Synthese synthese(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au) {
        return comptabilite.synthese(acteur.obtenir(), du, au);
    }

    /** Le relevé est envoyé en texte brut : une ligne « référence;montant » par paiement. */
    @PostMapping(path = "/rapprochement", consumes = MediaType.TEXT_PLAIN_VALUE)
    Comptabilite.Rapprochement rapprocher(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                                          @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au,
                                          @RequestBody String releve) {
        return comptabilite.rapprocher(acteur.obtenir(), du, au, releve);
    }

    @GetMapping("/export")
    ResponseEntity<byte[]> exporter(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au) {
        byte[] csv = comptabilite.exporter(acteur.obtenir(), du, au).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("paiements-" + du + "-" + au + ".csv").build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(csv);
    }
}
