package com.neamindustry.casier.bulletins;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.bulletins.interne.DepotBulletins;
import com.neamindustry.casier.bulletins.interne.GenerateurSecrets;
import com.neamindustry.casier.commun.CodeCourt;
import com.neamindustry.casier.commun.Empreintes;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.commun.TypeBulletin;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;
import com.neamindustry.casier.regles.CondamnationPourCalcul;
import com.neamindustry.casier.regles.JeuDeRegles;
import com.neamindustry.casier.regles.MoteurDeRegles;
import com.neamindustry.casier.regles.ResultatCalcul;
import com.neamindustry.casier.registre.CondamnationEnregistree;
import com.neamindustry.casier.registre.FicheCasier;
import com.neamindustry.casier.registre.RegistreLecture;

/**
 * Émission et consultation des bulletins (section 6). Le contenu est toujours calculé par le moteur de règles ;
 * aucune émission n'a lieu sur une fiche bloquée (RG-07). Chaque émission ou consultation est journalisée avec sa finalité.
 */
@Service
public class EmissionBulletins {

    private final RegistreLecture registre;
    private final MoteurDeRegles moteur;
    private final DepotBulletins depot;
    private final GenerateurSecrets secrets;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final ApplicationEventPublisher evenements;
    private final Clock horloge;

    EmissionBulletins(RegistreLecture registre, MoteurDeRegles moteur, DepotBulletins depot, GenerateurSecrets secrets,
                      Habilitations habilitations, JournalAudit journal, ApplicationEventPublisher evenements, Clock horloge) {
        this.registre = registre;
        this.moteur = moteur;
        this.depot = depot;
        this.secrets = secrets;
        this.habilitations = habilitations;
        this.journal = journal;
        this.evenements = evenements;
        this.horloge = horloge;
    }

    /**
     * Bulletin n°3 au profit de la personne elle-même (RG-01), décidé par le traitement automatique ou par un agent.
     * La personne et son identité ont été établies en amont par le rapprochement (section 12).
     *
     * @param personneId fiche rapprochée, ou {@code null} si aucune fiche ne correspond (bulletin « néant », RG-06)
     */
    @Transactional
    public BulletinDelivre emettreB3(Acteur decideur, UUID demandeId, UUID personneId, IdentiteSurBulletin identite) {
        return emettre(decideur, TypeBulletin.B3, demandeId, personneId, identite, null);
    }

    /** RG-02 : bulletin n°2 délivré à une administration habilitée, pour une finalité autorisée. */
    @Transactional
    public BulletinDelivre delivrerB2(Acteur agent, UUID personneId, IdentiteSurBulletin identite, String codeFinalite) {
        habilitations.exigerFinaliteB2(agent, codeFinalite, LocalDate.now(horloge));
        habilitations.exigerSansConflitInterets(agent, personneId);
        return emettre(agent, TypeBulletin.B2, null, personneId, identite, codeFinalite);
    }

    /** RG-03 : bulletin n°1, consulté par un magistrat ou le Parquet avec un numéro de procédure. */
    @Transactional
    public ContenuBulletin consulterB1(Acteur magistrat, UUID personneId, String numeroProcedure) {
        habilitations.exiger(magistrat, Permission.CONSULTER_B1);
        if (numeroProcedure == null || numeroProcedure.isBlank()) {
            throw new ErreurMetier("RG-03", "Le numéro de procédure est obligatoire pour consulter le bulletin n°1.");
        }
        habilitations.exigerSansConflitInterets(magistrat, personneId);
        FicheCasier fiche = fiche(personneId);
        ContenuBulletin contenu = calculer(TypeBulletin.B1, fiche, identite(fiche));
        journal.enregistrer(EvenementAudit.par(magistrat, "B1_CONSULTE", "Fiche", personneId.toString(), personneId.toString(),
                numeroProcedure, Map.of("neant", String.valueOf(contenu.neant()), "versionRegles", String.valueOf(contenu.versionRegles()))));
        return contenu;
    }

