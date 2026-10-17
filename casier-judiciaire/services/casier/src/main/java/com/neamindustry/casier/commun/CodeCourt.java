package com.neamindustry.casier.commun;

import java.util.Locale;

/** BUL-03 : forme canonique d'un code court saisi à la main (majuscules, sans séparateurs, confusions O/0 et I/L/1 corrigées). */
public final class CodeCourt {

    private CodeCourt() {
    }

    public static String canoniser(String saisi) {
        return saisi.toUpperCase(Locale.ROOT).replaceAll("[^0-9A-Z]", "")
                .replace('O', '0').replace('I', '1').replace('L', '1');
    }
}
