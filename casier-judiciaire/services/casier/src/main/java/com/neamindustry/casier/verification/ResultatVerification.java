package com.neamindustry.casier.verification;

import java.time.Instant;
import java.time.LocalDate;

import com.neamindustry.casier.commun.TypeBulletin;

/**
 * BUL-07 : ce que voit un vérificateur. Jamais de condamnation. Périmètre à valider avec l'autorité de protection des données.
 */
public record ResultatVerification(boolean authentique, Statut statut, TypeBulletin type, String numero,
                                   Instant dateEmission, Instant dateExpiration, String nom, String prenoms,
                                   LocalDate dateNaissance) {

    public enum Statut { VALIDE, EXPIRE, REVOQUE, INCONNU }

    public static ResultatVerification inconnu() {
        return new ResultatVerification(false, Statut.INCONNU, null, null, null, null, null, null, null);
    }
}
