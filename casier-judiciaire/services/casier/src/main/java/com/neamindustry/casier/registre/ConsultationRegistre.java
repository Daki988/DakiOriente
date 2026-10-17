package com.neamindustry.casier.registre;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.habilitations.AccesRefuse;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.MatriceHabilitations;
import com.neamindustry.casier.habilitations.Permission;
import com.neamindustry.casier.identification.ProfilIdentite;

/**
 * Consultation du registre par les agents du casier et les greffiers en chef (DSH-05, DSH-06).
 * Chaque consultation est journalisée dans la même transaction, avec son motif (ENF-12, SEC-07).
 */
@Service
public class ConsultationRegistre {

    private final RegistreLecture lecture;
    private final Habilitations habilitations;
    private final JournalAudit journal;

    private final com.neamindustry.casier.registre.interne.DepotRegistre depot;

    ConsultationRegistre(RegistreLecture lecture, Habilitations habilitations, JournalAudit journal,
                         com.neamindustry.casier.registre.interne.DepotRegistre depot) {
        this.depot = depot;
        this.lecture = lecture;
        this.habilitations = habilitations;
        this.journal = journal;
    }

    @Transactional
    public FicheCasier fiche(Acteur agent, UUID personneId, String motif) {
        exigerAgentDuCasier(agent, motif);
        habilitations.exigerSansConflitInterets(agent, personneId);
        FicheCasier fiche = lecture.fiche(personneId).orElseThrow(() -> new RessourceIntrouvable("Fiche introuvable."));
        journal.enregistrer(EvenementAudit.par(agent, "FICHE_CONSULTEE", "Fiche", personneId.toString(), personneId.toString(),
                motif, Map.of()));
        return fiche;
    }

    /** IDT-01 : recherche multicritère ; seules les identités sont rendues, jamais les condamnations (DON-02). */
    @Transactional
    public List<ProfilIdentite> rechercher(Acteur agent, String nom, String prenoms, LocalDate dateNaissance, String cnie,
                                           String passeport, String motif) {
        exigerAgentDuCasier(agent, motif);
        List<ProfilIdentite> resultats = lecture.candidats(nom, prenoms, dateNaissance, cnie, passeport);
        journal.enregistrer(EvenementAudit.par(agent, "REGISTRE_RECHERCHE", "Registre", null, null, motif,
                Map.of("resultats", String.valueOf(resultats.size()))));
        return resultats;
    }

    /** DSH-06 : validations en attente dans la juridiction du greffier en chef (toutes pour la direction centrale). */
    @Transactional(readOnly = true)
    public List<InscriptionEnAttente> enAttente(Acteur greffier) {
        habilitations.exiger(greffier, Permission.VALIDER_INSCRIPTION);
        String juridiction = greffier.aLeRole(com.neamindustry.casier.habilitations.Role.R08) ? null : greffier.juridiction();
        return depot.condamnationsEnAttente(juridiction).stream().map(e -> {
            CondamnationEnregistree c = e.condamnation();
            return new InscriptionEnAttente(c.id(), c.personneId(), e.identite().nom(), e.identite().prenoms(),
                    e.identite().dateNaissance(), c.version(), c.remplaceId(), c.juridiction(), c.dateDecision(), c.numeroDecision(),
                    c.infraction(), c.qualification(), c.peines(), c.saisiePar(), c.saisieLe(), c.saisiePar().equals(greffier.identifiant()));
        }).toList();
    }

    private static void exigerAgentDuCasier(Acteur agent, String motif) {
        if (!MatriceHabilitations.autorise(agent.roles(), Permission.TRAITER_CAS_DOUTEUX)
                && !MatriceHabilitations.autorise(agent.roles(), Permission.VALIDER_INSCRIPTION)) {
            throw new AccesRefuse("HAB-01", "Votre profil ne permet pas de consulter le registre.");
        }
        if (motif == null || motif.isBlank()) {
            throw new AccesRefuse("SEC-07", "Indiquez le motif de la consultation (numéro de dossier ou de procédure).");
        }
    }
}
