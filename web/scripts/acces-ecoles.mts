// Crée l'accès des établissements qui n'ont encore aucun compte actif (mot de passe provisoire à changer à la
// première connexion) et écrit le fichier des identifiants dans acces/ (privé, hors du site public) : à transmettre
// aux écoles, puis à supprimer. Usage sur le serveur : node outils/env.cjs outils/acces-ecoles.mjs
import fs from "node:fs";
import path from "node:path";
import { accesCsv, createMissingAccesses } from "../src/server/services/acces";

const crees = await createMissingAccesses(null);
if (!crees.length) { console.log("Aucun accès à créer : chaque établissement a déjà un compte actif."); process.exit(0); }
const dossier = path.resolve("acces");
fs.mkdirSync(dossier, { recursive: true, mode: 0o700 });
const f = path.join(dossier, `acces-etablissements-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-")}.csv`);
fs.writeFileSync(f, "﻿" + accesCsv(crees), { mode: 0o600 });
console.log(`${crees.length} accès créés (${crees.filter((c) => c.provisoire).length} avec une adresse provisoire à compléter) → ${f}`);
process.exit(0);
