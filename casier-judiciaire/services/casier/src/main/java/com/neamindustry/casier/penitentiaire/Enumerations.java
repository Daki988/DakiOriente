package com.neamindustry.casier.penitentiaire;

/** Énumérations du module pénitentiaire (regroupées : petites et toujours utilisées ensemble). */
public final class Enumerations {

    private Enumerations() {
    }

    public enum StatutDetenu { PREVENU, CONDAMNE, LIBERE }

    public enum TitreDetention { MANDAT_DEPOT, JUGEMENT, ARRET, CONTRAINTE }

    public enum TypeMouvement { TRANSFERT, EXTRACTION_JUDICIAIRE, EXTRACTION_MEDICALE, PERMISSION }

    public enum StatutMouvement { DEMANDE, AUTORISE, EN_COURS, TERMINE, REFUSE, ANNULE }

    public enum MotifLiberation { FIN_DE_PEINE, MAINLEVEE_MANDAT, ACQUITTEMENT_RELAXE, LIBERTE_CONDITIONNELLE, GRACE, AUTRE }
}
