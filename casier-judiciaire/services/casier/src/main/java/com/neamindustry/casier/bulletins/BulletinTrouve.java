package com.neamindustry.casier.bulletins;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Bulletin retrouvé par son numéro, pour une révocation (BUL-10). Le contenu du casier n'y figure pas. */
public record BulletinTrouve(UUID id, String numero, String statut, String nom, String prenoms, LocalDate dateNaissance,
                             Instant dateEmission, Instant dateExpiration, Instant revoqueLe, String motifRevocation) {
}
