import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { Logo } from "@/components/Logo";

/** Page introuvable (lien erroné, produit retiré, suivi expiré…). */
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4 py-16">
      <div className="grid max-w-md justify-items-start gap-5">
        <Link href="/" aria-label="Accueil Neam Print"><Logo className="h-11 w-auto" /></Link>
        <p className="tabular text-sm text-muted">(404)</p>
        <h1 className="text-[40px] font-bold leading-[1.05]">Cette page est <em className="accent">introuvable</em>.</h1>
        <p className="text-muted">Le lien est peut-être incomplet, ou la page a été déplacée. Pour suivre une commande, utilisez le lien reçu après l’avoir passée.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/produits" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-white hover:bg-brand">
            Voir les produits <ArrowRight className="size-4" />
          </Link>
          <Link href="/" className="inline-flex items-center rounded-full border border-line px-6 py-3.5 font-semibold">Accueil</Link>
        </div>
      </div>
    </main>
  );
}
