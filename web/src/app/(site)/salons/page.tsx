import type { Metadata } from "next";
import { CalendarDays, Clock, Presentation, Users } from "lucide-react";
import Link from "@/components/ui/Link";
import { PageHero } from "@/components/ui/PageHero";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { salonsPublics } from "@/server/services/salons";

export const metadata: Metadata = { title: "Salons virtuels des écoles au Maroc", description: "Les écoles reconnues au Maroc présentent leurs formations en direct : inscription gratuite, questions aux équipes d'admission, sans te déplacer.", alternates: { canonical: "/salons/" } };
export const revalidate = 300;

async function liste() { try { return await salonsPublics(); } catch { return []; } }
const date = (d: Date) => new Date(d).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Libreville" });

export default async function SalonsPage() {
  const salons = await liste();
  return (
    <>
      <PageHero crumb="Salons virtuels" title="Salons virtuels" accent="des écoles" sub="Les écoles présentent leurs formations en direct, et tu poses tes questions sans te déplacer. Gratuit, avec ton compte Navigoal." />
      <div className="container flex flex-col gap-5 pb-16">
        {!salons.length ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center"><Presentation size={30} className="text-brand-600" /><b className="text-lg">Aucun salon programmé pour l&apos;instant</b><p className="max-w-md text-sm text-ink-mute">Les prochains salons des écoles s&apos;afficheront ici. Navi te préviendra quand un salon correspond à ton projet.</p><Link href="/etablissements/" className="btn-ghost">Voir les écoles</Link></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {salons.map((s) => (
              <Link key={s.id} href={`/salons/${s.id}/`} className="card flex flex-col gap-3 p-5 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="flex items-center gap-3">{s.ecole.logo && <EtabLogo e={{ logo: s.ecole.logo, sigle: s.ecole.sigle ?? s.ecole.nom, nom: s.ecole.nom }} size={44} />}<span><b className="block">{s.ecole.sigle ?? s.ecole.nom}</b><span className="text-xs text-ink-mute">{s.ecole.ville}</span></span></span>
                <b className="text-lg leading-snug">{s.titre}</b>
                <span className="flex flex-col gap-1 text-sm text-ink-soft">
                  <span className="flex items-center gap-2 first-letter:uppercase"><CalendarDays size={15} className="text-brand-600" />{date(s.debut)} <span className="text-ink-mute">(heure de Libreville)</span></span>
                  <span className="flex items-center gap-2"><Clock size={15} className="text-brand-600" />{s.dureeMin} min</span>
                  <span className="flex items-center gap-2"><Users size={15} className="text-brand-600" />{s.placesRestantes > 0 ? `${s.placesRestantes} places restantes` : "Complet"}</span>
                </span>
                <span className="btn-sun mt-auto justify-center">Voir et s&apos;inscrire</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
