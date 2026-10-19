/**
 * Gestion des comptes des agents depuis la plateforme : création, changement de rôle, désactivation. Les comptes vivent
 * dans le fournisseur d'identité (Keycloak) ; ce module les pilote par son interface d'administration. Aucun compte n'est
 * supprimé, aucun administrateur ne modifie son propre compte ni n'attribue le rôle d'administrateur.
 */
@ApplicationModule(displayName = "Agents")
package com.neamindustry.casier.agents;

import org.springframework.modulith.ApplicationModule;
