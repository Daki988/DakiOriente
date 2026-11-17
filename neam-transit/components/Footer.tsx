import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 bg-marine-950 text-slate-300">
      <div className="conteneur grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <Logo clair />
          <p className="mt-3 text-sm">
            Comparez les transitaires vérifiés entre la Chine, la Corée du Sud et tout le Gabon, puis contactez-les directement.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Importateurs</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link href="/comparer" className="hover:text-white">Comparer les offres</Link></li>
            <li><Link href="/calculateur" className="hover:text-white">Calculer volume et poids</Link></li>
            <li><Link href="/guide" className="hover:text-white">Guide de l&apos;importateur</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Transitaires</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link href="/pro/inscription" className="hover:text-white">Référencer mon entreprise</Link></li>
            <li><Link href="/pro/connexion" className="hover:text-white">Se connecter</Link></li>
            <li><Link href="/conditions" className="hover:text-white">Conditions d&apos;utilisation</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="conteneur py-4 text-xs text-slate-400">
          Neam Transit met en relation, sans intermédiaire financier : aucun paiement ne transite par la plateforme. Vous réglez directement le transitaire.
        </p>
      </div>
    </footer>
  );
}
