import Link from "@/components/ui/Link";
import { ParOapsPied } from "@/components/ui/ParOaps";
import { Brand } from "./Brand";
import { DeviseSelect } from "./Devise";
import { VILLES, villeHref } from "@/lib/catalogue";
import { PAGES_LEGALES, SERVICES_LISTE, lienLegal } from "@/lib/services";

const cols = [
  { t: "Plateforme", l: [["Orientation", "/orientation"], ["Métiers", "/metiers"], ["Formations", "/formations"], ["Établissements", "/etablissements"], ["Comparateur", "/comparateur"], ["Navilease", "/navilease"], ["NaviTravel", "/navitravel"]] },
  { t: "Étudier au Maroc", l: [["Visa et séjour", "/ressources/visa-carte-de-sejour/"], ["Toutes les villes", "/villes"], ...VILLES.slice(0, 4).map((v) => [`Étudier à ${v.nom}`, villeHref(v.nom)]), ["Reconnus par l'État", "/etablissements/?label=reconnu_etat"]] },
  { t: "Ressources", l: [["Guides et outils", "/ressources"], ["Espace parents", "/parents"], ["Devis parents", "/devis"], ["Calculateur de moyenne", "/ressources/#outils"], ["Actualités", "/actualites"], ["Ma série au lycée", "/orientation#series"]] },
  { t: "Navigoal", l: [["Pourquoi Navigoal", "/pourquoi"], ["Mon espace", "/espace"], ["Bailleurs", "/navilease/bailleurs"], ["Contact", "mailto:contact@navigoal.net"]] },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-brand-950 pb-8 pt-16 text-white">
      <div className="container flex flex-col gap-12">
        <div className="flex flex-col justify-between gap-10 lg:flex-row">
          <div className="flex max-w-xs flex-col gap-4">
            <Brand dark />
            <p className="text-sm leading-relaxed text-[#a9b6e8]">De l&apos;orientation à la formation, jusqu&apos;au logement étudiant. Étudier au Maroc, depuis toute l&apos;Afrique.</p>
            <DeviseSelect dark className="mt-2" />
            <p className="text-xs leading-relaxed text-[#7f8fcf]">Les montants sont en dirhams (MAD). La conversion utilise le taux du jour, majoré de 3 % par prudence.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:gap-12">
            {cols.map((c) => (
              <div key={c.t} className="flex min-w-0 flex-col gap-3">
                <div className="text-sm font-extrabold">{c.t}</div>
                {c.l.map(([label, href]) => (
                  <Link key={label} href={href} className="text-sm text-[#a9b6e8] transition hover:text-white">{label}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-8 border-t border-[#1e2f73] pt-8 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-2"><span className="text-sm font-extrabold">Informations légales</span><p className="text-[13px] leading-relaxed text-[#7f8fcf]">Chaque service a ses conditions, sa politique de confidentialité, ses mentions légales et sa politique cookies.</p></div>
          {SERVICES_LISTE.map((sv) => (
            <div key={sv.id} className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-sm font-extrabold"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: sv.id === "navigoal" ? "#4f7bff" : sv.c }} />{sv.nom}</span>
              {PAGES_LEGALES.map((p) => <Link key={p.id} href={lienLegal(sv.id, p.id)} className="text-[13px] text-[#a9b6e8] hover:text-white">{p.long}</Link>)}
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-[#1e2f73] pt-6 text-[13px] text-[#7f8fcf] sm:flex-row">
          <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5"><span>© 2026 Navigoal · Navilease · NaviTravel — OAPS Consulting Group</span><ParOapsPied /></span>
          <Link href="mailto:contact@navigoal.net" className="hover:text-white">contact@navigoal.net</Link>
        </div>
      </div>
    </footer>
  );
}
