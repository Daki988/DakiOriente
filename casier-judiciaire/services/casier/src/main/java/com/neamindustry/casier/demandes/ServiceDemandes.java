package com.neamindustry.casier.demandes;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.bulletins.BulletinDelivre;
import com.neamindustry.casier.bulletins.EmissionBulletins;
import com.neamindustry.casier.bulletins.IdentiteSurBulletin;
import com.neamindustry.casier.commun.Empreintes;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.demandes.interne.Avis;
import com.neamindustry.casier.demandes.interne.Demande;
import com.neamindustry.casier.demandes.interne.DepotDemandes;
import com.neamindustry.casier.habilitations.AccesRefuse;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;
import com.neamindustry.casier.identification.ProfilIdentite;
import com.neamindustry.casier.identification.Rapprochement;
import com.neamindustry.casier.identification.ResultatRapprochement;
import com.neamindustry.casier.registre.CondamnationValidee;
import com.neamindustry.casier.registre.FicheCasier;
import com.neamindustry.casier.registre.RegistreLecture;
import com.neamindustry.casier.tarifs.ReferentielTarifs;
import com.neamindustry.casier.tarifs.Tarif;

/**
 * Parcours d'une demande de bulletin n°3 (section 8). L'agent ne décide que de l'identité ;
 * le contenu du bulletin reste calculé par le moteur de règles.
 */
@Service
public class ServiceDemandes {

    static final String ACTE_B3 = "BULLETIN_N3";

    private final DepotDemandes depot;
    private final ReferentielTarifs tarifs;
    private final RegistreLecture registre;
    private final Rapprochement rapprochement;
    private final EmissionBulletins bulletins;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final ParametresDemandes parametres;
    private final Clock horloge;
    private final TransactionTemplate transactions;
    private final SecureRandom aleatoire = new SecureRandom();
    private final Avis avis;

    ServiceDemandes(DepotDemandes depot, ReferentielTarifs tarifs, RegistreLecture registre, Rapprochement rapprochement,
                    EmissionBulletins bulletins, Habilitations habilitations, JournalAudit journal,
                    ParametresDemandes parametres, Clock horloge, PlatformTransactionManager gestionnaire, Avis avis) {
        this.avis = avis;
        this.depot = depot;
        this.tarifs = tarifs;
        this.registre = registre;
        this.rapprochement = rapprochement;
        this.bulletins = bulletins;
        this.habilitations = habilitations;
        this.journal = journal;
        this.parametres = parametres;
        this.horloge = horloge;
        this.transactions = new TransactionTemplate(gestionnaire);
    }

    /** RG-01 : la personne demande son propre bulletin ; le montant affiché est celui du référentiel (RG-10). */
    @Transactional
    public DemandeDeposee deposer(Acteur usager, NouvelleDemandeB3 nouvelle) {
        habilitations.exiger(usager, Permission.DEMANDER_B3_POUR_SOI);
        Tarif tarif = tarif(nouvelle.profil(), LocalDate.now(horloge));
        Instant maintenant = Instant.now(horloge);
        String numero = String.format("CJ-%d-%06d", LocalDate.now(horloge).getYear(), depot.prochainNumero());
        String code = String.format("%06d", aleatoire.nextInt(1_000_000));
        Demande d = new Demande(UUID.randomUUID(), numero, empreinteSuivi(numero, code), nouvelle.profil(), nouvelle.identite(),
                usager.identifiant(), usager.identiteVerifiee(), StatutDemande.EN_ATTENTE_PAIEMENT, tarif.montantFcfa(),
                tarif.provisoire(), null, maintenant, null, null, null, null, null, null, null, null, null, null);
        depot.inserer(d);
        depot.enregistrerContact(d.id(), nouvelle.telephone() == null ? null : nouvelle.telephone().replaceAll("\\s", ""),
                nouvelle.email());
        depot.ajouterEtape(d.id(), maintenant, d.statut(), d.statut().libelle());
        avis.depose(d.id(), numero, code);
        journal.enregistrer(EvenementAudit.par(usager, "DEMANDE_B3_DEPOSEE", "Demande", d.id().toString(), null, null,
                Map.of("numero", numero, "profil", nouvelle.profil().name(), "identiteVerifiee", String.valueOf(usager.identiteVerifiee()))));
        return new DemandeDeposee(d.id(), numero, code, tarif.montantFcfa(), tarif.provisoire());
    }

