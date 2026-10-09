"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BedDouble, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Images, Info, Lock, MapPin, Ruler, Share2, ShieldCheck, Star, Users, UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Avatar, Button, Dialog, Loading, money, useToast } from "@/components/app/kit";
import { useSession } from "@/components/app/Session";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { useApi } from "@/hooks/useApi";
import { etabById } from "@/lib/data";
import { AMENITIES, Cover, MODE_ICON, SERVICE_FEE, Stars, VERIF, VerifBadge, addMonths, etabName, genderLabel, isoDay, modeLabel, toEur, typeLabel, type Housing } from "./shared";
import { PseudoMap, pricePin } from "./PseudoMap";

type Data = {
  housing: Housing;
  landlord: { firstName: string; kycStatus: string | null; partner: boolean | null; kind: string | null; company: string | null; since: string };
  reviews: { r: { id: string; rating: number; comment: string | null; createdAt: string }; a: { firstName: string } }[];
};


export function HousingPage({ id }: { id: string }) {
  const { data, error, loading } = useApi<Data>(`/logements/${id}`);
  if (loading) return <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6"><Loading label="Chargement du logement…" /></div>;
  if (error || !data) return (
    <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
      <Alert tone="error" title={error?.status === 404 ? "Logement introuvable" : "Chargement impossible"} action={<Link href="/navilease/logements" className="btn-ghost py-2 text-[13px]">Voir les logements</Link>}>
        {error?.status === 404 ? "Cette annonce n'existe pas ou n'est plus publiée." : error?.message}
      </Alert>
    </div>
  );
  return <Listing d={data} />;
}

