package com.neamindustry.casier.identification;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.text.similarity.JaroWinklerSimilarity;

/**
 * IDT-02 : similarité entre deux noms, de 0 à 1, tolérante aux accents, à l'ordre des mots,
 * aux noms composés (avec ou sans trait d'union) et aux variantes orthographiques.
 */
public final class ComparateurNoms {

    private static final JaroWinklerSimilarity JARO_WINKLER = new JaroWinklerSimilarity();

    private ComparateurNoms() {
    }

    public static double similarite(String a, String b) {
        List<String> ma = NormalisationNoms.mots(a);
        List<String> mb = NormalisationNoms.mots(b);
        if (ma.isEmpty() || mb.isEmpty()) {
            return 0;
        }
        double parMots = appariement(ma, mb);
        double accoles = JARO_WINKLER.apply(String.join("", ma.stream().sorted().toList()),
                String.join("", mb.stream().sorted().toList()));
        double colles = JARO_WINKLER.apply(String.join("", ma), String.join("", mb));
        return Math.max(parMots, Math.max(accoles, colles) * (ma.size() == mb.size() ? 1.0 : 0.97));
    }

    private static double sim(String x, String y) {
        if (x.equals(y)) {
            return 1;
        }
        return Math.max(JARO_WINKLER.apply(x, y),
                JARO_WINKLER.apply(NormalisationNoms.phonetique(x), NormalisationNoms.phonetique(y)) * 0.98);
    }

    /** Appariement glouton des mots les plus proches, pondéré par leur longueur ; un mot sans équivalent pénalise. */
    private static double appariement(List<String> a, List<String> b) {
        List<String> restantsA = new ArrayList<>(a);
        List<String> restantsB = new ArrayList<>(b);
        double total = (longueur(a) + longueur(b)) / 2.0;
        double obtenu = 0;
        while (!restantsA.isEmpty() && !restantsB.isEmpty()) {
            double meilleur = -1;
            int ia = 0;
            int ib = 0;
            for (int i = 0; i < restantsA.size(); i++) {
                for (int j = 0; j < restantsB.size(); j++) {
                    double s = sim(restantsA.get(i), restantsB.get(j));
                    if (s > meilleur) {
                        meilleur = s;
                        ia = i;
                        ib = j;
                    }
                }
            }
            obtenu += meilleur * (restantsA.get(ia).length() + restantsB.get(ib).length()) / 2.0;
            restantsA.remove(ia);
            restantsB.remove(ib);
        }
        return Math.min(1, obtenu / total);
    }

    private static int longueur(List<String> mots) {
        return mots.stream().mapToInt(String::length).sum();
    }
}
