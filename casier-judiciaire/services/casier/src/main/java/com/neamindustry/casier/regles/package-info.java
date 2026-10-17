/**
 * Moteur de règles des bulletins (RG-04, RG-11) et paramètres juridiques versionnés (ADM-05, ADR 0005).
 * Aucune règle de droit n'est écrite dans le code : le contenu des bulletins est calculé à partir
 * d'un jeu de règles publié, avec sa date d'effet.
 */
@ApplicationModule(displayName = "Règles et paramètres juridiques")
package com.neamindustry.casier.regles;

import org.springframework.modulith.ApplicationModule;
