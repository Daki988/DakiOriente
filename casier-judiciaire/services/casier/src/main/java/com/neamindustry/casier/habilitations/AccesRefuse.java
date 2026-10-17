package com.neamindustry.casier.habilitations;

import com.neamindustry.casier.commun.ErreurMetier;

/** L'acteur n'est pas habilité pour cette action, ce périmètre ou cette finalité. */
public class AccesRefuse extends ErreurMetier {

    public AccesRefuse(String code, String message) {
        super(Nature.ACCES_REFUSE, code, message);
    }
}
