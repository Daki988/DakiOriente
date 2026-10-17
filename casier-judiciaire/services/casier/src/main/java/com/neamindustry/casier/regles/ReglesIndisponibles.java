package com.neamindustry.casier.regles;

import com.neamindustry.casier.commun.ErreurMetier;

/** Aucun jeu de règles publié n'est en vigueur à la date demandée : aucun bulletin ne peut être calculé. */
public class ReglesIndisponibles extends ErreurMetier {

    public ReglesIndisponibles(String message) {
        super("RG-04", message);
    }
}
