// Génération des PDF : reçu, bordereau de candidature, attestation, contrat de location, quittance.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const BLUE = rgb(0.1, 0.28, 0.96), INK = rgb(0.04, 0.08, 0.2), MUTE = rgb(0.42, 0.45, 0.58), LIGHT = rgb(0.93, 0.95, 1);
export const money = (n: number, cur: string) => `${Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} ${cur === "XAF" || cur === "XOF" ? "F CFA" : cur}`;
const date = (d: Date | string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
// Les polices standard PDF sont en WinAnsi : on remplace les caractères hors jeu.
const safe = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x00-\xff€]/g, "");

type Ctx = { page: PDFPage; font: PDFFont; bold: PDFFont; y: number };
function wrap(text: string, font: PDFFont, size: number, width: number) {
  const out: string[] = [];
  for (const para of safe(text).split("\n")) {
    let line = "";
    for (const w of para.split(" ")) {
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
function text(c: Ctx, s: string, o: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; width?: number; gap?: number } = {}) {
  const size = o.size ?? 10.5, f = o.bold ? c.bold : c.font;
  for (const l of wrap(s, f, size, o.width ?? 495)) {
    c.page.drawText(l, { x: o.x ?? 50, y: c.y, size, font: f, color: o.color ?? INK });
    c.y -= size + (o.gap ?? 4);
  }
}

async function base(title: string, number: string) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${title} ${number}`); pdf.setAuthor("Navigoal"); pdf.setCreator("Navigoal");
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({ x: 50, y: 778, width: 26, height: 26, color: BLUE });
  page.drawText("N", { x: 58, y: 785, size: 14, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Navigoal", { x: 84, y: 785, size: 16, font: bold, color: INK });
  page.drawText(safe(title.toUpperCase()), { x: 545 - bold.widthOfTextAtSize(safe(title.toUpperCase()), 14), y: 790, size: 14, font: bold, color: INK });
  const sub = safe(`N° ${number} · émis le ${date(new Date())}`);
  page.drawText(sub, { x: 545 - font.widthOfTextAtSize(sub, 9), y: 776, size: 9, font, color: MUTE });
  page.drawRectangle({ x: 50, y: 762, width: 495, height: 2.5, color: BLUE });
  const c: Ctx = { page, font, bold, y: 730 };
  return { pdf, c };
}
function rows(c: Ctx, items: [string, string][], strongLast = false) {
  items.forEach(([k, v], i) => {
    const last = strongLast && i === items.length - 1;
    if (last) c.page.drawRectangle({ x: 50, y: c.y - 6, width: 495, height: 22, color: LIGHT });
    c.page.drawText(safe(k), { x: 58, y: c.y, size: 10.5, font: last ? c.bold : c.font, color: INK });
    const vv = safe(v), f = last ? c.bold : c.font;
    c.page.drawText(vv, { x: 537 - f.widthOfTextAtSize(vv, 10.5), y: c.y, size: 10.5, font: f, color: INK });
    c.y -= 24;
    if (!last) c.page.drawLine({ start: { x: 50, y: c.y + 14 }, end: { x: 545, y: c.y + 14 }, thickness: 0.5, color: LIGHT });
  });
}
function footer(c: Ctx, note: string) {
  c.page.drawLine({ start: { x: 50, y: 70 }, end: { x: 545, y: 70 }, thickness: 0.5, color: MUTE });
  c.y = 56;
  text(c, note, { size: 8, color: MUTE });
  text(c, "Navigoal · navigoal.netlify.app · Document généré électroniquement", { size: 8, color: MUTE });
}

export async function receiptPdf(p: { reference: string; payer: string; label: string; amount: number; currency: string; method: string; paidAt: Date; escrow: boolean; beneficiary?: string }) {
  const { pdf, c } = await base("Reçu de paiement", p.reference);
  text(c, "Payé par", { size: 9, color: MUTE }); text(c, p.payer, { bold: true }); if (p.beneficiary) text(c, `Pour le compte de : ${p.beneficiary}`);
  c.y -= 12;
  rows(c, [["Objet", p.label], ["Moyen de paiement", p.method], ["Date", date(p.paidAt)], ["Montant payé", money(p.amount, p.currency)]], true);
  c.y -= 10;
  if (p.escrow) text(c, "Fonds placés en séquestre Navilease : ils sont versés au bailleur après votre entrée dans les lieux et l'état des lieux d'entrée.", { size: 9.5, color: BLUE });
  footer(c, "Reçu valant justificatif de paiement. Conservez-le jusqu'à la fin de la procédure.");
  return pdf.save();
}

export async function applicationPdf(p: { number: string; student: string; program: string; establishment: string; submittedAt: Date; documents: string[]; status: string; fee?: string }) {
  const { pdf, c } = await base("Bordereau de candidature", p.number);
  text(c, "Candidat·e", { size: 9, color: MUTE }); text(c, p.student, { bold: true }); c.y -= 8;
  rows(c, [["Formation", p.program], ["Établissement", p.establishment], ["Date d'envoi", date(p.submittedAt)], ["Frais de dossier", p.fee ?? "Aucun"], ["Statut", p.status]]);
  c.y -= 6; text(c, "Pièces jointes", { bold: true });
  for (const d of p.documents) text(c, `•  ${d}`);
  c.y -= 10;
  text(c, "Ce bordereau confirme la réception de votre dossier par Navigoal et sa transmission à l'établissement. La décision d'admission appartient à l'établissement.", { size: 9.5, color: MUTE });
  footer(c, "Suivi en temps réel dans votre espace Navigoal, rubrique « Mes candidatures ».");
  return pdf.save();
}

export async function admissionPdf(p: { number: string; student: string; program: string; establishment: string; city: string; decidedAt: Date }) {
  const { pdf, c } = await base("Attestation d'admission", p.number);
  c.y -= 10;
  text(c, `Navigoal atteste que l'établissement ${p.establishment} (${p.city}) a prononcé l'admission de :`, { size: 11 });
  c.y -= 6; text(c, p.student, { size: 15, bold: true }); c.y -= 6;
  text(c, `en ${p.program}, par décision du ${date(p.decidedAt)} (candidature n° ${p.number}).`, { size: 11 });
  c.y -= 14;
  text(c, "Cette attestation peut être présentée pour une demande de visa, de carte de séjour ou de logement Navilease. L'inscription définitive reste soumise aux conditions de l'établissement.", { size: 9.5, color: MUTE });
  footer(c, "Vérification : contactez l'établissement ou Navigoal en citant le numéro de candidature.");
  return pdf.save();
}

export async function leasePdf(p: { number: string; landlord: string; tenant: string; guarantor?: string; housing: string; address: string; startDate: string; months: number; rent: number; charges: number; deposit: number; currency: string; rules?: string | null; signedTenant?: string; signedLandlord?: string }) {
  const { pdf, c } = await base("Contrat de location étudiante", p.number);
  text(c, "Entre les soussignés", { bold: true });
  text(c, `Le bailleur : ${p.landlord}`); text(c, `Le locataire : ${p.tenant}`); if (p.guarantor) text(c, `Le garant : ${p.guarantor}`);
  c.y -= 8;
  rows(c, [["Logement", p.housing], ["Adresse", p.address], ["Prise d'effet", p.startDate], ["Durée", `${p.months} mois`], ["Loyer mensuel", money(p.rent, p.currency)], ["Charges mensuelles", money(p.charges, p.currency)], ["Dépôt de garantie", money(p.deposit, p.currency)]]);
  c.y -= 4; text(c, "Conditions", { bold: true });
  text(c, "1. Les paiements transitent par Navilease. Le premier loyer et le dépôt de garantie sont conservés en séquestre et versés au bailleur après l'état des lieux d'entrée.", { size: 9.5 });
  text(c, "2. Les loyers suivants sont payés mensuellement via Navilease ; une quittance est émise à chaque paiement.", { size: 9.5 });
  text(c, "3. Préavis d'un mois. Le dépôt de garantie est restitué après l'état des lieux de sortie, déduction faite des retenues justifiées.", { size: 9.5 });
  text(c, "4. En cas de différend, les parties recourent d'abord à la médiation Navilease.", { size: 9.5 });
  if (p.rules) { c.y -= 2; text(c, `Règlement intérieur : ${p.rules}`, { size: 9.5 }); }
  c.y -= 10;
  text(c, `Signature électronique du locataire : ${p.signedTenant ?? "en attente"}`, { size: 9.5, color: p.signedTenant ? INK : MUTE });
  text(c, `Signature électronique du bailleur : ${p.signedLandlord ?? "en attente"}`, { size: 9.5, color: p.signedLandlord ? INK : MUTE });
  footer(c, "Contrat type Navilease. Les signatures sont horodatées et liées aux comptes vérifiés des parties.");
  return pdf.save();
}

export async function rentReceiptPdf(p: { reference: string; landlord: string; tenant: string; housing: string; period: string; rent: number; charges: number; currency: string; paidAt: Date }) {
  const { pdf, c } = await base("Quittance de loyer", p.reference);
  text(c, `Je soussigné(e) ${p.landlord}, bailleur du logement « ${p.housing} », déclare avoir reçu de ${p.tenant} la somme ci-dessous au titre du loyer et des charges pour la période : ${p.period}.`);
  c.y -= 8;
  rows(c, [["Loyer", money(p.rent, p.currency)], ["Charges", money(p.charges, p.currency)], ["Payé le", date(p.paidAt)], ["Total", money(p.rent + p.charges, p.currency)]], true);
  footer(c, "Quittance émise par Navilease pour le compte du bailleur.");
  return pdf.save();
}
