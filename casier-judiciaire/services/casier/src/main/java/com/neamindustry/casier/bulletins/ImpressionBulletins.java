package com.neamindustry.casier.bulletins;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.bulletins.interne.DepotBulletins;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;

/**
 * Impression du bulletin au guichet (tableau de bord du validateur) : le greffier en chef valide le bulletin, puis
 * l'imprime sur un feuillet de papier sécurisé numéroté. Une réimpression exige un motif. Tout est journalisé (ENF-12)
 * et conservé en ajout seul (REG-08). Le contenu imprimé est le PDF scellé, identique au document numérique.
 */
@Service
public class ImpressionBulletins {

    private static final int TAILLE_FILE = 200;

    private final DepotBulletins depot;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final Clock horloge;

    ImpressionBulletins(DepotBulletins depot, Habilitations habilitations, JournalAudit journal, Clock horloge) {
        this.depot = depot;
        this.habilitations = habilitations;
        this.journal = journal;
        this.horloge = horloge;
    }

    @Transactional
    public List<BulletinAImprimer> file(Acteur validateur) {
        habilitations.exiger(validateur, Permission.IMPRIMER_BULLETIN);
        journal.enregistrer(EvenementAudit.par(validateur, "FILE_IMPRESSION_CONSULTEE", "Bulletin", null, null, null, Map.of()));
        return depot.fileImpression(TAILLE_FILE).stream()
                .map(l -> new BulletinAImprimer(l.id(), l.numero(), l.nom(), l.prenoms(), l.dateNaissance(), l.dateEmission(),
                        etat(l), l.validePar(), l.valideLe(), l.imprimeLe(), l.feuillet(), l.impressions()))
                .toList();
    }

    private static String etat(DepotBulletins.LigneImpression l) {
        if ("REVOQUE".equals(l.statut())) {
            return "REVOQUE";
        }
        if (l.impressions() > 0) {
            return "IMPRIME";
        }
        return l.valideLe() == null ? "A_VALIDER" : "A_IMPRIMER";
    }

    /** Contrôle du bulletin (identité du demandeur, paiement) avant impression. */
    @Transactional
    public void valider(Acteur validateur, UUID bulletinId) {
        habilitations.exiger(validateur, Permission.IMPRIMER_BULLETIN);
        DepotBulletins.BulletinConserve b = emisB3(bulletinId);
        if (depot.impressionValidee(bulletinId)) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "IMP-01", "Ce bulletin est déjà validé pour l'impression.");
        }
        depot.ajouterImpression(bulletinId, "VALIDATION", validateur.identifiant(), null, null, Instant.now(horloge));
        journal.enregistrer(EvenementAudit.par(validateur, "BULLETIN_VALIDE_POUR_IMPRESSION", "Bulletin", bulletinId.toString(),
                null, null, Map.of("numero", b.numero())));
    }

    /**
     * Impression sur papier sécurisé : renvoie le PDF scellé à imprimer. Le numéro de feuillet est unique ; une
     * réimpression (feuillet abîmé, perdu) exige un motif.
     */
    @Transactional
    public byte[] imprimer(Acteur validateur, UUID bulletinId, String feuillet, String motif) {
        habilitations.exiger(validateur, Permission.IMPRIMER_BULLETIN);
        DepotBulletins.BulletinConserve b = emisB3(bulletinId);
        if (!depot.impressionValidee(bulletinId)) {
            throw new ErreurMetier("IMP-02", "Validez le bulletin avant de l'imprimer.");
        }
        if (feuillet == null || feuillet.isBlank()) {
            throw new ErreurMetier("IMP-03", "Indiquez le numéro du feuillet sécurisé.");
        }
        String numeroFeuillet = feuillet.trim().toUpperCase(java.util.Locale.ROOT);
        if (depot.feuilletUtilise(numeroFeuillet)) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "IMP-03", "Ce feuillet a déjà été utilisé.");
        }
        boolean reimpression = depot.nombreImpressions(bulletinId) > 0;
        if (reimpression && (motif == null || motif.isBlank())) {
            throw new ErreurMetier("IMP-04", "Le motif de la réimpression est obligatoire.");
        }
        byte[] document = depot.document(bulletinId).orElseThrow(() -> new RessourceIntrouvable("Document introuvable."));
        depot.ajouterImpression(bulletinId, reimpression ? "REIMPRESSION" : "IMPRESSION", validateur.identifiant(), numeroFeuillet,
                reimpression ? motif.trim() : null, Instant.now(horloge));
        journal.enregistrer(EvenementAudit.par(validateur, reimpression ? "BULLETIN_REIMPRIME" : "BULLETIN_IMPRIME", "Bulletin",
                bulletinId.toString(), null, reimpression ? motif.trim() : null, Map.of("numero", b.numero(), "feuillet", numeroFeuillet)));
        return document;
    }

    private DepotBulletins.BulletinConserve emisB3(UUID bulletinId) {
        DepotBulletins.BulletinConserve b = depot.parId(bulletinId).orElseThrow(() -> new RessourceIntrouvable("Bulletin introuvable."));
        if (!"B3".equals(b.type())) {
            throw new ErreurMetier("IMP-05", "Seuls les bulletins n°3 s'impriment au guichet.");
        }
        if (!"EMIS".equals(b.statut())) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "BUL-10", "Ce bulletin est révoqué : il ne peut pas être imprimé.");
        }
        return b;
    }
}
