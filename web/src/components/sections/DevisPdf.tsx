"use client";
// Version imprimable (A4, une page) du devis, utilisée par « Télécharger le devis PDF ».
// En-tête, résumé (par mois, pour démarrer, total), rubriques et échéancier côte à côte, conditions de service,
// puis cachet numérique : numéro et empreinte attribués par le serveur, QR code vers /verifier/devis/<id>/.
import qrcode from "qrcode-generator";
import { BrandMark } from "@/components/ui/Brand";
import { destinationById, fmt, labelById, type Etablissement, type Formation } from "@/lib/data";
import { nomPays } from "@/lib/pays-origine";
import { COUTS, LOGEMENT_LABEL, type Devis, type Logement } from "@/lib/devis";
import { SITE_URL } from "@/lib/site";
import { prefixePrix } from "@/lib/prix";
import { MARGE_PRUDENCE, convertirDe, formatMontant, type Taux } from "@/lib/devises";

export type Cachet = { id: string; numero: string; empreinte: string; emisLe: string; valableJusquau: string; chemin: string };
type Pair = [number, number];
const jour = (d: string | Date) => new Date(d).toLocaleDateString("fr-FR");

/** QR code en SVG (modules dessinés un à un, sans HTML injecté). */
function QR({ texte, taille = 74 }: { texte: string; taille?: number }) {
  const q = qrcode(0, "M");
  q.addData(texte);
  q.make();
  const n = q.getModuleCount();
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return <svg width={taille} height={taille} viewBox={`-1 -1 ${n + 2} ${n + 2}`} shapeRendering="crispEdges" aria-label="QR code de vérification"><rect x={-1} y={-1} width={n + 2} height={n + 2} fill="#fff" /><path d={d} fill="#0b1640" /></svg>;
}

/** Cachet rond de la plateforme (texte circulaire, date et numéro). */
function Sceau({ date, numero }: { date: string; numero: string }) {
  return (
    <svg width="86" height="86" viewBox="0 0 120 120" aria-label="Cachet numérique Navigoal">
      <defs><path id="cercle-cachet" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="#1d3fd8" strokeWidth="3" />
      <circle cx="60" cy="60" r="35" fill="none" stroke="#1d3fd8" strokeWidth="1.5" />
      <text fontSize="10" fontWeight="800" fill="#1d3fd8"><textPath href="#cercle-cachet" textLength="266" lengthAdjust="spacingAndGlyphs">NAVIGOAL · CACHET NUMÉRIQUE · DEVIS CERTIFIÉ ·</textPath></text>
      <path d="M47 58 l9 9 l17 -19" fill="none" stroke="#0b7a3d" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="60" y="80" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1d3fd8">{date}</text>
      <text x="60" y="89" textAnchor="middle" fontSize="6" fill="#1d3fd8">{numero.slice(-6)}</text>
    </svg>
  );
}