    /**
     * PAY-02 : confirmation d'un paiement par notification serveur de l'opérateur (ou par le simulateur en démonstration, PAY-07).
     * Chaque transaction n'est traitée qu'une fois. Le dossier étant complet, le délai de 24 heures démarre (RG-09).
     * Le paiement est enregistré dans sa propre transaction : un incident de traitement ne l'annule jamais ;
     * le dossier part alors vers un agent.
     */
    public ResultatTraitement confirmerPaiement(String numeroDossier, String referenceTransaction, long montantFcfa,
                                               Instant payeLe) {
        Object enregistre = transactions.execute(s -> enregistrerPaiement(numeroDossier, referenceTransaction, montantFcfa, payeLe));
        if (enregistre instanceof ResultatTraitement dejaTraite) {
            return dejaTraite;
        }
        UUID id = (UUID) enregistre;
        try {
            return transactions.execute(s -> traiterAutomatiquement(id));
        } catch (ErreurMetier e) {
            return transactions.execute(s -> versAgent(depot.parId(id).orElseThrow(),
                    "Traitement automatique impossible : " + e.getMessage()));
        }
    }

    private Object enregistrerPaiement(String numeroDossier, String referenceTransaction, long montantFcfa, Instant payeLe) {
        var deja = depot.parReferencePaiement(referenceTransaction);
        if (deja.isPresent()) {
            Demande d = deja.get();
            return new ResultatTraitement(d.numeroDossier(), d.statut(), null);
        }
        Demande d = depot.parNumero(numeroDossier).flatMap(x -> depot.verrouiller(x.id()))
                .orElseThrow(() -> new RessourceIntrouvable("Dossier introuvable."));
        if (d.statut() != StatutDemande.EN_ATTENTE_PAIEMENT) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PAY-04", "Ce dossier est déjà payé.");
        }
        long attendu = tarif(d.profil(), LocalDate.ofInstant(payeLe, horloge.getZone())).montantFcfa();
        if (montantFcfa != attendu) {
            throw new ErreurMetier("PAY-04", "Montant reçu (" + montantFcfa + " FCFA) différent du tarif en vigueur (" + attendu + " FCFA).");
        }
        Instant echeance = DelaiTraitement.echeanceInitiale(payeLe, parametres.delaiTraitement());
        depot.enregistrerPaiement(d.id(), referenceTransaction, montantFcfa, payeLe, echeance);
        depot.ajouterEtape(d.id(), payeLe, StatutDemande.EN_TRAITEMENT, StatutDemande.EN_TRAITEMENT.libelle());
        journal.enregistrer(new EvenementAudit("paiement:" + referenceTransaction, "", "PAIEMENT_CONFIRME", "Demande",
                d.id().toString(), null, null, Map.of("montant", String.valueOf(montantFcfa))));
        return d.id();
    }

    /**
     * Traitement sans intervention humaine : émission immédiate si l'identité est vérifiée et le rapprochement certain
     * (correspondance ou absence), sinon transmission à un agent (IDT-03, RG-06, RG-07).
     */
    private ResultatTraitement traiterAutomatiquement(UUID id) {
        Demande d = depot.parId(id).orElseThrow();
        Acteur systeme = Acteur.systeme("traitement-automatique");
        IdentiteDeclaree i = d.identite();
        List<ProfilIdentite> candidats = registre.candidats(i.nom(), i.prenoms(), i.dateNaissance(), i.numeroCnie(), i.numeroPasseport());
        ResultatRapprochement r = rapprochement.rapprocher(profil(d), candidats);
        UUID personne = r.candidatRetenu() == null ? null : UUID.fromString(r.candidatRetenu());
        depot.enregistrerRapprochement(id, r.issue().name(), r.explication(), personne);
        journal.enregistrer(EvenementAudit.par(systeme, "RAPPROCHEMENT_AUTOMATIQUE", "Demande", id.toString(),
                personne == null ? null : personne.toString(), null,
                Map.of("issue", r.issue().name(), "explication", r.explication(), "candidats", String.valueOf(r.scores().size()))));

        if (!d.identiteVerifiee()) {
            return versAgent(d, "Identité non vérifiée : contrôle des pièces par un agent (IDT-07).");
        }
        return switch (r.issue()) {
            case CAS_DOUTEUX -> versAgent(d, r.explication());
            case ABSENCE_CERTAINE -> delivrer(d, systeme, null);
            case CORRESPONDANCE_CERTAINE -> {
                FicheCasier fiche = registre.fiche(personne).orElseThrow();
                yield fiche.bloquee()
                        ? versAgent(d, "RG-07 : " + String.join(", ", fiche.motifsBlocage()) + ".")
                        : delivrer(d, systeme, personne);
            }
        };
    }

    /** DSH-05 : file de travail, du dossier le plus urgent au moins urgent, avec compte à rebours des 24 heures. */
    @Transactional(readOnly = true)
    public List<DossierAgent> fileDeTravail(Acteur agent) {
        habilitations.exiger(agent, Permission.TRAITER_CAS_DOUTEUX);
        Instant maintenant = Instant.now(horloge);
        return depot.fileDeTravail().stream().map(d -> {
            Duration restant = d.echeance() == null ? null : DelaiTraitement.restant(d.echeance(), d.suspenduDepuis(), maintenant);
            boolean alerte = restant != null && DelaiTraitement.alerte(restant, parametres.seuilAlerte());
            boolean retard = restant != null && restant.isNegative();
            return new DossierAgent(d.id(), d.numeroDossier(), d.statut(), d.identite(), d.profil(), d.motifAgent(),
                    d.explicationRapprochement(), d.echeance(), restant, alerte, retard);
        }).toList();
    }

    /** RG-09 : demande d'une pièce à l'usager ; le délai de 24 heures est suspendu. */
    @Transactional
    public void demanderPiece(Acteur agent, UUID id, String piece) {
        habilitations.exiger(agent, Permission.TRAITER_CAS_DOUTEUX);
        Demande d = enStatut(id, StatutDemande.A_TRAITER_PAR_AGENT);
        Instant maintenant = Instant.now(horloge);
        depot.changerStatut(id, StatutDemande.EN_ATTENTE_PIECE, Map.of("suspendu_depuis", maintenant, "motif_agent", "Pièce demandée : " + piece));
        depot.ajouterEtape(id, maintenant, StatutDemande.EN_ATTENTE_PIECE, "Pièce complémentaire demandée : " + piece);
        journal.enregistrer(EvenementAudit.par(agent, "PIECE_DEMANDEE", "Demande", d.id().toString(), null, piece, Map.of()));
        avis.pieceDemandee(d.id(), d.numeroDossier());
    }

    /** RG-09 : la pièce est déposée par le demandeur ; le délai reprend pour la durée restante. */
    @Transactional
    public void pieceDeposee(Acteur usager, UUID id, String referencePiece) {
        Demande d = enStatut(id, StatutDemande.EN_ATTENTE_PIECE);
        if (!d.demandeurId().equals(usager.identifiant())) {
            throw new AccesRefuse("RG-01", "Seul le demandeur peut compléter son dossier.");
        }
        Instant maintenant = Instant.now(horloge);
        Instant echeance = DelaiTraitement.apresSuspension(d.echeance(), d.suspenduDepuis(), maintenant);
        Map<String, Object> champs = new HashMap<>();
        champs.put("echeance", echeance);
        champs.put("suspendu_depuis", null);
        depot.changerStatut(id, StatutDemande.A_TRAITER_PAR_AGENT, champs);
        depot.ajouterEtape(id, maintenant, StatutDemande.A_TRAITER_PAR_AGENT, "Pièce reçue, vérification en cours");
        journal.enregistrer(EvenementAudit.par(usager, "PIECE_DEPOSEE", "Demande", id.toString(), null, null,
                Map.of("piece", referencePiece)));
    }

    /**
     * IDT-06 : l'agent tranche l'identité, motivation obligatoire ; {@code personneId} nul signifie « aucune fiche ne correspond ».
     */
    @Transactional
    public ResultatTraitement deciderIdentite(Acteur agent, UUID id, UUID personneId, String motivation) {
        habilitations.exiger(agent, Permission.TRAITER_CAS_DOUTEUX);
        if (motivation == null || motivation.isBlank()) {
            throw new ErreurMetier("IDT-06", "La décision d'identité doit être motivée.");
        }
        Demande d = enStatut(id, StatutDemande.A_TRAITER_PAR_AGENT);
        habilitations.exigerSansConflitInterets(agent, personneId);
        if (personneId != null && registre.fiche(personneId).isEmpty()) {
            throw new RessourceIntrouvable("Fiche introuvable.");
        }
        Map<String, Object> champs = new HashMap<>();
        champs.put("personne_rapprochee", personneId);
        depot.changerStatut(id, StatutDemande.A_TRAITER_PAR_AGENT, champs);
        journal.enregistrer(EvenementAudit.par(agent, "IDENTITE_DECIDEE_PAR_AGENT", "Demande", id.toString(),
                personneId == null ? null : personneId.toString(), motivation, Map.of("fiche", personneId == null ? "aucune" : "rapprochée")));
        return delivrer(d, agent, personneId);
    }

    @Transactional
    public void rejeter(Acteur agent, UUID id, String motif) {
        habilitations.exiger(agent, Permission.TRAITER_CAS_DOUTEUX);
        if (motif == null || motif.isBlank()) {
            throw new ErreurMetier("RG-13", "Le motif du rejet est obligatoire ; il est communiqué à l'usager avec la voie de réclamation.");
        }
        Demande d = depot.verrouiller(id).orElseThrow(() -> new RessourceIntrouvable("Dossier introuvable."));
        if (d.statut() == StatutDemande.DELIVREE || d.statut() == StatutDemande.REJETEE) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "RG-13", "Ce dossier est déjà clos.");
        }
        Instant maintenant = Instant.now(horloge);
        depot.changerStatut(id, StatutDemande.REJETEE, Map.of("motif_rejet", motif));
        depot.ajouterEtape(id, maintenant, StatutDemande.REJETEE, "Demande rejetée : " + motif);
        journal.enregistrer(EvenementAudit.par(agent, "DEMANDE_REJETEE", "Demande", id.toString(), null, motif, Map.of()));
        avis.rejete(id, d.numeroDossier());
    }

    /** DSH-01 : demandes de l'usager connecté, avec frise, bulletin et avis reçus. */
    @Transactional(readOnly = true)
    public List<DemandeUsager> mesDemandes(Acteur usager) {
        habilitations.exiger(usager, Permission.DEMANDER_B3_POUR_SOI);
        return depot.parDemandeur(usager.identifiant()).stream()
                .map(d -> new DemandeUsager(d.id(), d.numeroDossier(), d.statut(), d.statut().libelle(), d.creeLe(), d.echeance(),
                        d.montantFcfa(), d.tarifProvisoire(), d.bulletinId(), d.bulletinNumero(),
                        d.statut() == StatutDemande.EN_ATTENTE_PIECE ? d.motifAgent() : null, d.motifRejet(),
                        depot.etapes(d.id()), depot.notifications(d.id())))
                .toList();
    }

    /** DSH-07, DSH-08 : indicateurs agrégés pour le pilotage national et le tableau de bord stratégique. */
    @Transactional(readOnly = true)
    public IndicateursDemandes indicateurs(Acteur acteur) {
        if (!com.neamindustry.casier.habilitations.MatriceHabilitations.autorise(acteur.roles(), Permission.SUPERVISER_NATIONAL)
                && !com.neamindustry.casier.habilitations.MatriceHabilitations.autorise(acteur.roles(), Permission.LIRE_TABLEAUX_AGREGES)) {
            throw new com.neamindustry.casier.habilitations.AccesRefuse("HAB-01", "Votre profil ne permet pas de consulter les indicateurs.");
        }
        Map<String, Long> parStatut = depot.nombreParStatut();
        long total = parStatut.values().stream().mapToLong(Long::longValue).sum();
        return new IndicateursDemandes(parStatut, total, parStatut.getOrDefault("DELIVREE", 0L), depot.delivreesSansAgent(),
                depot.delaiMoyenHeures(), depot.enRetard(Instant.now(horloge)), depot.recettes());
    }

    /** PUB-07 : suivi public avec le numéro de dossier et le code reçu par SMS. */
    @Transactional(readOnly = true)
    public SuiviDemande suivi(String numeroDossier, String codeSuivi) {
        Demande d = depot.parNumero(numeroDossier)
                .filter(x -> codeSuivi != null && x.empreinteCodeSuivi().equals(empreinteSuivi(numeroDossier, codeSuivi.trim())))
                .orElseThrow(() -> new RessourceIntrouvable("Numéro de dossier ou code de suivi incorrect."));
        return new SuiviDemande(d.numeroDossier(), d.statut(), d.statut().libelle(), d.echeance(), d.bulletinNumero(),
                depot.etapes(d.id()));
    }

    /**
     * Paiement au Trésor public : l'usager saisit l'identifiant de paiement (quittance) avec son code de suivi. La
     * référence « TRESOR-quittance » est unique : une quittance ne paie qu'un seul dossier (PAY-04). Le montant retenu
     * est le tarif en vigueur ; le contrôle auprès du Trésor sera branché avec l'interconnexion.
     */
    public ResultatTraitement payerAuTresor(String numeroDossier, String codeSuivi, String quittance, Instant payeLe) {
        Demande d = transactions.execute(s -> depot.parNumero(numeroDossier)
                .filter(x -> codeSuivi != null && x.empreinteCodeSuivi().equals(empreinteSuivi(numeroDossier, codeSuivi.trim())))
                .orElseThrow(() -> new RessourceIntrouvable("Numéro de dossier ou code de suivi incorrect.")));
        String reference = "TRESOR-" + quittance.trim().toUpperCase(Locale.ROOT);
        transactions.execute(s -> depot.parReferencePaiement(reference)).ifPresent(autre -> {
            if (!autre.numeroDossier().equals(d.numeroDossier())) {
                throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PAY-04", "Cet identifiant de paiement a déjà été utilisé.");
            }
        });
        long attendu = tarif(d.profil(), LocalDate.ofInstant(payeLe, horloge.getZone())).montantFcfa();
        return confirmerPaiement(d.numeroDossier(), reference, attendu, payeLe);
    }

    /** Section 8 : une inscription validée sur une fiche fait repasser par un agent les demandes en cours sur cette personne. */
    @ApplicationModuleListener
    void surInscriptionValidee(CondamnationValidee e) {
        Instant maintenant = Instant.now(horloge);
        for (Demande d : depot.enCoursSurPersonne(e.personneId())) {
            String motif = "RG-07 : la fiche a été modifiée pendant le traitement, contrôle par un agent.";
            boolean change = d.statut() == StatutDemande.EN_TRAITEMENT;
            depot.changerStatut(d.id(), change ? StatutDemande.A_TRAITER_PAR_AGENT : d.statut(), Map.of("motif_agent", motif));
            if (change) {
                depot.ajouterEtape(d.id(), maintenant, StatutDemande.A_TRAITER_PAR_AGENT, StatutDemande.A_TRAITER_PAR_AGENT.libelle());
            }
        }
    }

    private ResultatTraitement delivrer(Demande d, Acteur decideur, UUID personneId) {
        IdentiteDeclaree i = d.identite();
        BulletinDelivre b = bulletins.emettreB3(decideur, d.id(), personneId,
                new IdentiteSurBulletin(i.nom(), i.prenoms(), i.dateNaissance(), i.lieuNaissance(), i.nomPere(), i.nomMere()),
                d.demandeurId());
        Instant maintenant = Instant.now(horloge);
        Map<String, Object> champs = new HashMap<>();
        champs.put("bulletin_id", b.id());
        champs.put("bulletin_numero", b.numero());
        champs.put("suspendu_depuis", null);
        depot.changerStatut(d.id(), StatutDemande.DELIVREE, champs);
        depot.ajouterEtape(d.id(), maintenant, StatutDemande.DELIVREE, StatutDemande.DELIVREE.libelle());
        avis.delivre(d.id(), d.numeroDossier());
        return new ResultatTraitement(d.numeroDossier(), StatutDemande.DELIVREE, b);
    }

    private ResultatTraitement versAgent(Demande d, String motif) {
        depot.changerStatut(d.id(), StatutDemande.A_TRAITER_PAR_AGENT, Map.of("motif_agent", motif));
        depot.ajouterEtape(d.id(), Instant.now(horloge), StatutDemande.A_TRAITER_PAR_AGENT,
                StatutDemande.A_TRAITER_PAR_AGENT.libelle());
        return new ResultatTraitement(d.numeroDossier(), StatutDemande.A_TRAITER_PAR_AGENT, null);
    }

    private Demande enStatut(UUID id, StatutDemande attendu) {
        Demande d = depot.verrouiller(id).orElseThrow(() -> new RessourceIntrouvable("Dossier introuvable."));
        if (d.statut() != attendu) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "RG-09",
                    "Action impossible : le dossier est à l'état « " + d.statut().libelle() + " ».");
        }
        return d;
    }

    private Tarif tarif(ProfilDemandeur profil, LocalDate date) {
        return tarifs.applicable(ACTE_B3, profil.name(), date).orElseThrow(() -> new ErreurMetier("RG-10",
                "Le tarif du bulletin n°3 pour ce profil n'est pas encore fixé par le Ministère : la demande en ligne n'est pas ouverte."));
    }

    private static ProfilIdentite profil(Demande d) {
        IdentiteDeclaree i = d.identite();
        return new ProfilIdentite(d.id().toString(), i.nom(), i.prenoms(), i.dateNaissance(), i.lieuNaissance(), i.nomPere(),
                i.nomMere(), i.numeroCnie(), i.numeroPasseport(), List.of());
    }

    private static String empreinteSuivi(String numero, String code) {
        return Empreintes.sha256(numero.toUpperCase(Locale.ROOT) + ":" + code);
    }
}
