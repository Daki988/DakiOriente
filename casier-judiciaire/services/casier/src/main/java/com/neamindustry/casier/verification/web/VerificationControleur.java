package com.neamindustry.casier.verification.web;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.neamindustry.casier.bulletins.EmissionBulletins;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.commun.LimiteurDebit;
import com.neamindustry.casier.verification.ResultatVerification;
import com.neamindustry.casier.verification.VerificationPublique;

import jakarta.servlet.http.HttpServletRequest;

/** PUB-08 : points d'accès publics de vérification, sans compte (R14). */
@RestController
@RequestMapping("/api/public/v1/verifications")
class VerificationControleur {

    record DemandeParCode(String code) {
    }

    private final VerificationPublique verification;
    private final LimiteurDebit limiteur;
    private final EmissionBulletins bulletins;

    VerificationControleur(VerificationPublique verification, LimiteurDebit limiteur, EmissionBulletins bulletins) {
        this.verification = verification;
        this.limiteur = limiteur;
        this.bulletins = bulletins;
    }

    @GetMapping("/jeton/{jeton}")
    ResponseEntity<ResultatVerification> parJeton(@PathVariable String jeton, HttpServletRequest requete) {
        if (!limiteur.autoriser(requete.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.ok(verification.parJeton(jeton));
    }

    /** Résultat du contrôle d'un PDF déposé (BUL-08) : intégrité du fichier, puis statut du bulletin. */
    record ResultatDocument(boolean integre, ResultatVerification resultat) {
    }

    /**
     * BUL-08 : le vérificateur dépose le PDF ; le sceau et l'intégrité sont contrôlés, puis le bulletin est recherché.
     * Le fichier est analysé en mémoire et jamais conservé.
     */
    @PostMapping(path = "/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<ResultatDocument> parDocument(@RequestParam("fichier") MultipartFile fichier, HttpServletRequest requete)
            throws java.io.IOException {
        if (!limiteur.autoriser(requete.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        if (fichier.isEmpty() || fichier.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(bulletins.controlerDocument(fichier.getBytes())
                .map(j -> new ResultatDocument(true, verification.parJeton(j)))
                .orElseGet(() -> new ResultatDocument(false, ResultatVerification.inconnu())));
    }

    @PostMapping("/code")
    ResponseEntity<ResultatVerification> parCode(@RequestBody DemandeParCode demande, HttpServletRequest requete) {
        if (!limiteur.autoriser(requete.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.ok(verification.parCode(demande.code()));
    }
}
