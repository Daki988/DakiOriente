package com.neamindustry.casier.demandes.web;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Set;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.demandes.ParametresPaiement;
import com.neamindustry.casier.demandes.ServiceDemandes;

import tools.jackson.databind.json.JsonMapper;

/**
 * PAY-02 : le paiement n'est confirmé que par une notification serveur signée de l'agrégateur, jamais par le navigateur.
 * La signature HMAC-SHA256 du corps brut est vérifiée en temps constant ; chaque transaction n'est traitée qu'une fois.
 */
@RestController
class PaiementsControleur {

    static final String ENTETE_SIGNATURE = "X-Signature-Casier";

    record Notification(@NotBlank String numeroDossier, @NotBlank String reference, @PositiveOrZero long montantFcfa,
                        @NotNull Instant payeLe) {
    }

    private final ServiceDemandes demandes;
    private final ParametresPaiement parametres;
    private final JsonMapper json;
    private final Validator validateur;

    PaiementsControleur(ServiceDemandes demandes, ParametresPaiement parametres, JsonMapper json, Validator validateur) {
        this.demandes = demandes;
        this.parametres = parametres;
        this.json = json;
        this.validateur = validateur;
    }

    @PostMapping("/api/operateurs/v1/paiements/notifications")
    ResponseEntity<VueTraitement> notification(@RequestBody byte[] corps,
                                               @RequestHeader(value = ENTETE_SIGNATURE, required = false) String signature) {
        String secret = parametres.secretNotifications();
        if (secret == null || secret.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        if (signature == null || !signatureValide(secret, corps, signature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Notification n = json.readValue(corps, Notification.class);
        Set<ConstraintViolation<Notification>> erreurs = validateur.validate(n);
        if (!erreurs.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(VueTraitement.de(
                demandes.confirmerPaiement(n.numeroDossier(), n.reference(), n.montantFcfa(), n.payeLe())));
    }

    static String signer(String secret, byte[] corps) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(corps));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException(e);
        }
    }

    static boolean signatureValide(String secret, byte[] corps, String signature) {
        return MessageDigest.isEqual(signer(secret, corps).getBytes(StandardCharsets.US_ASCII),
                signature.trim().toLowerCase().getBytes(StandardCharsets.US_ASCII));
    }
}
