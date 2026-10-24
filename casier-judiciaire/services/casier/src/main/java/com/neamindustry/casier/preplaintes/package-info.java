/**
 * Pré-plaintes en ligne : la victime d'une atteinte aux biens déclare les faits, reçoit un numéro et un code, puis
 * signe sa plainte lors d'un rendez-vous avec un officier de police judiciaire. Sans signature dans le délai, la
 * pré-plainte expire. Chaque étape est journalisée ; rien n'est supprimé.
 */
@ApplicationModule(displayName = "Pré-plaintes")
package com.neamindustry.casier.preplaintes;

import org.springframework.modulith.ApplicationModule;
