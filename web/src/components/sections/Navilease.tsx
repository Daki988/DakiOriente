"use client";
// Accueil Navilease (maquette « refonte », écran 1, validée le 21/11/2026) : accroche et recherche, garanties, villes en
// photos, logements vérifiés, résidences universitaires, réservation en cinq étapes, parents, bailleurs.
import Link from "@/components/ui/Link";
import { motion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, BellRing, CalendarCheck, Eye, FilePenLine, GraduationCap, HandCoins, KeyRound, MapPin, PenLine, Search, ShieldCheck, Sparkles, Users, Wallet,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useApresPremierRendu } from "@/components/motion/Reveal";
import { useApi } from "@/hooks/useApi";
import { srcsetPhoto } from "@/lib/photo-variantes";
import { VILLES_ETUDES, etablissements, mobilite, villesOf } from "@/lib/data";
import { residencesEtudiantes } from "@/lib/residences";
import { CarteLogement } from "@/components/navilease/CarteLogement";
import type { Housing } from "@/components/navilease/shared";

/* eslint-disable @next/next/no-img-element */

const twenty = residencesEtudiantes.find((r) => r.id === "twenty-casa-anfa");
const photoRes = (n: number) => twenty?.photos[n] ?? residencesEtudiantes[0].photos[0];
const VILLES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir"];

export const GARANTIES: [typeof BadgeCheck, string, string][] = [
  [BadgeCheck, "Bailleurs vérifiés", "Identité contrôlée, logement visité ou partenaire certifié."],
  [ShieldCheck, "Paiement en séquestre", "Ton argent n'est versé au bailleur qu'après ton entrée dans les lieux."],
  [FilePenLine, "Contrat et état des lieux", "Signés en ligne, photos à l'appui, gardés dans ton espace."],
  [Users, "Parents associés", "Ils suivent, se portent garants et paient depuis leur pays."],
];

export const ETAPES: [typeof Search, string, string][] = [
  [Search, "Je cherche", "Par école, ville et budget. Chaque annonce indique le trajet jusqu'à ton établissement."],
  [CalendarCheck, "Je réserve", "Demande en ligne et pièces du dossier ; un parent valide si tu es mineur."],
  [ShieldCheck, "Je paie en séquestre", "Mobile money, carte ou espèces : les fonds restent protégés jusqu'à ton entrée."],
  [PenLine, "Je signe", "Contrat numérique et état des lieux photographié à l'arrivée."],
  [KeyRound, "J'emménage", "Quittances chaque mois, médiation en cas de désaccord."],
];

function Titre({ sur, children, sous, action }: { sur: string; children: ReactNode; sous?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-[.16em] text-nl-ocre-texte">{sur}</span>
        <h2 className="mt-2 text-[34px] leading-[1.08] text-nl-encre sm:text-[46px]">{children}</h2>
        {sous && <p className="mt-2 text-[15.5px] text-nl-gris">{sous}</p>}
      </div>
      {action}
    </div>
  );
}

