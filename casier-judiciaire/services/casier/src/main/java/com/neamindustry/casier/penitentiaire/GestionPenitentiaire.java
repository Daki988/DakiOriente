package com.neamindustry.casier.penitentiaire;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.habilitations.AccesRefuse;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.MatriceHabilitations;
import com.neamindustry.casier.habilitations.Permission;
import com.neamindustry.casier.penitentiaire.Enumerations.StatutDetenu;
import com.neamindustry.casier.penitentiaire.Enumerations.StatutMouvement;
import com.neamindustry.casier.penitentiaire.Enumerations.TitreDetention;
import com.neamindustry.casier.penitentiaire.Enumerations.TypeMouvement;
import com.neamindustry.casier.penitentiaire.Saisies.Condamnation;
import com.neamindustry.casier.penitentiaire.Saisies.Liberation;
import com.neamindustry.casier.penitentiaire.Saisies.NouveauMouvement;
import com.neamindustry.casier.penitentiaire.Saisies.NouvelEcrou;

/**
 * Registre pénitentiaire. Le greffe (R16) écroue, enregistre la situation pénale, demande et exécute les mouvements ; le chef
 * d'établissement (R17) autorise les mouvements demandés par un autre et prononce les libérations ; la direction (R18) consulte
 * tous les établissements. Agents et chefs n'agissent que sur leur établissement (attribut « juridiction » du compte).
 */
@Service
public class GestionPenitentiaire {

    private static final ZoneId LIBREVILLE = ZoneId.of("Africa/Libreville");

    private final JdbcClient jdbc;
    private final JournalAudit journal;
    private final Clock horloge;

    GestionPenitentiaire(JdbcClient jdbc, JournalAudit journal, Clock horloge) {
        this.jdbc = jdbc;
        this.journal = journal;
        this.horloge = horloge;
    }

    // ---------- Référentiel ----------

    @Transactional(readOnly = true)
    public List<Etablissement> etablissements() {
        return jdbc.sql("select * from penitentiaire.etablissement order by nom")
                .query((rs, i) -> new Etablissement(rs.getString("code"), rs.getString("nom"), rs.getString("ville"), rs.getString("province"),
                        rs.getString("type"), rs.getInt("capacite")))
                .list();
    }

    // ---------- Registre ----------

    /** Détenus de l'établissement (ou de tous pour la direction), présents par défaut ; recherche par nom ou numéro d'écrou. */
    @Transactional
    public List<Detenu> registre(Acteur acteur, String recherche, boolean avecLiberes) {
        String perimetre = perimetre(acteur);
        String q = recherche == null ? "" : recherche.strip().toUpperCase(Locale.ROOT);
        List<Detenu> liste = jdbc.sql("""
                        select * from penitentiaire.detenu
                        where (cast(:etab as text) is null or etablissement = :etab)
                          and (:avecLiberes or statut <> 'LIBERE')
                          and (:q = '' or upper(nom) like :motif or upper(prenoms) like :motif or numero_ecrou like :motif)
                        order by statut = 'LIBERE', nom, prenoms limit 300""")
                .param("etab", perimetre).param("avecLiberes", avecLiberes).param("q", q).param("motif", "%" + q + "%")
                .query(GestionPenitentiaire::lireDetenu).list();
        journal.enregistrer(EvenementAudit.par(acteur, "REGISTRE_PENITENTIAIRE_CONSULTE", "Etablissement", perimetre, null,
                q.isEmpty() ? null : "Recherche : " + q, Map.of()));
        return liste;
    }

