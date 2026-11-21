"use client";
// Carte d'une annonce Navilease (maquette « refonte », écrans 1 et 2) : grande photo, badge de vérification, titre en
// Fraunces, trajet jusqu'à l'école, équipements, loyer et mention du paiement protégé.
import Link from "@/components/ui/Link";
import { Footprints, Images, MapPin, ShieldCheck, Star } from "lucide-react";
import { money } from "@/components/app/kit";
import { Prix } from "@/components/ui/Devise";
import { AMENITIES, Cover, VERIF, genderLabel, modeLabel, etabName, typeLabel, type Housing, type Near } from "./shared";

export function CarteLogement({ h, near, survol, onSurvol }: { h: Housing; near?: Near; survol?: boolean; onSurvol?: (id: string | null) => void }) {
  const v = VERIF[h.verification] ?? VERIF.non_verifie;
  const proche = near ?? [...h.nearEstablishments].sort((a, b) => a.minutes - b.minutes)[0];
  const tags = [typeLabel(h.type), h.surface ? `${h.surface} m²` : null, h.furnished ? "Meublé" : null, ...h.amenities.filter((a) => a !== "meuble").slice(0, 2).map((a) => AMENITIES.find((x) => x.id === a)?.label ?? a), h.gender !== "mixte" ? genderLabel(h.gender) : null].filter(Boolean).slice(0, 4) as string[];
  return (
    <article onMouseEnter={() => onSurvol?.(h.id)} onMouseLeave={() => onSurvol?.(null)}
      className={`group relative flex flex-col overflow-hidden rounded-[22px] border bg-white shadow-[0_1px_0_rgba(16,35,26,.05),0_14px_32px_-16px_rgba(16,35,26,.25)] transition hover:-translate-y-1 ${survol ? "border-nl-vert2 ring-2 ring-nl-vert2/30" : "border-nl-bord"}`}>
      <div className="relative h-52 overflow-hidden sm:h-56">
        <Cover h={h} className="transition duration-700 group-hover:scale-105" />
        {h.verification !== "non_verifie" && <span className={`chip absolute left-3 top-3 shadow-sm ${v.cls}`}><v.Icon size={13} aria-hidden />{v.label}</span>}
        {h.photos.length > 1 && <span className="chip absolute bottom-3 left-3 bg-nl-encre/75 text-white backdrop-blur"><Images size={13} aria-hidden />{h.photos.length} photos</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-[19px] font-semibold leading-snug tracking-tight">
            <Link href={`/navilease/logements/${h.id}`} className="after:absolute after:inset-0 focus:outline-none">{h.title}</Link>
          </h3>
          {h.rating ? <span className="flex shrink-0 items-center gap-1 text-sm font-bold"><Star size={14} className="fill-nl-ocre text-nl-ocre" />{h.rating.toFixed(1).replace(".", ",")}</span> : <span className="shrink-0 text-xs text-nl-gris">Nouveau</span>}
        </div>
        <span className="flex items-center gap-1.5 text-[13px] text-nl-gris"><MapPin size={13} aria-hidden />{[h.quartier, h.ville].filter(Boolean).join(", ")}</span>
        {proche && <span className="flex items-center gap-1.5 text-[13px] font-bold text-nl-vert2"><Footprints size={14} aria-hidden />{proche.minutes} min {modeLabel(proche.mode)} de {etabName(proche.id)}</span>}
        <div className="flex flex-wrap gap-1.5">{tags.map((t) => <span key={t} className="chip bg-[#f4efe3] font-semibold text-[#4b4a40]">{t}</span>)}</div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-[#f0eadb] pt-3">
          <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-nl-vert2"><ShieldCheck size={14} aria-hidden />Paiement protégé</span>
          <span><b className="text-[21px] text-nl-encre">{h.currency === "MAD" ? <Prix mad={h.rent} /> : money(h.rent, h.currency)}</b><span className="text-xs text-nl-gris"> /mois</span></span>
        </div>
      </div>
    </article>
  );
}
