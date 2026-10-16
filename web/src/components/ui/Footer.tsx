import Link from "next/link";
import { Brand } from "./Brand";
import { DeviseSelect } from "./Devise";
import { VILLES, villeHref } from "@/lib/catalogue";

const cols = [
  { t: "Plateforme", l: [["Orientation", "/orientation"], ["Métiers", "/metiers"], ["Formations", "/formations"], ["Établissements", "/etablissements"], ["Comparateur", "/comparateur"], ["Navilease", "/navilease"]] },
  { t: "Étudier au Maroc", l: [["Visa et séjour", "/ressources/visa-carte-de-sejour/"], ["Toutes les villes", "/villes"], ...VILLES.slice(0, 4).map((v) => [`Étudier à ${v.nom}`, villeHref(v.nom)]), ["Reconnus par l'État", "/etablissements/?label=reconnu_etat"]] },
  { t: "Ressources", l: [["Guides et outils", "/ressources"], ["Devis parents", "/devis"], ["Calculateur de moyenne", "/ressources/#outils"], ["Actualités", "/actualites"], ["Ma série au lycée", "/orientation#series"]] },
  { t: "Navigoal", l: [["Pourquoi Navigoal", "/pourquoi"], ["Mon espace", "/espace"], ["Bailleurs", "/navilease#bailleurs"], ["Contact", "mailto:contact@navigoal.com"]] },
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
        <div className="flex flex-col justify-between gap-3 border-t border-[#1e2f73] pt-6 text-[13px] text-[#7f8fcf] sm:flex-row">
          <span>© 2026 Navigoal — Navilease est un service Navigoal</span>
          <span className="flex flex-wrap gap-4"><Link href="/confidentialite" className="hover:text-white">Confidentialité</Link><Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link><Link href="/cgu" className="hover:text-white">CGU</Link><Link href="/cookies" className="hover:text-white">Cookies</Link></span>
        </div>
      </div>
    </footer>
  );
}
