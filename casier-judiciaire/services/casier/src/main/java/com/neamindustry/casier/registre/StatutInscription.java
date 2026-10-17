package com.neamindustry.casier.registre;

/** Cycle d'une inscription : rien n'apparaît sur un bulletin avant validation (section 8). */
public enum StatutInscription {
    /** Saisie par l'agent du casier, en attente du greffier en chef. */
    SAISIE,
    /** Validée par un greffier en chef distinct : opposable. */
    VALIDEE,
    /** Refusée par le greffier en chef, avec motif. */
    REJETEE,
    /** Ancienne version remplacée par une correction validée (REG-08 : reste lisible). */
    REMPLACEE
}
