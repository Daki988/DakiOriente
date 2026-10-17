package com.neamindustry.casier.identification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.neamindustry.casier.identification.ResultatRapprochement.Issue;
import com.neamindustry.casier.identification.ResultatRapprochement.ScoreCandidat;

/**
 * IDT-01 à IDT-03 : rapprochement multicritère d'une identité déclarée avec les fiches candidates.
 * Règle de prudence (RG-06) : une absence n'est certaine que si aucune fiche ne correspond, même partiellement ;
 * un homonyme (noms très proches) est toujours un cas douteux, quelle que soit la date de naissance.
 */
@Service
public class Rapprochement {

    private static final double POIDS_NOMS = 0.45;
    private static final double POIDS_DATE = 0.35;
    private static final double POIDS_LIEU = 0.10;
    private static final double POIDS_FILIATION = 0.10;

    private final SeuilsIdentification seuils;

    public Rapprochement(SeuilsIdentification seuils) {
        this.seuils = seuils;
    }

    public ResultatRapprochement rapprocher(ProfilIdentite demandeur, List<ProfilIdentite> candidats) {
        if (candidats.isEmpty()) {
            return new ResultatRapprochement(Issue.ABSENCE_CERTAINE, null, List.of(), "Aucune fiche candidate dans le registre.");
        }
        List<ScoreCandidat> scores = candidats.stream()
                .map(c -> evaluer(demandeur, c))
                .sorted(Comparator.comparingDouble(ScoreCandidat::score).reversed())
                .toList();
        ScoreCandidat meilleur = scores.getFirst();
        List<ScoreCandidat> partiels = scores.stream()
                .filter(s -> s.score() >= seuils.doute() || s.similariteNoms() >= seuils.nomSeul())
                .toList();

        if (partiels.isEmpty()) {
            return new ResultatRapprochement(Issue.ABSENCE_CERTAINE, null, scores, String.format(Locale.ROOT,
                    "Aucune fiche ne correspond, même partiellement : meilleur score %.2f (seuil %.2f), noms les plus proches %.2f (seuil %.2f).",
                    meilleur.score(), seuils.doute(), maxNoms(scores), seuils.nomSeul()));
        }
        double second = scores.size() > 1 ? scores.get(1).score() : 0;
        boolean certain = meilleur.score() >= seuils.certitude() && meilleur.dateNaissanceExacte()
                && meilleur.score() - second >= seuils.ecartMinimal();
        if (certain) {
            return new ResultatRapprochement(Issue.CORRESPONDANCE_CERTAINE, meilleur.reference(), scores, String.format(Locale.ROOT,
                    "Correspondance certaine avec la fiche %s : score %.2f (seuil %.2f), écart %.2f avec le candidat suivant.",
                    meilleur.reference(), meilleur.score(), seuils.certitude(), meilleur.score() - second));
        }
        String raison;
        if (meilleur.score() >= seuils.certitude() && !meilleur.dateNaissanceExacte()) {
            raison = "date de naissance non identique";
        } else if (meilleur.score() >= seuils.certitude()) {
            raison = "plusieurs fiches trop proches";
        } else if (meilleur.similariteNoms() >= seuils.nomSeul()) {
            raison = "homonymie ou identité proche";
        } else {
            raison = "correspondance partielle";
        }
        return new ResultatRapprochement(Issue.CAS_DOUTEUX, null, scores, String.format(Locale.ROOT,
                "Cas douteux (%s) : %d fiche(s) en correspondance partielle, meilleur score %.2f. Décision réservée à un agent (IDT-06).",
                raison, partiels.size(), meilleur.score()));
    }