export function Navilease({ residences: rangee }: { residences?: ReactNode }) {
  const anime = useApresPremierRendu();
  const [ville, setVille] = useState("");
  const [ecole, setEcole] = useState("");
  const [budget, setBudget] = useState("");
  const ecoles = useMemo(() => etablissements.filter((e) => !ville || villesOf(e).includes(ville)).sort((a, b) => a.nom.localeCompare(b.nom, "fr")), [ville]);
  const { data, loading, error } = useApi<Housing[]>("/logements");
  const logements = (data ?? []).slice(0, 6);
  const nbVilles = new Set(residencesEtudiantes.map((r) => r.ville)).size;
  const chercher = () => {
    const q = new URLSearchParams({ ...(ville ? { ville } : {}), ...(ecole ? { etablissement: ecole } : {}), ...(budget ? { budget } : {}) });
    window.location.href = `/navilease/logements/${q.size ? `?${q}` : ""}`;
  };
  const villes = VILLES.map((v) => {
    const rs = residencesEtudiantes.filter((r) => r.ville === v);
    const min = Math.min(...rs.map((r) => r.a_partir_de ?? Infinity));
    return { v, photo: mobilite[v]?.couverture as { src: string } | undefined, n: rs.length, min: Number.isFinite(min) ? min : null };
  });

  return (
    <>
      {/* Accroche */}
      <section className="container grid items-center gap-10 pb-10 pt-8 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:pt-14">
        <div className="order-2 flex flex-col gap-5 lg:order-1">
          <span className="chip w-fit border border-nl-bord bg-white px-3 py-1.5 text-nl-vert"><Sparkles size={14} className="text-nl-ocre" aria-hidden />Un service Navigoal · Maroc</span>
          <h1 className="text-[42px] leading-[1.03] text-nl-encre sm:text-[60px] xl:text-[72px]">Ton chez-toi au Maroc, <em className="text-nl-vert2">trouvé avant</em> même d&apos;atterrir.</h1>
          <p className="max-w-[560px] text-[17px] leading-relaxed text-nl-gris sm:text-lg">Studios, colocations et résidences universitaires près de ton école. Bailleurs vérifiés, paiement protégé jusqu&apos;à ton entrée, et tes parents à tes côtés à chaque étape.</p>
        </div>

        <div className="relative order-1 h-[300px] sm:h-[420px] lg:order-2 lg:h-[600px]">
          <motion.div initial={anime ? { opacity: 0, y: 20 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="absolute inset-y-0 right-0 w-full overflow-hidden rounded-t-[160px] rounded-b-[28px] lg:left-auto lg:h-[540px] lg:w-[82%] lg:rounded-t-[220px]">
            <img src={photoRes(1).src} srcSet={srcsetPhoto(photoRes(1).src)} sizes="(max-width: 1024px) 100vw, 520px" alt="Étudiante à son bureau dans une chambre de résidence à Casablanca" fetchPriority="high" className="h-full w-full object-cover" />
          </motion.div>
          <motion.div initial={anime ? { opacity: 0, x: -20 } : false} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="absolute bottom-0 left-0 hidden h-[290px] w-[240px] overflow-hidden rounded-3xl border-8 border-nl-creme lg:block">
            <img src={photoRes(3).src} srcSet={srcsetPhoto(photoRes(3).src)} sizes="240px" alt="Étudiants dans une rue de Casablanca, près du tramway" className="h-full w-full object-cover" />
          </motion.div>
          <motion.div initial={anime ? { opacity: 0, y: -12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute bottom-3 left-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_14px_34px_-14px_rgba(16,35,26,.4)] lg:bottom-auto lg:left-6 lg:top-16">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-nl-vert2 text-white"><ShieldCheck size={19} aria-hidden /></span>
            <span><b className="block text-sm">Paiement en séquestre</b><span className="text-xs text-nl-gris">versé au bailleur après ton entrée</span></span>
          </motion.div>
          {twenty && <Link href={`/navilease/residences/${twenty.id}/`} className="absolute bottom-24 right-5 hidden w-[270px] rounded-2xl bg-white px-4 py-3 shadow-[0_14px_34px_-14px_rgba(16,35,26,.4)] transition hover:-translate-y-0.5 lg:block">
            <span className="flex items-center justify-between gap-2"><b className="truncate text-sm">{twenty.nom}</b><span className="chip shrink-0 bg-[#e9f4ed] text-nl-vert">{twenty.ville}</span></span>
            <span className="mt-1 block text-[13px] text-nl-gris">dès <b className="text-base text-nl-encre">{twenty.a_partir_de?.toLocaleString("fr-FR")} DH</b> /mois</span>
          </Link>}
          <span className="chip absolute right-5 top-4 hidden bg-nl-ocre text-nl-encre lg:inline-flex"><BadgeCheck size={14} aria-hidden />Logements vérifiés</span>
          <span className="absolute -bottom-6 right-0 text-[11px] text-nl-gris">Photos : {twenty?.nom ?? "résidence"}, {twenty?.ville}</span>
        </div>
        <div className="order-3 flex flex-col gap-4 lg:col-span-2">
          <form onSubmit={(e) => { e.preventDefault(); chercher(); }} className="flex flex-col gap-1 rounded-[28px] border border-nl-bord bg-white p-2 shadow-[0_20px_50px_-24px_rgba(16,35,26,.35)] lg:flex-row lg:items-center lg:rounded-full">
            <label className="flex flex-1 flex-col px-4 py-2">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-nl-gris"><MapPin size={13} className="text-nl-vert2" aria-hidden />Ville</span>
              <select value={ville} onChange={(e) => { setVille(e.target.value); setEcole(""); }} className="bg-transparent text-[15px] font-bold outline-none"><option value="">Toutes les villes</option>{VILLES_ETUDES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
            </label>
            <label className="flex flex-1 flex-col border-nl-bord px-4 py-2 lg:border-l">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-nl-gris"><GraduationCap size={13} className="text-nl-vert2" aria-hidden />École</span>
              <select value={ecole} onChange={(e) => setEcole(e.target.value)} className="w-full min-w-0 bg-transparent text-[15px] font-bold outline-none"><option value="">Toutes les écoles</option>{ecoles.map((e) => <option key={e.id} value={e.id}>{e.sigle && e.sigle.length <= 18 ? e.sigle : e.nom}</option>)}</select>
            </label>
            <label className="flex flex-1 flex-col border-nl-bord px-4 py-2 lg:border-l">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-nl-gris"><Wallet size={13} className="text-nl-vert2" aria-hidden />Budget / mois</span>
              <input type="number" min={0} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Sans limite (DH)" className="w-full bg-transparent text-[15px] font-bold outline-none placeholder:font-semibold placeholder:text-nl-gris" />
            </label>
            <button className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-nl-ocre px-7 text-[15px] font-extrabold text-nl-encre transition hover:brightness-105"><Search size={18} aria-hidden />Rechercher</button>
          </form>
          <div className="flex items-center gap-3">
            <span className="flex shrink-0">{[3, 5, 0].map((n, k) => <img key={n} src={photoRes(n).src} alt="" className={`h-9 w-9 rounded-full border-[3px] border-nl-creme object-cover ${k ? "-ml-2.5" : ""}`} />)}</span>
            <span className="text-[13.5px] text-nl-gris"><b className="text-nl-encre">{residencesEtudiantes.length} résidences universitaires</b> dans {nbVilles} villes, et des logements vérifiés près de ton école</span>
          </div>
        </div>
      </section>

      {/* Garanties */}
      <section className="container">
        <div className="grid gap-6 rounded-[26px] border border-nl-bord bg-white p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {GARANTIES.map(([I, t, d]) => (
            <div key={t} className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e9f4ed] text-nl-vert"><I size={20} aria-hidden /></span>
              <span><b className="block text-[15px]">{t}</b><span className="text-[13.5px] leading-relaxed text-nl-gris">{d}</span></span>
            </div>
          ))}
        </div>
      </section>

      {/* Villes */}
      <section className="container mt-20">
        <Titre sur="Explorer par ville" action={<Link href="/navilease/logements/" className="flex items-center gap-2 font-extrabold text-nl-vert">Toutes les villes <ArrowRight size={17} /></Link>}>Où vas-tu étudier ?</Titre>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:grid-rows-[250px_250px]">
          {villes.map(({ v, photo, n, min }, k) => (
            <Link key={v} href={`/navilease/logements/?ville=${encodeURIComponent(v)}`} className={`group relative h-[220px] overflow-hidden rounded-[22px] lg:h-auto ${k === 0 ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}`}>
              {photo && <img src={photo.src} srcSet={srcsetPhoto(photo.src)} sizes={k === 0 ? "(max-width: 1024px) 100vw, 560px" : "(max-width: 640px) 100vw, 400px"} alt={`Vue de ${v}`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
              <span className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-nl-encre/85" />
              <span className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3 text-white">
                <span><b className={`block font-serif font-semibold ${k === 0 ? "text-[34px]" : "text-[26px]"}`}>{v}</b><span className="text-[13px] opacity-90">{n ? `${n} résidence${n > 1 ? "s" : ""} universitaire${n > 1 ? "s" : ""}` : "Logements vérifiés"}</span></span>
                <span className="chip shrink-0 bg-white/95 text-nl-encre">{min ? `dès ${min.toLocaleString("fr-FR")} DH` : "Voir"}<ArrowRight size={13} aria-hidden /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Logements vérifiés */}
      <section id="logements" className="container mt-20 scroll-mt-24">
        <Titre sur="Logements vérifiés" sous="Chaque annonce affiche le temps de trajet jusqu'à ton établissement."
          action={<Link href="/navilease/logements/" className="btn shrink-0 self-start rounded-full border-[1.5px] border-nl-vert px-5 text-nl-vert hover:bg-[#e9f4ed] sm:self-auto">Voir les logements <ArrowRight size={16} /></Link>}>
          Près de ton école, <em className="text-nl-vert2">vraiment</em>.
        </Titre>
        {loading ? <p className="mt-7 text-nl-gris">Chargement des annonces…</p>
          : error || !logements.length ? <div className="mt-7 flex flex-col items-start gap-3 rounded-[22px] border border-nl-bord bg-white p-6 text-nl-gris sm:flex-row sm:items-center sm:justify-between">
              <span>{error ? "Les annonces n'ont pas pu être chargées." : "De nouvelles annonces sont en cours de vérification."} Crée une alerte : on te prévient dès qu&apos;un logement correspond.</span>
              <Link href="/navilease/logements/" className="btn shrink-0 rounded-full bg-nl-vert px-5 text-white"><BellRing size={16} />Créer une alerte</Link></div>
          : <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{logements.map((h) => <CarteLogement key={h.id} h={h} />)}</div>}
      </section>

      {rangee}

      {/* Comment ça marche */}
      <section className="relative mt-24 overflow-hidden bg-nl-vert py-16 text-white sm:py-20">
        <img src="/brand/navilease-symbole.webp" alt="" className="pointer-events-none absolute -right-16 -top-10 hidden w-[380px] opacity-[.06] brightness-[3] grayscale lg:block" />
        <div className="container">
          <span className="text-xs font-extrabold uppercase tracking-[.16em] text-[#f4c26b]">Comment ça marche</span>
          <h2 className="mt-2 max-w-[760px] text-[34px] leading-[1.06] sm:text-[50px]">Réserver à distance, <em className="text-nl-ocre">sans arnaque</em>, en cinq étapes.</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {ETAPES.map(([I, t, d], k) => (
              <li key={t}>
                <span className="flex items-center gap-3"><span className="font-serif text-[42px] font-semibold leading-none text-nl-ocre">0{k + 1}</span><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><I size={19} aria-hidden /></span></span>
                <b className="mt-3 block text-[17px]">{t}</b><span className="mt-1.5 block text-[13.5px] leading-relaxed text-[#c9d8cf]">{d}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/navilease/comment-ca-marche/" className="btn rounded-full bg-nl-ocre px-6 text-nl-encre">Comprendre les protections</Link>
            <Link href="/navilease/cgu/" className="btn rounded-full border-[1.5px] border-white/50 px-6 text-white hover:bg-white/10">Aide et règles</Link>
          </div>
        </div>
      </section>

      {/* Parents */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[300px] lg:min-h-[520px]">
          <img src={photoRes(2).src} srcSet={srcsetPhoto(photoRes(2).src)} sizes="(max-width: 1024px) 100vw, 720px" alt="Étudiants dans l'espace commun d'une résidence à Casablanca" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute bottom-3 left-4 text-[11px] text-white/85">{twenty?.nom}, {twenty?.ville}</span>
        </div>
        <div className="bg-nl-sable px-6 py-14 sm:px-14 lg:py-20">
          <span className="text-xs font-extrabold uppercase tracking-[.16em] text-nl-ocre-texte">Pour les parents</span>
          <h2 className="mt-2 text-[32px] leading-[1.08] text-nl-encre sm:text-[42px]">Vous suivez tout, depuis Libreville, Dakar ou Douala.</h2>
          <ul className="mt-7 flex flex-col gap-5">
            {([[Eye, "Le même dossier que votre enfant", "Annonce, contrat, état des lieux et quittances, dans votre espace parent."], [HandCoins, "Payez depuis votre pays", "Airtel Money, Moov Money, carte ou espèces ; versé au bailleur après l'entrée."], [BellRing, "Un rappel avant chaque loyer", "2, 3, 5 ou 7 jours avant l'échéance, et le jour même si vous le souhaitez."]] as const).map(([I, t, d]) => (
              <li key={t} className="flex gap-3.5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-nl-vert"><I size={19} aria-hidden /></span><span><b className="block">{t}</b><span className="text-[14px] leading-relaxed text-nl-gris">{d}</span></span></li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/inscription/?profil=parent" className="btn rounded-full bg-nl-vert px-6 text-white">Créer mon espace parent <ArrowRight size={16} /></Link>
            <Link href="/parents/" className="btn rounded-full border-[1.5px] border-nl-vert px-6 text-nl-vert">Tout savoir pour les parents</Link>
          </div>
        </div>
      </section>

      {/* Bailleurs */}
      <section className="container flex flex-col items-start justify-between gap-6 py-16 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-nl-ocre text-nl-encre"><KeyRound size={26} aria-hidden /></span>
          <span><b className="block font-serif text-[28px] font-semibold leading-tight">Vous louez à des étudiants ?</b><span className="text-nl-gris">Locataires sérieux, loyers protégés par le séquestre, visibilité auprès de {etablissements.length} écoles.</span></span>
        </div>
        <Link href="/navilease/bailleurs/" className="btn shrink-0 rounded-full bg-nl-encre px-6 text-white">Publier une annonce gratuitement <ArrowRight size={16} /></Link>
      </section>
    </>
  );
}
