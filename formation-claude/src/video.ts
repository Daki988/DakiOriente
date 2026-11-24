import type { Block, Module, Section } from "./content/types";
import type { Project } from "./content/projects";

/** Une « vidéo » = une suite de scènes ; chaque scène se déroule en temps (beats) narrés */
export type Beat = { say: string; reveal?: number };
export type Scene =
  | { k: "title"; kicker: string; title: string; sub?: string; beats: Beat[] }
  | { k: "points"; title?: string; items: string[]; ordered?: boolean; beats: Beat[] }
  | { k: "terminal"; title: string; lines: string[]; beats: Beat[] }
  | { k: "table"; head: string[]; rows: string[][]; beats: Beat[] }
  | { k: "callout"; tone: "warn" | "tip" | "key"; title: string; text: string; beats: Beat[] }
  | { k: "compare"; flou: string; precis: string; beats: Beat[] }
  | { k: "flow"; title: string; steps: string[]; loop?: boolean; beats: Beat[] }
  | { k: "end"; title: string; sub: string; beats: Beat[] };

export type Video = { title: string; scenes: Scene[] };

const plain = (t: string) => t.replace(/\*\*|`/g, "");

/** Rend un texte prononçable par la synthèse vocale */
export function speakable(t: string) {
  return plain(t)
    .replace(/(^|\s)\/([a-z][\w-]*)/gi, "$1slash $2")
    .replace(/(^|\s)@([\w./-]+)/g, "$1arobase $2")
    .replace(/(^|\s)!([a-z])/gi, "$1point d'exclamation $2")
    .replace(/Ctrl\+/g, "Contrôle ")
    .replace(/Shift\+/g, "Majuscule ")
    .replace(/Esc Esc/g, "Échap deux fois")
    .replace(/\bEsc\b/g, "Échap")
    .replace(/CLAUDE\.md/g, "Claude point M D")
    .replace(/\.md\b/g, " point M D")
    .replace(/→/g, ", puis ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Découpe un paragraphe en phrases pour une révélation progressive */
const sentences = (t: string) =>
  plain(t).split(/(?<=[.!?:])\s+(?=[A-ZÀ-ÖØ-Þ«(])/).map((s) => s.trim()).filter(Boolean);

function blockScenes(b: Block, sectionTitle: string): Scene[] {
  switch (b.t) {
    case "p": {
      const ss = sentences(b.text);
      if (ss.length <= 1) return [{ k: "points", items: [b.text], beats: [{ say: speakable(b.text), reveal: 1 }] }];
      return [{ k: "points", items: ss, beats: ss.map((s, i) => ({ say: speakable(s), reveal: i + 1 })) }];
    }
    case "list":
      return [{ k: "points", items: b.items, ordered: b.ordered, beats: b.items.map((it, i) => ({ say: speakable(it), reveal: i + 1 })) }];
    case "table":
      return [{
        k: "table", head: b.head, rows: b.rows,
        beats: b.rows.map((r, i) => ({ say: speakable(r.map((c, j) => (j === 0 ? c : c)).join(" : ")), reveal: i + 1 })),
      }];
    case "code": {
      const lines = b.text.split("\n");
      const comments = lines.filter((l) => /^\s*(#|\/\/)\s?\S/.test(l)).map((l) => l.replace(/^\s*(#|\/\/)\s?/, ""));
      const intro = b.title ? `Regardons ${plain(b.title)}.` : `Voici ce qu'il faut taper pour ${plain(sectionTitle).toLowerCase()}.`;
      const say = [intro, ...comments.slice(0, 4)].join(" ");
      return [{ k: "terminal", title: b.title ?? "terminal", lines, beats: [{ say: speakable(say) }, { say: "Prends le temps de lire chaque ligne." }] }];
    }
    case "callout":
      return [{ k: "callout", tone: b.tone, title: b.title, text: b.text, beats: [{ say: speakable(`${b.title}. ${b.text}`) }] }];
    case "compare":
      return [{
        k: "compare", flou: b.flou, precis: b.precis,
        beats: [{ say: `Un prompt flou : ${speakable(b.flou)}`, reveal: 1 }, { say: `Et sa version précise : ${speakable(b.precis)}`, reveal: 2 }],
      }];
  }
}

