package com.neamindustry.casier.habilitations;

import static com.neamindustry.casier.habilitations.Permission.*;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Matrice rôle → permissions (section 5), au moindre privilège (HAB-01).
 * Aucun rôle ne cumule saisie, validation et consultation d'une condamnation ;
 * le super administrateur (R13) n'a aucune permission de lecture du casier.
 */
public final class MatriceHabilitations {

    private static final Map<Role, Set<Permission>> MATRICE = new EnumMap<>(Role.class);

    static {
        MATRICE.put(Role.R01, EnumSet.of(DEMANDER_B3_POUR_SOI));
        MATRICE.put(Role.R02, EnumSet.of(SAISIR_DEMANDE_ASSISTEE, VERIFIER_IDENTITE_SUR_PIECES));
        MATRICE.put(Role.R05, EnumSet.of(VALIDER_PARAMETRE_JURIDIQUE));
        MATRICE.put(Role.R06, EnumSet.of(SAISIR_INSCRIPTION, TRAITER_CAS_DOUTEUX));
        MATRICE.put(Role.R07, EnumSet.of(VALIDER_INSCRIPTION, REVOQUER_BULLETIN, TRAITER_CAS_DOUTEUX, IMPRIMER_BULLETIN));
        MATRICE.put(Role.R08, EnumSet.of(SUPERVISER_NATIONAL, PROPOSER_PARAMETRE_JURIDIQUE, TRAITER_CAS_DOUTEUX, VALIDER_TARIF));
        MATRICE.put(Role.R09, EnumSet.of(LIRE_TABLEAUX_AGREGES));
        MATRICE.put(Role.R10, EnumSet.of(GERER_PAIEMENTS));
        MATRICE.put(Role.R11, EnumSet.of(TRAITER_RECLAMATIONS));
        MATRICE.put(Role.R12, EnumSet.of(LIRE_JOURNAL_AUDIT));
        MATRICE.put(Role.R13, EnumSet.of(PARAMETRER_PLATEFORME, GERER_AGENTS, PROPOSER_TARIF, VALIDER_TARIF));
        MATRICE.put(Role.R14, EnumSet.of(VERIFIER_BULLETIN));
    }

    private MatriceHabilitations() {
    }

    public static Set<Permission> permissions(Role role) {
        return EnumSet.copyOf(MATRICE.get(role));
    }

    public static boolean autorise(Set<Role> roles, Permission permission) {
        return roles.stream().anyMatch(r -> MATRICE.get(r).contains(permission));
    }
}
