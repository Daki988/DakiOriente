"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Building2, CalendarDays, CheckCircle2, Circle, ExternalLink, Globe, Mail, MapPin, Phone, Save } from "lucide-react";
import { useState } from "react";
import { Alert, Button, Chip, PageHeader, Panel, useToast } from "@/components/app/kit";
import { Field, FormError, Input, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { STATUT_LONG } from "@/lib/data";
import { useEcole } from "./EcoleContext";
import { ETAB_STATUS, PAYS_LABEL, type Etab } from "./shared";

type F = { description: string; siteWeb: string; email: string; phone: string; ville: string; anneeCreation: string };
const toF = (e: Etab): F => ({ description: e.description ?? "", siteWeb: e.siteWeb ?? "", email: e.email ?? "", phone: e.phone ?? "", ville: e.ville ?? "", anneeCreation: e.anneeCreation ? String(e.anneeCreation) : "" });

function validate(f: F) {
  const e: Partial<Record<keyof F, string>> = {};
  if (f.siteWeb && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(f.siteWeb.trim())) e.siteWeb = "Adresse complète attendue, ex. https://www.monecole.ma";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "E-mail invalide.";
  if (f.phone && !/^\+?[\d\s.-]{6,30}$/.test(f.phone.trim())) e.phone = "Numéro invalide.";
  const y = Number(f.anneeCreation);
  if (f.anneeCreation && (!Number.isInteger(y) || y < 1800 || y > new Date().getFullYear())) e.anneeCreation = "Année invalide.";
  if (!f.ville.trim()) e.ville = "Ville requise.";
  return e;
}

export function Fiche() {
  const { eid, etab, setEtab } = useEcole();
  const toast = useToast();
  const pub = useApi<Etab>(`/etablissements/${eid}`);
  const [f, setF] = useState<F>(() => toF(etab));
  const [errs, setErrs] = useState<Partial<Record<keyof F, string>>>({});
  const act = useAction();
  const set = (k: keyof F, v: string) => { setF((x) => ({ ...x, [k]: v })); setErrs((e) => ({ ...e, [k]: undefined })); };
  const dirty = JSON.stringify(f) !== JSON.stringify(toF(etab));
  const e = pub.data ?? etab;
  const st = ETAB_STATUS[etab.status];

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const v = validate(f);
    setErrs(v);
    if (Object.keys(v).length) { act.setError("Vérifiez les champs signalés."); return; }
    const body = { description: f.description.trim(), siteWeb: f.siteWeb.trim(), email: f.email.trim(), phone: f.phone.trim(), ville: f.ville.trim(), anneeCreation: f.anneeCreation ? Number(f.anneeCreation) : undefined };
    const u = await act.run(() => api<Etab>(`/ecole/${eid}`, { method: "PATCH", body }));
    if (u) { setEtab(u); setF(toF(u)); pub.setData(u); toast("Fiche mise à jour."); }
  };

  const steps: [string, string, boolean][] = [
    ["Fiche revendiquée", "Un compte établissement gère la fiche.", etab.status !== "importe"],
    ["Informations complétées", "Description, contacts et site web renseignés.", !!(etab.description && (etab.email || etab.phone) && etab.siteWeb)],
    ["Vérification Navigoal", "Agrément et représentant légal contrôlés.", etab.status === "verifie"],
  ];

  return (
    <>
      <PageHeader title="Fiche établissement" sub="Soignez votre vitrine : ces informations sont affichées aux élèves, étudiants et parents."
        badge={<Chip tone={st.tone}>{etab.status === "verifie" && <BadgeCheck size={13} />}{st.label}</Chip>}
        actions={<Link href={`/etablissements/${eid}`} target="_blank" className="btn-ghost"><ExternalLink size={17} />Voir la page publique</Link>} />

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_380px] [&>*]:min-w-0">
        <form onSubmit={submit} noValidate className="card flex flex-col gap-5 rounded-[22px] p-5 sm:p-7">
          <div className="flex items-center gap-4">
            <Logo e={e} size={64} />
            <div className="min-w-0"><b className="block text-lg leading-snug">{etab.nom}</b><span className="text-sm text-ink-mute">{etab.typeLibelle} · {STATUT_LONG[etab.statut] ?? etab.statut} · {PAYS_LABEL[etab.pays] ?? etab.pays}</span></div>
          </div>
          <Alert tone="info">Le nom officiel, le logo et les photos sont gérés par l&apos;équipe Navigoal : écrivez à etablissements@navigoal.com pour les modifier.</Alert>
          <Field label="Description" hint={`${f.description.length} / 4000 caractères`}>
            {(id) => <Textarea id={id} value={f.description} onChange={(ev) => set("description", ev.target.value)} maxLength={4000} className="min-h-[160px]" placeholder="Histoire, pédagogie, accréditations, vie étudiante, partenariats internationaux…" />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail admissions" error={errs.email}>{(id) => <IconInput icon={Mail}><Input id={id} type="email" value={f.email} onChange={(ev) => set("email", ev.target.value)} className="pl-11" placeholder="admissions@monecole.ma" aria-invalid={!!errs.email} /></IconInput>}</Field>
            <Field label="Téléphone" error={errs.phone}>{(id) => <IconInput icon={Phone}><Input id={id} type="tel" value={f.phone} onChange={(ev) => set("phone", ev.target.value)} className="pl-11" placeholder="+212 5 22 00 00 00" aria-invalid={!!errs.phone} /></IconInput>}</Field>
            <Field label="Site web" error={errs.siteWeb}>{(id) => <IconInput icon={Globe}><Input id={id} type="url" value={f.siteWeb} onChange={(ev) => set("siteWeb", ev.target.value)} className="pl-11" placeholder="https://" aria-invalid={!!errs.siteWeb} /></IconInput>}</Field>
            <div className="grid grid-cols-[1fr_120px] gap-4">
              <Field label="Ville" required error={errs.ville}>{(id) => <IconInput icon={MapPin}><Input id={id} value={f.ville} onChange={(ev) => set("ville", ev.target.value)} className="pl-11" maxLength={120} aria-invalid={!!errs.ville} /></IconInput>}</Field>
              <Field label="Création" error={errs.anneeCreation}>{(id) => <Input id={id} inputMode="numeric" value={f.anneeCreation} onChange={(ev) => set("anneeCreation", ev.target.value)} maxLength={4} aria-invalid={!!errs.anneeCreation} />}</Field>
            </div>
          </div>
          <FormError error={act.error} />
          <div className="flex flex-col gap-3 border-t border-[#eef1f8] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-ink-mute">{etab.status === "importe" ? "Votre première modification revendique la fiche ; l'équipe Navigoal la vérifie ensuite." : "Les modifications sont publiées immédiatement."}</span>
            <div className="flex gap-2">
              {dirty && <Button type="button" variant="quiet" onClick={() => { setF(toF(etab)); setErrs({}); act.setError(null); }}>Annuler</Button>}
              <Button type="submit" icon={Save} loading={act.pending} disabled={!dirty} className="!bg-[#6a3df0] hover:!bg-[#5a2fe0]">Enregistrer</Button>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-mute">Aperçu en direct · carte côté candidat</span>
            <motion.article layout className="card overflow-hidden rounded-[22px]">
              <div className="relative h-40 bg-gradient-to-br from-brand-600 to-brand-300">
                {e.photos[0]
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={e.photos[0].src} alt={`${e.nom} — photo`} className="h-full w-full object-cover" />
                  : <Building2 size={56} strokeWidth={1.4} className="absolute inset-0 m-auto text-white/60" />}
                {etab.status === "verifie" && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#0f8a46]"><BadgeCheck size={13} />Vérifié</span>}
              </div>
              <div className="flex flex-col gap-3 p-5">
                <div className="relative -mt-12 flex items-end gap-3"><Logo e={e} size={60} className="shadow-card" /></div>
                <div><b className="block leading-snug">{etab.nom}</b><span className="flex items-center gap-1 text-xs text-ink-mute"><MapPin size={12} />{f.ville || "—"} · {PAYS_LABEL[etab.pays] ?? etab.pays}{f.anneeCreation && <> · <CalendarDays size={12} />depuis {f.anneeCreation}</>}</span></div>
                <p className="line-clamp-4 text-sm text-ink-soft">{f.description || <span className="italic text-ink-mute">Ajoutez une description pour présenter votre établissement.</span>}</p>
                <div className="flex flex-col gap-1.5 text-xs text-ink-soft">
                  {f.siteWeb && <span className="flex items-center gap-2 truncate"><Globe size={13} />{f.siteWeb.replace(/^https?:\/\//, "")}</span>}
                  {f.email && <span className="flex items-center gap-2 truncate"><Mail size={13} />{f.email}</span>}
                  {f.phone && <span className="flex items-center gap-2"><Phone size={13} />{f.phone}</span>}
                </div>
              </div>
            </motion.article>
            {e.photos.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {e.photos.slice(0, 3).map((p, i) => <img key={p.src} src={p.src} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full rounded-xl object-cover" />)}
              </div>
            )}
          </div>

          <Panel title="Statut de vérification" action={<Chip tone={st.tone}>{st.label}</Chip>}>
            <p className="text-sm text-ink-mute">{st.text}</p>
            <ul className="flex flex-col gap-3">
              {steps.map(([t, d, ok]) => (
                <li key={t} className="flex gap-3">{ok ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#0f8a46]" /> : <Circle size={19} className="mt-0.5 shrink-0 text-slate-300" />}<span className="flex flex-col"><b className="text-sm">{t}</b><span className="text-xs text-ink-mute">{d}</span></span></li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Logo({ e, size, className = "" }: { e: Pick<Etab, "logo" | "sigle" | "nom">; size: number; className?: string }) {
  if (e.logo)
    // eslint-disable-next-line @next/next/no-img-element
    return <span className={`flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 ${className}`} style={{ width: size, height: size }}><img src={e.logo} alt={`Logo ${e.nom}`} className="max-h-full max-w-full object-contain" /></span>;
  return <span className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 font-extrabold text-white ${className}`} style={{ width: size, height: size, fontSize: size * 0.27 }}>{e.sigle.slice(0, 5)}</span>;
}

function IconInput({ icon: I, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return <div className="relative"><I size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" />{children}</div>;
}