export function DevisPdf({ e, F, D, devise, taux, origine, logement, eleve, payeur, cachet }: { e: Etablissement; F: Formation; D: Devis; devise: string | null; taux: Taux; origine: string; logement: Logement; eleve: string; payeur: string; cachet: Cachet | null }) {
  const C = COUTS[e.pays];
  const today = cachet ? new Date(cachet.emisLe) : new Date();
  const eq = (v: number) => { const c = devise ? convertirDe(v, D.devise, devise, taux) : null; return c == null ? null : formatMontant(c, devise!); };
  const loc = !!devise && eq(1000) != null;
  // Jamais de fourchette : « à partir de » + minimum, sauf montant unique.
  const P = (v: Pair) => `${prefixePrix(v)}${fmt(Math.round(v[0]))}`;
  const EqP = (v: Pair) => loc ? <span className="block text-[8.5px] font-semibold leading-tight text-brand-600">≈ {eq(v[0])}</span> : null;
  const n = D.years * 12;
  const mois: Pair = [D.total[0] / n, D.total[1] / n];
  const avant = D.detail.filter((x) => x.inclus && x.quand === "avant").reduce<Pair>((a, x) => { const k = x.cle === "billets" ? 0.5 : 1; return [a[0] + x.v[0] * k, a[1] + x.v[1] * k]; }, [0, 0]);
  // Détail mensuel : imprévus et transferts répartis au prorata des autres rubriques.
  const imp = D.cats["Imprévus & transferts"] ?? [0, 0];
  const autres = Object.entries(D.cats).filter(([k]) => k !== "Imprévus & transferts");
  const base = autres.reduce<Pair>((a, [, v]) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
  const parMois = autres.map(([k, v]) => [k, [(v[0] + (base[0] ? imp[0] * v[0] / base[0] : 0)) / n, (v[1] + (base[1] ? imp[1] * v[1] / base[1] : 0)) / n] as Pair] as const);
  const quandT = (q: string) => (D.postes ?? []).filter((x) => x.quand === q).reduce<Pair>((a, x) => [a[0] + x.v[0], a[1] + x.v[1]], [0, 0]);
  const site = SITE_URL.replace(/^https?:\/\//, "");
  const urlVerif = cachet ? `${SITE_URL}${cachet.chemin}` : null;
  const td = "border-b border-slate-200 px-2 py-[4px]";
  const titre = "text-[11.5px] font-extrabold uppercase tracking-wide text-brand-700";
  return (
    <div className="hidden bg-white text-[10.5px] leading-snug text-ink print:block">
      <div className="mx-auto flex h-[296mm] w-[210mm] flex-col overflow-hidden px-[12mm] py-[9mm]">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b-[3px] border-brand-600 pb-2">
          <div className="flex items-center gap-2"><BrandMark /><span className="text-[19px] font-extrabold">Navi<span className="text-sun-500">goal</span></span></div>
          <div className="flex flex-col items-end leading-tight"><b className="text-[17px]">DEVIS D&apos;ÉTUDES</b><span className="text-ink-mute">N° {cachet?.numero ?? "non certifié"} · émis le {jour(today)}</span><span className="text-ink-mute">Valable jusqu&apos;au {jour(cachet?.valableJusquau ?? new Date(today.getTime() + 60 * 86400e3))}</span></div>
        </div>

        {/* Étudiant et formation */}
        <div className="mt-2.5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#f6f8fe] px-3 py-2"><span className="text-[9px] font-extrabold text-ink-mute">ÉTUDIANT·E</span><b className="block text-[11.5px]">{eleve || "—"}</b><span className="block">Départ : {origine ? nomPays(origine) : "—"} · Responsable financier : {payeur || "—"}</span><span className="block">Logement : {D.logementLibelle ?? LOGEMENT_LABEL[logement].toLowerCase()}</span></div>
          <div className="rounded-lg bg-[#f6f8fe] px-3 py-2"><span className="text-[9px] font-extrabold text-ink-mute">FORMATION</span><b className="block text-[11.5px]">{F.intitule}</b><span className="block">{e.nom} · {e.ville}, {destinationById[e.pays]?.nom}</span><span className="block">{F.diplome} · {D.years} an{D.years > 1 ? "s" : ""} · {e.pays === "MA" ? labelById[e.label]?.libelle : e.label_libelle}</span></div>
        </div>

        {/* Résumé */}
        <div className="mt-2.5 grid grid-cols-[1.25fr_1fr_1fr] gap-2">
          <div className="rounded-lg bg-brand-600 px-3 py-2 text-white"><span className="text-[9px] font-extrabold uppercase opacity-80">En moyenne par mois, tout compris</span><b className="block text-[17px] leading-tight">{P(mois)} {D.devise}</b>{loc && <span className="block text-[9px] font-semibold opacity-90">≈ {eq(mois[0])}</span>}</div>
          <div className="rounded-lg border border-brand-100 px-3 py-2"><span className="text-[9px] font-extrabold uppercase text-ink-mute">Pour démarrer</span><b className="block text-[12.5px]">{P(avant)} {D.devise}</b>{EqP(avant)}<span className="text-[8.5px] text-ink-mute">avant le départ : billet, visa, caution, installation</span></div>
          <div className="rounded-lg border border-brand-100 px-3 py-2"><span className="text-[9px] font-extrabold uppercase text-ink-mute">Sur les {D.years} ans</span><b className="block text-[12.5px]">{P(D.total)} {D.devise}</b>{EqP(D.total)}<span className="text-[8.5px] text-ink-mute">payé au fil des années, marge d&apos;imprévus incluse</span></div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-ink-soft"><b>Par mois{prefixePrix(mois) ? ", à partir de" : ""} :</b>{parMois.map(([k, v]) => <span key={k}>{k} <b>{fmt(Math.round(v[0]))}</b></span>)}{D.aides && D.aides[1] > 0 && <span className="text-[#0b6e38]">bourse − <b>{fmt(Math.round(D.aides[1] / n))}</b></span>}<span>({D.devise}, imprévus et transferts répartis)</span></div>

        {/* Rubriques et échéancier */}
        <div className="mt-3 grid grid-cols-[1.35fr_1fr] gap-4">
          <div>
            <h3 className={titre}>Détail sur {D.years} ans ({D.devise})</h3>
            <table className="mt-1 w-full border-collapse">
              <thead><tr className="bg-brand-950 text-[9px] text-white"><td className="px-2 py-1">Rubrique</td><td className="px-2 py-1 text-right">Montant</td></tr></thead>
              <tbody>
                {Object.entries(D.cats).map(([k, v]) => <tr key={k}><td className={td}><b>{k}</b><span className="block text-[8px] leading-tight text-ink-mute">{D.detail.filter((x) => x.rubrique === k && x.inclus).map((x) => x.libelle.replace(/,.*$| \(une fois\)$|\s*\(.*\)$/, "")).join(" · ")}</span></td><td className={`${td} whitespace-nowrap text-right`}><span className="text-[8px] font-semibold text-ink-mute">{prefixePrix(v)}</span>{fmt(v[0])}{loc && <span className="block text-[8px] text-brand-600">≈ {eq(v[0])}</span>}</td></tr>)}
                {D.aides && D.aides[1] > 0 && <tr className="text-[#0b6e38]"><td className={td}>Bourse ou réduction déduite</td><td className={`${td} whitespace-nowrap text-right`}>− {fmt(D.aides[1])}</td></tr>}
                <tr className="bg-brand-50 font-extrabold"><td className="px-2 py-1.5">TOTAL</td><td className="whitespace-nowrap px-2 py-1.5 text-right">{P(D.total)}</td></tr>
              </tbody>
            </table>
            {D.detail.some((x) => !x.inclus) && <p className="mt-1 text-[8.5px] text-ink-mute"><b>Non inclus à votre demande :</b> {D.detail.filter((x) => !x.inclus).map((x) => x.libelle.replace(/,.*$| \(une fois\)$/, "")).join(" ; ")}.</p>}
            {loc && <p className="mt-1 text-[8.5px] text-ink-mute">Équivalents en {devise} au taux du {jour(taux.date)}, marge de prudence de {MARGE_PRUDENCE * 100} % incluse.</p>}
          </div>
          <div className="flex flex-col gap-2.5">
            <div>
              <h3 className={titre}>Échéancier ({D.devise})</h3>
              <table className="mt-1 w-full border-collapse"><tbody>
                {D.rows.map((r) => <tr key={r.annee}><td className={td}>Année {r.annee}</td><td className={`${td} text-right font-bold`}>{P(r.total)}</td></tr>)}
                <tr><td className={td}>Installation (une fois)</td><td className={`${td} text-right font-bold`}>{P(D.installation)}</td></tr>
              </tbody></table>
            </div>
            {D.postes && <div>
              <h3 className={titre}>Quand payer (1re année)</h3>
              <table className="mt-1 w-full border-collapse"><tbody>{([["avant", "Avant le départ"], ["mois", "Chaque mois sur place"], ["an", "Chaque année"]] as const).map(([q, l]) => <tr key={q}><td className={td}>{l}</td><td className={`${td} text-right font-bold`}>{P(quandT(q))}</td></tr>)}</tbody></table>
            </div>}
            <div>
              <h3 className={titre}>Démarches clés</h3>
              <div className="mt-1 flex flex-col gap-0.5">{C.demarches.slice(0, D.postes ? 5 : 7).map((d) => <div key={d.quand + d.etape} className="flex gap-1.5 text-[8.5px] leading-tight"><b className="w-[38px] shrink-0 text-brand-600">{d.quand}</b><span>{d.etape}</span></div>)}</div>
            </div>
          </div>
        </div>

        {/* Conditions de service */}
        <div className="mt-auto rounded-lg border border-slate-200 px-3 py-2">
          <h3 className="text-[9.5px] font-extrabold uppercase tracking-wide text-ink-soft">Conditions de service</h3>
          <ol className="mt-1 grid list-decimal grid-cols-2 gap-x-6 gap-y-0.5 pl-3.5 text-[8px] leading-snug text-ink-soft">
            <li><b>Estimation indicative.</b> Ce devis est établi par Navigoal à partir des tarifs publiés par l&apos;école ou, à défaut, de montants de départ par type d&apos;établissement (« à partir de »). Seuls les frais confirmés par écrit par l&apos;établissement font foi.</li>
            <li><b>Paiement direct à l&apos;école.</b> Navigoal n&apos;encaisse pas les frais de scolarité ni d&apos;inscription : ils se règlent à l&apos;établissement, uniquement par les moyens de paiement vérifiés affichés sur Navigoal.</li>
            <li><b>Candidature gratuite.</b> Aucun frais de dossier n&apos;est demandé par la plateforme. L&apos;admission est décidée par l&apos;établissement seul.</li>
            <li><b>Change et coût de la vie.</b> Conversions au taux du jour majoré d&apos;une marge de prudence ; loyers et dépenses courantes estimés selon la ville. Visa et séjour dépendent de la nationalité.</li>
            <li><b>Responsabilité.</b> Navigoal est une plateforme d&apos;information et de mise en relation, non partie au contrat de formation. Elle ne répond ni d&apos;une décision d&apos;admission, ni d&apos;un refus de visa, ni d&apos;un changement de frais par l&apos;école.</li>
            <li><b>Données et droit applicable.</b> Données traitées selon la politique de confidentialité ({site}/confidentialite). Conditions générales complètes sur {site}/cgu, droit gabonais. Contact : contact@navigoal.net.</li>
          </ol>
        </div>

        {/* Cachet numérique */}
        <div className="mt-2 flex items-center gap-3 border-t-2 border-brand-600 pt-2">
          <Sceau date={jour(today)} numero={cachet?.numero ?? "------"} />
          {urlVerif ? <QR texte={urlVerif} /> : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-[8.5px] leading-snug">
            <b className="text-[10px] text-brand-700">Cachet numérique de la plateforme Navigoal</b>
            {cachet ? <>
              <span>N° {cachet.numero} · empreinte <b className="font-mono">{cachet.empreinte}</b></span>
              <span>Scannez le QR code ou ouvrez <b className="break-all">{site}{cachet.chemin}</b> : la page affiche le devis tel qu&apos;émis par Navigoal. Tout écart (nom, montant, empreinte) signale un document modifié.</span>
            </> : <span>Cachet indisponible lors de l&apos;impression (connexion interrompue) : ce document n&apos;est pas certifié. Retéléchargez le devis depuis {site}/devis pour obtenir un devis certifié.</span>}
            <span className="text-ink-mute">Navigoal, service d&apos;OAPS Consulting Group (SARLU, Libreville, RCCM GA-LBV-01-2021-B13-00360) · {site} · contact@navigoal.net</span>
          </div>
        </div>
      </div>
    </div>
  );
}
