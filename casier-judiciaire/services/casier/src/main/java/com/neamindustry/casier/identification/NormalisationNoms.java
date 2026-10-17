package com.neamindustry.casier.identification;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * IDT-02 : forme comparable d'un nom. Majuscules sans accents, ponctuation et traits d'union remplacés
 * par des espaces, ordre des mots neutralisé pour la clé de recherche.
 */
public final class NormalisationNoms {

    private NormalisationNoms() {
    }

    public static String normaliser(String texte) {
        if (texte == null) {
            return "";
        }
        String sansAccents = Normalizer.normalize(texte, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return sansAccents.toUpperCase(Locale.ROOT)
                .replace('Œ', 'O').replace('Æ', 'A')
                .replaceAll("[^A-Z]+", " ")
                .trim();
    }

    public static List<String> mots(String texte) {
        String n = normaliser(texte);
        return n.isEmpty() ? List.of() : Arrays.asList(n.split(" "));
    }

    /** Clé de recherche indépendante de l'ordre noms/prénoms, utilisée pour l'index trigramme du registre. */
    public static String cleRecherche(String nom, String prenoms) {
        return String.join(" ", mots(nom + " " + prenoms).stream().sorted().toList());
    }

    /** Numéro de pièce (CNIE, passeport) comparable : lettres et chiffres en majuscules uniquement. */
    public static String normaliserPiece(String numero) {
        return numero == null ? null : numero.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
    }

    /**
     * Forme phonétique simplifiée pour les variantes orthographiques et translittérations courantes
     * (MOHAMMED/MOHAMED, PH/F, OU/U, Y/I, lettres doublées).
     */
    public static String phonetique(String mot) {
        String m = mot.replace("PH", "F").replace("OU", "U").replace("Y", "I").replace("W", "V")
                .replace("K", "C").replace("QU", "C").replace("Q", "C").replace("H", "");
        StringBuilder sb = new StringBuilder();
        for (char ch : m.toCharArray()) {
            if (sb.isEmpty() || sb.charAt(sb.length() - 1) != ch) {
                sb.append(ch);
            }
        }
        return sb.toString();
    }
}