    /** BUL-10 : révocation motivée par un greffier en chef ; l'usager est prévenu (NOT, lot suivant). */
    @Transactional
    public void revoquer(Acteur greffier, UUID bulletinId, String motif) {
        habilitations.exiger(greffier, Permission.REVOQUER_BULLETIN);
        if (motif == null || motif.isBlank()) {
            throw new ErreurMetier("BUL-10", "Le motif de la révocation est obligatoire.");
        }
        DepotBulletins.BulletinConserve b = depot.parId(bulletinId).orElseThrow(() -> new RessourceIntrouvable("Bulletin introuvable."));
        Instant maintenant = Instant.now(horloge);
        if (depot.revoquer(bulletinId, greffier.identifiant(), maintenant, motif) != 1) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "BUL-10", "Ce bulletin est déjà révoqué.");
        }
        journal.enregistrer(EvenementAudit.par(greffier, "BULLETIN_REVOQUE", "Bulletin", bulletinId.toString(),
                b.personneId() == null ? null : b.personneId().toString(), motif, Map.of("numero", b.numero())));
        evenements.publishEvent(new BulletinRevoque(bulletinId, b.empreinteJeton(), maintenant));
    }

    @Transactional(readOnly = true)
    public ContenuBulletin contenu(UUID bulletinId) {
        return depot.contenu(bulletinId).orElseThrow(() -> new RessourceIntrouvable("Bulletin introuvable."));
    }

    private BulletinDelivre emettre(Acteur decideur, TypeBulletin type, UUID demandeId, UUID personneId,
                                    IdentiteSurBulletin identite, String finalite) {
        ContenuBulletin contenu;
        if (personneId == null) {
            JeuDeRegles jeu = moteur.enVigueur(LocalDate.now(horloge));
            contenu = new ContenuBulletin(type, Instant.now(horloge), identite, List.of(), jeu.version(), jeu.contenu().reference());
        } else {
            FicheCasier fiche = fiche(personneId);
            if (fiche.bloquee()) {
                throw new ErreurMetier("RG-07", "Émission impossible : " + String.join(", ", fiche.motifsBlocage()) + ".");
            }
            contenu = calculer(type, fiche, identite);
        }
        Instant emission = contenu.etatDuCasierAu();
        Instant expiration = emission.plus(Duration.ofDays(moteur.dureeValiditeJours(type, LocalDate.now(horloge))));
        String jeton = secrets.jeton();
        String code = secrets.codeCourt();
        String empreinteJeton = Empreintes.sha256(jeton);
        String empreinteCode = Empreintes.sha256(CodeCourt.canoniser(code));
        UUID id = UUID.randomUUID();
        String numero = String.format("%s-%d-%07d", type.name(), LocalDate.now(horloge).getYear(), depot.prochainNumero());
        depot.inserer(id, numero, demandeId, personneId, contenu, empreinteJeton, empreinteCode, emission, expiration,
                decideur.identifiant(), finalite);

        Map<String, String> details = new HashMap<>();
        details.put("numero", numero);
        details.put("neant", String.valueOf(contenu.neant()));
        details.put("versionRegles", String.valueOf(contenu.versionRegles()));
        if (demandeId != null) {
            details.put("demande", demandeId.toString());
        }
        journal.enregistrer(EvenementAudit.par(decideur, type.name() + "_EMIS", "Bulletin", id.toString(),
                personneId == null ? null : personneId.toString(), finalite, details));
        evenements.publishEvent(new BulletinEmis(id, numero, type, empreinteJeton, empreinteCode, emission, expiration,
                identite.nom(), identite.prenoms(), identite.dateNaissance()));
        return new BulletinDelivre(id, numero, jeton, code, emission, expiration, contenu);
    }

    private ContenuBulletin calculer(TypeBulletin type, FicheCasier fiche, IdentiteSurBulletin identite) {
        Instant etat = Instant.now(horloge);
        LocalDate date = LocalDate.now(horloge);
        List<CondamnationPourCalcul> entrees = fiche.condamnations().stream().map(EmissionBulletins::pourCalcul).toList();
        ResultatCalcul r = moteur.calculer(type, entrees, date);
        JeuDeRegles jeu = moteur.enVigueur(date);
        List<ContenuBulletin.Ligne> lignes = fiche.condamnations().stream()
                .filter(c -> r.retenues().contains(c.id().toString()))
                .map(c -> new ContenuBulletin.Ligne(c.juridiction(), c.dateDecision(), c.numeroDecision(), c.infraction(),
                        c.peines(), c.mentions().stream()
                        .filter(m -> !m.dateEffet().isAfter(date))
                        .map(m -> new ContenuBulletin.MentionPortee(m.type(), m.dateEffet())).toList()))
                .toList();
        return new ContenuBulletin(type, etat, identite, lignes, r.versionRegles(), jeu.contenu().reference());
    }

    private static CondamnationPourCalcul pourCalcul(CondamnationEnregistree c) {
        return new CondamnationPourCalcul(c.id().toString(), c.dateDecision(), c.qualification(), c.peines(), c.definitive(),
                c.mentions().stream().map(m -> new CondamnationPourCalcul.Mention(m.type(), m.dateEffet())).toList());
    }

    private FicheCasier fiche(UUID personneId) {
        return registre.fiche(personneId).orElseThrow(() -> new RessourceIntrouvable("Fiche introuvable."));
    }

    private static IdentiteSurBulletin identite(FicheCasier f) {
        return new IdentiteSurBulletin(f.identite().nom(), f.identite().prenoms(), f.identite().dateNaissance(),
                f.identite().lieuNaissance(), f.identite().nomPere(), f.identite().nomMere());
    }
}
