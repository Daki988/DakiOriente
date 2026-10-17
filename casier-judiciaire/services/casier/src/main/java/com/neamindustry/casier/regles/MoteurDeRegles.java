package com.neamindustry.casier.regles;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.neamindustry.casier.commun.TypeBulletin;
import com.neamindustry.casier.regles.interne.DepotJeuxDeRegles;

/** Calcule le contenu d'un bulletin avec le jeu de règles en vigueur à la date de l'état du casier (RG-04, RG-05). */
@Service
public class MoteurDeRegles {

    private final DepotJeuxDeRegles depot;

    MoteurDeRegles(DepotJeuxDeRegles depot) {
        this.depot = depot;
    }

    public ResultatCalcul calculer(TypeBulletin type, List<CondamnationPourCalcul> condamnations, LocalDate date) {
        JeuDeRegles jeu = enVigueur(date);
        return CalculateurBulletin.calculer(jeu.contenu(), jeu.version(), type, condamnations, date);
    }

    /** RG-08 : durée de validité d'un bulletin, fixée par le Ministère. */
    public int dureeValiditeJours(TypeBulletin type, LocalDate date) {
        Integer jours = enVigueur(date).contenu().dureeValiditeJours().get(type);
        if (jours == null) {
            throw new ReglesIndisponibles("Durée de validité non définie pour le " + type.libelle() + ".");
        }
        return jours;
    }

    public JeuDeRegles enVigueur(LocalDate date) {
        return depot.publieEnVigueurAu(date)
                .orElseThrow(() -> new ReglesIndisponibles("Aucun jeu de règles publié n'est en vigueur au " + date + "."));
    }
}
