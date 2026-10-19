package com.neamindustry.casier.agents;

/** Le fournisseur d'identité n'est pas configuré ou ne répond pas. */
public class AnnuaireIndisponible extends RuntimeException {

    public AnnuaireIndisponible(String message) {
        super(message);
    }
}
