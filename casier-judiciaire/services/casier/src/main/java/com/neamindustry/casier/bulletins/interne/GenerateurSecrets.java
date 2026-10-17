package com.neamindustry.casier.bulletins.interne;

import java.security.SecureRandom;
import java.util.Base64;

import org.springframework.stereotype.Component;

/** BUL-06, BUL-03 : jeton 256 bits et code court 60 bits, tirés d'un générateur cryptographique (ADR 0004). */
@Component
public class GenerateurSecrets {

    /** Alphabet de Crockford : sans I, L, O, U, pour éviter les confusions à la saisie. */
    static final String CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

    private final SecureRandom aleatoire = new SecureRandom();

    public String jeton() {
        byte[] octets = new byte[32];
        aleatoire.nextBytes(octets);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(octets);
    }

    /** Code de 12 caractères, affiché XXXX-XXXX-XXXX. */
    public String codeCourt() {
        StringBuilder sb = new StringBuilder(14);
        for (int i = 0; i < 12; i++) {
            if (i > 0 && i % 4 == 0) {
                sb.append('-');
            }
            sb.append(CROCKFORD.charAt(aleatoire.nextInt(32)));
        }
        return sb.toString();
    }
}
