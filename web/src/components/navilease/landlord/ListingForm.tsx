"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ImagePlus, Info, Loader2, Save, Send, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Alert, Button, Chip, Loading, PageHeader, Panel, StatusBadge, money, useToast } from "@/components/app/kit";
import { Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { useApi } from "@/hooks/useApi";
import { api, ApiError } from "@/lib/api";
import { etablissements } from "@/lib/data";
import type { LandlordInfo } from "@/app/(app)/bailleur/landlord";
import { AMENITIES, CURRENCY_OF_COUNTRY, GENDERS, MODES, PAYS, SERVICE_FEE, TYPES, VerifBadge, photoUrl, type Housing, type Near } from "../shared";
import { KycChip } from "./common";

type S = {
  title: string; type: string; description: string; pays: string; ville: string; quartier: string; address: string; rent: string; charges: string; deposit: string;
  surface: string; rooms: string; capacity: string; gender: string; furnished: boolean; amenities: string[]; rules: string; minMonths: string; availableFrom: string; near: Near[];
};
const EMPTY: S = { title: "", type: "studio", description: "", pays: "MA", ville: "", quartier: "", address: "", rent: "", charges: "0", deposit: "0", surface: "", rooms: "", capacity: "1", gender: "mixte", furnished: true, amenities: [], rules: "", minMonths: "1", availableFrom: "", near: [] };
const fromHousing = (h: Housing): S => ({
  title: h.title, type: h.type, description: h.description, pays: h.pays, ville: h.ville, quartier: h.quartier ?? "", address: h.address ?? "", rent: String(h.rent), charges: String(h.charges), deposit: String(h.deposit),
  surface: h.surface ? String(h.surface) : "", rooms: h.rooms ? String(h.rooms) : "", capacity: String(h.capacity), gender: h.gender, furnished: h.furnished, amenities: h.amenities, rules: h.rules ?? "", minMonths: String(h.minMonths), availableFrom: h.availableFrom?.slice(0, 10) ?? "", near: h.nearEstablishments,
});
const SECTIONS: [string, string][] = [["logement", "1 · Logement"], ["photos", "2 · Photos"], ["prix", "3 · Prix"], ["equipements", "4 · Équipements"], ["disponibilite", "5 · Disponibilité"], ["ecoles", "6 · Écoles proches"]];
const FIELD_LABEL: Record<string, string> = { title: "Titre", description: "Description", ville: "Ville", rent: "Loyer", charges: "Charges", deposit: "Caution", surface: "Surface", rooms: "Pièces", capacity: "Capacité", minMonths: "Durée minimale", type: "Type", pays: "Pays" };

function validate(s: S) {
  const e: Record<string, string> = {};
  const int = (v: string) => /^\d+$/.test(v.trim());
  if (s.title.trim().length < 5) e.title = "Titre trop court (5 caractères minimum).";
  if (s.title.length > 120) e.title = "120 caractères maximum.";
  if (s.description.trim().length < 30) e.description = "Décrivez le logement (30 caractères minimum).";
  if (s.ville.trim().length < 2) e.ville = "Indiquez la ville.";
  if (!int(s.rent) || Number(s.rent) <= 0) e.rent = "Loyer mensuel requis (nombre entier).";
  if (!int(s.charges || "0")) e.charges = "Montant invalide.";
  if (!int(s.deposit || "0")) e.deposit = "Montant invalide.";
  else if (int(s.rent) && Number(s.deposit) > Number(s.rent) * 2) e.deposit = "Caution limitée à 2 mois de loyer (charte bailleur).";
  if (s.surface && (!int(s.surface) || +s.surface < 5 || +s.surface > 500)) e.surface = "Entre 5 et 500 m².";
  if (s.rooms && (!int(s.rooms) || +s.rooms < 1 || +s.rooms > 20)) e.rooms = "Entre 1 et 20.";
  if (!int(s.capacity) || +s.capacity < 1 || +s.capacity > 20) e.capacity = "Entre 1 et 20.";
  if (!int(s.minMonths) || +s.minMonths < 1 || +s.minMonths > 24) e.minMonths = "Entre 1 et 24 mois.";
  if (s.near.some((n) => !Number.isInteger(n.minutes) || n.minutes < 0 || n.minutes > 240)) e.near = "Temps de trajet entre 0 et 240 minutes.";
  return e;
}
const payload = (s: S) => ({
  title: s.title.trim(), type: s.type, description: s.description.trim(), pays: s.pays, ville: s.ville.trim(), quartier: s.quartier.trim() || undefined, address: s.address.trim() || undefined,
  rent: Number(s.rent), charges: Number(s.charges || 0), deposit: Number(s.deposit || 0), surface: s.surface ? Number(s.surface) : undefined, rooms: s.rooms ? Number(s.rooms) : undefined,
  capacity: Number(s.capacity), gender: s.gender, furnished: s.furnished, amenities: s.amenities, rules: s.rules.trim() || undefined, minMonths: Number(s.minMonths), availableFrom: s.availableFrom || undefined, nearEstablishments: s.near,
});

export function ListingForm({ id, info }: { id?: string; info: LandlordInfo | null }) {
  const { data, error, loading } = useApi<Housing>(id ? `/bailleur/logements/${id}` : null);
  if (id && loading) return <Loading label="Chargement de l'annonce…" />;
  if (id && (error || !data)) return <Alert tone="error" title="Annonce introuvable" action={<Link href="/bailleur/annonces" className="btn-ghost py-2 text-[13px]">Mes annonces</Link>}>{error?.message}</Alert>;
  return <Editor key={data?.id ?? "new"} initial={data} info={info} />;
}

function Editor({ initial, info }: { initial?: Housing; info: LandlordInfo | null }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState<S>(initial ? fromHousing(initial) : EMPTY);
  const [h, setH] = useState<Housing | undefined>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const set = <K extends keyof S>(k: K, v: S[K]) => { setS((x) => ({ ...x, [k]: v })); if (errors[k as string]) setErrors((e) => { const n = { ...e }; delete n[k as string]; return n; }); };
  const cur = CURRENCY_OF_COUNTRY[s.pays];
  const curLabel = cur === "MAD" ? "MAD" : "F CFA";
  const photos = h?.photos ?? [];

  const save = async (): Promise<Housing | null> => {
    const e = validate(s);
    setErrors(e); setFormErr(null);
    if (Object.keys(e).length) { setFormErr("Corrigez les champs signalés."); document.getElementById(Object.keys(e)[0] === "near" ? "ecoles" : "logement")?.scrollIntoView({ behavior: "smooth" }); return null; }
    try {
      const r = h ? await api<Housing>(`/bailleur/logements/${h.id}`, { method: "PATCH", body: payload(s) }) : await api<Housing>("/bailleur/logements", { body: payload(s) });
      setH(r); setSavedAt(new Date());
      return r;
    } catch (err) {
      if (err instanceof ApiError && err.fields?.length) setErrors(Object.fromEntries(err.fields.map((f) => [f.path.split(".")[0], `${FIELD_LABEL[f.path.split(".")[0]] ?? f.path} : ${f.message}`])));
      setFormErr(err instanceof Error ? err.message : "Enregistrement impossible.");
      return null;
    }
  };
  const onSave = async () => {
    setBusy("save");
    const wasNew = !h;
    const r = await save();
    setBusy(null);
    if (!r) return;
    toast(wasNew ? "Brouillon créé : ajoutez maintenant vos photos." : "Annonce enregistrée.");
    if (wasNew) { router.replace(`/bailleur/annonces/${r.id}/`); }
  };
  const onSubmit = async () => {
    setBusy("submit");
    const r = await save();
    if (!r) { setBusy(null); return; }
    try {
      await api(`/bailleur/logements/${r.id}/moderation`, { body: {} });
      toast("Annonce soumise à la modération : réponse sous 48 h.");
      router.push("/bailleur/annonces");
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : "Soumission impossible.");
      if (!h) router.replace(`/bailleur/annonces/${r.id}/`);
    } finally { setBusy(null); }
  };

  const schools = useMemo(() => etablissements.filter((e) => e.pays === s.pays).sort((a, b) => (b.ville.toLowerCase() === s.ville.trim().toLowerCase() ? 1 : 0) - (a.ville.toLowerCase() === s.ville.trim().toLowerCase() ? 1 : 0) || a.nom.localeCompare(b.nom)), [s.pays, s.ville]);
  const quality = [
    ["Titre et description", s.title.trim().length >= 5 && s.description.trim().length >= 120],
    [`${photos.length} photo${photos.length > 1 ? "s" : ""} (3 minimum, 8 recommandées)`, photos.length >= 3],
    ["Prix, charges et caution", !!s.rent],
    ["Équipements renseignés", s.amenities.length >= 3],
    ["Établissements proches", s.near.length > 0],
  ] as [string, boolean][];
  const score = Math.round((quality.filter((q) => q[1]).length / quality.length) * 100);
  const net = Number(s.rent || 0) + Number(s.charges || 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={h ? "Modifier l'annonce" : "Nouvelle annonce"} crumbs={[["Mes annonces", "/bailleur/annonces"], [h ? h.title : "Nouvelle annonce"]]}
        badge={h && <StatusBadge status={h.status} />} sub={h ? <span className="flex flex-wrap items-center gap-2">{savedAt ? `Enregistrée à ${savedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : `Mise à jour le ${new Date(h.updatedAt).toLocaleDateString("fr-FR")}`}<VerifBadge v={h.verification} /></span> : "Enregistrez un brouillon, ajoutez vos photos puis soumettez à la modération."} />
      {h?.status === "refuse" && h.moderationNote && <Alert tone="error" title="Annonce à corriger">{h.moderationNote}</Alert>}
      {h?.status === "publie" && <Alert tone="warn">Cette annonce est publiée : toute modification enregistrée la repasse en modération avant republication.</Alert>}
      {h?.status === "en_moderation" && <Alert tone="info" title="En cours de modération">{h.moderationNote ? `Note de contrôle : ${h.moderationNote}` : "Notre équipe vérifie l'annonce (48 h ouvrées)."}</Alert>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <form className="card flex min-w-0 flex-col gap-6 rounded-[24px] p-5 sm:p-7" onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate>
          <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#eef1f8] pb-2" aria-label="Sections">
            {SECTIONS.map(([k, l]) => <a key={k} href={`#${k}`} className="shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-ink-mute hover:bg-[#effbf3] hover:text-[#0f8a46]">{l}</a>)}
          </nav>

          <Section id="logement" n={1} title="Le logement">
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <Field label="Type" required>{(fid) => <Select id={fid} value={s.type} onChange={(e) => set("type", e.target.value)} options={TYPES} />}</Field>
              <Field label="Titre de l'annonce" required error={errors.title}>{(fid) => <Input id={fid} value={s.title} maxLength={120} onChange={(e) => set("title", e.target.value)} placeholder="Studio meublé lumineux · Maârif" />}</Field>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Surface (m²)" error={errors.surface}>{(fid) => <Input id={fid} type="number" min={5} max={500} value={s.surface} onChange={(e) => set("surface", e.target.value)} />}</Field>
              <Field label="Pièces" error={errors.rooms}>{(fid) => <Input id={fid} type="number" min={1} max={20} value={s.rooms} onChange={(e) => set("rooms", e.target.value)} />}</Field>
              <Field label="Capacité" required error={errors.capacity}>{(fid) => <Input id={fid} type="number" min={1} max={20} value={s.capacity} onChange={(e) => set("capacity", e.target.value)} />}</Field>
              <Field label="Public">{(fid) => <Select id={fid} value={s.gender} onChange={(e) => set("gender", e.target.value)} options={GENDERS} />}</Field>
            </div>
            <Field label="Description" required error={errors.description} hint={`${s.description.trim().length} caractères · décrivez l'état, l'étage, le quartier, les transports.`}>{(fid) => <Textarea id={fid} value={s.description} maxLength={5000} onChange={(e) => set("description", e.target.value)} className="min-h-[140px]" />}</Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Pays" required>{(fid) => <Select id={fid} value={s.pays} onChange={(e) => setS({ ...s, pays: e.target.value, near: [] })} options={PAYS} />}</Field>
              <Field label="Ville" required error={errors.ville}>{(fid) => <Input id={fid} value={s.ville} onChange={(e) => set("ville", e.target.value)} placeholder="Casablanca" />}</Field>
              <Field label="Quartier">{(fid) => <Input id={fid} value={s.quartier} onChange={(e) => set("quartier", e.target.value)} placeholder="Maârif" />}</Field>
            </div>
            <Field label="Adresse exacte (privée)" hint="Jamais affichée : seuls le quartier et une position approximative (~500 m) sont visibles avant le paiement en séquestre.">{(fid) => <Input id={fid} value={s.address} maxLength={200} onChange={(e) => set("address", e.target.value)} placeholder="14, rue Ibnou Mounir" />}</Field>
          </Section>

          <Section id="photos" n={2} title="Photos">
            {h ? <Photos h={h} onChange={(p) => setH({ ...h, photos: p })} /> : <p className="flex items-start gap-2 rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-mute"><Info size={16} className="mt-0.5 shrink-0" />Enregistrez d&apos;abord le brouillon pour pouvoir ajouter vos photos.</p>}
          </Section>

          <Section id="prix" n={3} title="Prix">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={`Loyer mensuel (${curLabel})`} required error={errors.rent}>{(fid) => <Input id={fid} type="number" min={1} inputMode="numeric" value={s.rent} onChange={(e) => set("rent", e.target.value)} />}</Field>
              <Field label={`Charges (${curLabel})`} error={errors.charges} hint="Eau, électricité, wifi…">{(fid) => <Input id={fid} type="number" min={0} inputMode="numeric" value={s.charges} onChange={(e) => set("charges", e.target.value)} />}</Field>
              <Field label={`Caution (${curLabel})`} error={errors.deposit} hint="Max. 2 mois · conservée en séquestre">{(fid) => <Input id={fid} type="number" min={0} inputMode="numeric" value={s.deposit} onChange={(e) => set("deposit", e.target.value)} />}</Field>
            </div>
            {net > 0 && <p className="flex items-start gap-2 rounded-2xl bg-[#effbf3] p-4 text-sm text-[#0b6b37]"><Info size={16} className="mt-0.5 shrink-0" /><span>Vous recevez <b>{money(net, cur)} / mois</b> (loyer + charges). Les frais de service Navilease ({SERVICE_FEE * 100} % du premier loyer, soit {money(Math.round(Number(s.rent || 0) * SERVICE_FEE), cur)}) sont payés par le locataire.</span></p>}
          </Section>

          <Section id="equipements" n={4} title="Équipements">
            <label className="flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" className="h-[18px] w-[18px] accent-[#0f8a46]" checked={s.furnished} onChange={(e) => set("furnished", e.target.checked)} />Logement meublé</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const on = s.amenities.includes(a.id);
                return <label key={a.id} className={`chip cursor-pointer border py-1.5 text-[13px] transition focus-within:ring-2 focus-within:ring-[#bfe9cf] ${on ? "border-[#bfe9cf] bg-[#e8f8ef] text-[#0f8a46]" : "border-slate-200 bg-white text-ink-soft hover:border-[#bfe9cf]"}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => set("amenities", on ? s.amenities.filter((x) => x !== a.id) : [...s.amenities, a.id])} />
                  {on ? <CheckCircle2 size={14} /> : <a.Icon size={14} />}{a.label}
                </label>;
              })}
            </div>
            <Field label="Règlement intérieur" hint="Une règle par ligne (non-fumeur, visites jusqu'à 21 h, préavis d'un mois…).">{(fid) => <Textarea id={fid} value={s.rules} maxLength={2000} onChange={(e) => set("rules", e.target.value)} />}</Field>
          </Section>

          <Section id="disponibilite" n={5} title="Disponibilité">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Disponible à partir du">{(fid) => <Input id={fid} type="date" value={s.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} />}</Field>
              <Field label="Durée minimale (mois)" required error={errors.minMonths} hint="10 mois = année universitaire">{(fid) => <Input id={fid} type="number" min={1} max={24} value={s.minMonths} onChange={(e) => set("minMonths", e.target.value)} />}</Field>
            </div>
          </Section>

          <Section id="ecoles" n={6} title="Établissements proches">
            <p className="-mt-2 text-sm text-ink-mute">Votre annonce apparaît aux élèves et étudiants de ces écoles. Indiquez le temps de trajet réel (10 maximum).</p>
            {errors.near && <span className="text-xs font-semibold text-[#d42a50]">{errors.near}</span>}
            <div className="grid max-h-[460px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {schools.map((e) => {
                const n = s.near.find((x) => x.id === e.id);
                return (
                  <div key={e.id} className={`flex flex-col gap-2 rounded-2xl border p-3 ${n ? "border-[#bfe9cf] bg-[#f6fdf8]" : "border-slate-200/70"}`}>
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <EtabLogo e={e} size={32} />
                      <span className="min-w-0 flex-1"><b className="block truncate text-sm">{e.sigle || e.nom}</b><span className="block truncate text-xs text-ink-mute">{e.ville}</span></span>
                      <input type="checkbox" className="h-[18px] w-[18px] accent-[#0f8a46]" checked={!!n} disabled={!n && s.near.length >= 10} aria-label={`${e.nom} à proximité`}
                        onChange={() => set("near", n ? s.near.filter((x) => x.id !== e.id) : [...s.near, { id: e.id, minutes: 15, mode: "pied" }])} />
                    </label>
                    {n && <div className="flex items-center gap-2">
                      <input type="number" min={0} max={240} aria-label={`Minutes jusqu'à ${e.nom}`} className="input w-20 px-2.5 py-2" value={n.minutes} onChange={(ev) => set("near", s.near.map((x) => (x.id === e.id ? { ...x, minutes: Math.round(Number(ev.target.value)) } : x)))} />
                      <span className="text-xs text-ink-mute">min</span>
                      <select aria-label={`Mode de trajet jusqu'à ${e.nom}`} className="input flex-1 px-2.5 py-2" value={n.mode} onChange={(ev) => set("near", s.near.map((x) => (x.id === e.id ? { ...x, mode: ev.target.value } : x)))}>{MODES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                    </div>}
                  </div>
                );
              })}
            </div>
          </Section>

          <FormError error={formErr} />
          <div className="flex flex-col-reverse gap-3 border-t border-[#eef1f8] pt-5 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <Button type="submit" variant="ghost" icon={Save} loading={busy === "save"}>{h ? "Enregistrer" : "Enregistrer le brouillon"}</Button>
              {h?.status === "publie" && <Link href={`/navilease/logements/${h.id}`} className="btn-ghost">Voir l&apos;annonce</Link>}
            </div>
            <Button type="button" icon={Send} loading={busy === "submit"} disabled={!h || photos.length < 3} onClick={onSubmit} className="bg-[#0f8a46] hover:bg-[#0b6b37]">Enregistrer et soumettre à la modération</Button>
          </div>
          {(!h || photos.length < 3) && <p className="-mt-3 text-right text-xs text-ink-mute">La soumission nécessite au moins 3 photos.</p>}
        </form>

        <aside className="flex flex-col gap-5">
          <Panel title="Vérification KYC" icon={ShieldCheck} tone="green" action={info && <KycChip status={info.kycStatus} />}>
            <p className="text-sm text-ink-mute">Obligatoire pour recevoir des versements. Une identité validée ajoute le badge « Identité vérifiée » à toutes vos annonces.</p>
            {info?.kycStatus !== "valide" && <Link href="/bailleur/profil" className="btn-ghost py-2.5 text-[13px]">{info?.kycStatus === "en_revue" ? "Voir ma vérification" : "Vérifier mon identité"}</Link>}
          </Panel>
          <Panel title="Qualité de l'annonce">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="#e8f8ef" strokeWidth="4" /><circle cx="18" cy="18" r="15.5" fill="none" stroke="#0f8a46" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(score / 100) * 97.4} 97.4`} className="transition-all duration-700" /></svg>
                <b className="absolute inset-0 flex items-center justify-center text-sm">{score} %</b>
              </div>
              <ul className="flex flex-col gap-1.5 text-[13px]">{quality.map(([l, ok]) => <li key={l} className="flex items-center gap-2">{ok ? <CheckCircle2 size={15} className="shrink-0 text-[#0f8a46]" /> : <Circle size={15} className="shrink-0 text-sun-500" />}<span className={ok ? "" : "text-ink-mute"}>{l}</span></li>)}</ul>
            </div>
          </Panel>
          <Panel title="Charte bailleur" icon={ShieldCheck}>
            <p className="text-sm text-ink-mute">Pas de paiement hors plateforme, annonce conforme à la réalité, caution ≤ 2 mois, logement décent. Tout manquement entraîne la suspension du compte.</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4">
      <h2 className="flex items-center gap-3 text-lg font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f8ef] text-sm text-[#0f8a46]">{n}</span>{title}</h2>
      {children}
    </section>
  );
}

function Photos({ h, onChange }: { h: Housing; onChange: (p: string[]) => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [removing, setRemoving] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const upload = async (files: FileList | File[]) => {
    setErr(null);
    let list = [...h.photos];
    for (const f of Array.from(files)) {
      setBusy((b) => b + 1);
      const fd = new FormData(); fd.append("fichier", f);
      try { const r = await api<{ key: string }>(`/bailleur/logements/${h.id}/photos`, { form: fd }); list = [...list, r.key]; onChange(list); }
      catch (e) { setErr(`${f.name} : ${e instanceof Error ? e.message : "échec de l'envoi."}`); }
      finally { setBusy((b) => b - 1); }
    }
    if (input.current) input.current.value = "";
  };
  const remove = async (key: string) => {
    setRemoving(key);
    try { await api(`/bailleur/logements/${h.id}/photos?cle=${encodeURIComponent(key)}`, { method: "DELETE" }); onChange(h.photos.filter((p) => p !== key)); toast("Photo retirée."); }
    catch (e) { setErr(e instanceof Error ? e.message : "Suppression impossible."); } finally { setRemoving(null); }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {h.photos.map((k, i) => (
          <div key={k} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#eef1f8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(k)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && <Chip tone="grey" className="absolute bottom-2 left-2 bg-white/95">Couverture</Chip>}
            <button type="button" onClick={() => remove(k)} disabled={removing === k} aria-label={`Retirer la photo ${i + 1}`} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-[#d42a50] shadow-sm hover:bg-white">
              {removing === k ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            </button>
          </div>
        ))}
        {h.photos.length < 15 && (
          <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#bfe9cf] bg-[#f6fdf8] text-sm font-bold text-[#0f8a46] hover:border-[#0f8a46]">
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}{busy ? "Envoi…" : "Ajouter"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
      {err && <span className="text-xs font-semibold text-[#d42a50]" role="alert">{err}</span>}
      <p className="text-xs text-ink-mute">{h.photos.length} / 15 · 3 photos minimum, 8 recommandées · JPG, PNG ou WebP, 8 Mo max. · pas de visage ni de document visible. La première photo sert de couverture.</p>
    </div>
  );
}
