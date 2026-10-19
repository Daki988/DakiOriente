package com.neamindustry.casier.demandes;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;

/**
 * Tableau du comptable (R10) : paiements encaissés sur une période, synthèse par moyen de paiement et rapprochement
 * avec un relevé du Trésor ou d'un opérateur. Lecture seule : aucun paiement n'est modifié ici.
 */
@Service
public class Comptabilite {

    private static final ZoneId LIBREVILLE = ZoneId.of("Africa/Libreville");
    private static final int PERIODE_MAX_JOURS = 366;

    /** Paiement encaissé, rattaché à un dossier. */
    public record PaiementEncaisse(String numeroDossier, String reference, String moyen, long montantFcfa, Instant payeLe,
                                   boolean tarifProvisoire) {
    }

    /** Synthèse des recettes d'une période. */
    public record Synthese(LocalDate du, LocalDate au, long nombre, long totalFcfa, Map<String, Long> totalParMoyen,
                           Map<String, Long> nombreParMoyen) {
    }

    /** Ligne d'écart du rapprochement. */
    public record Ecart(String reference, Long montantPlateforme, Long montantReleve, String nature) {
    }

    /** Résultat du rapprochement : lignes concordantes et écarts à examiner. */
    public record Rapprochement(LocalDate du, LocalDate au, int lignesReleve, int concordantes, long totalReleveFcfa,
                                long totalPlateformeFcfa, List<Ecart> ecarts) {
    }

    private final JdbcClient jdbc;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final Clock horloge;

    Comptabilite(JdbcClient jdbc, Habilitations habilitations, JournalAudit journal, Clock horloge) {
        this.jdbc = jdbc;
        this.habilitations = habilitations;
        this.journal = journal;
        this.horloge = horloge;
    }

    @Transactional(readOnly = true)
    public List<PaiementEncaisse> paiements(Acteur comptable, LocalDate du, LocalDate au) {
        habilitations.exiger(comptable, Permission.GERER_PAIEMENTS);
        verifierPeriode(du, au);
        return lire(du, au);
    }

    @Transactional(readOnly = true)
    public Synthese synthese(Acteur comptable, LocalDate du, LocalDate au) {
        habilitations.exiger(comptable, Permission.GERER_PAIEMENTS);
        verifierPeriode(du, au);
        Map<String, Long> total = new TreeMap<>();
        Map<String, Long> nombre = new TreeMap<>();
        long somme = 0;
        List<PaiementEncaisse> liste = lire(du, au);
        for (PaiementEncaisse p : liste) {
            total.merge(p.moyen(), p.montantFcfa(), Long::sum);
            nombre.merge(p.moyen(), 1L, Long::sum);
            somme += p.montantFcfa();
        }
        return new Synthese(du, au, liste.size(), somme, total, nombre);
    }

    /**
     * Rapproche un relevé (une ligne « référence;montant » par paiement, en-tête facultatif) avec les paiements
     * enregistrés sur la période. La consultation est journalisée.
     */
    @Transactional
    public Rapprochement rapprocher(Acteur comptable, LocalDate du, LocalDate au, String releve) {
        habilitations.exiger(comptable, Permission.GERER_PAIEMENTS);
        verifierPeriode(du, au);
        Map<String, Long> lignes = lireReleve(releve);
        Map<String, Long> plateforme = new HashMap<>();
        long totalPlateforme = 0;
        for (PaiementEncaisse p : lire(du, au)) {
            plateforme.put(cle(p.reference()), p.montantFcfa());
            totalPlateforme += p.montantFcfa();
        }
        List<Ecart> ecarts = new ArrayList<>();
        int concordantes = 0;
        long totalReleve = 0;
        for (var l : lignes.entrySet()) {
            totalReleve += l.getValue();
            Long montant = plateforme.get(l.getKey());
            if (montant == null) {
                ecarts.add(new Ecart(l.getKey(), null, l.getValue(), "ABSENT_DE_LA_PLATEFORME"));
            } else if (!montant.equals(l.getValue())) {
                ecarts.add(new Ecart(l.getKey(), montant, l.getValue(), "MONTANT_DIFFERENT"));
            } else {
                concordantes++;
            }
        }
        for (var p : plateforme.entrySet()) {
            if (!lignes.containsKey(p.getKey())) {
                ecarts.add(new Ecart(p.getKey(), p.getValue(), null, "ABSENT_DU_RELEVE"));
            }
        }
        journal.enregistrer(EvenementAudit.par(comptable, "RAPPROCHEMENT_PAIEMENTS", "Paiements", du + "/" + au, null, null,
                Map.of("lignes", String.valueOf(lignes.size()), "ecarts", String.valueOf(ecarts.size()))));
        return new Rapprochement(du, au, lignes.size(), concordantes, totalReleve, totalPlateforme, ecarts);
    }

