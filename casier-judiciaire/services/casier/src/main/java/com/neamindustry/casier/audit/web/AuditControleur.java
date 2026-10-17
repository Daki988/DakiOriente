package com.neamindustry.casier.audit.web;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.audit.EntreeJournal;
import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.audit.ResultatIntegrite;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.ActeurCourant;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;

/** DSH-11 : contrôle et audit. La lecture du journal est elle-même journalisée (SEC-07). */
@RestController
@RequestMapping("/api/v1/audit")
class AuditControleur {

    private final JournalAudit journal;
    private final Habilitations habilitations;
    private final ActeurCourant acteur;

    AuditControleur(JournalAudit journal, Habilitations habilitations, ActeurCourant acteur) {
        this.journal = journal;
        this.habilitations = habilitations;
        this.acteur = acteur;
    }

    /** ADR 0003 : recalcul de toute la chaîne d'empreintes ; signale la première entrée altérée. */
    @GetMapping("/integrite")
    @Transactional
    ResultatIntegrite integrite() {
        auditeur("JOURNAL_INTEGRITE_VERIFIEE", null);
        return journal.verifierIntegrite();
    }

    @GetMapping("/entrees")
    @Transactional
    List<EntreeJournal> dernieres(@RequestParam(defaultValue = "50") @Min(1) @Max(500) int nombre) {
        auditeur("JOURNAL_CONSULTE", null);
        return journal.dernieres(Math.min(Math.max(nombre, 1), 500));
    }

    /** DSH-01 (à valider) : historique des consultations du casier d'une personne. */
    @GetMapping("/personnes/{personneId}")
    @Transactional
    List<EntreeJournal> parPersonne(@PathVariable String personneId) {
        auditeur("JOURNAL_CONSULTE_PERSONNE", personneId);
        return journal.parPersonneConcernee(personneId);
    }

    private Acteur auditeur(String action, String personne) {
        Acteur a = acteur.obtenir();
        habilitations.exiger(a, Permission.LIRE_JOURNAL_AUDIT);
        journal.enregistrer(EvenementAudit.par(a, action, "Journal", null, personne, null, Map.of()));
        return a;
    }
}