/** Schémas animés écrits à la main pour les notions clés */
const DIAGRAMS: Record<string, Scene> = {
  m0s1: { k: "flow", title: "La boucle de l'agent", loop: true, steps: ["Comprendre", "Agir", "Vérifier"], beats: [
    { say: "Retiens ce schéma : Claude Code est un agent qui tourne en boucle.", reveal: 0 },
    { say: "D'abord il comprend : il lit tes fichiers et cherche dans le code.", reveal: 1 },
    { say: "Ensuite il agit : il modifie des fichiers et lance des commandes.", reveal: 2 },
    { say: "Puis il vérifie le résultat, et recommence jusqu'à ce que la tâche soit terminée.", reveal: 3 },
  ] },
  m1s2: { k: "flow", title: "Majuscule + Tab fait tourner les modes", loop: true, steps: ["Normal", "Acceptation auto", "Plan"], beats: [
    { say: "Trois modes, qui tournent avec Majuscule Tab.", reveal: 0 },
    { say: "Normal : il te demande la permission avant chaque action sensible.", reveal: 1 },
    { say: "Acceptation automatique : il applique les modifications sans demander.", reveal: 2 },
    { say: "Plan : il lit, analyse, et te propose un plan sans rien modifier.", reveal: 3 },
  ] },
  m2s2: { k: "flow", title: "Les six ingrédients d'un prompt", steps: ["Objectif", "Contexte", "Périmètre", "Critère de fin", "Vérification", "Format"], beats: [
    { say: "Un bon prompt, c'est six ingrédients.", reveal: 0 },
    { say: "L'objectif, et pourquoi.", reveal: 1 }, { say: "Le contexte : fichiers, maquette, contraintes.", reveal: 2 },
    { say: "Le périmètre : ce qu'il ne faut pas toucher.", reveal: 3 }, { say: "Le critère de fin : comment savoir que c'est terminé.", reveal: 4 },
    { say: "La vérification : la preuve exigée.", reveal: 5 }, { say: "Et le format de ce que tu veux recevoir.", reveal: 6 },
  ] },
  m3s1: { k: "flow", title: "Trois niveaux de mémoire", steps: ["~/.claude/CLAUDE.md · toi", "./CLAUDE.md · le projet", "sous-dossier/CLAUDE.md · une partie"], beats: [
    { say: "La mémoire de Claude tient en trois niveaux.", reveal: 0 },
    { say: "Ton fichier personnel, pour tous tes projets.", reveal: 1 },
    { say: "Le fichier du projet, versionné et partagé avec l'équipe.", reveal: 2 },
    { say: "Et un fichier par sous-dossier, lu seulement quand Claude y travaille.", reveal: 3 },
  ] },
  m4s1: { k: "flow", title: "Le workflow de base", steps: ["Explorer", "Planifier", "Coder", "Vérifier", "Clore"], beats: [
    { say: "Pour toute tâche non triviale, un seul workflow.", reveal: 0 },
    { say: "Explorer, en mode plan, sans rien modifier.", reveal: 1 }, { say: "Planifier : corriger le plan coûte moins cher que corriger le code.", reveal: 2 },
    { say: "Coder en appliquant le plan.", reveal: 3 }, { say: "Vérifier : tests, build, captures, et ta relecture du diff.", reveal: 4 },
    { say: "Clore : un commit clair, et la mise à jour de Claude point M D si tu as appris quelque chose.", reveal: 5 },
  ] },
  m6s5: { k: "flow", title: "Le bon outil pour chaque besoin", steps: ["Règle courte → CLAUDE.md", "Procédure → Skill", "Raccourci → Commande", "Toujours → Hook", "Spécialiste → Sous-agent"], beats: [
    { say: "Comment choisir le bon outil ?", reveal: 0 },
    { say: "Une règle courte, toujours vraie : Claude point M D.", reveal: 1 }, { say: "Une procédure détaillée pour certaines tâches : une skill.", reveal: 2 },
    { say: "Un raccourci que tu lances toi-même : une commande.", reveal: 3 }, { say: "Une action qui doit arriver à chaque fois : un hook.", reveal: 4 },
    { say: "Un spécialiste avec son propre contexte : un sous-agent.", reveal: 5 },
  ] },
  m7s2: { k: "flow", title: "Le sous-agent protège ton contexte", steps: ["Session principale", "Sous-agent : lit 50 fichiers", "Renvoie un résumé"], beats: [
    { say: "Le sous-agent travaille dans son propre contexte.", reveal: 0 },
    { say: "Ta session principale lui confie une tâche.", reveal: 1 },
    { say: "Il lit, cherche, analyse, sans encombrer ta session.", reveal: 2 },
    { say: "Et il ne renvoie que la conclusion.", reveal: 3 },
  ] },
  m9s1: { k: "flow", title: "Le pipeline complet", steps: ["Spec", "Maquette", "Plan", "Code", "Contrôle design", "Qualité", "PR", "Préprod", "Bilan"], beats: [
    { say: "Le projet final enchaîne tout ce que tu as appris.", reveal: 0 },
    { say: "La spec par interview, puis la maquette Figma validée.", reveal: 2 },
    { say: "Le plan, puis l'implémentation avec ta skill.", reveal: 4 },
    { say: "Le contrôle design, puis la qualité : hooks et revues.", reveal: 6 },
    { say: "La pull request, la prévisualisation, et enfin le bilan.", reveal: 9 },
  ] },
};

