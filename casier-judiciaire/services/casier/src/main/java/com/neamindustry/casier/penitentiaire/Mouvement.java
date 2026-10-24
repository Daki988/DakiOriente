package com.neamindustry.casier.penitentiaire;

import java.time.Instant;
import java.util.UUID;

import com.neamindustry.casier.penitentiaire.Enumerations.StatutMouvement;
import com.neamindustry.casier.penitentiaire.Enumerations.TypeMouvement;

/** Mouvement d'un détenu : transfert, extraction ou permission de sortir. */
public record Mouvement(UUID id, UUID detenuId, String numeroEcrou, String nomDetenu, TypeMouvement type, String origine,
                        String destination, String motif, Instant prevuLe, Instant retourPrevu, StatutMouvement statut,
                        boolean demandeParMoi, Instant departLe, Instant retourLe, String observation) {
}