    /** Fiche d'un détenu avec ses mouvements ; la consultation est journalisée. */
    @Transactional
    public Map<String, Object> fiche(Acteur acteur, UUID id) {
        Detenu d = detenuDansPerimetre(acteur, id);
        List<Mouvement> mouvements = mouvements("where m.detenu_id = :id order by m.prevu_le desc", Map.of("id", id), acteur);
        journal.enregistrer(EvenementAudit.par(acteur, "FICHE_DETENU_CONSULTEE", "Detenu", id.toString(), null, null,
                Map.of("ecrou", d.numeroEcrou())));
        Map<String, Object> fiche = new HashMap<>();
        fiche.put("detenu", d);
        fiche.put("mouvements", mouvements);
        return fiche;
    }

    @Transactional
    public Detenu ecrouer(Acteur agent, NouvelEcrou e) {
        exiger(agent, Permission.GERER_ECROU);
        String etab = etablissementDe(agent);
        if (vide(e.nom()) || vide(e.prenoms()) || e.dateNaissance() == null || vide(e.lieuNaissance())) {
            throw new ErreurMetier("PEN-01", "Nom, prénoms, date et lieu de naissance sont obligatoires.");
        }
        if (e.titreDetention() == null || vide(e.referenceTitre()) || vide(e.juridiction()) || vide(e.infraction())) {
            throw new ErreurMetier("PEN-01", "Le titre de détention (type, référence, juridiction) et l'infraction sont obligatoires : aucun écrou sans titre.");
        }
        LocalDate aujourdhui = LocalDate.now(horloge.withZone(LIBREVILLE));
        LocalDate dateEcrou = e.dateEcrou() == null ? aujourdhui : e.dateEcrou();
        if (dateEcrou.isAfter(aujourdhui)) {
            throw new ErreurMetier("PEN-01", "La date d'écrou ne peut pas être dans le futur.");
        }
        boolean condamne = e.titreDetention() != TitreDetention.MANDAT_DEPOT;
        LocalDate debut = null;
        Integer duree = null;
        if (condamne) {
            if (e.dureePeineMois() == null || e.dureePeineMois() <= 0) {
                throw new ErreurMetier("PEN-01", "Indiquez la durée de la peine en mois pour un écrou sur condamnation.");
            }
            debut = e.dateDebutPeine() == null ? dateEcrou : e.dateDebutPeine();
            duree = e.dureePeineMois();
        }
        long rang = jdbc.sql("select nextval('penitentiaire.ecrou_seq')").query(Long.class).single();
        String numero = "%s-%d-%05d".formatted(etab.substring(0, 3), aujourdhui.getYear(), rang);
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        insert into penitentiaire.detenu(id, numero_ecrou, nom, prenoms, date_naissance, lieu_naissance, nationalite, etablissement,
                            quartier, statut, titre_detention, reference_titre, juridiction, infraction, date_ecrou, date_debut_peine,
                            duree_peine_mois, date_liberation_prevue, ecroue_par, ecroue_le)
                        values (:id, :numero, :nom, :prenoms, :naissance, :lieu, :nationalite, :etab, :quartier, :statut, :titre, :ref, :juridiction,
                            :infraction, :ecrou, :debut, :duree, :liberation, :par, :le)""")
                .param("id", id).param("numero", numero).param("nom", e.nom().strip().toUpperCase(Locale.FRENCH)).param("prenoms", e.prenoms().strip())
                .param("naissance", e.dateNaissance()).param("lieu", e.lieuNaissance().strip())
                .param("nationalite", vide(e.nationalite()) ? "Gabonaise" : e.nationalite().strip()).param("etab", etab)
                .param("quartier", vide(e.quartier()) ? null : e.quartier().strip()).param("statut", condamne ? "CONDAMNE" : "PREVENU")
                .param("titre", e.titreDetention().name()).param("ref", e.referenceTitre().strip()).param("juridiction", e.juridiction().strip())
                .param("infraction", e.infraction().strip()).param("ecrou", dateEcrou).param("debut", debut).param("duree", duree)
                .param("liberation", condamne ? liberationPrevue(debut, duree, 0) : null).param("par", agent.identifiant())
                .param("le", Timestamp.from(Instant.now(horloge))).update();
        journal.enregistrer(EvenementAudit.par(agent, "MISE_SOUS_ECROU", "Detenu", id.toString(), null, e.referenceTitre().strip(),
                Map.of("ecrou", numero, "etablissement", etab, "titre", e.titreDetention().name())));
        return detenu(id);
    }

    /** Un prévenu est condamné : la détention provisoire s'impute, la date de libération prévisible est calculée. */
    @Transactional
    public Detenu condamner(Acteur agent, UUID id, Condamnation c) {
        exiger(agent, Permission.GERER_ECROU);
        Detenu d = detenuDansPerimetre(agent, id);
        if (d.statut() != StatutDetenu.PREVENU) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PEN-02", "Seul un prévenu peut recevoir une condamnation.");
        }
        if (c.titre() == null || c.titre() == TitreDetention.MANDAT_DEPOT || vide(c.reference()) || vide(c.juridiction()) || c.dureePeineMois() <= 0) {
            throw new ErreurMetier("PEN-02", "Indiquez le jugement ou l'arrêt (référence, juridiction) et la durée de la peine.");
        }
        LocalDate debut = c.dateDebutPeine() == null ? d.dateEcrou() : c.dateDebutPeine();
        jdbc.sql("""
                        update penitentiaire.detenu set statut = 'CONDAMNE', titre_detention = :titre, reference_titre = :ref, juridiction = :juridiction,
                            date_debut_peine = :debut, duree_peine_mois = :duree, date_liberation_prevue = :liberation
                        where id = :id""")
                .param("titre", c.titre().name()).param("ref", c.reference().strip()).param("juridiction", c.juridiction().strip())
                .param("debut", debut).param("duree", c.dureePeineMois()).param("liberation", liberationPrevue(debut, c.dureePeineMois(), d.reductionJours()))
                .param("id", id).update();
        journal.enregistrer(EvenementAudit.par(agent, "CONDAMNATION_ENREGISTREE", "Detenu", id.toString(), null, c.reference().strip(),
                Map.of("dureeMois", String.valueOf(c.dureePeineMois()))));
        return detenu(id);
    }

    /** Libération prononcée par le chef d'établissement ; impossible si le détenu est hors de l'établissement. */
    @Transactional
    public Detenu liberer(Acteur chef, UUID id, Liberation l) {
        exiger(chef, Permission.DECIDER_PENITENTIAIRE);
        Detenu d = detenuDansPerimetre(chef, id);
        if (d.statut() == StatutDetenu.LIBERE) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PEN-03", "Ce détenu est déjà libéré.");
        }
        if (l == null || l.motif() == null) {
            throw new ErreurMetier("PEN-03", "Le motif de la libération est obligatoire.");
        }
        Long dehors = jdbc.sql("select count(*) from penitentiaire.mouvement where detenu_id = :id and statut = 'EN_COURS'")
                .param("id", id).query(Long.class).single();
        if (dehors > 0) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PEN-03", "Le détenu est actuellement hors de l'établissement : enregistrez d'abord son retour.");
        }
        LocalDate date = l.date() == null ? LocalDate.now(horloge.withZone(LIBREVILLE)) : l.date();
        String motif = l.motif().name() + (vide(l.precision()) ? "" : " — " + l.precision().strip());
        jdbc.sql("update penitentiaire.detenu set statut = 'LIBERE', date_liberation = :date, motif_liberation = :motif where id = :id")
                .param("date", date).param("motif", motif).param("id", id).update();
        jdbc.sql("update penitentiaire.mouvement set statut = 'ANNULE', observation = 'Annulé : détenu libéré' where detenu_id = :id and statut in ('DEMANDE', 'AUTORISE')")
                .param("id", id).update();
        journal.enregistrer(EvenementAudit.par(chef, "LEVEE_ECROU", "Detenu", id.toString(), null, motif, Map.of("ecrou", d.numeroEcrou())));
        return detenu(id);
    }

    // ---------- Mouvements ----------

    @Transactional(readOnly = true)
    public List<Mouvement> mouvementsOuverts(Acteur acteur) {
        String perimetre = perimetre(acteur);
        return mouvements("where m.statut in ('DEMANDE', 'AUTORISE', 'EN_COURS') and (cast(:etab as text) is null or m.origine = :etab) order by m.prevu_le",
                parametres("etab", perimetre), acteur);
    }

    @Transactional
    public Mouvement demanderMouvement(Acteur agent, UUID detenuId, NouveauMouvement m) {
        exiger(agent, Permission.GERER_ECROU);
        Detenu d = detenuDansPerimetre(agent, detenuId);
        if (d.statut() == StatutDetenu.LIBERE) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PEN-04", "Ce détenu est libéré.");
        }
        if (m.type() == null || vide(m.destination()) || vide(m.motif()) || m.prevuLe() == null) {
            throw new ErreurMetier("PEN-04", "Type, destination, motif et date du mouvement sont obligatoires.");
        }
        if (m.type() == TypeMouvement.TRANSFERT) {
            Long existe = jdbc.sql("select count(*) from penitentiaire.etablissement where code = :c").param("c", m.destination()).query(Long.class).single();
            if (existe == 0 || m.destination().equals(d.etablissement())) {
                throw new ErreurMetier("PEN-04", "Un transfert se fait vers un autre établissement du réseau.");
            }
        }
        if (m.type() == TypeMouvement.PERMISSION && d.statut() != StatutDetenu.CONDAMNE) {
            throw new ErreurMetier("PEN-04", "Une permission de sortir ne concerne qu'un condamné ; un prévenu relève du magistrat saisi.");
        }
        if (m.retourPrevu() != null && m.retourPrevu().isBefore(m.prevuLe())) {
            throw new ErreurMetier("PEN-04", "Le retour prévu précède le départ.");
        }
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        insert into penitentiaire.mouvement(id, detenu_id, type, origine, destination, motif, prevu_le, retour_prevu, statut, demande_par)
                        values (:id, :detenu, :type, :origine, :destination, :motif, :prevu, :retour, 'DEMANDE', :par)""")
                .param("id", id).param("detenu", detenuId).param("type", m.type().name()).param("origine", d.etablissement())
                .param("destination", m.destination().strip()).param("motif", m.motif().strip()).param("prevu", Timestamp.from(m.prevuLe()))
                .param("retour", m.retourPrevu() == null ? null : Timestamp.from(m.retourPrevu())).param("par", agent.identifiant()).update();
        journal.enregistrer(EvenementAudit.par(agent, "MOUVEMENT_DEMANDE", "Detenu", detenuId.toString(), null, m.motif().strip(),
                Map.of("type", m.type().name(), "mouvement", id.toString())));
        return mouvement(id, agent);
    }

    /** Le chef d'établissement autorise ou refuse un mouvement demandé par une autre personne. */
    @Transactional
    public void deciderMouvement(Acteur chef, UUID id, boolean autoriser, String observation) {
        exiger(chef, Permission.DECIDER_PENITENTIAIRE);
        Mouvement m = mouvementDansPerimetre(chef, id);
        if (m.statut() != StatutMouvement.DEMANDE) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PEN-05", "Ce mouvement n'attend plus de décision.");
        }
        if (m.demandeParMoi()) {
            throw new AccesRefuse("HAB-02", "Une autre personne que le demandeur doit autoriser ce mouvement.");
        }
        if (!autoriser && vide(observation)) {
            throw new ErreurMetier("PEN-05", "Le motif du refus est obligatoire.");
        }
        jdbc.sql("update penitentiaire.mouvement set statut = :statut, autorise_par = :chef, observation = :obs where id = :id and statut = 'DEMANDE'")
                .param("statut", autoriser ? "AUTORISE" : "REFUSE").param("chef", chef.identifiant())
                .param("obs", vide(observation) ? null : observation.strip()).param("id", id).update();
        journal.enregistrer(EvenementAudit.par(chef, autoriser ? "MOUVEMENT_AUTORISE" : "MOUVEMENT_REFUSE", "Detenu", m.detenuId().toString(), null,
                observation, Map.of("mouvement", id.toString())));
    }

    /** Départ (le détenu quitte l'établissement) puis retour ; un transfert terminé change l'établissement d'affectation. */
    @Transactional
    public void executerMouvement(Acteur agent, UUID id, String etape) {
        exiger(agent, Permission.GERER_ECROU);
        Mouvement m = mouvementDansPerimetre(agent, id);
        Instant maintenant = Instant.now(horloge);
        if ("DEPART".equals(etape)) {
            if (m.statut() != StatutMouvement.AUTORISE) {
                throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PEN-06", "Le mouvement doit être autorisé avant le départ.");
            }
            jdbc.sql("update penitentiaire.mouvement set statut = 'EN_COURS', depart_le = :le where id = :id").param("le", Timestamp.from(maintenant)).param("id", id).update();
            journal.enregistrer(EvenementAudit.par(agent, "MOUVEMENT_DEPART", "Detenu", m.detenuId().toString(), null, null, Map.of("mouvement", id.toString())));
            if (m.type() == TypeMouvement.TRANSFERT) {
                terminer(agent, m, maintenant);
            }
        } else if ("RETOUR".equals(etape)) {
            if (m.statut() != StatutMouvement.EN_COURS) {
                throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PEN-06", "Le détenu n'est pas sorti pour ce mouvement.");
            }
            terminer(agent, m, maintenant);
        } else if ("ANNULATION".equals(etape)) {
            if (m.statut() != StatutMouvement.DEMANDE && m.statut() != StatutMouvement.AUTORISE) {
                throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PEN-06", "Un mouvement commencé ne s'annule pas.");
            }
            jdbc.sql("update penitentiaire.mouvement set statut = 'ANNULE' where id = :id").param("id", id).update();
            journal.enregistrer(EvenementAudit.par(agent, "MOUVEMENT_ANNULE", "Detenu", m.detenuId().toString(), null, null, Map.of("mouvement", id.toString())));
        } else {
            throw new ErreurMetier("PEN-06", "Étape inconnue.");
        }
    }

    private void terminer(Acteur agent, Mouvement m, Instant le) {
        jdbc.sql("update penitentiaire.mouvement set statut = 'TERMINE', retour_le = :le where id = :id").param("le", Timestamp.from(le)).param("id", m.id()).update();
        if (m.type() == TypeMouvement.TRANSFERT) {
            jdbc.sql("update penitentiaire.detenu set etablissement = :dest where id = :id").param("dest", m.destination()).param("id", m.detenuId()).update();
        }
        journal.enregistrer(EvenementAudit.par(agent, m.type() == TypeMouvement.TRANSFERT ? "TRANSFERT_EFFECTUE" : "MOUVEMENT_RETOUR", "Detenu",
                m.detenuId().toString(), null, null, Map.of("mouvement", m.id().toString(), "destination", m.destination())));
    }

    // ---------- Tableau de bord ----------

    @Transactional(readOnly = true)
    public TableauDeBord tableauDeBord(Acteur acteur) {
        String perimetre = perimetre(acteur);
        Map<String, Object> p = parametres("etab", perimetre);
        List<TableauDeBord.Occupation> occupation = jdbc.sql("""
                        select e.code, e.nom, e.ville, e.capacite,
                               (select count(*) from penitentiaire.detenu d where d.etablissement = e.code and d.statut <> 'LIBERE') as population
                        from penitentiaire.etablissement e where cast(:etab as text) is null or e.code = :etab order by e.nom""")
                .params(p)
                .query((rs, i) -> {
                    long population = rs.getLong("population");
                    int capacite = rs.getInt("capacite");
                    return new TableauDeBord.Occupation(rs.getString("code"), rs.getString("nom"), rs.getString("ville"), capacite, population,
                            (int) Math.round(population * 100.0 / capacite));
                }).list();
        LocalDate aujourdhui = LocalDate.now(horloge.withZone(LIBREVILLE));
        String filtre = " and (cast(:etab as text) is null or etablissement = :etab)";
        long prevenus = compter("select count(*) from penitentiaire.detenu where statut = 'PREVENU'" + filtre, p);
        long condamnes = compter("select count(*) from penitentiaire.detenu where statut = 'CONDAMNE'" + filtre, p);
        Map<String, Object> p30 = new HashMap<>(p);
        p30.put("du", aujourdhui);
        p30.put("au", aujourdhui.plusDays(30));
        long liberations = compter("select count(*) from penitentiaire.detenu where statut = 'CONDAMNE' and date_liberation_prevue between :du and :au" + filtre, p30);
        String filtreM = " and (cast(:etab as text) is null or origine = :etab)";
        long aAutoriser = compter("select count(*) from penitentiaire.mouvement where statut = 'DEMANDE'" + filtreM, p);
        Map<String, Object> pj = new HashMap<>(p);
        pj.put("debut", Timestamp.from(aujourdhui.atStartOfDay(LIBREVILLE).toInstant()));
        pj.put("fin", Timestamp.from(aujourdhui.plusDays(1).atStartOfDay(LIBREVILLE).toInstant()));
        long duJour = compter("select count(*) from penitentiaire.mouvement where statut in ('AUTORISE', 'EN_COURS') and prevu_le >= :debut and prevu_le < :fin" + filtreM, pj);
        long dehors = compter("select count(*) from penitentiaire.mouvement where statut = 'EN_COURS'" + filtreM, p);
        List<Detenu> prochaines = jdbc.sql("select * from penitentiaire.detenu where statut = 'CONDAMNE' and date_liberation_prevue >= :du" + filtre
                        + " order by date_liberation_prevue limit 10")
                .params(p30).query(GestionPenitentiaire::lireDetenu).list();
        return new TableauDeBord(occupation, prevenus, condamnes, liberations, aAutoriser, duJour, dehors, prochaines);
    }

    // ---------- Outils ----------

    static LocalDate liberationPrevue(LocalDate debut, int dureeMois, int reductionJours) {
        return debut.plusMonths(dureeMois).minusDays(reductionJours);
    }

    /** Établissement couvert par l'acteur ({@code null} : tous, pour la direction). */
    private String perimetre(Acteur acteur) {
        if (MatriceHabilitations.autorise(acteur.roles(), Permission.SUPERVISER_PENITENTIAIRE)) {
            return null;
        }
        if (!MatriceHabilitations.autorise(acteur.roles(), Permission.GERER_ECROU)
                && !MatriceHabilitations.autorise(acteur.roles(), Permission.DECIDER_PENITENTIAIRE)) {
            throw new AccesRefuse("HAB-01", "Votre profil ne donne pas accès au registre pénitentiaire.");
        }
        return etablissementDe(acteur);
    }

    private static String etablissementDe(Acteur acteur) {
        if (acteur.juridiction() == null || acteur.juridiction().isBlank()) {
            throw new AccesRefuse("HAB-03", "Votre compte n'est rattaché à aucun établissement pénitentiaire.");
        }
        return acteur.juridiction();
    }

    private static void exiger(Acteur acteur, Permission permission) {
        if (!MatriceHabilitations.autorise(acteur.roles(), permission)) {
            throw new AccesRefuse("HAB-01", "Votre profil ne permet pas cette action.");
        }
    }

    private Detenu detenuDansPerimetre(Acteur acteur, UUID id) {
        String perimetre = perimetre(acteur);
        Detenu d = detenu(id);
        if (perimetre != null && !perimetre.equals(d.etablissement())) {
            throw new AccesRefuse("HAB-03", "Ce détenu n'est pas affecté à votre établissement.");
        }
        return d;
    }

    private Mouvement mouvementDansPerimetre(Acteur acteur, UUID id) {
        String perimetre = perimetre(acteur);
        Mouvement m = mouvement(id, acteur);
        if (perimetre != null && !perimetre.equals(m.origine())) {
            throw new AccesRefuse("HAB-03", "Ce mouvement ne relève pas de votre établissement.");
        }
        return m;
    }

    private Detenu detenu(UUID id) {
        return jdbc.sql("select * from penitentiaire.detenu where id = :id").param("id", id).query(GestionPenitentiaire::lireDetenu)
                .optional().orElseThrow(() -> new RessourceIntrouvable("Détenu introuvable."));
    }

    private Mouvement mouvement(UUID id, Acteur acteur) {
        List<Mouvement> l = mouvements("where m.id = :id", Map.of("id", id), acteur);
        if (l.isEmpty()) {
            throw new RessourceIntrouvable("Mouvement introuvable.");
        }
        return l.getFirst();
    }

    private List<Mouvement> mouvements(String clause, Map<String, ?> params, Acteur acteur) {
        return jdbc.sql("""
                        select m.*, d.numero_ecrou, d.nom, d.prenoms from penitentiaire.mouvement m
                        join penitentiaire.detenu d on d.id = m.detenu_id
                        """ + clause)
                .params(params)
                .query((rs, i) -> new Mouvement(rs.getObject("id", UUID.class), rs.getObject("detenu_id", UUID.class), rs.getString("numero_ecrou"),
                        rs.getString("nom") + " " + rs.getString("prenoms"), TypeMouvement.valueOf(rs.getString("type")), rs.getString("origine"),
                        rs.getString("destination"), rs.getString("motif"), instant(rs, "prevu_le"), instant(rs, "retour_prevu"),
                        StatutMouvement.valueOf(rs.getString("statut")), acteur.identifiant().equals(rs.getString("demande_par")),
                        instant(rs, "depart_le"), instant(rs, "retour_le"), rs.getString("observation")))
                .list();
    }

    private long compter(String sql, Map<String, ?> params) {
        return jdbc.sql(sql).params(params).query(Long.class).single();
    }

    private static Map<String, Object> parametres(String cle, Object valeur) {
        Map<String, Object> m = new HashMap<>();
        m.put(cle, valeur);
        return m;
    }

    private static boolean vide(String s) {
        return s == null || s.isBlank();
    }

    private static Instant instant(ResultSet rs, String colonne) throws SQLException {
        Timestamp t = rs.getTimestamp(colonne);
        return t == null ? null : t.toInstant();
    }

    private static Detenu lireDetenu(ResultSet rs, int i) throws SQLException {
        return new Detenu(rs.getObject("id", UUID.class), rs.getString("numero_ecrou"), rs.getString("nom"), rs.getString("prenoms"),
                rs.getObject("date_naissance", LocalDate.class), rs.getString("lieu_naissance"), rs.getString("nationalite"),
                rs.getString("etablissement"), rs.getString("quartier"), StatutDetenu.valueOf(rs.getString("statut")),
                TitreDetention.valueOf(rs.getString("titre_detention")), rs.getString("reference_titre"), rs.getString("juridiction"),
                rs.getString("infraction"), rs.getObject("date_ecrou", LocalDate.class), rs.getObject("date_debut_peine", LocalDate.class),
                (Integer) rs.getObject("duree_peine_mois"), rs.getInt("reduction_jours"), rs.getObject("date_liberation_prevue", LocalDate.class),
                rs.getObject("date_liberation", LocalDate.class), rs.getString("motif_liberation"), instant(rs, "ecroue_le"));
    }
}
