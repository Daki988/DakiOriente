import { BADGES, type BadgeCode, type Famille } from "@/lib/referentiel";
import { MIN_ENVOIS_DELAI, type DelaiReel, type Stats } from "@/lib/queries";
import { nombre } from "@/lib/format";

export function Coche({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
    </svg>
  );
}

export function PastilleVerifie() {
  return (
    <span className="pastille bg-verifie-100 text-verifie-600" title="Informations contrôlées par Neam Transit">
      <Coche /> Vérifié
    </span>
  );
}

export function PastilleDemo() {
  return <span className="pastille bg-alerte-100 text-alerte-600">Démo</span>;
}

export function Badges({ badges, delaisTenus }: { badges: BadgeCode[]; delaisTenus?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <li key={b} className="pastille bg-marine-100 text-marine-800" title={BADGES[b]?.description}>
          <Coche className="h-3 w-3" /> {BADGES[b]?.label ?? b}
        </li>
      ))}
      {delaisTenus && (
        <li className="pastille bg-verifie-100 text-verifie-600" title="Au moins 80 % des envois notés livrés dans le délai annoncé">
          ⏱ Délais tenus
        </li>
      )}
    </ul>
  );
}

export function Etoiles({ note, taille = "text-sm" }: { note: number; taille?: string }) {
  const pleine = Math.round(note);
  return (
    <span className={`${taille} text-cargo-500`} aria-label={`${nombre(note, 1)} sur 5`}>
      {"★".repeat(pleine)}
      <span className="text-slate-300">{"★".repeat(5 - pleine)}</span>
    </span>
  );
}

export function NoteCourte({ stats }: { stats: Stats }) {
  if (!stats.nbAvis || stats.note === null) return <span className="text-xs text-slate-500">Pas encore d&apos;avis</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Etoiles note={stats.note} />
      <span className="font-semibold text-slate-800">{nombre(stats.note, 1)}</span>
      <span className="text-slate-500">({stats.nbAvis} avis)</span>
    </span>
  );
}

export function DelaiReelTexte({ d, famille }: { d: DelaiReel; famille: Famille }) {
  if (d.mediane === null) {
    return (
      <span className="text-xs text-slate-500">
        Délai réel : pas encore assez de données ({d.n}/{MIN_ENVOIS_DELAI} envois {famille === "aerien" ? "aériens" : "maritimes"} notés)
      </span>
    );
  }
  return (
    <span className="text-sm text-slate-800">
      Délai réel : <strong>{nombre(d.mediane, 0)} j</strong> en médiane · 8 envois sur 10 en {nombre(d.p80 ?? 0, 0)} j ou moins
      <span className="text-slate-500"> ({d.n} envois)</span>
    </span>
  );
}

export function Alerte({ type = "info", children }: { type?: "info" | "erreur" | "succes" | "attention"; children: React.ReactNode }) {
  const styles = {
    info: "border-marine-100 bg-marine-50 text-marine-900",
    erreur: "border-red-200 bg-red-50 text-red-800",
    succes: "border-verifie-100 bg-verifie-100 text-verifie-600",
    attention: "border-alerte-100 bg-alerte-100 text-alerte-600",
  }[type];
  return (
    <div role={type === "erreur" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
