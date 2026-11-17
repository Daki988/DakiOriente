"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigerAdmin, fermerSession, ouvrirSession, verifierMotDePasseAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { deleteDemo, seedDemo } from "@/lib/demo";
import { majStatutTransitaire, modererAvis, modererReponse, traiterModifProfil, validerOffre, type StatutTransitaire } from "@/lib/queries";
import { BADGE_CODES, type BadgeCode } from "@/lib/referentiel";

export async function connexionAdmin(form: FormData) {
  await new Promise((r) => setTimeout(r, 400)); // ralentit les essais en série
  if (!verifierMotDePasseAdmin(String(form.get("motdepasse") ?? ""))) redirect("/admin/connexion?erreur=1");
  await ouvrirSession({ role: "admin" }, 12);
  redirect("/admin");
}

export async function deconnexionAdmin() {
  await fermerSession();
  redirect("/");
}

export async function decisionTransitaire(form: FormData) {
  await exigerAdmin();
  const id = Number(form.get("id"));
  const statut = String(form.get("statut")) as StatutTransitaire;
  if (!["en_attente", "verifie", "refuse", "suspendu"].includes(statut)) return;
  const badges = form.getAll("badges").map(String).filter((b): b is BadgeCode => (BADGE_CODES as string[]).includes(b));
  majStatutTransitaire(id, statut, badges, String(form.get("note") ?? "").trim().slice(0, 500) || null);
  redirect(`/admin/transitaires/${id}?ok=1`);
}

async function modifProfil(form: FormData, accepter: boolean) {
  await exigerAdmin();
  const id = Number(form.get("id"));
  traiterModifProfil(id, accepter);
  redirect(`/admin/transitaires/${id}?ok=1`);
}
export async function accepterModifProfil(form: FormData) {
  return modifProfil(form, true);
}
export async function refuserModifProfil(form: FormData) {
  return modifProfil(form, false);
}

async function decisionOffre(form: FormData, ok: boolean) {
  await exigerAdmin();
  validerOffre(Number(form.get("id")), ok, String(form.get("motif") ?? "").trim().slice(0, 300) || null);
  revalidatePath("/admin");
  redirect("/admin#offres");
}
export async function validerOffreAction(form: FormData) {
  return decisionOffre(form, true);
}
export async function refuserOffreAction(form: FormData) {
  return decisionOffre(form, false);
}

async function decisionAvis(form: FormData, publier: boolean) {
  await exigerAdmin();
  const id = Number(form.get("id"));
  if (String(form.get("cible")) === "reponse") modererReponse(id, publier);
  else modererAvis(id, publier);
  redirect("/admin#avis");
}
export async function publierAction(form: FormData) {
  return decisionAvis(form, true);
}
export async function rejeterAction(form: FormData) {
  return decisionAvis(form, false);
}

export async function chargerDemo() {
  await exigerAdmin();
  const db = getDb();
  const n = db.prepare("SELECT COUNT(*) AS n FROM transitaires WHERE demo = 1").get() as { n: number };
  if (n.n === 0) seedDemo(db);
  redirect("/admin");
}
export async function supprimerDemo() {
  await exigerAdmin();
  deleteDemo(getDb());
  redirect("/admin");
}
