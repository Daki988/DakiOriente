"use client";
import Link from "@/components/ui/Link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Check as CheckIcon, GraduationCap, Info, KeyRound, School, ShieldCheck, Sparkles, UsersRound, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Tabs } from "@/components/app/kit";
import { Check, Field, FormError, Input, PasswordInput, Select } from "@/components/app/form";
import { api, ApiError } from "@/lib/api";
import { etablissements, series, villesOf } from "@/lib/data";
import { PAYS_OPTIONS, paysOrigineById } from "@/lib/pays-origine";
import { useAction } from "@/hooks/useApi";
import { DEV_CODE_KEY } from "./Otp";
import { PhoneInput, composePhone, defaultCountry } from "./inputs";
import { GoogleButton, MESSAGES_GOOGLE } from "./Google";

type Role = "eleve" | "etudiant" | "parent" | "etablissement" | "bailleur";
const ROLES: { id: Role; I: LucideIcon; t: string; s: string; pts: string[]; bg: string; fg: string }[] = [
  { id: "eleve", I: School, t: "Élève", s: "Collège ou lycée", pts: ["Test d'orientation", "Choisir ma série", "Préparer mes études au Maroc"], bg: "bg-brand-50", fg: "text-brand-600" },
  { id: "etudiant", I: GraduationCap, t: "Étudiant·e", s: "Bachelier ou en études supérieures", pts: [`Candidater dans ${etablissements.length} établissements`, "Suivre mes dossiers", "Logement Navilease"], bg: "bg-[#f1edff]", fg: "text-[#6a3df0]" },
  { id: "parent", I: UsersRound, t: "Parent / tuteur", s: "J'accompagne mon enfant", pts: ["Suivre ses candidatures", "Devis et paiements", "Garant du logement"], bg: "bg-sun-100", fg: "text-[#a55a00]" },
  { id: "etablissement", I: Building2, t: "Établissement", s: "École, université, institut", pts: ["Recevoir des candidatures", "Gérer mes formations", "Statistiques"], bg: "bg-[#e8f8ef]", fg: "text-[#0f8a46]" },
  { id: "bailleur", I: KeyRound, t: "Bailleur Navilease", s: "Je loue à des étudiants", pts: ["Publier mes logements", "Paiement en séquestre", "Contrats & quittances"], bg: "bg-[#ffecef]", fg: "text-[#d42a50]" },
];
const LEVELS: [string, string][] = [["3e", "3e / fin de collège"], ["2nde", "Seconde"], ["1re", "Première"], ["terminale", "Terminale"], ["bachelier", "Bachelier·ère"], ["bac+1", "Bac+1"], ["bac+2", "Bac+2"], ["bac+3", "Bac+3"], ["bac+4", "Bac+4 / 5"]];
const ETABS: [string, string][] = etablissements.slice().sort((x, y) => x.nom.localeCompare(y.nom, "fr")).map((e) => [e.id, `${e.nom}${e.sigle && e.sigle !== e.nom ? ` (${e.sigle})` : ""} · ${villesOf(e).join(", ")}`]);

