package com.neamindustry.casier.preplaintes;

import java.security.SecureRandom;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.commun.Empreintes;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.habilitations.AccesRefuse;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.MatriceHabilitations;
import com.neamindustry.casier.habilitations.Permission;

import tools.jackson.databind.json.JsonMapper;

/** Dépôt public d'une pré-plainte, suivi par numéro et code, traitement par l'officier de police judiciaire (R15). */
@Service
public class ServicePreplaintes {

    /** Délai pour signer la plainte ; au-delà, la pré-plainte expire. */
    static final Duration DELAI_SIGNATURE = Duration.ofDays(30);
    private static final ZoneId LIBREVILLE = ZoneId.of("Africa/Libreville");

    private final JdbcClient jdbc;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final JsonMapper json;
    private final Clock horloge;
    private final SecureRandom aleatoire = new SecureRandom();

    ServicePreplaintes(JdbcClient jdbc, Habilitations habilitations, JournalAudit journal, JsonMapper json, Clock horloge) {
        this.jdbc = jdbc;
        this.habilitations = habilitations;
        this.journal = journal;
        this.json = json;
        this.horloge = horloge;
    }

    @Transactional
    public PreplainteDeposee deposer(NouvellePreplainte p) {
        controler(p);
        Instant maintenant = Instant.now(horloge);
        long rang = jdbc.sql("select nextval('preplaintes.numero_seq')").query(Long.class).single();
        String numero = "PP-%d-%06d".formatted(Year.now(horloge.withZone(LIBREVILLE)).getValue(), rang);
        String code = String.format("%06d", aleatoire.nextInt(1_000_000));
        UUID id = UUID.randomUUID();
        Instant expire = maintenant.plus(DELAI_SIGNATURE);
        NouvellePreplainte.Declarant d = p.declarant();
        NouvellePreplainte.Declarant propre = new NouvellePreplainte.Declarant(d.nom().strip().toUpperCase(Locale.FRENCH), d.prenoms().strip(),
                d.dateNaissance(), d.telephone().replaceAll("\\s", ""), vide(d.email()) ? null : d.email().strip(),
                vide(d.adresse()) ? null : d.adresse().strip(), vide(d.entreprise()) ? null : d.entreprise().strip());
        jdbc.sql("""
                        insert into preplaintes.preplainte(id, numero, empreinte_code, nature, date_faits, heure_faits, ville, lieu, description,
                            auteur_connu, auteur_infos, biens, prejudice_fcfa, declarant, service, statut, cree_le, expire_le)
                        values (:id, :numero, :code, :nature, :date, :heure, :ville, :lieu, :description, :auteurConnu, :auteurInfos, :biens,
                            :prejudice, cast(:declarant as jsonb), :service, 'RECUE', :le, :expire)""")
                .param("id", id).param("numero", numero).param("code", empreinte(numero, code)).param("nature", p.nature().name())
                .param("date", p.dateFaits()).param("heure", vide(p.heureFaits()) ? null : p.heureFaits().strip())
                .param("ville", p.ville().strip()).param("lieu", p.lieu().strip()).param("description", p.description().strip())
                .param("auteurConnu", p.auteurConnu()).param("auteurInfos", vide(p.auteurInfos()) ? null : p.auteurInfos().strip())
                .param("biens", vide(p.biens()) ? null : p.biens().strip()).param("prejudice", p.prejudiceFcfa())
                .param("declarant", json.writeValueAsString(propre)).param("service", p.service().strip())
                .param("le", Timestamp.from(maintenant)).param("expire", Timestamp.from(expire)).update();
        journal.enregistrer(new EvenementAudit("public:preplainte", "", "PREPLAINTE_DEPOSEE", "Preplainte", id.toString(), null, null,
                Map.of("numero", numero, "nature", p.nature().name())));
        return new PreplainteDeposee(numero, code, expire, p.service().strip());
    }