export function videoForSection(m: Module, s: Section, index: number): Video {
  const scenes: Scene[] = [
    { k: "title", kicker: `Module ${m.num} · Section ${index + 1}/${m.sections.length}`, title: s.title, sub: m.title, beats: [{ say: speakable(`Module ${m.num}, ${m.title}. ${s.title}.`) }] },
  ];
  if (DIAGRAMS[s.id]) scenes.push(DIAGRAMS[s.id]);
  for (const b of s.blocks) scenes.push(...blockScenes(b, s.title));
  const last = index === m.sections.length - 1;
  scenes.push({
    k: "end", title: "À toi de jouer",
    sub: last ? "Contrôle de compréhension, puis le quiz de validation du palier." : "Réponds à la question de contrôle pour débloquer la section suivante.",
    beats: [{ say: last ? "C'est la dernière section. Réponds au contrôle, puis passe le quiz de validation." : "Bien. Réponds maintenant à la question de contrôle pour débloquer la suite." }],
  });
  return { title: s.title, scenes };
}

export function videoForProject(p: Project): Video {
  const scenes: Scene[] = [
    { k: "title", kicker: `Projet guidé · ${p.level} · ${p.duration}`, title: p.title, beats: [{ say: speakable(`Projet ${p.level.toLowerCase()}. ${p.title}.`) }] },
    { k: "points", title: "Ce que tu vas construire", items: p.build, beats: [{ say: speakable(p.pitch), reveal: 0 }, ...p.build.map((b, i) => ({ say: speakable(b), reveal: i + 1 }))] },
    { k: "flow", title: "Les étapes", steps: p.steps.map((s) => s.title), beats: [{ say: `Le projet se déroule en ${p.steps.length} étapes.`, reveal: 0 }, ...p.steps.map((s, i) => ({ say: speakable(s.title), reveal: i + 1 }))] },
  ];
  p.steps.forEach((s, i) => {
    scenes.push({ k: "callout", tone: "key", title: `Étape ${i + 1} · ${s.title}`, text: s.why, beats: [{ say: speakable(`Étape ${i + 1}. ${s.title}. ${s.why}`) }] });
    if (s.prompt) scenes.push({ k: "terminal", title: "Prompt à donner à Claude", lines: s.prompt.split("\n"), beats: [{ say: "Voici le prompt à donner à Claude." }, { say: "Remarque l'objectif, les contraintes et le critère de fin." }] });
    else if (s.code?.length) scenes.push(...blockScenes({ t: "code", title: s.code[0].title, text: s.code[0].text }, s.title));
    scenes.push({ k: "callout", tone: "tip", title: "Point de contrôle", text: s.check, beats: [{ say: speakable(`Vérifie : ${s.check}`) }] });
  });
  scenes.push({ k: "end", title: "À toi de construire", sub: "Suis les étapes détaillées sous la vidéo et coche-les une à une.", beats: [{ say: "À toi maintenant. Suis les étapes sous la vidéo et coche-les au fur et à mesure." }] });
  return { title: p.title, scenes };
}

/** Durée estimée d'une narration (ms) à vitesse 1 */
export const beatMs = (b: Beat) => Math.max(1800, b.say.length * 62);
export const videoMs = (v: Video) => v.scenes.reduce((s, sc) => s + sc.beats.reduce((a, b) => a + beatMs(b), 0), 0);
