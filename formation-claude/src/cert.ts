import { MODULES } from "./content";
import type { Store } from "./engine";

/** Grille pratique de certification = compétences du module 9 */
export const GRILLE = MODULES[MODULES.length - 1].competences;

export type Level = {
  id: "praticien" | "avance" | "expert";
  title: string;
  short: string;
  color: string;
  rule: string;
};

export const LEVELS: Level[] = [
  { id: "praticien", title: "Praticien Claude Code", short: "Praticien", color: "#2f8f5b", rule: "Examen réussi à 80 % ou plus" },
  { id: "avance", title: "Praticien avancé Claude Code", short: "Avancé", color: "#c4613f", rule: "Examen réussi à 90 % ou plus" },
  { id: "expert", title: "Expert Claude Code", short: "Expert", color: "#7a4fd1", rule: "90 % ou plus et grille pratique complète (6/6)" },
];

export function levelOf(s: Store): Level | null {
  const f = s.final;
  if (!f.passed) return null;
  const grilleOk = GRILLE.every((g) => f.grille?.includes(g));
  if (f.best >= 0.9 && grilleOk) return LEVELS[2];
  if (f.best >= 0.9) return LEVELS[1];
  return LEVELS[0];
}

/** Identifiant de certificat stable, dérivé du nom, de la date et du score */
export function certId(s: Store): string {
  const f = s.final;
  const src = `${(f.name ?? "").trim().toLowerCase()}|${f.date ?? 0}|${Math.round(f.best * 100)}`;
  let h = 2166136261;
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const year = new Date(f.date ?? Date.now()).getFullYear();
  return `CC-${year}-${(h >>> 0).toString(36).toUpperCase().padStart(7, "0")}`;
}

export const fmtDate = (t?: number) =>
  new Date(t ?? Date.now()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Dessine le certificat sur un canvas et déclenche le téléchargement en PNG */
export async function downloadCertificate(s: Store) {
  const lvl = levelOf(s);
  if (!lvl) return;
  try {
    await document.fonts.ready;
  } catch {
    /* polices indisponibles : repli système */
  }
  const W = 1600, H = 1131;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  // Fond et cadres
  x.fillStyle = "#fbf8f3";
  x.fillRect(0, 0, W, H);
  x.strokeStyle = "#d97757";
  x.lineWidth = 6;
  x.strokeRect(40, 40, W - 80, H - 80);
  x.strokeStyle = "#e7d9cb";
  x.lineWidth = 2;
  x.strokeRect(64, 64, W - 128, H - 128);
  // Logo
  x.fillStyle = "#d97757";
  roundRect(x, W / 2 - 44, 110, 88, 88, 22);
  x.fill();
  x.strokeStyle = "#fff";
  x.lineWidth = 7;
  x.lineCap = "round";
  for (let a = 0; a < 4; a++) {
    const ang = (a * Math.PI) / 4;
    x.beginPath();
    x.moveTo(W / 2 - Math.cos(ang) * 26, 154 - Math.sin(ang) * 26);
    x.lineTo(W / 2 + Math.cos(ang) * 26, 154 + Math.sin(ang) * 26);
    x.stroke();
  }
  x.textAlign = "center";
  x.fillStyle = "#d97757";
  x.font = "700 24px Inter, sans-serif";
  x.fillText("CERTIFICAT DE RÉUSSITE", W / 2, 260);
  x.fillStyle = "#191714";
  x.font = "700 78px Fraunces, Georgia, serif";
  x.fillText("Formation Claude Code", W / 2, 350);
  x.fillStyle = "#6e6a63";
  x.font = "400 30px Inter, sans-serif";
  x.fillText("décerné à", W / 2, 430);
  x.fillStyle = "#191714";
  x.font = "700 72px Fraunces, Georgia, serif";
  x.fillText(s.final.name?.trim() || "—", W / 2, 520);
  // Niveau
  x.font = "700 30px Inter, sans-serif";
  const label = `Niveau : ${lvl.title}`;
  const lw = x.measureText(label).width + 64;
  x.fillStyle = lvl.color;
  roundRect(x, W / 2 - lw / 2, 568, lw, 64, 32);
  x.fill();
  x.fillStyle = "#fff";
  x.fillText(label, W / 2, 611);
  x.fillStyle = "#3d3a35";
  x.font = "400 28px Inter, sans-serif";
  x.fillText("pour avoir validé les 10 paliers du parcours, de l'installation à l'automatisation,", W / 2, 700);
  x.fillText(`et réussi l'examen de certification avec un score de ${Math.round(s.final.best * 100)} %.`, W / 2, 742);
  // Pied
  x.font = "600 24px Inter, sans-serif";
  x.fillStyle = "#191714";
  x.fillText(fmtDate(s.final.date), W / 2 - 360, 900);
  x.fillText(certId(s), W / 2 + 360, 900);
  x.font = "400 20px Inter, sans-serif";
  x.fillStyle = "#6e6a63";
  x.fillText("Date d'obtention", W / 2 - 360, 935);
  x.fillText("Identifiant du certificat", W / 2 + 360, 935);
  x.strokeStyle = "#e7d9cb";
  x.beginPath();
  x.moveTo(W / 2 - 520, 870);
  x.lineTo(W / 2 - 200, 870);
  x.moveTo(W / 2 + 200, 870);
  x.lineTo(W / 2 + 520, 870);
  x.stroke();
  x.font = "italic 400 22px Fraunces, Georgia, serif";
  x.fillStyle = "#6e6a63";
  x.fillText("Plan avant le code · Toujours une preuve · Une tâche, un contexte · Aucun agent ne fusionne seul", W / 2, 1020);

  const a = document.createElement("a");
  a.download = `certificat-claude-code-${certId(s)}.png`;
  a.href = c.toDataURL("image/png");
  a.click();
}

function roundRect(x: CanvasRenderingContext2D, X: number, Y: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + w, Y, X + w, Y + h, r);
  x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r);
  x.arcTo(X, Y, X + w, Y, r);
  x.closePath();
}