    /** Export CSV (séparateur point-virgule) pour la comptabilité publique. L'export est journalisé. */
    @Transactional
    public String exporter(Acteur comptable, LocalDate du, LocalDate au) {
        List<PaiementEncaisse> liste = paiements(comptable, du, au);
        StringBuilder csv = new StringBuilder("numero_dossier;reference;moyen;montant_fcfa;paye_le;tarif_provisoire\n");
        for (PaiementEncaisse p : liste) {
            csv.append(p.numeroDossier()).append(';').append(p.reference()).append(';').append(p.moyen()).append(';')
                    .append(p.montantFcfa()).append(';').append(p.payeLe()).append(';').append(p.tarifProvisoire() ? "oui" : "non").append('\n');
        }
        journal.enregistrer(EvenementAudit.par(comptable, "PAIEMENTS_EXPORTES", "Paiements", du + "/" + au, null, null,
                Map.of("lignes", String.valueOf(liste.size()))));
        return csv.toString();
    }

    private List<PaiementEncaisse> lire(LocalDate du, LocalDate au) {
        return jdbc.sql("""
                        select numero_dossier, reference_paiement, montant_fcfa, paye_le, tarif_provisoire from demandes.demande
                        where reference_paiement is not null and paye_le >= :debut and paye_le < :fin
                        order by paye_le, numero_dossier""")
                .param("debut", Timestamp.from(du.atStartOfDay(LIBREVILLE).toInstant()))
                .param("fin", Timestamp.from(au.plusDays(1).atStartOfDay(LIBREVILLE).toInstant()))
                .query((rs, i) -> new PaiementEncaisse(rs.getString("numero_dossier"), rs.getString("reference_paiement"),
                        moyen(rs.getString("reference_paiement")), rs.getLong("montant_fcfa"), rs.getTimestamp("paye_le").toInstant(),
                        rs.getBoolean("tarif_provisoire")))
                .list();
    }

    static String moyen(String reference) {
        if (reference.startsWith("TRESOR-")) {
            return "TRESOR";
        }
        if (reference.startsWith("SIMULATEUR-")) {
            return "SIMULATION";
        }
        return "OPERATEUR";
    }

    static Map<String, Long> lireReleve(String releve) {
        Map<String, Long> lignes = new LinkedHashMap<>();
        if (releve == null) {
            return lignes;
        }
        int numero = 0;
        for (String brute : releve.split("\\R")) {
            numero++;
            String ligne = brute.strip();
            if (ligne.isEmpty()) {
                continue;
            }
            String[] champs = ligne.split("[;,\\t]");
            if (champs.length < 2) {
                throw new ErreurMetier("CPT-01", "Ligne " + numero + " du relevé illisible : « référence;montant » attendu.");
            }
            String montant = champs[1].strip().replaceAll("[\\s\\u00a0\\u202f]", "");
            if (!montant.matches("\\d{1,12}")) {
                if (numero == 1) {
                    continue; // ligne d'en-tête
                }
                throw new ErreurMetier("CPT-01", "Ligne " + numero + " du relevé : montant invalide.");
            }
            String cle = cle(champs[0]);
            if (lignes.put(cle, Long.parseLong(montant)) != null) {
                throw new ErreurMetier("CPT-01", "La référence " + cle + " figure deux fois dans le relevé.");
            }
        }
        if (lignes.isEmpty()) {
            throw new ErreurMetier("CPT-01", "Le relevé ne contient aucune ligne de paiement.");
        }
        return lignes;
    }

    private static String cle(String reference) {
        return reference.strip().toUpperCase(Locale.ROOT);
    }

    private void verifierPeriode(LocalDate du, LocalDate au) {
        if (du == null || au == null || au.isBefore(du)) {
            throw new ErreurMetier("CPT-02", "La période est invalide : la date de fin précède la date de début.");
        }
        if (du.plusDays(PERIODE_MAX_JOURS).isBefore(au)) {
            throw new ErreurMetier("CPT-02", "La période ne peut dépasser un an.");
        }
        if (du.isAfter(LocalDate.now(horloge.withZone(LIBREVILLE)))) {
            throw new ErreurMetier("CPT-02", "La période commence dans le futur.");
        }
    }
}
