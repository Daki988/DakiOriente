import Link from "next/link";
import { BadgeCheck, KeyRound, ShieldCheck } from "lucide-react";
import { etablissements, metiers, VILLES_ETUDES } from "@/lib/data";

/** Panneau visuel des pages d'authentification (ordinateur). Chiffres calculés depuis les référentiels. */
export function AuthAside() {
  const reconnus = etablissements.filter((e) => e.label !== "autorise").length;
  return (
    <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 p-10 text-white lg:flex xl:p-12">
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,194,31,.35),transparent_70%)]" />
      <Link href="/" className="relative self-start rounded-2xl bg-white px-4 py-3 shadow-lift" aria-label="Navigoal, accueil">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/navigoal-logo.png" alt="Navigoal" width={150} height={116} className="h-[84px] w-auto" />
      </Link>
      <h2 className="relative mt-10 text-[38px] font-extrabold leading-tight tracking-tight">Ton avenir commence <span className="text-sun-400">ici.</span></h2>
      <p className="relative mt-3 max-w-md text-[16px] text-brand-100">Orientation, formations, candidatures et logement étudiant au Maroc : tout ton parcours au même endroit, sur ordinateur comme sur téléphone.</p>
      <ul className="relative mt-8 flex max-w-md flex-col gap-3">
        {[
          { I: BadgeCheck, t: `${etablissements.length} établissements privés au Maroc`, s: `${reconnus} reconnus par l'État ou aux diplômes homologués, dans ${VILLES_ETUDES.length} villes` },
          { I: ShieldCheck, t: "Paiements protégés", s: "Frais de dossier et réservation de logement en séquestre, montants en dirhams" },
          { I: KeyRound, t: "Logements étudiants vérifiés", s: `Navilease, près de ton école · ${metiers.length} fiches métiers pour t'orienter` },
        ].map(({ I, t, s }) => (
          <li key={t} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sun-400 text-ink"><I size={19} /></span>
            <span><b className="block text-[15px]">{t}</b><span className="text-[13px] text-brand-100">{s}</span></span>
          </li>
        ))}
      </ul>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/etudiante.webp" alt="" className="pointer-events-none absolute -bottom-2 right-0 w-[min(46%,340px)] opacity-95" />
    </aside>
  );
}
