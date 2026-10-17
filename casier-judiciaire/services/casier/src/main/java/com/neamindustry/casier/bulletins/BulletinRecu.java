package com.neamindustry.casier.bulletins;

import java.time.Instant;
import java.util.UUID;

import com.neamindustry.casier.commun.TypeBulletin;

/** Bulletin listé dans l'espace de son destinataire (DSH-01) : ni jeton ni code de vérification. */
public record BulletinRecu(UUID id, String numero, TypeBulletin type, String statut, Instant dateEmission, Instant dateExpiration,
                           boolean neant, UUID demandeId) {
}