function Listing({ d }: { d: Data }) {
  const h = d.housing;
  const user = useSession();
  const router = useRouter();
  const toast = useToast();
  const today = isoDay(new Date());
  const [start, setStart] = useState(() => (h.availableFrom && h.availableFrom > today ? h.availableFrom.slice(0, 10) : today));
  const [months, setMonths] = useState(Math.max(h.minMonths, 10 >= h.minMonths ? 10 : h.minMonths));
  const [gallery, setGallery] = useState<number | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const fee = Math.round(h.rent * SERVICE_FEE);
  const total = h.rent + h.charges + h.deposit + fee;
  const eur = toEur(total, h.currency);
  const rating = d.reviews.length ? d.reviews.reduce((a, r) => a + r.r.rating, 0) / d.reviews.length : null;
  const photos = Math.max(h.photos.length, 1);
  const near = useMemo(() => [...h.nearEstablishments].sort((a, b) => a.minutes - b.minutes), [h.nearEstablishments]);
  const first = near[0] ? etabById[near[0].id] : null;
  const schoolPin = first?.coordonnees ? { ...first.coordonnees, label: etabName(first.id) } : null;
  const canBook = !user || ["eleve", "etudiant"].includes(user.role);
  const bookHref = `/navilease/reservations/nouvelle/?logement=${h.id}&entree=${start}&duree=${months}`;

  const book = () => {
    if (!user) { router.push(`/connexion/?suite=${encodeURIComponent(bookHref)}`); return; }
    if (!canBook) { setWhyOpen(true); return; }
    router.push(bookHref);
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: h.title, text: `Regarde ce logement sur Navilease : ${h.title}`, url });
      else { await navigator.clipboard.writeText(url); toast("Lien copié : envoie-le à tes parents."); }
    } catch { /* partage annulé */ }
  };

  const facts: [typeof BedDouble, string, string][] = [
    [BedDouble, "Type", `${typeLabel(h.type)}${h.furnished ? " meublé" : ""}`], [Ruler, "Surface", h.surface ? `${h.surface} m²` : "—"],
    [Users, "Occupants", `${h.capacity} personne${h.capacity > 1 ? "s" : ""} · ${genderLabel(h.gender)}`], [CalendarDays, "Disponible", h.availableFrom ? new Date(h.availableFrom).toLocaleDateString("fr-FR") : "Immédiatement"],
    [Clock, "Durée min.", `${h.minMonths} mois`], [BedDouble, "Pièces", h.rooms ? String(h.rooms) : "—"],
  ];

  return (
    <div className="bg-[#f6f8fe] pb-28 lg:pb-16">
      <div className="mx-auto max-w-[1280px] px-4 pt-6 sm:px-6">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-[13px] text-ink-mute" aria-label="Fil d'Ariane">
          <Link href="/navilease" className="hover:text-brand-600">Navilease</Link><ChevronRight size={13} />
          <Link href={`/navilease/logements/?ville=${encodeURIComponent(h.ville)}`} className="hover:text-brand-600">{h.ville}</Link>
          {h.quartier && <><ChevronRight size={13} /><span>{h.quartier}</span></>}<ChevronRight size={13} /><span className="truncate">{typeLabel(h.type)}</span>
        </nav>
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="min-w-0">
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[34px]">{h.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-ink-mute">
              <VerifBadge v={h.verification} />
              <span className="flex items-center gap-1"><MapPin size={14} />{[h.quartier, h.ville].filter(Boolean).join(", ")}</span>
              <span className="italic">· adresse exacte communiquée après paiement</span>
            </div>
          </div>
          <Button variant="ghost" icon={Share2} onClick={share}>Partager à mes parents</Button>
        </div>

        {/* Galerie */}
        <div className="grid gap-3 md:h-[400px] md:grid-cols-[1.6fr_1fr] md:grid-rows-2">
          <button type="button" onClick={() => setGallery(0)} className="relative h-64 overflow-hidden rounded-[24px] md:row-span-2 md:h-full" aria-label="Agrandir les photos">
            <Cover h={h} iconSize={80} />
            {h.verification !== "non_verifie" && <span className={`chip absolute left-4 top-4 shadow-sm ${VERIF[h.verification].cls}`}>{VERIF[h.verification].label}</span>}
          </button>
          <button type="button" onClick={() => setGallery(Math.min(1, photos - 1))} className="relative hidden overflow-hidden rounded-[24px] md:block" aria-label="Photo suivante"><Cover h={h} idx={1} iconSize={50} /></button>
          <div className="hidden grid-cols-2 gap-3 md:grid">
            <button type="button" onClick={() => setGallery(Math.min(2, photos - 1))} className="overflow-hidden rounded-[24px]" aria-label="Photo"><Cover h={h} idx={2} iconSize={40} /></button>
            <button type="button" onClick={() => setGallery(0)} className="relative overflow-hidden rounded-[24px]" aria-label="Voir toutes les photos">
              <Cover h={h} idx={3} iconSize={h.photos.length > 3 ? 40 : 0} />
              <span className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/40 font-extrabold text-white"><Images size={18} />{h.photos.length ? `${h.photos.length} photo${h.photos.length > 1 ? "s" : ""}` : "Photos à venir"}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="card grid grid-cols-2 gap-4 rounded-[22px] p-5 sm:grid-cols-3">
              {facts.map(([I, l, v]) => (
                <div key={l} className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><I size={18} /></span><div className="min-w-0"><span className="block text-xs text-ink-mute">{l}</span><b className="block truncate text-sm">{v}</b></div></div>
              ))}
            </section>

            <section className="card rounded-[22px] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-extrabold">Le logement</h2>
              <p className="whitespace-pre-line leading-relaxed text-ink-soft">{h.description}</p>
            </section>

            <div className="grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
              <section className="card rounded-[22px] p-5 sm:p-6">
                <h2 className="mb-3 text-xl font-extrabold">Équipements</h2>
                {h.amenities.length ? <ul className="grid grid-cols-1 gap-2.5 text-sm text-ink-soft sm:grid-cols-2">
                  {h.amenities.map((id) => { const a = AMENITIES.find((x) => x.id === id); const I = a?.Icon ?? Check; return <li key={id} className="flex items-center gap-2.5"><I size={17} className="text-ink-mute" />{a?.label ?? id}</li>; })}
                </ul> : <p className="text-sm text-ink-mute">Non renseignés.</p>}
              </section>
              <section className="card rounded-[22px] p-5 sm:p-6">
                <h2 className="mb-3 text-xl font-extrabold">Règlement</h2>
                {h.rules ? <ul className="flex flex-col gap-2.5 text-sm text-ink-soft">
                  {h.rules.split(/\n|·|;/).map((r) => r.trim()).filter(Boolean).map((r, i) => <li key={i} className="flex items-start gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-[#0f8a46]" />{r}</li>)}
                </ul> : <p className="text-sm text-ink-mute">Pas de règlement particulier indiqué.</p>}
                <p className="mt-3 text-xs text-ink-mute">Durée minimale : {h.minMonths} mois · caution {money(h.deposit, h.currency)}, conservée en séquestre puis restituée à la sortie.</p>
              </section>
            </div>

            <div className="grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
              <section className="card flex flex-col gap-3 rounded-[22px] p-5 sm:p-6">
                <h2 className="text-xl font-extrabold">Distance de ton école</h2>
                {h.lat != null && h.lng != null && <PseudoMap pins={[{ id: h.id, lat: h.lat, lng: h.lng, label: pricePin(h.rent, h.currency), active: true }]} school={schoolPin} className="h-56" osm={{ lat: h.lat, lng: h.lng }} />}
                {near.length ? near.map((n) => { const e = etabById[n.id]; const I = MODE_ICON[n.mode] ?? MapPin; return (
                  <Link key={n.id} href={e ? `/etablissements/${e.id}` : "#"} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 p-3 hover:border-brand-200 hover:bg-brand-50/40">
                    {e ? <EtabLogo e={e} size={34} /> : <span className="h-[34px] w-[34px] rounded-xl bg-brand-50" />}
                    <b className="min-w-0 flex-1 truncate text-sm">{e?.nom ?? n.id}</b>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-ink-mute"><I size={13} />{n.minutes} min {modeLabel(n.mode)}</span>
                  </Link>); }) : <p className="text-sm text-ink-mute">Aucun établissement proche renseigné.</p>}
              </section>

              <section className="card flex flex-col gap-3 rounded-[22px] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2"><h2 className="text-xl font-extrabold">Avis vérifiés</h2>{rating && <span className="flex items-center gap-1.5 font-extrabold"><Star size={16} className="fill-sun-400 text-sun-500" />{rating.toFixed(1).replace(".", ",")} / 5 · {d.reviews.length}</span>}</div>
                {d.reviews.length ? d.reviews.slice(0, 6).map(({ r, a }) => (
                  <article key={r.id} className="rounded-2xl border border-slate-200/70 p-4">
                    <div className="flex items-center gap-3"><Avatar name={a.firstName} size={34} /><div className="min-w-0 flex-1"><b className="text-sm">{a.firstName}</b><span className="block text-xs text-ink-mute">{new Date(r.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span></div><Stars value={r.rating} size={13} /></div>
                    {r.comment && <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>}
                    <span className="chip mt-2 bg-[#e8f8ef] text-[#0f8a46]"><Check size={12} />Séjour vérifié</span>
                  </article>
                )) : <p className="rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-mute">Pas encore d&apos;avis. Seuls les locataires ayant réellement séjourné via Navilease peuvent en laisser.</p>}
              </section>
            </div>

            <section className="card flex flex-col gap-4 rounded-[22px] p-5 sm:flex-row sm:items-center sm:p-6">
              <Avatar name={d.landlord.company ?? d.landlord.firstName} size={56} className="from-[#0f8a46] to-[#4ad08a] text-white" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><b className="text-lg">{d.landlord.company ?? d.landlord.firstName}</b>
                  {d.landlord.kycStatus === "valide" && <span className="chip bg-brand-50 text-brand-700"><ShieldCheck size={13} />Identité vérifiée</span>}
                  {d.landlord.partner && <span className="chip bg-sun-100 text-[#a55a00]"><Star size={12} />Partenaire certifié</span>}
                </div>
                <p className="text-sm text-ink-mute">{d.landlord.kind === "agence" ? "Agence" : d.landlord.kind === "residence" ? "Résidence" : "Particulier"} · bailleur Navilease depuis {new Date(d.landlord.since).getFullYear()}</p>
              </div>
              <p className="flex max-w-xs items-start gap-2 text-xs text-ink-mute"><Lock size={14} className="mt-0.5 shrink-0" />Coordonnées du bailleur communiquées après le paiement en séquestre. Échangez via la messagerie Navilease après votre demande.</p>
            </section>
          </div>

          {/* Encadré prix */}
          <aside className="lg:sticky lg:top-24 lg:h-max">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col gap-4 rounded-[24px] p-5 shadow-lift sm:p-6">
              <div className="flex items-baseline justify-between gap-2">
                <p><b className="text-[28px] text-brand-600">{money(h.rent, h.currency)}</b><span className="text-sm text-ink-mute"> / mois</span></p>
                {rating && <span className="flex items-center gap-1 text-sm font-bold"><Star size={14} className="fill-sun-400 text-sun-500" />{rating.toFixed(1).replace(".", ",")}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-[13px] font-bold">Entrée<input type="date" className="input px-3" min={today} value={start} onChange={(e) => setStart(e.target.value)} /></label>
                <label className="flex flex-col gap-1.5 text-[13px] font-bold">Durée
                  <select className="input px-3" value={months} onChange={(e) => setMonths(Number(e.target.value))}>{Array.from({ length: 25 - h.minMonths }, (_, i) => h.minMonths + i).map((m) => <option key={m} value={m}>{m} mois</option>)}</select>
                </label>
              </div>
              <p className="-mt-2 text-xs text-ink-mute">Sortie prévue le {addMonths(start, months).toLocaleDateString("fr-FR")}</p>
              <dl className="flex flex-col gap-1.5 text-sm">
                {[["Premier loyer", h.rent], [`Charges${h.amenities.includes("wifi") ? " (dont wifi)" : ""}`, h.charges], ["Caution (restituée)", h.deposit], ["Frais de service Navilease (5 %)", fee]].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between gap-3"><dt className="text-ink-mute">{l}</dt><dd className="font-bold">{money(v as number, h.currency)}</dd></div>
                ))}
              </dl>
              <div className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white">
                <b className="text-sm">À payer à la réservation</b>
                <div className="text-right"><b className="text-lg">{money(total, h.currency)}</b>{eur && <span className="block text-[11px] text-white/70">≈ {eur.toLocaleString("fr-FR")} € (indicatif)</span>}</div>
              </div>
              <Button onClick={book} className="w-full btn-shine">Demander une réservation</Button>
              {!canBook && <p className="text-xs text-ink-mute">La réservation se fait depuis un compte élève ou étudiant.</p>}
              <div className="rounded-2xl bg-[#effbf3] p-3.5 text-xs text-[#0b6b37]"><b>Paiement en séquestre :</b> rien n&apos;est débité avant l&apos;acceptation du bailleur. Le bailleur n&apos;est payé qu&apos;après ton entrée dans les lieux ; la caution reste bloquée jusqu&apos;à la sortie.</div>
              <p className="flex items-start gap-2 text-xs text-ink-mute"><UserRound size={14} className="mt-0.5 shrink-0" />Garant parent accepté · paiement possible depuis un autre pays (mobile money, carte, virement).</p>
            </motion.div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <p className="min-w-0"><b className="text-lg text-brand-600">{money(h.rent, h.currency)}</b><span className="text-xs text-ink-mute"> / mois</span><span className="block truncate text-[11px] text-ink-mute">{money(total, h.currency)} à la réservation</span></p>
        <Button onClick={book} size="sm" className="shrink-0">Demander une réservation</Button>
      </div>
      <Dialog open={gallery !== null} onClose={() => setGallery(null)} title={`Photos · ${h.title}`} wide>
        {gallery !== null && (
          <div className="flex flex-col gap-3">
            <div className="relative h-[55vh] overflow-hidden rounded-2xl bg-ink"><Cover h={h} idx={gallery} iconSize={80} className="object-contain" alt={`Photo ${gallery + 1} sur ${photos}`} /></div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" icon={ChevronLeft} disabled={gallery === 0} onClick={() => setGallery(gallery - 1)}>Précédente</Button>
              <span className="text-sm text-ink-mute">{gallery + 1} / {photos}</span>
              <Button variant="ghost" size="sm" disabled={gallery >= photos - 1} onClick={() => setGallery(gallery + 1)}>Suivante<ChevronRight size={15} /></Button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog open={whyOpen} onClose={() => setWhyOpen(false)} title="Réservation réservée aux élèves et étudiants">
        <div className="flex flex-col gap-3 text-sm text-ink-soft">
          <p className="flex items-start gap-2"><Info size={18} className="mt-0.5 shrink-0 text-brand-600" />
            {user?.role === "parent" ? "La demande de réservation est faite par votre enfant depuis son compte Navigoal. Vous recevrez ensuite une notification pour valider la réservation en tant que garant et pourrez régler le séquestre vous-même." : "Seuls les comptes élève ou étudiant peuvent demander une réservation. Les bailleurs et les établissements ne peuvent pas réserver de logement."}
          </p>
          {user?.role === "parent" && <Button variant="ghost" onClick={share} icon={Share2}>Envoyer ce logement à mon enfant</Button>}
        </div>
      </Dialog>
    </div>
  );
}