    @Transactional
    public SuiviPreplainte suivi(String numero, String code) {
        expirer();
        String n = numero == null ? "" : numero.strip().toUpperCase(Locale.ROOT);
        return jdbc.sql("select * from preplaintes.preplainte where numero = :n").param("n", n)
                .query(this::lire).optional()
                .filter(x -> code != null && empreinte(n, code.strip()).equals(empreinteDe(n)))
                .map(x -> new SuiviPreplainte(x.numero(), x.statut(), x.creeLe(), x.expireLe(), x.service(), x.rendezVousLe(),
                        x.rendezVousLieu(), x.signeeLe()))
                .orElseThrow(() -> new RessourceIntrouvable("Numéro de pré-plainte ou code incorrect."));
    }

    /** File de l'officier de police judiciaire ; lecture seule pour la direction centrale. */
    @Transactional
    public List<Preplainte> file(Acteur acteur) {
        if (!MatriceHabilitations.autorise(acteur.roles(), Permission.TRAITER_PREPLAINTES)
                && !MatriceHabilitations.autorise(acteur.roles(), Permission.SUPERVISER_NATIONAL)) {
            throw new AccesRefuse("HAB-01", "Votre profil ne permet pas de consulter les pré-plaintes.");
        }
        expirer();
        List<Preplainte> liste = jdbc.sql("""
                        select * from preplaintes.preplainte
                        order by case statut when 'RECUE' then 0 when 'RENDEZ_VOUS_FIXE' then 1 else 2 end, cree_le
                        limit 200""").query(this::lire).list();
        journal.enregistrer(EvenementAudit.par(acteur, "PREPLAINTES_CONSULTEES", "Preplainte", null, null, null, Map.of()));
        return liste;
    }

    @Transactional
    public void fixerRendezVous(Acteur opj, UUID id, Instant le, String lieu) {
        habilitations.exiger(opj, Permission.TRAITER_PREPLAINTES);
        if (le == null || le.isBefore(Instant.now(horloge))) {
            throw new ErreurMetier("PPL-02", "Le rendez-vous doit être fixé dans le futur.");
        }
        if (vide(lieu)) {
            throw new ErreurMetier("PPL-02", "Indiquez le lieu du rendez-vous.");
        }
        int n = jdbc.sql("""
                        update preplaintes.preplainte set statut = 'RENDEZ_VOUS_FIXE', rendez_vous_le = :le, rendez_vous_lieu = :lieu, traite_par = :opj
                        where id = :id and statut in ('RECUE', 'RENDEZ_VOUS_FIXE')""")
                .param("id", id).param("le", Timestamp.from(le)).param("lieu", lieu.strip()).param("opj", opj.identifiant()).update();
        conflit(n, id, "Cette pré-plainte n'attend plus de rendez-vous.");
        journal.enregistrer(EvenementAudit.par(opj, "PREPLAINTE_RENDEZ_VOUS_FIXE", "Preplainte", id.toString(), null, null, Map.of()));
    }

    /** La victime a signé sa plainte : la pré-plainte devient une plainte, rattachée à son numéro de procédure. */
    @Transactional
    public void constaterSignature(Acteur opj, UUID id, String numeroProcedure) {
        habilitations.exiger(opj, Permission.TRAITER_PREPLAINTES);
        if (vide(numeroProcedure)) {
            throw new ErreurMetier("PPL-03", "Indiquez le numéro de procédure de la plainte signée.");
        }
        int n = jdbc.sql("""
                        update preplaintes.preplainte set statut = 'PLAINTE_SIGNEE', signee_le = :le, numero_procedure = :proc, traite_par = :opj
                        where id = :id and statut in ('RECUE', 'RENDEZ_VOUS_FIXE')""")
                .param("id", id).param("le", Timestamp.from(Instant.now(horloge))).param("proc", numeroProcedure.strip())
                .param("opj", opj.identifiant()).update();
        conflit(n, id, "Cette pré-plainte est déjà close.");
        journal.enregistrer(EvenementAudit.par(opj, "PREPLAINTE_SIGNEE", "Preplainte", id.toString(), null, numeroProcedure.strip(), Map.of()));
    }