export function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="hidden items-center gap-3 md:flex" aria-label="Étapes de l'inscription">
      {["Profil", "Informations", "Vérification"].map((t, i) => {
        const n = i + 1, done = n < step, on = n === step;
        return (
          <li key={t} className="flex items-center gap-3" aria-current={on ? "step" : undefined}>
            {i > 0 && <span className={`h-0.5 w-12 lg:w-20 ${done || on ? "bg-[#0f8a46]" : "bg-[#dbe3f7]"}`} />}
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-[#0f8a46] text-white" : on ? "bg-brand-600 text-white ring-4 ring-brand-100" : "border-2 border-[#dbe3f7] text-ink-mute"}`}>{done ? <CheckIcon size={16} /> : n}</span>
            <span className={`text-sm font-bold ${on ? "" : "text-ink-mute"}`}>{t}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Étapes compactes pour mobile. */
const MobileSteps = ({ step }: { step: 1 | 2 }) => (
  <div className="flex items-center gap-2 md:hidden" aria-hidden>
    {[1, 2, 3].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-brand-600" : "bg-[#dbe3f7]"}`} />)}
  </div>
);

export function Signup() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = ROLES.some((r) => r.id === params.get("profil")) ? (params.get("profil") as Role) : null;
  const [step, setStep] = useState<1 | 2>(initialRole ? 2 : 1);
  const [role, setRole] = useState<Role>(initialRole ?? "etudiant");
  const [via, setVia] = useState<"email" | "phone">("email");
  const [f, setF] = useState({ firstName: "", lastName: "", birthYear: "", country: "", city: "", level: "", serie: "", currentSchool: "", email: "", phone: "", phoneCountry: "MA", password: "", password2: "", establishmentId: "", company: "", guardianEmail: "", guardianPhone: "", guardianVia: "phone", guardianCountry: "MA", terms: false });
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  const a = useAction();
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  useEffect(() => { const c = defaultCountry(); setF((x) => ({ ...x, phoneCountry: c, guardianCountry: c })); }, []);
  const age = f.birthYear ? new Date().getFullYear() - Number(f.birthYear) : null;
  const isStudent = role === "eleve" || role === "etudiant";
  const minor = isStudent && age !== null && age < 18;
  const R = ROLES.find((r) => r.id === role)!;
  const googleNotice = params.get("google") === "nouveau"
    ? { tone: "info" as const, t: `Aucun compte Navigoal n'est encore associé à ${params.get("email") ?? "ce compte Google"}. Choisis ton profil, puis « S'inscrire avec Google » : ton compte est créé en un clic.` }
    : MESSAGES_GOOGLE[params.get("google") ?? ""] ?? null;
  // Séries détaillées pour les pays du référentiel ; saisie libre pour les autres pays d'origine
  const seriesPays = useMemo(() => series.filter((s) => s.pays === f.country), [f.country]);
  const pwScore = [f.password.length >= 8, /\d/.test(f.password), /[A-Za-z]/.test(f.password), f.password.length >= 12].filter(Boolean).length;
  const pays = f.country ? paysOrigineById[f.country] : null;

  const check = () => {
    const e: Record<string, string> = {};
    if (!f.firstName.trim()) e.firstName = "Prénom requis.";
    if (!f.lastName.trim()) e.lastName = "Nom requis.";
    if (isStudent && !f.birthYear) e.birthYear = "Année de naissance requise.";
    if (isStudent && age !== null && (age < 8 || age > 90)) e.birthYear = "Année de naissance invalide.";
    if (role === "etablissement" && !f.establishmentId) e.establishmentId = "Choisissez votre établissement.";
    if (via === "email" && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Adresse e-mail invalide.";
    if (via === "phone" && f.phone.replace(/\D/g, "").length < 6) e.phone = "Numéro de téléphone invalide.";
    if (f.password.length < 8 || !/\d/.test(f.password) || !/[A-Za-z]/.test(f.password)) e.password = "8 caractères minimum, avec au moins une lettre et un chiffre.";
    if (f.password2 !== f.password) e.password2 = "Les deux mots de passe ne correspondent pas.";
    if (minor && (f.guardianVia === "email" ? !/^\S+@\S+\.\S+$/.test(f.guardianEmail.trim()) : f.guardianPhone.replace(/\D/g, "").length < 6)) e.guardian = "Indique le contact de ton parent ou tuteur.";
    if (!f.terms) e.terms = "Tu dois accepter les conditions d'utilisation.";
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = check();
    setFieldErr(e);
    if (Object.keys(e).length) { a.setError("Vérifie les champs signalés en rouge."); document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    a.run(async () => {
      try {
        const phone = via === "phone" ? composePhone(f.phoneCountry, f.phone) : "";
        const body = {
          role, firstName: f.firstName.trim(), lastName: f.lastName.trim(), password: f.password, acceptTerms: f.terms,
          email: via === "email" ? f.email.trim() : "", phone,
          birthYear: isStudent && f.birthYear ? Number(f.birthYear) : undefined, country: f.country || undefined, city: f.city.trim() || undefined,
          level: f.level || undefined, serie: f.serie || undefined, currentSchool: f.currentSchool || undefined,
          establishmentId: f.establishmentId || undefined, company: f.company || undefined,
          guardianEmail: minor && f.guardianVia === "email" ? f.guardianEmail.trim() : "", guardianPhone: minor && f.guardianVia === "phone" ? composePhone(f.guardianCountry, f.guardianPhone) : "",
        };
        const r = await api<{ devCode?: string }>("/auth/inscription", { body });
        try { if (r.devCode) sessionStorage.setItem(DEV_CODE_KEY, r.devCode); } catch { /* stockage indisponible */ }
        const cible = via === "email" ? f.email.trim() : phone;
        router.replace(`/verification/?cible=${encodeURIComponent(cible)}&objet=${via === "email" ? "verify_email" : "verify_phone"}`);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError && err.fields) setFieldErr(Object.fromEntries(err.fields.map((x) => [x.path, x.message])));
        throw err;
      }
    });
  };
  const err = (k: string) => fieldErr[k] ?? null;

  if (step === 1)
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <MobileSteps step={1} />
        <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
          <span className="chip bg-brand-50 text-brand-700">Étape 1 sur 3 · Ton profil</span>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-4xl">Qui es-tu ?</h1>
          <p className="max-w-xl text-ink-soft">Choisis ton profil : Navigoal adapte ton espace, tes outils et ce que tu vois.</p>
        </div>
        {googleNotice && <Alert tone={googleNotice.tone}>{googleNotice.t}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5" role="radiogroup" aria-label="Profil">
          {ROLES.map((r) => {
            const on = r.id === role;
            return (
              <motion.button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => setRole(r.id)} onDoubleClick={() => { setRole(r.id); setStep(2); }} whileTap={{ scale: 0.98 }}
                className={`card relative flex items-center gap-4 rounded-3xl p-4 text-left transition sm:flex-col sm:items-stretch sm:gap-3 sm:p-5 ${on ? "border-2 border-brand-600 shadow-[0_24px_50px_-24px_rgba(26,71,245,.55)]" : "hover:border-brand-200"}`}>
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-24 sm:w-auto ${r.bg} ${r.fg}`}><r.I size={30} strokeWidth={1.6} className="sm:hidden" /><r.I size={44} strokeWidth={1.6} className="hidden sm:block" /></span>
                {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white sm:right-7 sm:top-7"><CheckIcon size={16} /></motion.span>}
                <span className="min-w-0 pr-8 sm:pr-0"><b className="block text-[17px] sm:text-lg">{r.t}</b><span className="text-[13px] text-ink-mute">{r.s}</span></span>
                <span className="hidden flex-col gap-1.5 sm:flex">{r.pts.map((p) => <span key={p} className="flex items-center gap-2 text-[13px] text-ink-soft"><CheckIcon size={14} className={`shrink-0 ${r.fg}`} />{p}</span>)}</span>
              </motion.button>
            );
          })}
        </div>
        {(role === "etablissement" || role === "bailleur") && <div className="card flex items-start gap-3 rounded-2xl p-4 text-sm"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand-600" /><span><b>Vérification manuelle.</b> {role === "etablissement" ? "Votre compte est activé après vérification de votre rattachement à l'établissement par l'équipe Navigoal" : "Vos annonces sont publiées après vérification de votre identité et de votre titre de propriété (ou mandat) par l'équipe Navigoal"}, sous 48 h ouvrées.</span></div>}
        <div className="sticky bottom-0 -mx-4 flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 bg-[#f6f8fe]/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:border-0 sm:bg-transparent sm:p-0">
          <span className="hidden items-center gap-2 text-sm text-ink-mute sm:flex"><Info size={16} />Tu as moins de 18 ans ? Ton parent ou tuteur validera ton inscription.</span>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
            {role !== "etablissement" && <div className="sm:w-[260px]"><GoogleButton profil={role} suite={params.get("suite")} label="S'inscrire avec Google" separateur={false} /></div>}
            <Button onClick={() => setStep(2)} className="min-h-[48px] w-full sm:w-auto">Continuer en tant que {R.t.toLowerCase()} <ArrowRight size={18} /></Button>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <MobileSteps step={2} />
      <form onSubmit={submit} className="mt-4 grid items-start gap-6 md:mt-0 lg:grid-cols-[1fr_340px]" noValidate>
        <div className="card flex flex-col gap-6 rounded-3xl p-4 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div><span className="chip bg-brand-50 text-brand-700">Étape 2 sur 3 · Tes informations</span><h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-[28px]">Faisons connaissance{f.firstName ? `, ${f.firstName}` : ""}</h1></div>
            <button type="button" onClick={() => setStep(1)} className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs font-bold lg:hidden ${R.bg} ${R.fg}`}><R.I size={16} />{R.t}<span className="underline">Modifier</span></button>
          </div>
          <Section n={1} t={role === "etablissement" ? "Responsable du compte" : "Identité"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" required error={err("firstName")}>{(i) => <Input id={i} value={f.firstName} onChange={(e) => set("firstName")(e.target.value)} autoComplete="given-name" required aria-invalid={!!err("firstName") || undefined} className="text-[15px] sm:text-sm" />}</Field>
              <Field label="Nom" required error={err("lastName")}>{(i) => <Input id={i} value={f.lastName} onChange={(e) => set("lastName")(e.target.value)} autoComplete="family-name" required aria-invalid={!!err("lastName") || undefined} className="text-[15px] sm:text-sm" />}</Field>
              {isStudent && <Field label="Année de naissance" required error={err("birthYear")} hint={age !== null ? `${age} ans${minor ? " · compte mineur : accord parental requis" : ""}` : undefined}>{(i) => <Input id={i} type="number" inputMode="numeric" min={1940} max={new Date().getFullYear() - 8} value={f.birthYear} onChange={(e) => set("birthYear")(e.target.value)} required aria-invalid={!!err("birthYear") || undefined} placeholder="Ex. 2007" className="text-[15px] sm:text-sm" />}</Field>}
              {role === "bailleur" && <Field label="Société ou résidence (facultatif)">{(i) => <Input id={i} value={f.company} onChange={(e) => set("company")(e.target.value)} className="text-[15px] sm:text-sm" />}</Field>}
            </div>
          </Section>
          {role === "etablissement" ? (
            <Section n={2} t="Votre établissement">
              <Field label="Établissement représenté" required error={err("establishmentId")} hint="Établissements privés du référentiel Navigoal. Réseau multi-campus : un seul compte pour tous les campus.">{(i) => <Select id={i} value={f.establishmentId} onChange={(e) => set("establishmentId")(e.target.value)} required placeholder="Choisir…" options={ETABS} aria-invalid={!!err("establishmentId") || undefined} />}</Field>
            </Section>
          ) : (
            <Section n={2} t={isStudent ? "D'où viens-tu ?" : "Où habitez-vous ?"}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={isStudent ? "Pays d'origine" : "Pays de résidence"} error={err("country")} hint={pays ? `Indicatif ${pays.indicatif} · devise ${pays.devise}` : "Les montants seront convertis dans ta devise."}>{(i) => <Select id={i} value={f.country} onChange={(e) => { const c = e.target.value; setF((x) => ({ ...x, country: c, serie: "", phoneCountry: c || x.phoneCountry, guardianCountry: c || x.guardianCountry })); }} placeholder="Choisir…" options={PAYS_OPTIONS.map((o) => [o.value, o.label, o.group])} />}</Field>
                <Field label="Ville">{(i) => <Input id={i} value={f.city} onChange={(e) => set("city")(e.target.value)} autoComplete="address-level2" maxLength={80} className="text-[15px] sm:text-sm" />}</Field>
              </div>
            </Section>
          )}
          {isStudent && (
            <Section n={3} t="Ta scolarité">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Niveau actuel">{(i) => <Select id={i} value={f.level} onChange={(e) => set("level")(e.target.value)} placeholder="Choisir…" options={LEVELS} />}</Field>
                {seriesPays.length > 0
                  ? <Field label="Série du bac">{(i) => <Select id={i} value={f.serie} onChange={(e) => set("serie")(e.target.value)} placeholder="Choisir…" options={seriesPays.map((s) => [s.id, `${s.code} — ${s.intitule}`])} />}</Field>
                  : <Field label="Série / spécialité du bac" hint={f.country ? undefined : "Choisis d'abord ton pays."}>{(i) => <Input id={i} value={f.serie} onChange={(e) => set("serie")(e.target.value)} disabled={!f.country} placeholder="Ex. scientifique, économique, littéraire" maxLength={40} className="text-[15px] sm:text-sm" />}</Field>}
                <Field label="Établissement actuel" className="sm:col-span-2">{(i) => <Input id={i} value={f.currentSchool} onChange={(e) => set("currentSchool")(e.target.value)} placeholder="Nom de ton lycée ou de ton université" maxLength={160} className="text-[15px] sm:text-sm" />}</Field>
              </div>
            </Section>
          )}
          <Section n={isStudent ? 4 : 3} t="Identifiants de connexion">
            <Tabs value={via} onChange={(v) => { setVia(v); setFieldErr((x) => ({ ...x, email: "", phone: "" })); }} items={[["email", "E-mail"], ["phone", "Téléphone"]]} />
            <div className="grid gap-4 sm:grid-cols-2">
              {via === "email"
                ? <Field label="Adresse e-mail" required error={err("email")} className="sm:col-span-2">{(i) => <Input id={i} type="email" inputMode="email" value={f.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" required aria-invalid={!!err("email") || undefined} placeholder="prenom.nom@email.com" className="text-[15px] sm:text-sm" />}</Field>
                : <Field label="Numéro de téléphone" required error={err("phone")} hint="Choisis l'indicatif puis saisis ton numéro (code de vérification par SMS)." className="sm:col-span-2">{(i) => <PhoneInput id={i} country={f.phoneCountry} onCountry={set("phoneCountry") as (v: string) => void} value={f.phone} onChange={set("phone") as (v: string) => void} required invalid={!!err("phone")} />}</Field>}
              <Field label="Mot de passe" required error={err("password")} hint={f.password ? ["Trop court", "Faible", "Moyen", "Bon mot de passe", "Excellent"][pwScore] : "8 caractères minimum, une lettre et un chiffre"}>
                {(i) => <><PasswordInput id={i} value={f.password} onChange={(e) => set("password")(e.target.value)} autoComplete="new-password" required minLength={8} aria-invalid={!!err("password") || undefined} className="text-[15px] sm:text-sm" />
                  <div className="mt-1 flex gap-1" aria-hidden>{[0, 1, 2, 3].map((k) => <span key={k} className={`h-1 flex-1 rounded-full ${k < pwScore ? (pwScore >= 3 ? "bg-[#0f8a46]" : "bg-sun-500") : "bg-[#e8edfa]"}`} />)}</div></>}
              </Field>
              <Field label="Confirme le mot de passe" required error={err("password2") || (f.password2 && f.password2 !== f.password ? "Les deux mots de passe ne correspondent pas." : null)}>{(i) => <PasswordInput id={i} value={f.password2} onChange={(e) => set("password2")(e.target.value)} autoComplete="new-password" required aria-invalid={!!err("password2") || undefined} className="text-[15px] sm:text-sm" />}</Field>
            </div>
          </Section>
          {minor && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
              <div className="flex flex-col gap-3 rounded-2xl border border-[#f6dd9a] bg-[#fff7dd] p-4 sm:p-5">
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sun-400"><UsersRound size={19} /></span><span><b className="block">Ton parent ou tuteur</b><span className="text-xs text-ink-mute">Obligatoire car tu as moins de 18 ans</span></span></div>
                <Tabs value={f.guardianVia as "phone" | "email"} onChange={set("guardianVia") as (v: "phone" | "email") => void} items={[["phone", "Téléphone"], ["email", "E-mail"]]} />
                {f.guardianVia === "email"
                  ? <Field label="E-mail de ton parent" required error={err("guardian") || err("guardianEmail")}>{(i) => <Input id={i} type="email" value={f.guardianEmail} onChange={(e) => set("guardianEmail")(e.target.value)} placeholder="parent@email.com" aria-invalid={!!err("guardian") || undefined} className="text-[15px] sm:text-sm" />}</Field>
                  : <Field label="Téléphone de ton parent" required error={err("guardian") || err("guardianPhone")}>{(i) => <PhoneInput id={i} country={f.guardianCountry} onCountry={set("guardianCountry") as (v: string) => void} value={f.guardianPhone} onChange={set("guardianPhone") as (v: string) => void} invalid={!!err("guardian")} />}</Field>}
                <p className="text-xs text-[#8a4b00]">Il recevra un code pour valider ton inscription. En attendant, tu peux explorer Navigoal ; les candidatures et paiements seront activés après son consentement.</p>
              </div>
            </motion.div>
          )}
          <div className="flex flex-col gap-1">
            <Check checked={f.terms} onChange={set("terms") as (v: boolean) => void}>J&apos;accepte les <Link href="/cgu" target="_blank" className="font-bold text-brand-600">conditions générales d&apos;utilisation</Link> et la <Link href="/confidentialite" target="_blank" className="font-bold text-brand-600">politique de confidentialité</Link> de Navigoal.</Check>
            {err("terms") || err("acceptTerms") ? <span className="pl-7 text-xs font-semibold text-[#d42a50]">{err("terms") || err("acceptTerms")}</span> : null}
          </div>
          <FormError error={a.error} />
          <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="min-h-[48px]"><ArrowLeft size={18} />Retour</Button>
            <Button loading={a.pending} className="min-h-[48px]">Créer mon compte <ArrowRight size={18} /></Button>
          </div>
        </div>
        <aside className="flex flex-col gap-4">
          <div className="card hidden items-center gap-3 rounded-3xl p-5 lg:flex"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${R.bg} ${R.fg}`}><R.I size={22} /></span><span className="flex-1"><span className="block text-xs font-bold text-ink-mute">PROFIL CHOISI</span><b>{R.t}</b></span><button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-brand-600">Modifier</button></div>
          <div className="card flex flex-col gap-3 rounded-3xl p-5 text-[13px] text-ink-soft"><b className="text-base text-ink">Pourquoi ces informations ?</b>
            {isStudent && <span>Ta série et ton niveau filtrent les formations auxquelles tu peux candidater au Maroc.</span>}
            <span>Ton pays d&apos;origine adapte l&apos;indicatif, la conversion des montants en dirhams et les démarches d&apos;entrée au Maroc (visa, carte de séjour).</span>
            <span>Tes données restent privées : seuls les établissements où tu candidates voient ton dossier.</span></div>
          {isStudent && <div className="flex flex-col gap-2 rounded-3xl bg-gradient-to-br from-brand-950 to-brand-700 p-5 text-white"><b className="flex items-center gap-2"><Sparkles size={18} className="text-sun-400" />Après l&apos;inscription</b><span className="text-[13px] text-brand-100">Passe le test d&apos;orientation (5 minutes) et découvre les métiers, formations et établissements qui te correspondent.</span></div>}
        </aside>
      </form>
    </>
  );
}

function Section({ n, t, children }: { n: number; t: string; children: React.ReactNode }) {
  return <section className="flex flex-col gap-4 border-b border-[#eef1f8] pb-6 last:border-0"><h2 className="flex items-center gap-3 text-lg font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm text-brand-600">{n}</span>{t}</h2>{children}</section>;
}
