package com.neamindustry.casier.registre.interne;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Qualification;
import com.neamindustry.casier.commun.TypeMention;
import com.neamindustry.casier.identification.NormalisationNoms;
import com.neamindustry.casier.registre.CondamnationEnregistree;
import com.neamindustry.casier.registre.IdentitePersonne;
import com.neamindustry.casier.registre.IntegriteCompromise;
import com.neamindustry.casier.registre.MentionEnregistree;
import com.neamindustry.casier.registre.StatutInscription;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Accès au schéma {@code registre}. Aucune suppression (REG-08) ; contrôle d'empreinte à chaque lecture (REG-09). */
@Repository
public class DepotRegistre {

    private static final TypeReference<List<Peine>> PEINES = new TypeReference<>() {
    };

    private final JdbcClient jdbc;
    private final JsonMapper json;

    DepotRegistre(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    /** Personne lue, empreinte contrôlée. */
    public record PersonneLue(UUID id, IdentitePersonne identite) {
    }

    // ---------- Personnes ----------

    public void insererPersonne(UUID id, IdentitePersonne i, String creePar, Instant le) {
        jdbc.sql("""
                        insert into registre.personne(id, nom, prenoms, date_naissance, lieu_naissance, pays_naissance, nom_pere,
                            nom_mere, nationalites, numero_cnie, numero_passeport, alias, cle_recherche, cles_alias, cree_par, cree_le, empreinte)
                        values (:id, :nom, :prenoms, :date, :lieu, :pays, :pere, :mere, :nationalites, :cnie, :passeport, :alias,
                            :cle, :clesAlias, :par, :le, :empreinte)""")
                .param("id", id)
                .param("nom", i.nom())
                .param("prenoms", i.prenoms())
                .param("date", i.dateNaissance())
                .param("lieu", i.lieuNaissance())
                .param("pays", i.paysNaissance())
                .param("pere", i.nomPere())
                .param("mere", i.nomMere())
                .param("nationalites", i.nationalites().toArray(String[]::new))
                .param("cnie", NormalisationNoms.normaliserPiece(i.numeroCnie()))
                .param("passeport", NormalisationNoms.normaliserPiece(i.numeroPasseport()))
                .param("alias", i.alias().toArray(String[]::new))
                .param("cle", NormalisationNoms.cleRecherche(i.nom(), i.prenoms()))
                .param("clesAlias", String.join(" | ", i.alias().stream().map(a -> NormalisationNoms.cleRecherche(a, "")).toList()))
                .param("par", creePar)
                .param("le", Timestamp.from(le))
                .param("empreinte", EmpreintesRegistre.personne(id, normaliserPieces(i)))
                .update();
    }

    public Optional<PersonneLue> personne(UUID id) {
        return jdbc.sql("select * from registre.personne where id = :id").param("id", id).query(this::lirePersonne).optional();
    }

    /**
     * IDT-01 : fiches candidates pour le rapprochement — même pièce d'identité, nom ou alias proche (trigrammes),
     * ou même date de naissance avec un nom approchant.
     */
    public List<PersonneLue> candidats(String nom, String prenoms, LocalDate dateNaissance, String cnie, String passeport) {
        return jdbc.sql("""
                        select * from registre.personne p
                        where (cast(:cnie as text) is not null and p.numero_cnie = :cnie)
                           or (cast(:passeport as text) is not null and p.numero_passeport = :passeport)
                           or similarity(p.cle_recherche, :cle) >= 0.3
                           or (p.cles_alias <> '' and word_similarity(:cle, p.cles_alias) >= 0.5)
                           or (p.date_naissance = :date and similarity(p.cle_recherche, :cle) >= 0.1)
                        order by similarity(p.cle_recherche, :cle) desc
                        limit 50""")
                .param("cnie", NormalisationNoms.normaliserPiece(cnie))
                .param("passeport", NormalisationNoms.normaliserPiece(passeport))
                .param("cle", NormalisationNoms.cleRecherche(nom, prenoms))
                .param("date", dateNaissance)
                .query(this::lirePersonne).list();
    }

    private PersonneLue lirePersonne(ResultSet rs, int n) throws SQLException {
        UUID id = rs.getObject("id", UUID.class);
        IdentitePersonne i = new IdentitePersonne(rs.getString("nom"), rs.getString("prenoms"),
                rs.getObject("date_naissance", LocalDate.class), rs.getString("lieu_naissance"), rs.getString("pays_naissance"),
                rs.getString("nom_pere"), rs.getString("nom_mere"), tableau(rs.getArray("nationalites")),
                rs.getString("numero_cnie"), rs.getString("numero_passeport"), tableau(rs.getArray("alias")));
        if (!EmpreintesRegistre.personne(id, i).equals(rs.getString("empreinte"))) {
            throw new IntegriteCompromise("la fiche " + id);
        }
        return new PersonneLue(id, i);
    }

    private static IdentitePersonne normaliserPieces(IdentitePersonne i) {
        return new IdentitePersonne(i.nom(), i.prenoms(), i.dateNaissance(), i.lieuNaissance(), i.paysNaissance(), i.nomPere(),
                i.nomMere(), i.nationalites(), NormalisationNoms.normaliserPiece(i.numeroCnie()),
                NormalisationNoms.normaliserPiece(i.numeroPasseport()), i.alias());
    }

    // ---------- Condamnations ----------

    public void insererCondamnation(CondamnationEnregistree c, String motifCorrection) {
        jdbc.sql("""
                        insert into registre.condamnation(id, personne_id, version, remplace_id, juridiction, date_decision,
                            numero_decision, infraction, qualification, peines, date_definitive, reference_piece_source, statut,
                            saisie_par, saisie_le, motif_correction, empreinte)
                        values (:id, :personne, :version, :remplace, :juridiction, :date, :numero, :infraction, :qualification,
                            cast(:peines as jsonb), :definitive, :piece, :statut, :par, :le, :motif, :empreinte)""")
                .param("id", c.id())
                .param("personne", c.personneId())
                .param("version", c.version())
                .param("remplace", c.remplaceId())
                .param("juridiction", c.juridiction())
                .param("date", c.dateDecision())
                .param("numero", c.numeroDecision())
                .param("infraction", c.infraction())
                .param("qualification", c.qualification().name())
                .param("peines", json.writeValueAsString(c.peines()))
                .param("definitive", c.dateDefinitive())
                .param("piece", c.referencePieceSource())
                .param("statut", c.statut().name())
                .param("par", c.saisiePar())
                .param("le", Timestamp.from(c.saisieLe()))
                .param("motif", motifCorrection)
                .param("empreinte", EmpreintesRegistre.condamnation(c))
                .update();
    }

    public void changerStatutCondamnation(CondamnationEnregistree avant, StatutInscription statut, String par, Instant le,
                                          String motifRejet) {
        CondamnationEnregistree apres = new CondamnationEnregistree(avant.id(), avant.personneId(), avant.version(),
                avant.remplaceId(), avant.juridiction(), avant.dateDecision(), avant.numeroDecision(), avant.infraction(),
                avant.qualification(), avant.peines(), avant.dateDefinitive(), avant.referencePieceSource(), statut,
                avant.saisiePar(), avant.saisieLe(), statut == StatutInscription.REMPLACEE ? avant.valideePar() : par,
                statut == StatutInscription.REMPLACEE ? avant.valideeLe() : le, avant.mentions());
        int n = jdbc.sql("""
                        update registre.condamnation set statut = :statut, validee_par = :par, validee_le = :le,
                            motif_rejet = :motif, empreinte = :empreinte
                        where id = :id and statut = :statutAvant""")
                .param("statut", statut.name())
                .param("par", apres.valideePar())
                .param("le", apres.valideeLe() == null ? null : Timestamp.from(apres.valideeLe()))
                .param("motif", motifRejet)
                .param("empreinte", EmpreintesRegistre.condamnation(apres))
                .param("id", avant.id())
                .param("statutAvant", avant.statut().name())
                .update();
        if (n != 1) {
            throw new IllegalStateException("Transition concurrente sur la condamnation " + avant.id());
        }
    }

    public Optional<CondamnationEnregistree> condamnation(UUID id) {
        return jdbc.sql("select * from registre.condamnation where id = :id").param("id", id)
                .query((rs, i) -> lireCondamnation(rs, List.of())).optional();
    }

    public List<CondamnationEnregistree> condamnationsDe(UUID personneId) {
        List<MentionEnregistree> mentions = mentionsDe(personneId);
        return jdbc.sql("select * from registre.condamnation where personne_id = :p order by date_decision, version")
                .param("p", personneId)
                .query((rs, i) -> {
                    UUID id = rs.getObject("id", UUID.class);
                    return lireCondamnation(rs, mentions.stream().filter(m -> m.condamnationId().equals(id)).toList());
                }).list();
    }

    private CondamnationEnregistree lireCondamnation(ResultSet rs, List<MentionEnregistree> mentions) throws SQLException {
        Timestamp valideeLe = rs.getTimestamp("validee_le");
        CondamnationEnregistree c = new CondamnationEnregistree(rs.getObject("id", UUID.class),
                rs.getObject("personne_id", UUID.class), rs.getInt("version"), rs.getObject("remplace_id", UUID.class),
                rs.getString("juridiction"), rs.getObject("date_decision", LocalDate.class), rs.getString("numero_decision"),
                rs.getString("infraction"), Qualification.valueOf(rs.getString("qualification")),
                json.readValue(rs.getString("peines"), PEINES), rs.getObject("date_definitive", LocalDate.class),
                rs.getString("reference_piece_source"), StatutInscription.valueOf(rs.getString("statut")),
                rs.getString("saisie_par"), rs.getTimestamp("saisie_le").toInstant(), rs.getString("validee_par"),
                valideeLe == null ? null : valideeLe.toInstant(), mentions);
        if (!EmpreintesRegistre.condamnation(c).equals(rs.getString("empreinte"))) {
            throw new IntegriteCompromise("la condamnation " + c.id());
        }
        return c;
    }

    // ---------- Mentions ----------

    public void insererMention(MentionEnregistree m, Instant le) {
        jdbc.sql("""
                        insert into registre.mention(id, condamnation_id, type, date_effet, details, statut, saisie_par, saisie_le, empreinte)
                        values (:id, :condamnation, :type, :date, :details, :statut, :par, :le, :empreinte)""")
                .param("id", m.id())
                .param("condamnation", m.condamnationId())
                .param("type", m.type().name())
                .param("date", m.dateEffet())
                .param("details", m.details())
                .param("statut", m.statut().name())
                .param("par", m.saisiePar())
                .param("le", Timestamp.from(le))
                .param("empreinte", EmpreintesRegistre.mention(m))
                .update();
    }

    public Optional<MentionEnregistree> mention(UUID id) {
        return jdbc.sql("select * from registre.mention where id = :id").param("id", id).query(this::lireMention).optional();
    }

    public void changerStatutMention(MentionEnregistree avant, StatutInscription statut, String par, Instant le) {
        MentionEnregistree apres = new MentionEnregistree(avant.id(), avant.condamnationId(), avant.type(), avant.dateEffet(),
                avant.details(), statut, avant.saisiePar(), par);
        int n = jdbc.sql("""
                        update registre.mention set statut = :statut, validee_par = :par, validee_le = :le, empreinte = :empreinte
                        where id = :id and statut = 'SAISIE'""")
                .param("statut", statut.name())
                .param("par", par)
                .param("le", Timestamp.from(le))
                .param("empreinte", EmpreintesRegistre.mention(apres))
                .param("id", avant.id())
                .update();
        if (n != 1) {
            throw new IllegalStateException("Transition concurrente sur la mention " + avant.id());
        }
    }

    public List<MentionEnregistree> mentionsDe(UUID personneId) {
        return jdbc.sql("""
                        select m.* from registre.mention m join registre.condamnation c on c.id = m.condamnation_id
                        where c.personne_id = :p order by m.date_effet""")
                .param("p", personneId)
                .query(this::lireMention).list();
    }

    private MentionEnregistree lireMention(ResultSet rs, int n) throws SQLException {
        MentionEnregistree m = new MentionEnregistree(rs.getObject("id", UUID.class), rs.getObject("condamnation_id", UUID.class),
                TypeMention.valueOf(rs.getString("type")), rs.getObject("date_effet", LocalDate.class), rs.getString("details"),
                StatutInscription.valueOf(rs.getString("statut")), rs.getString("saisie_par"), rs.getString("validee_par"));
        if (!EmpreintesRegistre.mention(m).equals(rs.getString("empreinte"))) {
            throw new IntegriteCompromise("la mention " + m.id());
        }
        return m;
    }

    // ---------- Blocages (contestations, RG-07) ----------

    public void ouvrirBlocage(UUID id, UUID personneId, String motif, String par, Instant le) {
        jdbc.sql("insert into registre.blocage(id, personne_id, motif, ouvert_par, ouvert_le) values (:id, :p, :motif, :par, :le)")
                .param("id", id).param("p", personneId).param("motif", motif).param("par", par).param("le", Timestamp.from(le))
                .update();
    }

    public int clore(UUID id, String par, Instant le) {
        return jdbc.sql("update registre.blocage set clos_par = :par, clos_le = :le where id = :id and clos_le is null")
                .param("par", par).param("le", Timestamp.from(le)).param("id", id).update();
    }

    public List<String> motifsBlocageOuverts(UUID personneId) {
        return jdbc.sql("select motif from registre.blocage where personne_id = :p and clos_le is null order by ouvert_le")
                .param("p", personneId).query(String.class).list();
    }

    private static List<String> tableau(Array a) throws SQLException {
        return a == null ? List.of() : Arrays.asList((String[]) a.getArray());
    }

    /** DSH-06 : condamnations saisies en attente de validation, avec l'identité de la fiche. */
    public record EnAttente(CondamnationEnregistree condamnation, IdentitePersonne identite) {
    }

    public List<EnAttente> condamnationsEnAttente(String juridiction) {
        List<UUID> ids = jdbc.sql("""
                        select id from registre.condamnation where statut = 'SAISIE'
                          and (cast(:j as text) is null or juridiction = :j) order by saisie_le limit 200""")
                .param("j", juridiction).query(UUID.class).list();
        return ids.stream().map(id -> {
            CondamnationEnregistree c = condamnation(id).orElseThrow();
            return new EnAttente(c, personne(c.personneId()).orElseThrow().identite());
        }).toList();
    }

    /** Mentions saisies en attente de validation (toutes juridictions si {@code juridiction} est nulle). */
    public record MentionAValider(MentionEnregistree mention, CondamnationEnregistree condamnation, IdentitePersonne identite) {
    }

    public List<MentionAValider> mentionsEnAttente(String juridiction) {
        List<UUID> ids = jdbc.sql("""
                        select m.id from registre.mention m join registre.condamnation c on c.id = m.condamnation_id
                        where m.statut = 'SAISIE' and (cast(:j as text) is null or c.juridiction = :j)
                        order by m.saisie_le limit 200""")
                .param("j", juridiction).query(UUID.class).list();
        return ids.stream().map(id -> {
            MentionEnregistree m = mention(id).orElseThrow();
            CondamnationEnregistree c = condamnation(m.condamnationId()).orElseThrow();
            return new MentionAValider(m, c, personne(c.personneId()).orElseThrow().identite());
        }).toList();
    }

    /** Contestations ouvertes (blocages RG-07), de la plus ancienne à la plus récente. */
    public record BlocageOuvert(UUID id, UUID personneId, String motif, String ouvertPar, Instant ouvertLe, IdentitePersonne identite) {
    }

    public List<BlocageOuvert> blocagesOuverts() {
        record Ligne(UUID id, UUID personneId, String motif, String ouvertPar, Instant ouvertLe) {
        }
        List<Ligne> lignes = jdbc.sql("""
                        select id, personne_id, motif, ouvert_par, ouvert_le from registre.blocage
                        where clos_le is null order by ouvert_le limit 200""")
                .query((rs, n) -> new Ligne(rs.getObject("id", UUID.class), rs.getObject("personne_id", UUID.class),
                        rs.getString("motif"), rs.getString("ouvert_par"), rs.getTimestamp("ouvert_le").toInstant()))
                .list();
        return lignes.stream().map(l -> new BlocageOuvert(l.id(), l.personneId(), l.motif(), l.ouvertPar(), l.ouvertLe(),
                personne(l.personneId()).orElseThrow().identite())).toList();
    }

    public void rejeterMention(MentionEnregistree avant, String par, Instant le) {
        changerStatutMention(avant, StatutInscription.REJETEE, par, le);
    }
}
