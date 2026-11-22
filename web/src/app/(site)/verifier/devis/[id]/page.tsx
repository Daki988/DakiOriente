import type { Metadata } from "next";
import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "@/components/ui/Link";
import { lireCachet } from "@/server/services/cachets-devis";
import { fmt } from "@/lib/data";
import { RUBRIQUES } from "@/lib/devis";
import { prixTexte } from "@/lib/prix";

// Vérification du cachet numérique d'un devis PDF (QR code) : affiche ce que Navigoal a réellement émis.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vérifier un devis Navigoal", description: "Vérifiez l'authenticité d'un devis d'études émis par Navigoal grâce à son cachet numérique.", robots: { index: false, follow: false } };

const jour = (d: Date) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Libreville" });
const plage = (v: [number, number], dev: string) => prixTexte(v, (n) => `${fmt(Math.round(n))} ${dev}`, { majuscule: true });

export default async function VerifierDevis(props: { params: Promise<{ id: string }> }) {
  const c = await lireCachet((await props.params).id).catch(() => null);
  if (!c) return (
    <section className="container flex flex-col items-center gap-4 py-20 text-center">
      <ShieldAlert size={48} className="text-[#b8213f]" />
      <h1 className="h-section">Cachet introuvable</h1>
      <p className="max-w-xl text-ink-soft">Ce code ne correspond à aucun devis émis par Navigoal. Le document a pu être modifié ou recopié. En cas de doute, écrivez à <a href="mailto:contact@navigoal.net" className="font-bold text-brand-600">contact@navigoal.net</a> en joignant le PDF.</p>
    </section>
  );
  const r = c.resume;
  const valide = c.valableJusquau.getTime() > Date.now();
  return (
    <section className="container mx-auto flex max-w-3xl flex-col gap-6 py-14">
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldCheck size={52} className="text-[#0b7a3d]" />
        <h1 className="h-section">Devis authentique, émis par Navigoal</h1>
        <p className="text-ink-soft">Comparez les informations ci-dessous avec le PDF : si un montant, un nom ou l&apos;empreinte diffère, le document a été modifié.</p>
      </div>
      <div className="card flex flex-col gap-4 rounded-3xl p-6">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-mute">Numéro</dt><dd className="font-bold">{c.numero}</dd></div>
          <div><dt className="text-ink-mute">Empreinte</dt><dd className="font-mono font-bold">{c.empreinte}</dd></div>
          <div><dt className="text-ink-mute">Émis le</dt><dd className="font-bold">{jour(c.createdAt)}</dd></div>
          <div><dt className="text-ink-mute">Validité</dt><dd className={`font-bold ${valide ? "text-[#0b7a3d]" : "text-[#a55a00]"}`}>{valide ? `Valable jusqu'au ${jour(c.valableJusquau)}` : `Expiré le ${jour(c.valableJusquau)} : refaire un devis à jour`}</dd></div>
          <div><dt className="text-ink-mute">Étudiant·e</dt><dd className="font-bold">{c.eleve || "—"}</dd></div>
          <div><dt className="text-ink-mute">Responsable financier</dt><dd className="font-bold">{c.payeur || "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-ink-mute">Formation</dt><dd className="font-bold">{r.formation} · {r.diplome} · {r.annees} an{r.annees > 1 ? "s" : ""}</dd><dd>{r.ecole}{r.sigle ? ` (${r.sigle})` : ""}, {r.ville} · logement : {r.logement}</dd></div>
        </dl>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-brand-50 p-4"><span className="text-xs font-bold uppercase text-ink-mute">En moyenne par mois</span><b className="block text-lg">{plage(r.parMois, r.devise)}</b></div>
          <div className="rounded-2xl bg-brand-50 p-4"><span className="text-xs font-bold uppercase text-ink-mute">Total sur {r.annees} an{r.annees > 1 ? "s" : ""}</span><b className="block text-lg">{plage(r.total, r.devise)}</b></div>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          {Object.entries(r.rubriques).sort(([a], [b]) => (RUBRIQUES as readonly string[]).indexOf(a) - (RUBRIQUES as readonly string[]).indexOf(b)).map(([k, v]) => <li key={k} className="flex justify-between gap-3 border-b border-[#eef1f8] pb-1.5"><span>{k}</span><b className="whitespace-nowrap">{plage(v, r.devise)}</b></li>)}
          {r.aides && r.aides[1] > 0 && <li className="flex justify-between gap-3 text-[#0b6e38]"><span>Bourse ou réduction déduite</span><b>− {fmt(Math.round(r.aides[1]))} {r.devise}</b></li>}
        </ul>
        {r.exclus.length > 0 && <p className="text-xs text-ink-mute">Non inclus à la demande du demandeur : {r.exclus.join(" ; ")}.</p>}
        <p className="flex items-start gap-2 rounded-2xl bg-[#fff7dd] p-3 text-[13px]"><BadgeCheck size={17} className="mt-0.5 shrink-0 text-[#a55a00]" /><span>Devis indicatif : il certifie l&apos;estimation faite par Navigoal à cette date, pas les frais de l&apos;école, qui seuls font foi une fois confirmés par écrit. Montants dans la monnaie du pays d&apos;études.</span></p>
      </div>
      <p className="text-center text-sm"><Link href="/devis/" className="font-bold text-brand-600">Faire un nouveau devis</Link> · <Link href="/cgu/" className="font-bold text-brand-600">Conditions d&apos;utilisation</Link></p>
    </section>
  );
}