    private void conflit(int n, UUID id, String message) {
        if (n == 1) {
            return;
        }
        Long existe = jdbc.sql("select count(*) from preplaintes.preplainte where id = :id").param("id", id).query(Long.class).single();
        if (existe == 0) {
            throw new RessourceIntrouvable("Pré-plainte introuvable.");
        }
        throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "PPL-04", message);
    }

    private void expirer() {
        jdbc.sql("update preplaintes.preplainte set statut = 'EXPIREE' where statut in ('RECUE', 'RENDEZ_VOUS_FIXE') and expire_le < :maintenant")
                .param("maintenant", Timestamp.from(Instant.now(horloge))).update();
    }

    private void controler(NouvellePreplainte p) {
        if (p.nature() == null) {
            throw new ErreurMetier("PPL-01", "Choisissez la nature des faits.");
        }
        LocalDate aujourdhui = LocalDate.now(horloge.withZone(LIBREVILLE));
        if (p.dateFaits() == null || p.dateFaits().isAfter(aujourdhui)) {
            throw new ErreurMetier("PPL-01", "La date des faits est obligatoire et ne peut pas être dans le futur.");
        }
        if (vide(p.ville()) || vide(p.lieu())) {
            throw new ErreurMetier("PPL-01", "Indiquez la ville et le lieu des faits.");
        }
        String description = p.description() == null ? "" : p.description().strip();
        if (description.length() < 20 || description.length() > 4000) {
            throw new ErreurMetier("PPL-01", "Décrivez les faits en 20 à 4 000 caractères.");
        }
        if (p.prejudiceFcfa() != null && p.prejudiceFcfa() < 0) {
            throw new ErreurMetier("PPL-01", "Le préjudice ne peut pas être négatif.");
        }
        NouvellePreplainte.Declarant d = p.declarant();
        if (d == null || vide(d.nom()) || vide(d.prenoms()) || d.dateNaissance() == null) {
            throw new ErreurMetier("PPL-01", "Votre nom, vos prénoms et votre date de naissance sont obligatoires.");
        }
        if (vide(d.telephone()) || !d.telephone().replaceAll("[\\s.-]", "").matches("\\+?\\d{8,15}")) {
            throw new ErreurMetier("PPL-01", "Indiquez un numéro de téléphone valide, pour vous proposer un rendez-vous.");
        }
        if (!vide(d.email()) && !d.email().strip().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw new ErreurMetier("PPL-01", "Adresse électronique invalide.");
        }
        if (vide(p.service())) {
            throw new ErreurMetier("PPL-01", "Choisissez le service où vous signerez votre plainte.");
        }
    }

    private String empreinteDe(String numero) {
        return jdbc.sql("select empreinte_code from preplaintes.preplainte where numero = :n").param("n", numero).query(String.class).single();
    }

    private static String empreinte(String numero, String code) {
        return Empreintes.sha256("preplainte|" + numero + "|" + code);
    }

    private static boolean vide(String s) {
        return s == null || s.isBlank();
    }

    private Preplainte lire(ResultSet rs, int i) throws SQLException {
        return new Preplainte(rs.getObject("id", UUID.class), rs.getString("numero"), NaturePreplainte.valueOf(rs.getString("nature")),
                rs.getObject("date_faits", LocalDate.class), rs.getString("heure_faits"), rs.getString("ville"), rs.getString("lieu"),
                rs.getString("description"), rs.getBoolean("auteur_connu"), rs.getString("auteur_infos"), rs.getString("biens"),
                rs.getObject("prejudice_fcfa", Long.class), json.readValue(rs.getString("declarant"), NouvellePreplainte.Declarant.class),
                rs.getString("service"), StatutPreplainte.valueOf(rs.getString("statut")), instant(rs, "cree_le"), instant(rs, "expire_le"),
                instant(rs, "rendez_vous_le"), rs.getString("rendez_vous_lieu"), instant(rs, "signee_le"), rs.getString("numero_procedure"));
    }

    private static Instant instant(ResultSet rs, String colonne) throws SQLException {
        Timestamp t = rs.getTimestamp(colonne);
        return t == null ? null : t.toInstant();
    }
}
