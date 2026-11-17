import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { chiffres } from "@/lib/queries";
import { pret } from "@/lib/stockage";

export default async function Accueil() {
  await pret();
  const c = chiffres();
  return (
    <>
      <section className="bg-marine-900 text-white">
        <div className="conteneur grid items-start gap-10 py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="pastille bg-white/10 text-cargo-500">🇨🇳 Chine · 🇰🇷 Corée du Sud → 🇬🇦 tout le Gabon</p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Trouvez le bon transitaire, <span className="text-cargo-500">au vrai prix</span>.
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-200 sm:text-lg">
              Comparez le coût total et les délais réels des transitaires vérifiés, en avion ou en bateau, puis contactez-les directement sur WhatsApp.
            </p>
            <ul className="mt-6 grid max-w-xl gap-3 text-sm text-slate-100 sm:grid-cols-3">
              <li className="rounded-xl bg-white/5 p-3"><strong className="block text-white">Prix tout compris</strong>Ce qui est inclus et ce qui ne l&apos;est pas.</li>
              <li className="rounded-xl bg-white/5 p-3"><strong className="block text-white">Délais réels</strong>Mesurés sur les envois des clients.</li>
              <li className="rounded-xl bg-white/5 p-3"><strong className="block text-white">100 % vérifié</strong>Documents et avis contrôlés.</li>
            </ul>
            <p className="mt-6 text-sm text-slate-300">
              {c.transitairesVerifies} transitaire{c.transitairesVerifies > 1 ? "s" : ""} vérifié{c.transitairesVerifies > 1 ? "s" : ""} · {c.offresValides} offre{c.offresValides > 1 ? "s" : ""} en ligne
            </p>
          </div>
          <div className="carte p-5 text-slate-900 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-marine-900">Comparer les offres</h2>
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="conteneur py-12">
        <h2 className="text-2xl font-bold text-marine-900">Comment ça marche</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            ["1", "Décrivez votre envoi", "Départ, arrivée, poids ou volume, type de marchandise."],
            ["2", "Comparez", "Coût total estimé, délai annoncé et délai réel, avis vérifiés."],
            ["3", "Contactez", "Demandez un devis ou écrivez directement au transitaire sur WhatsApp."],
            ["4", "Notez", "Après réception, votre avis et votre délai aident les autres importateurs."],
          ].map(([n, t, d]) => (
            <li key={n} className="carte p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cargo-100 font-bold text-cargo-600">{n}</span>
              <h3 className="mt-3 font-semibold text-marine-900">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="conteneur grid gap-6 pb-4 lg:grid-cols-2">
        <div className="carte p-6">
          <h2 className="text-xl font-bold text-marine-900">Seulement des informations vérifiées</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>✔ Chaque transitaire est contrôlé avant d&apos;apparaître : RCCM, NIF, identité du gérant, agrément en douane, entrepôts en Chine ou en Corée.</li>
            <li>✔ Chaque tarif, et chaque modification de tarif, est relu avant publication.</li>
            <li>✔ Seuls les clients mis en relation via Neam Transit peuvent laisser un avis, et chaque avis est modéré.</li>
            <li>✔ Les délais réels sont calculés à partir des dates d&apos;envoi et de réception déclarées par les clients.</li>
          </ul>
        </div>
        <div className="carte p-6">
          <h2 className="text-xl font-bold text-marine-900">Aucun paiement sur la plateforme</h2>
          <p className="mt-4 text-sm text-slate-700">
            Neam Transit vous met en relation, gratuitement. Vous convenez du prix et vous payez <strong>directement le transitaire</strong>, selon ses modes de paiement.
          </p>
          <p className="mt-3 text-sm text-slate-700">
            Pour votre sécurité : ne payez qu&apos;aux coordonnées affichées sur la fiche du transitaire, et signalez-nous toute demande suspecte.
          </p>
          <Link href="/guide" className="btn-contour mt-5">Lire le guide de l&apos;importateur</Link>
        </div>
      </section>

      <section className="conteneur py-12">
        <div className="carte flex flex-col items-start justify-between gap-4 bg-marine-800 p-6 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Vous êtes transitaire ?</h2>
            <p className="mt-1 text-sm text-slate-200">Référencez gratuitement votre entreprise et recevez des demandes de clients qualifiés dans tout le Gabon.</p>
          </div>
          <Link href="/pro/inscription" className="btn-primaire">Référencer mon entreprise</Link>
        </div>
      </section>
    </>
  );
}
