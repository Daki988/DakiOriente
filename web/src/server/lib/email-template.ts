// Gabarit des e-mails Navigoal : logo, message, code ou bouton d'action, pied avec coordonnées.
// HTML en tableaux et styles en ligne (compatibilité Gmail, Outlook, Apple Mail, webmails mobiles).
import { SITE_URL } from "@/lib/site";

export type EmailContenu = {
  /** Titre affiché en tête du message (sinon, l'objet). */
  titre?: string;
  /** Code à usage unique, mis en évidence. */
  code?: string;
  /** Bouton d'action (lien absolu ou chemin du site). */
  action?: { label: string; url: string };
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`);
const lien = (s: string) => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1a47f5;text-decoration:underline">$1</a>');

const BLEU = "#1a47f5", ENCRE = "#0d1636", DOUX = "#5b6478", SOLEIL = "#ffc21f";

export function emailHtml(o: { subject?: string; text: string } & EmailContenu, logo: string | null) {
  const titre = o.titre ?? o.subject?.replace(/^Navigoal\s*·\s*/, "") ?? "Navigoal";
  const paragraphes = esc(o.text).split(/\n{1,}/).filter(Boolean).map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${ENCRE}">${lien(p)}</p>`).join("");
  const code = o.code ? `<div style="margin:6px 0 20px;text-align:center"><span style="display:inline-block;padding:14px 26px;border-radius:14px;background:#eef2ff;color:${BLEU};font-size:30px;font-weight:800;letter-spacing:8px;font-family:Consolas,Menlo,monospace">${esc(o.code)}</span></div>` : "";
  const bouton = o.action ? `<div style="margin:8px 0 22px;text-align:center"><a href="${esc(abs(o.action.url))}" style="display:inline-block;padding:13px 26px;border-radius:12px;background:${BLEU};color:#ffffff;font-weight:700;font-size:15px;text-decoration:none">${esc(o.action.label)}</a></div>` : "";
  const entete = logo
    ? `<img src="${logo}" width="220" alt="Navigoal" style="display:block;width:220px;max-width:70%;height:auto;border:0">`
    : `<span style="font-size:24px;font-weight:800;color:${ENCRE}">Navi<span style="color:#f2a900">goal</span></span>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titre)}</title></head>
<body style="margin:0;padding:0;background:#f3f6fd;font-family:'Plus Jakarta Sans',Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fd;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(26,71,245,.08)">
<tr><td style="padding:24px 28px 12px">${entete}</td></tr>
<tr><td style="height:4px;background:linear-gradient(90deg,${BLEU},${SOLEIL});font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:26px 28px 8px">
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:${ENCRE}">${esc(titre)}</h1>
${paragraphes}${code}${bouton}
</td></tr>
<tr><td style="padding:18px 28px 26px;border-top:1px solid #eef1f8;font-size:12px;line-height:1.6;color:${DOUX}">
<b style="color:${ENCRE}">Navigoal</b> · Ton talent, tes opportunités, ton avenir.<br>
Orientation, candidature et logement étudiant pour étudier au Maroc.<br>
<a href="${SITE_URL}" style="color:${BLEU}">${SITE_URL.replace(/^https?:\/\//, "")}</a> · <a href="mailto:contact@navigoal.net" style="color:${BLEU}">contact@navigoal.net</a><br>
Vous recevez ce message car un compte Navigoal est associé à cette adresse. Ne communiquez jamais vos codes.
</td></tr>
</table></td></tr></table></body></html>`;
}

export function emailTexte(o: { text: string } & EmailContenu) {
  return [o.text, o.code ? `\nCode : ${o.code}` : "", o.action ? `\n${o.action.label} : ${abs(o.action.url)}` : "", "\n\n—\nNavigoal · contact@navigoal.net · " + SITE_URL].join("");
}
