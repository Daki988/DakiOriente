/**
 * Administration (back-office) — Keystatic.
 * Accessible sur /keystatic. Chaque enregistrement modifie les fichiers de /content
 * (commit GitHub en production) ; Vercel republie automatiquement le site (~1 min).
 *
 * Production : définir KEYSTATIC_GITHUB_CLIENT_ID, KEYSTATIC_GITHUB_CLIENT_SECRET,
 * KEYSTATIC_SECRET, NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG (voir README).
 */
import { config, fields, singleton } from "@keystatic/core";

const repo = (process.env.NEXT_PUBLIC_KEYSTATIC_REPO ?? "daki988/dakioriente") as `${string}/${string}`;
const useGithub = !!process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG;

const img = (label: string, dir: string) =>
  fields.image({ label, directory: `public/images/${dir}`, publicPath: `/images/${dir}/` });

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export default config({
  storage: useGithub ? { kind: "github", repo } : { kind: "local" },
  ui: {
    brand: { name: "Jackboy · Admin" },
    navigation: { "Contenu du site": ["menu", "events", "gallery", "loft"], "Informations pratiques": ["settings"] },
  },
  singletons: {
    settings: singleton({
      label: "Infos pratiques (horaires, téléphones, adresse)",
      path: "content/settings",
      format: { data: "json" },
      schema: {
        demoMode: fields.checkbox({ label: "Mode démonstration (bandeau + non indexé). À DÉCOCHER avant la mise en ligne.", defaultValue: true }),
        name: fields.text({ label: "Nom de l'établissement" }),
        tagline: fields.text({ label: "Accroche (anglais)" }),
        taglineFr: fields.text({ label: "Accroche (français)" }),
        phones: fields.array(
          fields.object({
            label: fields.text({ label: "Libellé (ex. Contact principal)" }),
            number: fields.text({ label: "Numéro international sans espaces (ex. +24177000000)" }),
            display: fields.text({ label: "Numéro affiché (ex. +241 77 00 00 00)" }),
          }),
          { label: "Téléphones (le premier est le contact principal)", itemLabel: (p) => p.fields.display.value || "Téléphone" },
        ),
        whatsapp: fields.text({ label: "WhatsApp (optionnel)" }),
        address: fields.object({
          street: fields.text({ label: "Rue / quartier" }),
          city: fields.text({ label: "Ville" }),
          country: fields.text({ label: "Pays" }),
          landmark: fields.text({ label: "Repère" }),
          lat: fields.number({ label: "Latitude GPS" }),
          lng: fields.number({ label: "Longitude GPS" }),
        }, { label: "Adresse" }),
        hours: fields.array(
          fields.object({
            day: fields.select({ label: "Jour", options: DAYS.map((d) => ({ label: d, value: d })), defaultValue: "lundi" }),
            open: fields.text({ label: "Ouverture (HH:MM)", defaultValue: "15:00" }),
            close: fields.text({ label: "Fermeture (HH:MM, ex. 06:00 = lendemain matin)", defaultValue: "06:00" }),
            closed: fields.checkbox({ label: "Fermé ce jour", defaultValue: false }),
          }),
          { label: "Horaires", itemLabel: (h) => `${h.fields.day.value} : ${h.fields.closed.value ? "fermé" : `${h.fields.open.value} – ${h.fields.close.value}`}` },
        ),
        hoursNote: fields.text({ label: "Note sur les horaires" }),
        socials: fields.array(
          fields.object({
            network: fields.select({ label: "Réseau", options: ["facebook", "instagram", "tiktok", "youtube", "x"].map((v) => ({ label: v, value: v })), defaultValue: "facebook" }),
            url: fields.url({ label: "Lien" }),
          }),
          { label: "Réseaux sociaux", itemLabel: (s) => s.fields.network.value },
        ),
      },
    }),
    menu: singleton({
      label: "Menu & prix",
      path: "content/menu",
      format: { data: "json" },
      schema: {
        categories: fields.array(
          fields.object({
            name: fields.text({ label: "Nom de la catégorie" }),
            slug: fields.text({ label: "Identifiant (minuscules, sans espace)" }),
            visible: fields.checkbox({ label: "Visible sur le site", defaultValue: true }),
            intro: fields.text({ label: "Phrase d'introduction (optionnel)" }),
            products: fields.array(
              fields.object({
                name: fields.text({ label: "Nom du produit" }),
                description: fields.text({ label: "Description courte", multiline: true }),
                price: fields.integer({ label: "Prix en FCFA (0 = « Prix à confirmer »)", defaultValue: 0 }),
                image: img("Photo (optionnel)", "menu"),
                featured: fields.checkbox({ label: "Produit signature (mis en avant)", defaultValue: false }),
                available: fields.checkbox({ label: "Disponible", defaultValue: true }),
                isNew: fields.checkbox({ label: "Badge « Nouveau »", defaultValue: false }),
              }),
              { label: "Produits", itemLabel: (p) => `${p.fields.name.value} — ${p.fields.price.value ?? 0} FCFA` },
            ),
          }),
          { label: "Catégories (glisser pour réordonner)", itemLabel: (c) => c.fields.name.value || "Catégorie" },
        ),
      },
    }),
    events: singleton({
      label: "Événements",
      path: "content/events",
      format: { data: "json" },
      schema: {
        events: fields.array(
          fields.object({
            title: fields.text({ label: "Titre" }),
            date: fields.text({ label: "Date (AAAA-MM-JJ)" }),
            time: fields.text({ label: "Heure (HH:MM)", defaultValue: "22:00" }),
            dj: fields.text({ label: "DJ / artiste" }),
            description: fields.text({ label: "Description", multiline: true }),
            poster: img("Affiche", "events"),
            visible: fields.checkbox({ label: "Visible", defaultValue: true }),
          }),
          { label: "Événements (les dates passées sont masquées automatiquement)", itemLabel: (e) => `${e.fields.date.value} · ${e.fields.title.value}` },
        ),
      },
    }),
    gallery: singleton({
      label: "Galerie & équipe",
      path: "content/gallery",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.object({
            src: img("Photo", "gallery"),
            alt: fields.text({ label: "Description de la photo (accessibilité)" }),
            mood: fields.select({ label: "Ambiance", options: [
              { label: "Début de soirée", value: "early" }, { label: "Nuit", value: "late" },
              { label: "Cuisine", value: "food" }, { label: "Équipe", value: "team" },
            ], defaultValue: "late" }),
            caption: fields.text({ label: "Légende" }),
          }),
          { label: "Photos (glisser pour réordonner)", itemLabel: (i) => i.fields.caption.value || i.fields.alt.value || "Photo" },
        ),
        team: fields.array(
          fields.object({ name: fields.text({ label: "Nom" }), role: fields.text({ label: "Rôle" }), photo: img("Photo", "team") }),
          { label: "Équipe", itemLabel: (m) => `${m.fields.name.value} — ${m.fields.role.value}` },
        ),
      },
    }),
    loft: singleton({
      label: "Le Loft",
      path: "content/loft",
      format: { data: "json" },
      schema: {
        title: fields.text({ label: "Titre" }),
        intro: fields.text({ label: "Présentation", multiline: true }),
        features: fields.array(fields.text({ label: "Atout" }), { label: "Atouts", itemLabel: (f) => f.value }),
        conditions: fields.text({ label: "Conditions", multiline: true }),
        image: img("Photo", "loft"),
      },
    }),
  },
});
