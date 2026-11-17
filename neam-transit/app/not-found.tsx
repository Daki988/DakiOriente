import Link from "next/link";

export default function NotFound() {
  return (
    <div className="conteneur max-w-xl py-16 text-center">
      <h1 className="titre-page">Page introuvable</h1>
      <p className="mt-2 text-slate-600">Cette page n&apos;existe pas ou n&apos;est plus disponible.</p>
      <Link href="/" className="btn-primaire mt-6">Retour à l&apos;accueil</Link>
    </div>
  );
}
