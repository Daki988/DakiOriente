import PDFDocument from 'pdfkit';
import type { Config } from './config.js';
import type { Db } from './db.js';
import type { Mailer } from './mail.js';

// Rapports automatiques (§ 5.4) : hebdomadaire, mensuel et de fin de bande, envoyés par e-mail avec le PDF
// et le détail en CSV. Un rapport n'est envoyé qu'une fois par période (table report_runs).

export type ReportKind = 'hebdomadaire' | 'mensuel' | 'finBande';
export const REPORT_KINDS: ReportKind[] = ['hebdomadaire', 'mensuel', 'finBande'];
export interface Period { key: string; label: string; from: string; to: string }
export interface Report {
  kind: ReportKind; period: Period; title: string;
  kpis: { label: string; value: string }[];
  table: { title: string; head: string[]; rows: string[][] };
  csv: { filename: string; content: string };
}
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const PROVINCES: Record<string, string> = {
  GA1: 'Estuaire', GA2: 'Haut-Ogooué', GA3: 'Moyen-Ogooué', GA4: 'Ngounié', GA5: 'Nyanga',
  GA6: 'Ogooué-Ivindo', GA7: 'Ogooué-Lolo', GA8: 'Ogooué-Maritime', GA9: 'Woleu-Ntem',
};
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const frDay = (d: Date) => `${d.getUTCDate() === 1 ? '1er' : d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
const frDate = (s?: string) => (s ? `${Number(s.slice(8, 10))} ${MONTHS[Number(s.slice(5, 7)) - 1]} ${s.slice(0, 4)}` : '—');
/** Nombre au format français, avec des espaces ordinaires (lisibles dans le PDF et le CSV). */
const n = (v: number, digits = 0) => v.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).replace(/[  ]/g, ' ');
const sum = <T>(rows: T[], f: (r: T) => number) => rows.reduce((a, r) => a + (f(r) || 0), 0);
const csv = (rows: (string | number)[][]) => '﻿' + rows.map((r) => r.map((c) => (/[;"\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c))).join(';')).join('\n');

/** Dernière période complète, à l'heure de Libreville (UTC+1). */
export function lastPeriod(kind: 'hebdomadaire' | 'mensuel', now = new Date()): Period {
  const local = new Date(now.getTime() + 3_600_000);
  const y = local.getUTCFullYear(); const m = local.getUTCMonth(); const d = local.getUTCDate();
  if (kind === 'mensuel') {
    const first = new Date(Date.UTC(y, m - 1, 1)); const last = new Date(Date.UTC(y, m, 0));
    const name = MONTHS[first.getUTCMonth()];
    return { key: iso(first).slice(0, 7), label: `${name[0].toUpperCase()}${name.slice(1)} ${first.getUTCFullYear()}`, from: iso(first), to: iso(last) };
  }
  const monday = new Date(Date.UTC(y, m, d - ((local.getUTCDay() + 6) % 7) - 7));
  const sunday = new Date(monday.getTime() + 6 * DAY);
  // Semaine ISO : celle qui contient le jeudi.
  const thursday = new Date(monday.getTime() + 3 * DAY);
  const week = Math.floor((thursday.getTime() - Date.UTC(thursday.getUTCFullYear(), 0, 1)) / (7 * DAY)) + 1;
  return { key: `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`, label: `Semaine ${week} · du ${frDay(monday)} au ${frDay(sunday)} ${sunday.getUTCFullYear()}`, from: iso(monday), to: iso(sunday) };
}

async function load(db: Db, tables: string[]) {
  const rows = (await db.query('SELECT tbl, payload FROM records WHERE tbl = ANY($1)', [tables])).rows;
  return (t: string): Row[] => rows.filter((r) => r.tbl === t).map((r) => r.payload);
}

export async function nationalReport(db: Db, kind: 'hebdomadaire' | 'mensuel', period: Period): Promise<Report> {
  const of = await load(db, ['farms', 'bands', 'entries', 'exits', 'lots', 'alerts']);
  const within = (date?: string) => !!date && date.slice(0, 10) >= period.from && date.slice(0, 10) <= period.to;
  const farms = of('farms'); const bands = of('bands'); const entries = of('entries'); const exits = of('exits'); const lots = of('lots').filter((l) => !l.parentId); const alerts = of('alerts');
  const open = bands.filter((b) => b.placedAt <= period.to && (!b.closedAt || b.closedAt > period.to));
  const farmOfBand = new Map(bands.map((b) => [b.id, b.farmId]));
  const present = (ids: Set<string>) => sum(open.filter((b) => ids.has(b.id)), (b) => b.chicks)
    - sum(entries.filter((e) => ids.has(e.bandId) && e.date <= period.to), (e) => e.deaths) - sum(exits.filter((e) => ids.has(e.bandId) && e.date <= period.to), (e) => e.count);
  const stats = (farmIds: Set<string>) => {
    const mine = (bandId: string) => farmIds.has(farmOfBand.get(bandId) ?? '');
    const openIds = new Set(open.filter((b) => farmIds.has(b.farmId)).map((b) => b.id));
    const en = entries.filter((e) => mine(e.bandId) && within(e.date)); const ex = exits.filter((e) => mine(e.bandId) && within(e.date));
    return {
      bands: openIds.size, present: Math.max(0, present(openIds)), placed: sum(open.filter((b) => openIds.has(b.id)), (b) => b.chicks), deaths: sum(en, (e) => e.deaths), feed: sum(en, (e) => e.feedKg),
      out: sum(ex, (e) => e.count), kg: sum(ex, (e) => e.weightKg), revenue: sum(ex, (e) => (e.unitPriceXaf ?? 0) * e.count), priced: sum(ex.filter((e) => e.unitPriceXaf), (e) => e.count),
      lots: lots.filter((l) => farmIds.has(l.farmId) && within(l.cededAt)),
    };
  };
  const all = stats(new Set(farms.map((f) => f.id)));
  const newAlerts = alerts.filter((a) => within(a.createdAt));
  const provinces = [...new Set(farms.map((f) => f.province as string))].sort();
  return {
    kind, period, title: kind === 'mensuel' ? 'Rapport mensuel national' : 'Rapport hebdomadaire national',
    kpis: [
      { label: 'Fermes opérationnelles', value: `${n(farms.filter((f) => f.status === 'operationnelle').length)} sur ${n(farms.length)} enrôlées` },
      { label: 'Bandes en cours', value: n(all.bands) },
      { label: 'Poulets en élevage', value: n(all.present) },
      { label: 'Mortalité de la période', value: `${n(all.deaths)} morts · ${n(all.placed ? (all.deaths / all.placed) * 100 : 0, 2)} %` },
      { label: 'Aliment distribué', value: `${n(all.feed)} kg` },
      { label: 'Poulets sortis', value: `${n(all.out)} · ${n(all.kg)} kg de poids vif` },
      { label: 'Prix moyen par tête', value: all.priced ? `${n(all.revenue / all.priced)} FCFA` : '—' },
      { label: 'Lots cédés', value: `${n(all.lots.length)} · ${n(all.lots.length ? (all.lots.filter((l) => l.signature).length / all.lots.length) * 100 : 0)} % avec QR · ${n(all.lots.filter((l) => l.receivedAt).length)} reçus` },
      { label: 'Alertes sanitaires', value: `${n(newAlerts.length)} nouvelles · ${n(alerts.filter((a) => a.status !== 'close').length)} ouvertes` },
    ],
    table: {
      title: 'Par province',
      head: ['Province', 'Fermes', 'Bandes', 'Effectif', 'Morts', 'Sortis', 'Poids vif (kg)'],
      rows: provinces.map((p) => { const fs = farms.filter((f) => f.province === p); const s = stats(new Set(fs.map((f) => f.id))); return [PROVINCES[p] ?? p, n(fs.length), n(s.bands), n(s.present), n(s.deaths), n(s.out), n(s.kg)]; }),
    },
    csv: {
      filename: `origa-${kind}-${period.key}.csv`,
      content: csv([['Ferme', 'Nom', 'Province', 'Localité', 'Bandes en cours', 'Effectif', 'Morts', 'Aliment (kg)', 'Poulets sortis', 'Poids vif (kg)', 'Recettes (FCFA)', 'Lots cédés'],
        ...farms.sort((a, b) => String(a.id).localeCompare(String(b.id))).map((f) => { const s = stats(new Set([f.id])); return [f.id, f.name, PROVINCES[f.province] ?? f.province, f.locality, s.bands, s.present, s.deaths, Math.round(s.feed), s.out, Math.round(s.kg), Math.round(s.revenue), s.lots.length]; })]),
    },
  };
}

export async function bandReport(db: Db, bandId: string): Promise<Report | null> {
  const of = await load(db, ['farms', 'bands', 'entries', 'exits', 'lots', 'charges', 'operators']);
  const band = of('bands').find((b) => b.id === bandId);
  if (!band) return null;
  const farm = of('farms').find((f) => f.id === band.farmId) ?? {};
  const entries = of('entries').filter((e) => e.bandId === bandId).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const exits = of('exits').filter((e) => e.bandId === bandId); const lots = of('lots').filter((l) => l.bandId === bandId && !l.parentId);
  const charges = sum(of('charges').filter((c) => c.bandId === bandId), (c) => c.amountXaf);
  const ops = new Map(of('operators').map((o) => [o.id, o.name]));
  const deaths = sum(entries, (e) => e.deaths); const feed = sum(entries, (e) => e.feedKg);
  const out = sum(exits, (e) => e.count); const kg = sum(exits, (e) => e.weightKg); const revenue = sum(exits, (e) => (e.unitPriceXaf ?? 0) * e.count);
  const end = band.closedAt ?? iso(new Date());
  return {
    kind: 'finBande', period: { key: bandId, label: `Bande ${bandId}`, from: band.placedAt, to: end }, title: `Rapport de fin de bande · ${farm.name ?? band.farmId}`,
    kpis: [
      { label: 'Ferme', value: `${band.farmId} · ${farm.name ?? ''} · ${farm.locality ?? ''}` },
      { label: 'Mise en place', value: `${frDate(band.placedAt)} · ${n(band.chicks)} poussins (${band.strain ?? ''})` },
      { label: 'Clôture', value: `${frDate(band.closedAt)} · ${Math.round((Date.parse(end) - Date.parse(band.placedAt)) / DAY)} jours` },
      { label: 'Mortalité', value: `${n(deaths)} morts · ${n(band.chicks ? (deaths / band.chicks) * 100 : 0, 2)} %` },
      { label: 'Aliment distribué', value: `${n(feed)} kg` },
      { label: 'Poulets sortis', value: `${n(out)} · ${n(kg)} kg de poids vif` },
      // Même formule que l'application : aliment / (poids vif sorti + présent − poids des poussins) ; bande clôturée, présent = 0.
      { label: 'Indice de consommation', value: kg - (band.chicks ?? 0) * (band.initialWeightG ?? 0) / 1000 > 0 ? n(feed / (kg - (band.chicks ?? 0) * (band.initialWeightG ?? 0) / 1000), 2) : '—' },
      { label: 'Recettes', value: `${n(revenue)} FCFA` },
      { label: 'Charges', value: `${n(charges)} FCFA` },
      { label: 'Marge', value: `${n(revenue - charges)} FCFA` },
    ],
    table: {
      title: 'Lots cédés',
      head: ['Lot', 'Cédé le', 'Poulets', 'Poids vif (kg)', 'Destinataire', 'Réception'],
      rows: lots.map((l) => [l.id, frDate(l.cededAt), n(l.count), n(l.weightKg), ops.get(l.operatorId) ?? l.destination ?? '—', l.receivedAt ? frDate(l.receivedAt) : 'en attente']),
    },
    csv: { filename: `origa-bande-${bandId}.csv`, content: csv([['Date', 'Morts', 'Aliment (kg)', 'Eau (L)'], ...entries.map((e) => [e.date, e.deaths, e.feedKg, e.waterL ?? ''])]) },
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function renderHtml(r: Report): string {
  const td = 'padding:8px 10px;border-bottom:1px solid #E3E9E6;font-size:13px';
  return `<div style="font-family:Arial,sans-serif;color:#10201A;max-width:680px;margin:auto">
