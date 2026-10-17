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
import com.neamindustry.casier.bulletins.interne.GenerateurPdf;
import com.neamindustry.casier.bulletins.interne.GenerateurSecrets;
import com.neamindustry.casier.bulletins.interne.SceauElectronique;
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
    private final GenerateurPdf pdf;
    private final SceauElectronique sceau;

    EmissionBulletins(RegistreLecture registre, MoteurDeRegles moteur, DepotBulletins depot, GenerateurSecrets secrets,
                      Habilitations habilitations, JournalAudit journal, ApplicationEventPublisher evenements, Clock horloge,
                      GenerateurPdf pdf, SceauElectronique sceau) {
        this.pdf = pdf;
        this.sceau = sceau;
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
     * @param personneId   fiche rapprochée, ou {@code null} si aucune fiche ne correspond (bulletin « néant », RG-06)
     * @param destinataire identifiant de l'usager qui pourra seul télécharger son bulletin (RG-01)
     */
    @Transactional
    public BulletinDelivre emettreB3(Acteur decideur, UUID demandeId, UUID personneId, IdentiteSurBulletin identite,
                                     String destinataire) {
        return emettre(decideur, TypeBulletin.B3, demandeId, personneId, identite, null, destinataire, null);
    }

    /** RG-02 : bulletin n°2 délivré à une administration habilitée, pour une finalité autorisée. */
    @Transactional
    public BulletinDelivre delivrerB2(Acteur agent, UUID personneId, IdentiteSurBulletin identite, String codeFinalite) {
        habilitations.exigerFinaliteB2(agent, codeFinalite, LocalDate.now(horloge));
        habilitations.exigerSansConflitInterets(agent, personneId);
        return emettre(agent, TypeBulletin.B2, null, personneId, identite, codeFinalite, agent.identifiant(), agent.organisme());
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

    /**
     * DSH-01, DSH-03 : téléchargement du bulletin scellé par son seul destinataire (l'usager pour le n°3, l'organisme
     * pour le n°2). Chaque téléchargement est journalisé.
     */
    @Transactional
    public byte[] telecharger(Acteur acteur, UUID bulletinId) {
        String[] acces = depot.acces(bulletinId).orElseThrow(() -> new RessourceIntrouvable("Bulletin introuvable."));
        boolean autorise = acteur.identifiant().equals(acces[0])
                || (acces[1] != null && acces[1].equals(acteur.organisme()) && acteur.aLeRole(com.neamindustry.casier.habilitations.Role.R03));
        if (!autorise) {
            throw new com.neamindustry.casier.habilitations.AccesRefuse("RG-01", "Ce bulletin ne vous est pas destiné.");
        }
        byte[] document = depot.document(bulletinId).orElseThrow(() -> new RessourceIntrouvable("Document introuvable."));
        journal.enregistrer(EvenementAudit.par(acteur, "BULLETIN_TELECHARGE", "Bulletin", bulletinId.toString(), null, null, Map.of()));
        return document;
    }

    /** DSH-07 : nombre de bulletins par type et statut (agrégat sans donnée nominative). */
    @Transactional(readOnly = true)
    public Map<String, Long> statistiques() {
        return depot.nombreParType();
    }

    /** DSH-01 : bulletins reçus par l'acteur connecté. */
    @Transactional(readOnly = true)
    public List<BulletinRecu> mesBulletins(Acteur acteur) {
        return depot.parDestinataire(acteur.identifiant()).stream()
                .map(b -> new BulletinRecu(b.id(), b.numero(), TypeBulletin.valueOf(b.type()), b.statut(), b.dateEmission(),
                        b.dateExpiration(), b.neant(), b.demandeId()))
                .toList();
    }

    /**
     * BUL-08 : contrôle d'un PDF déposé par un vérificateur. Renvoie le jeton de vérification si le document est intact et
     * scellé par la plateforme ; vide sinon. Le fichier n'est jamais conservé.
     */
    public java.util.Optional<String> controlerDocument(byte[] document) {
        if (!sceau.controler(document)) {
            return java.util.Optional.empty();
        }
        try (var doc = org.apache.pdfbox.Loader.loadPDF(document)) {
            return java.util.Optional.ofNullable(doc.getDocumentInformation().getCustomMetadataValue(GenerateurPdf.CLE_JETON));
        } catch (java.io.IOException e) {
            return java.util.Optional.empty();
        }
    }

    @Transactional(readOnly = true)
    public ContenuBulletin contenu(UUID bulletinId) {
        return depot.contenu(bulletinId).orElseThrow(() -> new RessourceIntrouvable("Bulletin introuvable."));
    }

    private BulletinDelivre emettre(Acteur decideur, TypeBulletin type, UUID demandeId, UUID personneId,
                                    IdentiteSurBulletin identite, String finalite, String destinataire, String organisme) {
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
                decideur.identifiant(), finalite, destinataire, organisme);
        // BUL-01 : document PDF/A généré puis scellé dans la même transaction que l'émission.
        byte[] document = sceau.sceller(pdf.generer(new GenerateurPdf.Donnees(numero, contenu, emission, expiration, jeton, code,
                finalite, sceau.demonstration())), emission, "Sceau électronique du casier judiciaire national");
        depot.insererDocument(id, document, Empreintes.sha256(document), sceau.empreinteCertificat(), sceau.demonstration(), emission);

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
