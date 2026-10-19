package com.neamindustry.casier.demandes;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
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
import com.neamindustry.casier.demandes.interne.Demande;
import com.neamindustry.casier.demandes.interne.DepotDemandes;
import com.neamindustry.casier.habilitations.AccesRefuse;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;

/**
 * RG-09 : pièces justificatives déposées en ligne par le demandeur (PDF, JPEG ou PNG, 5 Mo au plus). Le type est
 * contrôlé sur le contenu du fichier, pas sur son nom. Une pièce n'est ni modifiée ni supprimée ; chaque consultation
 * par un agent est journalisée.
 */
@Service
public class PiecesJustificatives {

    public static final int TAILLE_MAX = 5 * 1024 * 1024;

    /** Description d'une pièce, sans son contenu. */
    public record Piece(UUID id, String nomFichier, String typeMime, int taille, Instant deposeLe) {
    }

    /** Contenu d'une pièce, pour son téléchargement par un agent. */
    public record Fichier(String nomFichier, String typeMime, byte[] contenu) {
    }

    private final JdbcClient jdbc;
    private final DepotDemandes depot;
    private final ServiceDemandes demandes;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final Clock horloge;

    PiecesJustificatives(JdbcClient jdbc, DepotDemandes depot, ServiceDemandes demandes, Habilitations habilitations,
                         JournalAudit journal, Clock horloge) {
        this.jdbc = jdbc;
        this.depot = depot;
        this.demandes = demandes;
        this.habilitations = habilitations;
        this.journal = journal;
        this.horloge = horloge;
    }

    /** Le demandeur dépose la pièce demandée ; le dossier repart en traitement et le délai reprend. */
    @Transactional
    public Piece deposer(Acteur usager, UUID demandeId, String nomFichier, byte[] contenu) {
        Demande d = depot.parId(demandeId).orElseThrow(() -> new RessourceIntrouvable("Dossier introuvable."));
        if (d.demandeurId() == null || !d.demandeurId().equals(usager.identifiant())) {
            throw new AccesRefuse("RG-01", "Seul le demandeur peut compléter son dossier.");
        }
        if (d.statut() != StatutDemande.EN_ATTENTE_PIECE) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "RG-09", "Aucune pièce n'est attendue pour ce dossier.");
        }
        if (contenu == null || contenu.length == 0) {
            throw new ErreurMetier("RG-09", "Le fichier est vide.");
        }
        if (contenu.length > TAILLE_MAX) {
            throw new ErreurMetier("RG-09", "Le fichier dépasse 5 Mo.");
        }
        String type = typeReel(contenu);
        if (type == null) {
            throw new ErreurMetier("RG-09", "Format non accepté : déposez un PDF, une photo JPEG ou PNG.");
        }
        String nom = nettoyer(nomFichier, type);
        UUID id = UUID.randomUUID();
        Instant maintenant = Instant.now(horloge);
        jdbc.sql("""
                        insert into demandes.piece(id, demande_id, nom_fichier, type_mime, taille, empreinte, contenu, depose_par, depose_le)
                        values (:id, :demande, :nom, :type, :taille, :empreinte, :contenu, :par, :le)""")
                .param("id", id).param("demande", demandeId).param("nom", nom).param("type", type).param("taille", contenu.length)
                .param("empreinte", Empreintes.sha256(contenu)).param("contenu", contenu).param("par", usager.identifiant())
                .param("le", Timestamp.from(maintenant)).update();
        demandes.pieceDeposee(usager, demandeId, id.toString());
        return new Piece(id, nom, type, contenu.length, maintenant);
    }

    /** Pièces d'un dossier, pour l'agent qui le traite. */
    @Transactional(readOnly = true)
    public List<Piece> pieces(Acteur agent, UUID demandeId) {
        habilitations.exiger(agent, Permission.TRAITER_CAS_DOUTEUX);
        return jdbc.sql("select id, nom_fichier, type_mime, taille, depose_le from demandes.piece where demande_id = :d order by depose_le")
                .param("d", demandeId)
                .query((rs, i) -> new Piece(rs.getObject("id", UUID.class), rs.getString("nom_fichier"), rs.getString("type_mime"),
                        rs.getInt("taille"), rs.getTimestamp("depose_le").toInstant()))
                .list();
    }

    /** Ouverture d'une pièce par un agent : journalisée. */
    @Transactional
    public Fichier ouvrir(Acteur agent, UUID demandeId, UUID pieceId) {
        habilitations.exiger(agent, Permission.TRAITER_CAS_DOUTEUX);
        Fichier f = jdbc.sql("select nom_fichier, type_mime, contenu from demandes.piece where id = :id and demande_id = :d")
                .param("id", pieceId).param("d", demandeId)
                .query((rs, i) -> new Fichier(rs.getString("nom_fichier"), rs.getString("type_mime"), rs.getBytes("contenu")))
                .optional().orElseThrow(() -> new RessourceIntrouvable("Pièce introuvable."));
        journal.enregistrer(EvenementAudit.par(agent, "PIECE_CONSULTEE", "Demande", demandeId.toString(), null, null,
                Map.of("piece", pieceId.toString())));
        return f;
    }

    /** Type déterminé par la signature du fichier. */
    static String typeReel(byte[] c) {
        if (commencePar(c, '%', 'P', 'D', 'F', '-')) {
            return "application/pdf";
        }
        if (c.length > 3 && (c[0] & 0xFF) == 0xFF && (c[1] & 0xFF) == 0xD8 && (c[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (commencePar(c, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        return null;
    }

    private static boolean commencePar(byte[] c, int... signature) {
        if (c.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((c[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }

    /** Nom affichable sans chemin ni caractère de contrôle, avec l'extension du type réel. */
    static String nettoyer(String nom, String type) {
        String base = nom == null ? "" : nom.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "").strip();
        int point = base.lastIndexOf('.');
        if (point > 0) {
            base = base.substring(0, point);
        }
        if (base.isBlank()) {
            base = "piece";
        }
        if (base.length() > 80) {
            base = base.substring(0, 80);
        }
        String extension = switch (type) {
            case "application/pdf" -> ".pdf";
            case "image/jpeg" -> ".jpg";
            default -> ".png";
        };
        return base + extension;
    }
}
