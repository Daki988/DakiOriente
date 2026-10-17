package com.neamindustry.casier.regles;

import java.util.Map;

import com.neamindustry.casier.commun.Qualification;
import com.neamindustry.casier.commun.TypeBulletin;

/**
 * Contenu d'un jeu de règles (paramètres juridiques, ADM-05).
 *
 * @param reference              texte de référence et statut, par exemple « CPP, Titre VIII — à valider »
 * @param parBulletin            critères par type de bulletin
 * @param delaiEffacementAnnees  délai d'effacement par qualification, compté depuis la décision (RG-11)
 * @param effacementAutomatique  vrai : l'effacement s'applique dès l'échéance ; faux : validation d'un greffier en chef requise (RG-11)
 * @param dureeValiditeJours     durée de validité d'un bulletin émis (RG-08)
 */
public record ReglesBulletins(String reference, Map<TypeBulletin, RegleBulletin> parBulletin,
                              Map<Qualification, Integer> delaiEffacementAnnees, boolean effacementAutomatique,
                              Map<TypeBulletin, Integer> dureeValiditeJours) {

    public ReglesBulletins {
        parBulletin = Map.copyOf(parBulletin);
        delaiEffacementAnnees = delaiEffacementAnnees == null ? Map.of() : Map.copyOf(delaiEffacementAnnees);
        dureeValiditeJours = dureeValiditeJours == null ? Map.of() : Map.copyOf(dureeValiditeJours);
    }

    public RegleBulletin regle(TypeBulletin type) {
        RegleBulletin r = parBulletin.get(type);
        if (r == null) {
            throw new IllegalStateException("Aucune règle définie pour le " + type.libelle());
        }
        return r;
    }
}
