package com.neamindustry.casier.audit;

import java.util.Map;
import java.util.Objects;

import com.neamindustry.casier.habilitations.Acteur;

/**
 * Ce qui doit être tracé : qui, quoi, sur quel objet, pour qui, pourquoi (modèle « Entrée de journal », section 11).
 *
 * @param acteurId          identifiant de l'acteur ou du traitement automatique
 * @param roles             rôles de l'acteur au moment de l'action
 * @param action            action, par exemple {@code CONDAMNATION_VALIDEE}
 * @param objetType         type d'objet concerné
 * @param objetId           identifiant de l'objet
 * @param personneConcernee personne dont le casier est touché, sinon {@code null}
 * @param finalite          finalité ou motif déclaré (numéro de procédure, motif de révocation…)
 * @param details           détails complémentaires, sans donnée pénale inutile (DON-02)
 */
public record EvenementAudit(String acteurId, String roles, String action, String objetType, String objetId,
                             String personneConcernee, String finalite, Map<String, String> details) {

    public EvenementAudit {
        Objects.requireNonNull(acteurId, "acteurId");
        Objects.requireNonNull(action, "action");
        details = details == null ? Map.of() : Map.copyOf(details);
    }

    /** Événement attribué à un acteur authentifié ou à un traitement automatique. */
    public static EvenementAudit par(Acteur acteur, String action, String objetType, String objetId,
                                     String personneConcernee, String finalite, Map<String, String> details) {
        return new EvenementAudit(acteur.identifiant(), acteur.rolesTexte(), action, objetType, objetId,
                personneConcernee, finalite, details);
    }
}
