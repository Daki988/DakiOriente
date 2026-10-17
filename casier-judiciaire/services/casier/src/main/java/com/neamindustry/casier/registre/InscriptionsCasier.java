package com.neamindustry.casier.registre;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.commun.TypeMention;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;
import com.neamindustry.casier.registre.interne.DepotRegistre;

/**
 * Écriture dans le registre en mode autonome (section 11) : l'agent du casier saisit, le greffier en chef
 * de la même juridiction valide (quatre yeux). Chaque opération est journalisée dans sa transaction.
 */
@Service
public class InscriptionsCasier {

    private final DepotRegistre depot;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final ApplicationEventPublisher evenements;
    private final Clock horloge;

    InscriptionsCasier(DepotRegistre depot, Habilitations habilitations, JournalAudit journal,
                       ApplicationEventPublisher evenements, Clock horloge) {
        this.depot = depot;
        this.habilitations = habilitations;
        this.journal = journal;
        this.evenements = evenements;
        this.horloge = horloge;
    }

    /** REG-01 : saisie d'une condamnation ; elle reste invisible sur les bulletins jusqu'à validation. */
    @Transactional
    public UUID saisir(Acteur agent, SaisieCondamnation s) {
        habilitations.exiger(agent, Permission.SAISIR_INSCRIPTION);
        habilitations.exigerJuridiction(agent, s.juridiction());
        verifierCoherence(s);
        Instant maintenant = Instant.now(horloge);
        UUID personneId = s.personneId();
        if (personneId == null) {
            personneId = UUID.randomUUID();
            depot.insererPersonne(personneId, s.nouvellePersonne(), agent.identifiant(), maintenant);
        } else if (depot.personne(personneId).isEmpty()) {
            throw new RessourceIntrouvable("Fiche introuvable : rapprochez d'abord l'identité (IDT-06).");
        }
        habilitations.exigerSansConflitInterets(agent, personneId);
        CondamnationEnregistree c = new CondamnationEnregistree(UUID.randomUUID(), personneId, 1, null, s.juridiction(),
                s.dateDecision(), s.numeroDecision(), s.infraction(), s.qualification(), s.peines(), s.dateDefinitive(),
                s.referencePieceSource(), StatutInscription.SAISIE, agent.identifiant(), maintenant, null, null, null);
        depot.insererCondamnation(c, null);
        tracer(agent, "CONDAMNATION_SAISIE", c, Map.of("juridiction", s.juridiction(), "decision", s.numeroDecision()));
        return c.id();
    }

    /** REG-08 : une correction crée une nouvelle version ; l'ancienne reste lisible et opposable jusqu'à validation. */
    @Transactional
    public UUID saisirCorrection(Acteur agent, UUID condamnationId, SaisieCondamnation s, String motif) {
        habilitations.exiger(agent, Permission.SAISIR_INSCRIPTION);
        CondamnationEnregistree actuelle = condamnation(condamnationId);
        if (actuelle.statut() != StatutInscription.VALIDEE) {
            throw new ErreurMetier("REG-08", "Seule une inscription validée peut être corrigée.");
        }
        habilitations.exigerJuridiction(agent, actuelle.juridiction());
        habilitations.exigerSansConflitInterets(agent, actuelle.personneId());
        if (motif == null || motif.isBlank()) {
            throw new ErreurMetier("REG-08", "Le motif de la correction est obligatoire.");
        }
        verifierCoherence(s);
        CondamnationEnregistree c = new CondamnationEnregistree(UUID.randomUUID(), actuelle.personneId(),
                actuelle.version() + 1, actuelle.id(), actuelle.juridiction(), s.dateDecision(), s.numeroDecision(),
                s.infraction(), s.qualification(), s.peines(), s.dateDefinitive(), s.referencePieceSource(),
                StatutInscription.SAISIE, agent.identifiant(), Instant.now(horloge), null, null, null);
        depot.insererCondamnation(c, motif);
        tracer(agent, "CORRECTION_SAISIE", c, Map.of("remplace", actuelle.id().toString(), "motif", motif));
        return c.id();
    }

    /** REG-02, HAB-02 : validation par un greffier en chef de la juridiction, distinct de l'agent qui a saisi. */
    @Transactional
    public void valider(Acteur greffier, UUID condamnationId) {
        CondamnationEnregistree c = enAttente(greffier, condamnationId);
        Instant maintenant = Instant.now(horloge);
        if (c.remplaceId() != null) {
            depot.changerStatutCondamnation(condamnation(c.remplaceId()), StatutInscription.REMPLACEE, greffier.identifiant(),
                    maintenant, null);
        }
        depot.changerStatutCondamnation(c, StatutInscription.VALIDEE, greffier.identifiant(), maintenant, null);
        tracer(greffier, c.remplaceId() == null ? "CONDAMNATION_VALIDEE" : "CORRECTION_VALIDEE", c, Map.of());
        evenements.publishEvent(new CondamnationValidee(c.personneId(), c.id()));
    }

    @Transactional
    public void rejeter(Acteur greffier, UUID condamnationId, String motif) {
        CondamnationEnregistree c = enAttente(greffier, condamnationId);
        if (motif == null || motif.isBlank()) {
            throw new ErreurMetier("REG-02", "Le motif du rejet est obligatoire.");
        }
        depot.changerStatutCondamnation(c, StatutInscription.REJETEE, greffier.identifiant(), Instant.now(horloge), motif);
        tracer(greffier, "CONDAMNATION_REJETEE", c, Map.of("motif", motif));
    }

