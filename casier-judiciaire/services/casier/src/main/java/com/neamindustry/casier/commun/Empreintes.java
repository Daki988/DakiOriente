package com.neamindustry.casier.commun;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/** Empreintes SHA-256 (REG-09, SEC-07, BUL-06). */
public final class Empreintes {

    private Empreintes() {
    }

    public static String sha256(String texte) {
        return sha256(texte.getBytes(StandardCharsets.UTF_8));
    }

    public static String sha256(byte[] octets) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(octets));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }

    /** Joint des champs avec un séparateur non imprimable : aucune ambiguïté de concaténation. */
    public static String canonique(Object... champs) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < champs.length; i++) {
            if (i > 0) {
                sb.append('\u001F');
            }
            sb.append(champs[i] == null ? "" : champs[i].toString());
        }
        return sb.toString();
    }
}
