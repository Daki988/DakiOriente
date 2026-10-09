"use client";
import { Info } from "lucide-react";
import { BrandMark } from "@/components/ui/Brand";
import { fmt, labelById, type Etablissement, type Formation } from "@/lib/data";
import { nomPays } from "@/lib/pays-origine";
import { COUTS, HYP, LOGEMENT_LABEL, convert, type Devis, type Logement } from "@/lib/devis";

/** Version imprimable (A4) du devis, utilisée par « Télécharger le devis PDF ». */
export function DevisPdf({ e, F, D, origine, logement, eleve, payeur }: { e: Etablissement; F: Formation; D: Devis; origine: string; logement: Logement; eleve: string; payeur: string }) {
  const C = COUTS[e.pays];
  const today = new Date();
  const num = `NG-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${(Math.abs([...`${e.id}${F.id}${origine}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 100000).toString().padStart(5, "0")}`;
  const xaf = (v: number) => fmt(convert(v, D.devise, "XAF"));
  const td = "border-b border-slate-200 px-2.5 py-1";
  return (
    <div className="hidden bg-white text-[11.5px] leading-snug text-ink print:block">
      <div className="mx-auto w-[210mm] px-[14mm] py-[7mm]">
        <div className="flex items-center justify-between border-b-[3px] border-brand-600 pb-3">
          <div className="flex items-center gap-2.5"><BrandMark /><span className="text-[21px] font-extrabold">Navi<span className="text-sun-500">goal</span></span></div>
          <div className="flex flex-col items-end"><b className="text-xl">DEVIS D&apos;ÉTUDES</b><span className="text-ink-mute">N° {num} · émis le {today.toLocaleDateString("fr-FR")}</span><span className="text-ink-mute">Valable 60 jours</span></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-0.5 rounded-xl bg-[#f6f8fe] p-3"><span className="text-[11px] font-extrabold text-ink-mute">ÉTUDIANT·E</span><b>{eleve || "—"}</b><span>Départ : {nomPays(origine)}</span><span>Responsable financier : {payeur || "—"}</span><span>Logement : {LOGEMENT_LABEL[logement].toLowerCase()}</span></div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-[#f6f8fe] p-3"><span className="text-[11px] font-extrabold text-ink-mute">FORMATION</span><b>{F.intitule}</b><span>{e.nom}</span><span>{e.ville}, Maroc · {labelById[e.label]?.libelle}</span><span>{F.diplome} · {D.years} an{D.years > 1 ? "s" : ""}</span></div>
        </div>
        <h3 className="mt-3 text-[14px] font-extrabold">1. Synthèse des coûts sur {D.years} ans ({D.devise})</h3>
        <table className="mt-2 w-full border-collapse">
          <thead><tr className="bg-brand-950 text-xs text-white"><td className="px-2.5 py-2">Poste</td><td className="px-2.5 py-2 text-right">Minimum</td><td className="px-2.5 py-2 text-right">Maximum</td></tr></thead>
          <tbody>
            {Object.entries(D.cats).map(([k, v]) => <tr key={k}><td className={td}>{k}</td><td className={`${td} text-right`}>{fmt(v[0])}</td><td className={`${td} text-right`}>{fmt(v[1])}</td></tr>)}
            <tr className="bg-brand-50 font-extrabold"><td className="px-2.5 py-2.5">TOTAL ({D.devise})</td><td className="px-2.5 py-2.5 text-right">{fmt(D.total[0])}</td><td className="px-2.5 py-2.5 text-right">{fmt(D.total[1])}</td></tr>
            {!["XAF", "XOF"].includes(D.devise) && <tr className="font-extrabold text-brand-600"><td className="px-2.5 py-2">Équivalent F CFA</td><td className="px-2.5 py-2 text-right">{xaf(D.total[0])}</td><td className="px-2.5 py-2 text-right">{xaf(D.total[1])}</td></tr>}
          </tbody>
        </table>
        <div className="mt-4 grid grid-cols-2 gap-5">
          <div><h3 className="text-[14px] font-extrabold">2. Échéancier annuel ({D.devise})</h3>
            <table className="mt-2 w-full border-collapse"><thead><tr className="text-[11px] font-extrabold text-ink-mute"><td className="px-2.5 py-1.5">ANNÉE</td><td className="px-2.5 py-1.5 text-right">MIN.</td><td className="px-2.5 py-1.5 text-right">MAX.</td></tr></thead>
              <tbody>{D.rows.map((r) => <tr key={r.annee}><td className={td}>Année {r.annee}</td><td className={`${td} text-right`}>{fmt(r.total[0])}</td><td className={`${td} text-right`}>{fmt(r.total[1])}</td></tr>)}
                <tr><td className="px-2.5 py-1.5">Installation (une fois)</td><td className="px-2.5 py-1.5 text-right">{fmt(D.installation[0])}</td><td className="px-2.5 py-1.5 text-right">{fmt(D.installation[1])}</td></tr></tbody></table>
          </div>
          <div className="flex flex-col gap-1.5"><h3 className="text-[14px] font-extrabold">3. Démarches et calendrier</h3>
            {C.demarches.map((d) => <div key={d.quand + d.etape} className="flex gap-2 text-[10.5px]"><b className="w-[68px] shrink-0 text-brand-600">{d.quand}</b><span>{d.etape}</span></div>)}
          </div>
        </div>
        <h3 className="mt-3 text-[14px] font-extrabold">4. Ce qui est inclus</h3>
        <p className="leading-relaxed">Frais de scolarité ({D.typ.toLowerCase()}), inscription et dossier, loyer et vie quotidienne sur {HYP.mois_par_an} mois par an ({D.chere ? "ville à coût élevé" : "ville à coût modéré"}, {LOGEMENT_LABEL[logement].toLowerCase()}), carte de séjour et assurance santé chaque année, visa, billets d&apos;avion aller-retour, caution du logement, équipement, inflation de {Math.round(HYP.inflation_annuelle * 100)} % par an, marge d&apos;imprévus de {Math.round(HYP.marge_imprevus * 100)} % et frais de transfert de {Math.round(HYP.frais_transfert * 100)} %.</p>
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#fff7dd] p-3.5"><Info size={18} className="shrink-0 text-[#a55a00]" /><span className="text-xs leading-relaxed">Devis indicatif établi par Navigoal. Les frais de scolarité définitifs sont ceux confirmés par écrit par l&apos;établissement. Les règles de visa et de séjour dépendent de la nationalité et doivent être vérifiées auprès des autorités consulaires. Taux de change indicatif : 1 € = 655,957 F CFA.</span></div>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-[11px] text-ink-mute"><span>Navigoal · navigoal.netlify.app</span><span>Retrouver ce devis en ligne : navigoal.netlify.app/devis</span></div>
      </div>
    </div>
  );
}