    /** REG-03 : appel, exécution, réhabilitation, amnistie, grâce… suivent le même circuit. */
    @Transactional
    public UUID saisirMention(Acteur agent, UUID condamnationId, TypeMention type, LocalDate dateEffet, String details) {
        habilitations.exiger(agent, Permission.SAISIR_INSCRIPTION);
        CondamnationEnregistree c = condamnation(condamnationId);
        if (c.statut() != StatutInscription.VALIDEE) {
            throw new ErreurMetier("REG-03", "Une mention ne s'ajoute qu'à une condamnation validée.");
        }
        habilitations.exigerJuridiction(agent, c.juridiction());
        habilitations.exigerSansConflitInterets(agent, c.personneId());
        MentionEnregistree m = new MentionEnregistree(UUID.randomUUID(), condamnationId, type, dateEffet, details,
                StatutInscription.SAISIE, agent.identifiant(), null);
        depot.insererMention(m, Instant.now(horloge));
        journal.enregistrer(EvenementAudit.par(agent, "MENTION_SAISIE", "Mention", m.id().toString(),
                c.personneId().toString(), null, Map.of("type", type.name(), "condamnation", condamnationId.toString())));
        return m.id();
    }

    @Transactional
    public void validerMention(Acteur greffier, UUID mentionId) {
        habilitations.exiger(greffier, Permission.VALIDER_INSCRIPTION);
        MentionEnregistree m = depot.mention(mentionId).orElseThrow(() -> new RessourceIntrouvable("Mention introuvable."));
        if (m.statut() != StatutInscription.SAISIE) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "REG-03", "Cette mention n'est plus en attente de validation.");
        }
        CondamnationEnregistree c = condamnation(m.condamnationId());
        habilitations.exigerJuridiction(greffier, c.juridiction());
        habilitations.exigerQuatreYeux(m.saisiePar(), greffier);
        habilitations.exigerSansConflitInterets(greffier, c.personneId());
        depot.changerStatutMention(m, StatutInscription.VALIDEE, greffier.identifiant(), Instant.now(horloge));
        journal.enregistrer(EvenementAudit.par(greffier, "MENTION_VALIDEE", "Mention", m.id().toString(),
                c.personneId().toString(), null, Map.of("type", m.type().name())));
        evenements.publishEvent(new CondamnationValidee(c.personneId(), c.id()));
    }

    /** RG-07 : une contestation ouverte bloque toute émission automatique sur la fiche. */
    @Transactional
    public UUID ouvrirContestation(Acteur agent, UUID personneId, String motif) {
        habilitations.exiger(agent, Permission.TRAITER_CAS_DOUTEUX);
        UUID id = UUID.randomUUID();
        depot.ouvrirBlocage(id, personneId, "Contestation en cours : " + motif, agent.identifiant(), Instant.now(horloge));
        journal.enregistrer(EvenementAudit.par(agent, "CONTESTATION_OUVERTE", "Fiche", personneId.toString(),
                personneId.toString(), motif, Map.of()));
        return id;
    }

    @Transactional
    public void cloreContestation(Acteur greffier, UUID blocageId, UUID personneId) {
        habilitations.exiger(greffier, Permission.VALIDER_INSCRIPTION);
        if (depot.clore(blocageId, greffier.identifiant(), Instant.now(horloge)) != 1) {
            throw new RessourceIntrouvable("Contestation introuvable ou déjà close.");
        }
        journal.enregistrer(EvenementAudit.par(greffier, "CONTESTATION_CLOSE", "Fiche", personneId.toString(),
                personneId.toString(), null, Map.of()));
    }

    private CondamnationEnregistree enAttente(Acteur greffier, UUID id) {
        habilitations.exiger(greffier, Permission.VALIDER_INSCRIPTION);
        CondamnationEnregistree c = condamnation(id);
        if (c.statut() != StatutInscription.SAISIE) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "REG-02", "Cette inscription n'est plus en attente de validation.");
        }
        habilitations.exigerJuridiction(greffier, c.juridiction());
        habilitations.exigerQuatreYeux(c.saisiePar(), greffier);
        habilitations.exigerSansConflitInterets(greffier, c.personneId());
        return c;
    }

    private CondamnationEnregistree condamnation(UUID id) {
        return depot.condamnation(id).orElseThrow(() -> new RessourceIntrouvable("Condamnation introuvable."));
    }

    private void verifierCoherence(SaisieCondamnation s) {
        if ((s.personneId() == null) == (s.nouvellePersonne() == null)) {
            throw new ErreurMetier("REG-01", "Indiquez soit une fiche existante, soit l'identité d'une nouvelle personne.");
        }
        if (s.dateDecision().isAfter(LocalDate.now(horloge))) {
            throw new ErreurMetier("REG-01", "La date de décision ne peut pas être dans le futur.");
        }
        if (s.dateDefinitive() != null && s.dateDefinitive().isBefore(s.dateDecision())) {
            throw new ErreurMetier("REG-01", "La date du caractère définitif ne peut précéder la décision.");
        }
    }

    private void tracer(Acteur acteur, String action, CondamnationEnregistree c, Map<String, String> details) {
        journal.enregistrer(EvenementAudit.par(acteur, action, "Condamnation", c.id().toString(), c.personneId().toString(),
                null, details));
    }
}
