package com.neamindustry.casier.agents;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.habilitations.AccesRefuse;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;
import com.neamindustry.casier.habilitations.Role;

/**
 * Gestion des comptes des agents par l'administrateur (R13). Règles : seuls les rôles d'agent sont attribuables (ni
 * usager, ni administrateur) ; un administrateur ne modifie pas son propre compte ; un compte se désactive, il ne se
 * supprime pas ; chaque action est journalisée.
 */
@Service
public class GestionAgents {

    /** Rôles attribuables depuis la plateforme. */
    public static final Set<Role> ROLES_GERES = EnumSet.complementOf(EnumSet.of(Role.R01, Role.R13));
    /** Rôles rattachés à une juridiction. */
    static final Set<Role> ROLES_AVEC_JURIDICTION = EnumSet.of(Role.R05, Role.R06, Role.R07);

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    private final AnnuaireAgents annuaire;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final SecureRandom aleatoire = new SecureRandom();

    GestionAgents(AnnuaireAgents annuaire, Habilitations habilitations, JournalAudit journal) {
        this.annuaire = annuaire;
        this.habilitations = habilitations;
        this.journal = journal;
    }

    /** Rôles proposés dans le formulaire, avec leur libellé. */
    public Map<String, String> rolesAttribuables() {
        return ROLES_GERES.stream().collect(Collectors.toMap(Enum::name, Role::libelle, (a, b) -> a, java.util.TreeMap::new));
    }

    public List<CompteAgent> comptes(Acteur admin) {
        habilitations.exiger(admin, Permission.GERER_AGENTS);
        return annuaire.comptes(codes(ROLES_GERES)).stream()
                .sorted(Comparator.comparing(CompteAgent::nom, String.CASE_INSENSITIVE_ORDER).thenComparing(CompteAgent::prenom))
                .toList();
    }

    public CompteCree creer(Acteur admin, NouvelAgent a) {
        habilitations.exiger(admin, Permission.GERER_AGENTS);
        Role role = roleGere(a.role());
        String login = a.login() == null ? "" : a.login().strip().toLowerCase(Locale.ROOT);
        if (!login.matches("[a-z0-9][a-z0-9._-]{2,49}")) {
            throw new ErreurMetier("AGT-01", "Identifiant invalide : 3 à 50 caractères, lettres minuscules, chiffres, point ou tiret.");
        }
        if (vide(a.prenom()) || vide(a.nom())) {
            throw new ErreurMetier("AGT-01", "Le prénom et le nom sont obligatoires.");
        }
        if (a.email() == null || !a.email().strip().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw new ErreurMetier("AGT-01", "Adresse électronique invalide.");
        }
        String juridiction = juridiction(role, a.juridiction());
        NouvelAgent propre = new NouvelAgent(login, a.prenom().strip(), a.nom().strip().toUpperCase(Locale.FRENCH),
                a.email().strip().toLowerCase(Locale.ROOT), role.name(), juridiction);
        String motDePasse = motDePasseProvisoire();
        CompteAgent compte = annuaire.creer(propre, motDePasse);
        journal.enregistrer(EvenementAudit.par(admin, "AGENT_CREE", "Compte", compte.identifiant(), null, null,
                details("role", role.name(), "juridiction", juridiction)));
        return new CompteCree(compte, motDePasse);
    }

    public void changerRole(Acteur admin, String identifiant, String nouveauRole, String juridiction) {
        habilitations.exiger(admin, Permission.GERER_AGENTS);
        CompteAgent c = autreCompte(admin, identifiant);
        Role role = roleGere(nouveauRole);
        String j = juridiction(role, juridiction);
        if (!role.name().equals(c.role())) {
            annuaire.changerRole(identifiant, c.role(), role.name());
        }
        if (!java.util.Objects.equals(j, c.juridiction())) {
            annuaire.changerJuridiction(identifiant, j);
        }
        journal.enregistrer(EvenementAudit.par(admin, "AGENT_ROLE_MODIFIE", "Compte", identifiant, null, null,
                details("ancienRole", c.role(), "nouveauRole", role.name(), "juridiction", j)));
    }

    public void activer(Acteur admin, String identifiant, boolean actif, String motif) {
        habilitations.exiger(admin, Permission.GERER_AGENTS);
        if (!actif && vide(motif)) {
            throw new ErreurMetier("AGT-03", "Le motif de la désactivation est obligatoire.");
        }
        CompteAgent c = autreCompte(admin, identifiant);
        if (c.actif() == actif) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "AGT-03", actif ? "Ce compte est déjà actif." : "Ce compte est déjà désactivé.");
        }
        annuaire.activer(identifiant, actif);
        journal.enregistrer(EvenementAudit.par(admin, actif ? "AGENT_REACTIVE" : "AGENT_DESACTIVE", "Compte", identifiant, null,
                motif, Map.of()));
    }

    private CompteAgent autreCompte(Acteur admin, String identifiant) {
        if (admin.identifiant().equals(identifiant)) {
            throw new AccesRefuse("AGT-02", "Vous ne pouvez pas modifier votre propre compte.");
        }
        CompteAgent c = annuaire.compte(identifiant).orElseThrow(() -> new RessourceIntrouvable("Compte introuvable."));
        if (c.role() == null || !codes(ROLES_GERES).contains(c.role())) {
            throw new AccesRefuse("AGT-02", "Ce compte n'est pas un compte d'agent géré par la plateforme.");
        }
        return c;
    }

    private static Role roleGere(String code) {
        Role role;
        try {
            role = Role.valueOf(code == null ? "" : code.strip());
        } catch (IllegalArgumentException e) {
            throw new ErreurMetier("AGT-01", "Rôle inconnu.");
        }
        if (!ROLES_GERES.contains(role)) {
            throw new AccesRefuse("AGT-02", "Ce rôle ne s'attribue pas depuis la plateforme.");
        }
        return role;
    }

    private static String juridiction(Role role, String juridiction) {
        if (!ROLES_AVEC_JURIDICTION.contains(role)) {
            return null;
        }
        String j = juridiction == null ? "" : juridiction.strip().toUpperCase(Locale.ROOT);
        if (!j.matches("[A-Z0-9-]{3,40}")) {
            throw new ErreurMetier("AGT-01", "La juridiction de rattachement est obligatoire pour ce rôle (par exemple TPI-LIBREVILLE).");
        }
        return j;
    }

    private String motDePasseProvisoire() {
        StringBuilder s = new StringBuilder(16);
        for (int i = 0; i < 16; i++) {
            s.append(ALPHABET.charAt(aleatoire.nextInt(ALPHABET.length())));
        }
        return s.toString();
    }

    private static Set<String> codes(Set<Role> roles) {
        return roles.stream().map(Enum::name).collect(Collectors.toSet());
    }

    private static boolean vide(String s) {
        return s == null || s.isBlank();
    }

    private static Map<String, String> details(String... cleValeur) {
        Map<String, String> m = new java.util.LinkedHashMap<>();
        for (int i = 0; i + 1 < cleValeur.length; i += 2) {
            if (cleValeur[i + 1] != null) {
                m.put(cleValeur[i], cleValeur[i + 1]);
            }
        }
        return m;
    }
}