<div style="background:#0B3D2E;color:#fff;padding:22px 24px;border-radius:12px 12px 0 0"><div style="font-size:13px;color:#A9D8C3">Origa · filière avicole du Gabon</div><div style="font-size:22px;font-weight:bold;margin-top:4px">${esc(r.title)}</div><div style="font-size:14px;margin-top:4px">${esc(r.period.label)}</div></div>
<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E3E9E6">${r.kpis.map((k) => `<tr><td style="${td};color:#4A5A53">${esc(k.label)}</td><td style="${td};font-weight:bold;text-align:right">${esc(k.value)}</td></tr>`).join('')}</table>
<h3 style="font-size:15px;margin:22px 0 8px">${esc(r.table.title)}</h3>
<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E3E9E6"><tr>${r.table.head.map((h) => `<th style="${td};text-align:left;color:#4A5A53">${esc(h)}</th>`).join('')}</tr>
${r.table.rows.length ? r.table.rows.map((row) => `<tr>${row.map((c) => `<td style="${td}">${esc(c)}</td>`).join('')}</tr>`).join('') : `<tr><td style="${td}" colspan="${r.table.head.length}">Aucune donnée sur la période.</td></tr>`}</table>
<p style="font-size:12px;color:#4A5A53;margin-top:18px">Rapport généré automatiquement par Origa. Le PDF et le détail en CSV sont joints. Les envois se règlent dans Origa, page Rapports.</p></div>`;
}

export function renderPdf(r: Report): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `${r.title} — ${r.period.label}`, Author: 'Origa' } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    const W = doc.page.width - 80;
    doc.rect(0, 0, doc.page.width, 96).fill('#0B3D2E');
    doc.fillColor('#A9D8C3').fontSize(10).text('Origa · filière avicole du Gabon · programme POUFA', 40, 26);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(19).text(r.title, 40, 42, { width: W });
    doc.font('Helvetica').fontSize(11).text(r.period.label, 40, 68, { width: W });
    let y = 116;
    for (const k of r.kpis) {
      doc.fillColor('#4A5A53').font('Helvetica').fontSize(10).text(k.label, 40, y, { width: 190 });
      doc.fillColor('#10201A').font('Helvetica-Bold').fontSize(10).text(k.value, 235, y, { width: W - 195 });
      y = Math.max(y + 18, doc.y + 4);
      doc.moveTo(40, y - 3).lineTo(40 + W, y - 3).strokeColor('#E3E9E6').lineWidth(0.5).stroke();
    }
    y += 14;
    doc.fillColor('#0B3D2E').font('Helvetica-Bold').fontSize(13).text(r.table.title, 40, y);
    y = doc.y + 8;
    const cols = r.table.head.length; const first = Math.min(190, W * 0.34); const cw = (W - first) / Math.max(1, cols - 1);
    const x = (i: number) => (i === 0 ? 40 : 40 + first + (i - 1) * cw);
    const line = (cells: string[], bold: boolean) => {
      if (y > doc.page.height - 70) { doc.addPage(); y = 50; }
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(bold ? '#4A5A53' : '#10201A');
      let bottom = y;
      cells.forEach((c, i) => { doc.text(c, x(i), y, { width: (i === 0 ? first : cw) - 6 }); bottom = Math.max(bottom, doc.y); });
      y = bottom + 5;
      doc.moveTo(40, y - 3).lineTo(40 + W, y - 3).strokeColor('#E3E9E6').lineWidth(0.5).stroke();
    };
    line(r.table.head, true);
    if (r.table.rows.length) r.table.rows.forEach((row) => line(row, false)); else line(['Aucune donnée sur la période.'], false);
    doc.font('Helvetica').fontSize(8).fillColor('#8A9A93').text(`Généré par Origa le ${frDate(iso(new Date()))}. Détail par ligne dans le fichier CSV joint.`, 40, Math.min(y + 14, doc.page.height - 60), { width: W });
    doc.end();
  });
}

export interface SendResult { sent: boolean; skipped?: string; kind: ReportKind; period?: string; recipients?: string[]; error?: string }

/** Envoie un rapport si la période n'a pas déjà été servie. `force` renvoie (bouton « Envoyer maintenant »). */
export async function sendReport(db: Db, mailer: Mailer, cfg: Config, kind: ReportKind, opts: { bandId?: string; force?: boolean; now?: Date } = {}): Promise<SendResult> {
  const settings = (await db.query(`SELECT payload FROM records WHERE tbl='settings' AND key='global'`)).rows[0]?.payload;
  if (!opts.force && settings?.reports?.[kind] === false) return { sent: false, skipped: 'envoi désactivé dans les paramètres', kind };
  const wanted: unknown[] = Array.isArray(settings?.reports?.recipients) && settings.reports.recipients.length ? settings.reports.recipients : cfg.reportRecipients;
  const recipients = [...new Set(wanted.filter((e): e is string => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).map((e) => e.toLowerCase()))].slice(0, 30);
  if (!recipients.length) return { sent: false, skipped: 'aucun destinataire', kind };
  const report = kind === 'finBande' ? (opts.bandId ? await bandReport(db, opts.bandId) : null) : await nationalReport(db, kind, lastPeriod(kind, opts.now));
  if (!report) return { sent: false, skipped: 'bande introuvable', kind };
  const period = report.period.key;
  const prev = (await db.query('SELECT status, attempts FROM report_runs WHERE kind=$1 AND period=$2', [kind, period])).rows[0];
  if (!opts.force && prev && (prev.status === 'envoye' || prev.attempts >= 5)) return { sent: false, skipped: prev.status === 'envoye' ? 'déjà envoyé' : 'abandonné après 5 essais', kind, period };
  let error: string | null = null;
  try {
    await mailer({
      to: recipients, subject: `Origa · ${report.title} · ${report.period.label}`, html: renderHtml(report),
      attachments: [
        { filename: report.csv.filename.replace(/\.csv$/, '.pdf'), content: await renderPdf(report), contentType: 'application/pdf' },
        { filename: report.csv.filename, content: Buffer.from(report.csv.content, 'utf8'), contentType: 'text/csv; charset=utf-8' },
      ],
    });
  } catch (e) { error = (e as Error).message.slice(0, 300); }
  await db.query(
    `INSERT INTO report_runs (kind, period, label, recipients, status, error) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (kind, period) DO UPDATE SET sent_at=now(), label=EXCLUDED.label, recipients=EXCLUDED.recipients, status=EXCLUDED.status, error=EXCLUDED.error, attempts=report_runs.attempts+1`,
    [kind, period, report.period.label, recipients, error ? 'echec' : 'envoye', error],
  );
  return { sent: !error, kind, period, recipients, ...(error ? { error } : {}) };
}

/** Rapports périodiques dus : appelé au démarrage puis toutes les 30 minutes. */
export async function runDueReports(db: Db, mailer: Mailer, cfg: Config, now = new Date()): Promise<SendResult[]> {
  const out: SendResult[] = [];
  for (const kind of ['hebdomadaire', 'mensuel'] as const) out.push(await sendReport(db, mailer, cfg, kind, { now }));
  return out;
}

export function startReportScheduler(db: Db, mailer: Mailer, cfg: Config, log: (msg: string) => void) {
  const tick = () => runDueReports(db, mailer, cfg).then((rs) => rs.filter((r) => r.sent || r.error).forEach((r) => log(`[Rapport ${r.kind} ${r.period}] ${r.sent ? 'envoyé' : `échec : ${r.error}`}`))).catch((e) => log(`[Rapports] ${(e as Error).message}`));
  const first = setTimeout(tick, 60_000); const timer = setInterval(tick, 30 * 60_000);
  first.unref(); timer.unref();
  return () => { clearTimeout(first); clearInterval(timer); };
}