    ScoreCandidat evaluer(ProfilIdentite d, ProfilIdentite c) {
        List<String> details = new ArrayList<>();
        double noms = similariteNoms(d, c);
        details.add(String.format(Locale.ROOT, "noms %.2f", noms));
        double somme = POIDS_NOMS * noms;
        double poids = POIDS_NOMS;

        Double date = similariteDates(d.dateNaissance(), c.dateNaissance());
        if (date != null) {
            somme += POIDS_DATE * date;
            poids += POIDS_DATE;
            details.add(String.format(Locale.ROOT, "date de naissance %.2f", date));
        }
        if (renseigne(d.lieuNaissance()) && renseigne(c.lieuNaissance())) {
            double lieu = ComparateurNoms.similarite(d.lieuNaissance(), c.lieuNaissance());
            somme += POIDS_LIEU * lieu;
            poids += POIDS_LIEU;
            details.add(String.format(Locale.ROOT, "lieu de naissance %.2f", lieu));
        }
        Double filiation = similariteFiliation(d, c);
        if (filiation != null) {
            somme += POIDS_FILIATION * filiation;
            poids += POIDS_FILIATION;
            details.add(String.format(Locale.ROOT, "filiation %.2f", filiation));
        }
        double score = somme / poids;
        boolean dateExacte = date != null && date == 1.0;

        boolean memePiece = identique(d.numeroCnie(), c.numeroCnie()) || identique(d.numeroPasseport(), c.numeroPasseport());
        boolean piecesDifferentes = different(d.numeroCnie(), c.numeroCnie()) || different(d.numeroPasseport(), c.numeroPasseport());
        if (memePiece) {
            if (noms >= seuils.nomSeul() && dateExacte) {
                score = Math.max(score, 0.97);
                details.add("numéro de pièce identique");
            } else {
                score = Math.min(Math.max(score, seuils.doute()), seuils.certitude() - 0.01);
                details.add("numéro de pièce identique mais identité incohérente");
            }
        } else if (piecesDifferentes) {
            score = Math.min(score, seuils.certitude() - 0.01);
            details.add("numéros de pièce différents");
        }
        return new ScoreCandidat(c.reference(), arrondi(score), arrondi(noms), dateExacte, details);
    }

    /** Meilleure similarité entre l'identité déclarée et le nom principal ou un alias connu du candidat. */
    static double similariteNoms(ProfilIdentite d, ProfilIdentite c) {
        String completD = d.nom() + " " + Objects.toString(d.prenoms(), "");
        double meilleure = ComparateurNoms.similarite(completD, c.nom() + " " + Objects.toString(c.prenoms(), ""));
        if (renseigne(d.prenoms()) && renseigne(c.prenoms())) {
            double separee = 0.55 * ComparateurNoms.similarite(d.nom(), c.nom())
                    + 0.45 * ComparateurNoms.similarite(d.prenoms(), c.prenoms());
            meilleure = Math.max(meilleure, separee);
        }
        for (String alias : c.alias()) {
            meilleure = Math.max(meilleure, ComparateurNoms.similarite(completD, alias));
        }
        return meilleure;
    }

    /** Tolère les erreurs de saisie fréquentes : jour et mois inversés, année décalée d'un an. */
    static Double similariteDates(LocalDate a, LocalDate b) {
        if (a == null || b == null) {
            return null;
        }
        if (a.equals(b)) {
            return 1.0;
        }
        if (a.getYear() == b.getYear() && a.getDayOfMonth() == b.getMonthValue() && a.getMonthValue() == b.getDayOfMonth()) {
            return 0.7;
        }
        if (a.getYear() == b.getYear() && a.getMonthValue() == b.getMonthValue()) {
            return 0.5;
        }
        if (Math.abs(a.getYear() - b.getYear()) == 1 && a.getMonthValue() == b.getMonthValue()
                && a.getDayOfMonth() == b.getDayOfMonth()) {
            return 0.5;
        }
        return a.getYear() == b.getYear() ? 0.25 : 0.0;
    }

    private static Double similariteFiliation(ProfilIdentite d, ProfilIdentite c) {
        double total = 0;
        int n = 0;
        if (renseigne(d.nomPere()) && renseigne(c.nomPere())) {
            total += ComparateurNoms.similarite(d.nomPere(), c.nomPere());
            n++;
        }
        if (renseigne(d.nomMere()) && renseigne(c.nomMere())) {
            total += ComparateurNoms.similarite(d.nomMere(), c.nomMere());
            n++;
        }
        return n == 0 ? null : total / n;
    }

    private static double maxNoms(List<ScoreCandidat> scores) {
        return scores.stream().mapToDouble(ScoreCandidat::similariteNoms).max().orElse(0);
    }

    private static boolean renseigne(String s) {
        return s != null && !s.isBlank();
    }

    private static boolean identique(String a, String b) {
        return renseigne(a) && renseigne(b) && NormalisationNoms.normaliserPiece(a).equals(NormalisationNoms.normaliserPiece(b));
    }

    private static boolean different(String a, String b) {
        return renseigne(a) && renseigne(b) && !NormalisationNoms.normaliserPiece(a).equals(NormalisationNoms.normaliserPiece(b));
    }

    private static double arrondi(double v) {
        return Math.round(v * 1000) / 1000.0;
    }
}
