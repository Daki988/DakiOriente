package com.neamindustry.casier.verification;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.bulletins.BulletinEmis;
import com.neamindustry.casier.bulletins.BulletinRevoque;
import com.neamindustry.casier.commun.CodeCourt;
import com.neamindustry.casier.commun.Empreintes;
import com.neamindustry.casier.commun.TypeBulletin;

/** Vérification d'un bulletin par jeton (QR code) ou par code court, sans compte (R14). */
@Service
public class VerificationPublique {

    private final JdbcClient jdbc;
    private final Clock horloge;

    VerificationPublique(JdbcClient jdbc, Clock horloge) {
        this.jdbc = jdbc;
        this.horloge = horloge;
    }

    /** BUL-06 : vérification par le jeton du QR code. Compte la vérification de façon anonyme (BUL-11). */
    @Transactional
    public ResultatVerification parJeton(String jeton) {
        if (jeton == null || jeton.length() < 40 || jeton.length() > 64) {
            return ResultatVerification.inconnu();
        }
        return verifier("empreinte_jeton", Empreintes.sha256(jeton));
    }

    /** BUL-03 : vérification par le code court imprimé en clair. */
    @Transactional
    public ResultatVerification parCode(String code) {
        if (code == null) {
            return ResultatVerification.inconnu();
        }
        String canonique = CodeCourt.canoniser(code);
        if (canonique.length() != 12) {
            return ResultatVerification.inconnu();
        }
        return verifier("empreinte_code", Empreintes.sha256(canonique));
    }

    private ResultatVerification verifier(String colonne, String empreinte) {
        int trouve = jdbc.sql("update verification.bulletin_verifiable set nb_verifications = nb_verifications + 1 where "
                        + colonne + " = :e")
                .param("e", empreinte).update();
        if (trouve == 0) {
            return ResultatVerification.inconnu();
        }
        return jdbc.sql("select * from verification.bulletin_verifiable where " + colonne + " = :e")
                .param("e", empreinte).query(this::lire).single();
    }

    /** BUL-11 : nombre de vérifications d'un bulletin, consultable par la personne concernée (à valider). */
    @Transactional(readOnly = true)
    /** BUL-11 : total anonyme des vérifications, pour les indicateurs. */
    public long totalVerifications() {
        return jdbc.sql("select coalesce(sum(nb_verifications), 0) from verification.bulletin_verifiable").query(Long.class).single();
    }

    public long nombreVerifications(String numero) {
        return jdbc.sql("select coalesce(sum(nb_verifications), 0) from verification.bulletin_verifiable where numero = :n")
                .param("n", numero).query(Long.class).single();
    }

    @ApplicationModuleListener
    void surEmission(BulletinEmis e) {
        jdbc.sql("""
                        insert into verification.bulletin_verifiable(empreinte_jeton, empreinte_code, bulletin_id, numero, type,
                            date_emission, date_expiration, revoque, nom, prenoms, date_naissance)
                        values (:jeton, :code, :id, :numero, :type, :emission, :expiration, false, :nom, :prenoms, :naissance)
                        on conflict (empreinte_jeton) do nothing""")
                .param("jeton", e.empreinteJeton()).param("code", e.empreinteCode()).param("id", e.bulletinId())
                .param("numero", e.numero()).param("type", e.type().name())
                .param("emission", Timestamp.from(e.dateEmission())).param("expiration", Timestamp.from(e.dateExpiration()))
                .param("nom", e.nom()).param("prenoms", e.prenoms()).param("naissance", e.dateNaissance())
                .update();
    }

    @ApplicationModuleListener
    void surRevocation(BulletinRevoque e) {
        jdbc.sql("update verification.bulletin_verifiable set revoque = true where empreinte_jeton = :jeton")
                .param("jeton", e.empreinteJeton()).update();
    }

    private ResultatVerification lire(ResultSet rs, int n) throws SQLException {
        Instant expiration = rs.getTimestamp("date_expiration").toInstant();
        ResultatVerification.Statut statut = rs.getBoolean("revoque") ? ResultatVerification.Statut.REVOQUE
                : Instant.now(horloge).isAfter(expiration) ? ResultatVerification.Statut.EXPIRE : ResultatVerification.Statut.VALIDE;
        return new ResultatVerification(true, statut, TypeBulletin.valueOf(rs.getString("type")), rs.getString("numero"),
                rs.getTimestamp("date_emission").toInstant(), expiration, rs.getString("nom"), rs.getString("prenoms"),
                rs.getObject("date_naissance", LocalDate.class));
    }
}
