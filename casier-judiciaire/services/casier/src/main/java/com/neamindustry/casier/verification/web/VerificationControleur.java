package com.neamindustry.casier.verification.web;

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

    VerificationControleur(VerificationPublique verification, LimiteurDebit limiteur) {
        this.verification = verification;
        this.limiteur = limiteur;
    }

    @GetMapping("/jeton/{jeton}")
    ResponseEntity<ResultatVerification> parJeton(@PathVariable String jeton, HttpServletRequest requete) {
        if (!limiteur.autoriser(requete.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.ok(verification.parJeton(jeton));
    }

    @PostMapping("/code")
    ResponseEntity<ResultatVerification> parCode(@RequestBody DemandeParCode demande, HttpServletRequest requete) {
        if (!limiteur.autoriser(requete.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.ok(verification.parCode(demande.code()));
    }
}
