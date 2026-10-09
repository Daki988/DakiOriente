"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Check as CheckIcon, GraduationCap, Info, KeyRound, School, ShieldCheck, Sparkles, UsersRound, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Tabs } from "@/components/app/kit";
import { Check, Field, FormError, Input, PasswordInput, Select } from "@/components/app/form";
import { api, ApiError } from "@/lib/api";
import { etablissements, pays, series } from "@/lib/data";
import { PAYS_OPTIONS, paysOrigineById } from "@/lib/pays-origine";
import { useAction } from "@/hooks/useApi";

type Role = "eleve" | "etudiant" | "parent" | "etablissement" | "bailleur";
const ROLES: { id: Role; I: LucideIcon; t: string; s: string; pts: string[]; bg: string; fg: string }[] = [
  { id: "eleve", I: School, t: "Élève", s: "Collège ou lycée", pts: ["Test d'orientation", "Choisir ma série", "Annales BEPC / BFEM / bac"], bg: "bg-brand-50", fg: "text-brand-600" },
  { id: "etudiant", I: GraduationCap, t: "Étudiant·e", s: "Bachelier ou en études supérieures", pts: ["Candidater dans 79 écoles", "Suivre mes dossiers", "Logement Navilease"], bg: "bg-[#f1edff]", fg: "text-[#6a3df0]" },
  { id: "parent", I: UsersRound, t: "Parent / tuteur", s: "J'accompagne mon enfant", pts: ["Suivre ses candidatures", "Devis et paiements", "Garant du logement"], bg: "bg-sun-100", fg: "text-[#a55a00]" },
  { id: "etablissement", I: Building2, t: "Établissement", s: "École, université, institut", pts: ["Recevoir des candidatures", "Gérer mes formations", "Statistiques"], bg: "bg-[#e8f8ef]", fg: "text-[#0f8a46]" },
  { id: "bailleur", I: KeyRound, t: "Bailleur Navilease", s: "Je loue à des étudiants", pts: ["Publier mes logements", "Paiement en séquestre", "Contrats & quittances"], bg: "bg-[#ffecef]", fg: "text-[#d42a50]" },
];
const LEVELS: [string, string][] = [["3e", "3e / fin de collège"], ["2nde", "Seconde"], ["1re", "Première"], ["terminale", "Terminale"], ["bachelier", "Bachelier·ère"], ["bac+1", "Bac+1"], ["bac+2", "Bac+2"], ["bac+3", "Bac+3"], ["bac+4", "Bac+4 / 5"]];

export function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="hidden items-center gap-3 md:flex">
      {["Profil", "Informations", "Vérification"].map((t, i) => {
        const n = i + 1, done = n < step, on = n === step;
        return (
          <li key={t} className="flex items-center gap-3">
            {i > 0 && <span className={`h-0.5 w-20 ${done || on ? "bg-[#0f8a46]" : "bg-[#dbe3f7]"}`} />}
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-[#0f8a46] text-white" : on ? "bg-brand-600 text-white ring-4 ring-brand-100" : "border-2 border-[#dbe3f7] text-ink-mute"}`}>{done ? <CheckIcon size={16} /> : n}</span>
            <span className={`text-sm font-bold ${on ? "" : "text-ink-mute"}`}>{t}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Signup() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<1 | 2>(params.get("profil") ? 2 : 1);
  const [role, setRole] = useState<Role>((params.get("profil") as Role) || "etudiant");
  const [via, setVia] = useState<"email" | "phone">("email");
  const [f, setF] = useState({ firstName: "", lastName: "", birthYear: "", country: "", city: "", level: "", serie: "", currentSchool: "", email: "", phone: "", password: "", establishmentId: "", company: "", guardianContact: "", terms: false });
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  const a = useAction();
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const age = f.birthYear ? new Date().getFullYear() - Number(f.birthYear) : null;
  const minor = (role === "eleve" || role === "etudiant") && age !== null && age < 18;
  const R = ROLES.find((r) => r.id === role)!;
  const villes = useMemo(() => (f.country ? pays.find((p) => p.id === f.country)?.villes_universitaires ?? [] : []), [f.country]);
  // Séries détaillées pour le Gabon, le Maroc et le Sénégal ; saisie libre pour les autres pays
  const seriesPays = useMemo(() => series.filter((s) => s.pays === f.country), [f.country]);
  const pwScore = [f.password.length >= 8, /\d/.test(f.password), /[A-Za-z]/.test(f.password), f.password.length >= 12].filter(Boolean).length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErr({});
    a.run(async () => {
      try {
        const body = {
          role, firstName: f.firstName, lastName: f.lastName, password: f.password, acceptTerms: f.terms,
          email: via === "email" ? f.email : "", phone: via === "phone" ? f.phone : "",
          birthYear: f.birthYear ? Number(f.birthYear) : undefined, country: f.country || undefined, city: f.city || undefined,
          level: f.level || undefined, serie: f.serie || undefined, currentSchool: f.currentSchool || undefined,
          establishmentId: f.establishmentId || undefined, company: f.company || undefined,
          guardianEmail: minor && f.guardianContact.includes("@") ? f.guardianContact : "", guardianPhone: minor && f.guardianContact && !f.guardianContact.includes("@") ? f.guardianContact : "",
        };
        await api("/auth/inscription", { body });
        const cible = via === "email" ? f.email : f.phone;
        router.push(`/verification/?cible=${encodeURIComponent(cible)}&objet=${via === "email" ? "verify_email" : "verify_phone"}`);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError && err.fields) setFieldErr(Object.fromEntries(err.fields.map((x) => [x.path, x.message])));
        throw err;
      }
    });
  };

  const top = <div className="mb-8 flex justify-center"><Stepper step={step} /></div>;
  if (step === 1)
    return (
      <div className="flex flex-col gap-8">
        {top}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="chip bg-brand-50 text-brand-700">Étape 1 sur 3 · Ton profil</span>
          <h1 className="h-section">Qui es-tu ?</h1>
          <p className="max-w-xl text-ink-soft">Choisis ton profil : Navigoal adapte ton espace, tes outils et ce que tu vois.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="radiogroup" aria-label="Profil">
          {ROLES.map((r) => {
            const on = r.id === role;
            return (
              <motion.button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => setRole(r.id)} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
                className={`card relative flex flex-col gap-3 rounded-3xl p-5 text-left transition ${on ? "border-2 border-[#6a3df0] shadow-[0_24px_50px_-24px_rgba(106,61,240,.55)]" : ""}`}>
                <span className={`flex h-24 items-center justify-center rounded-2xl ${r.bg} ${r.fg}`}><r.I size={44} strokeWidth={1.6} /></span>
                {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-7 top-7 flex h-7 w-7 items-center justify-center rounded-full bg-[#6a3df0] text-white"><CheckIcon size={16} /></motion.span>}
                <span><b className="block text-lg">{r.t}</b><span className="text-[13px] text-ink-mute">{r.s}</span></span>
                <span className="flex flex-col gap-1.5">{r.pts.map((p) => <span key={p} className="flex items-center gap-2 text-[13px] text-ink-soft"><CheckIcon size={14} className={r.fg} />{p}</span>)}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="flex items-center gap-2 text-sm text-ink-mute"><Info size={16} />Tu as moins de 18 ans ? Ton parent ou tuteur validera ton inscription.</span>
          <Button onClick={() => setStep(2)}>Continuer en tant que {R.t.toLowerCase()} <ArrowRight size={18} /></Button>
        </div>
        {(role === "etablissement" || role === "bailleur") && <div className="card flex items-center gap-3 rounded-2xl p-4 text-sm"><ShieldCheck size={20} className="shrink-0 text-[#6a3df0]" /><span><b>Vérification manuelle.</b> Votre compte est activé après vérification par l&apos;équipe Navigoal (agrément, pièce d&apos;identité, titre de propriété) sous 48 h ouvrées.</span></div>}
      </div>
    );

  const isStudent = role === "eleve" || role === "etudiant";
  return (
    <>{top}
    <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card flex flex-col gap-6 rounded-3xl p-5 sm:p-8">
        <div><span className="chip bg-brand-50 text-brand-700">Étape 2 sur 3 · Tes informations</span><h1 className="mt-2 text-[28px] font-extrabold tracking-tight">Faisons connaissance{f.firstName ? `, ${f.firstName}` : ""}</h1></div>
        <Section n={1} t="Identité">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" required error={fieldErr.firstName}>{(i) => <Input id={i} value={f.firstName} onChange={(e) => set("firstName")(e.target.value)} autoComplete="given-name" required />}</Field>
            <Field label="Nom" required error={fieldErr.lastName}>{(i) => <Input id={i} value={f.lastName} onChange={(e) => set("lastName")(e.target.value)} autoComplete="family-name" required />}</Field>
            {isStudent && <Field label="Année de naissance" required hint={age !== null ? `${age} ans${minor ? " · compte mineur" : ""}` : undefined}>{(i) => <Input id={i} type="number" min={1950} max={new Date().getFullYear() - 8} value={f.birthYear} onChange={(e) => set("birthYear")(e.target.value)} required />}</Field>}
            {role === "bailleur" && <Field label="Société ou résidence (facultatif)">{(i) => <Input id={i} value={f.company} onChange={(e) => set("company")(e.target.value)} />}</Field>}
          </div>
        </Section>
        {role === "etablissement" ? (
          <Section n={2} t="Votre établissement">
            <Field label="Établissement représenté" required hint="Votre rattachement est vérifié par l'équipe Navigoal.">{(i) => <Select id={i} value={f.establishmentId} onChange={(e) => set("establishmentId")(e.target.value)} required placeholder="Choisir…" options={etablissements.slice().sort((x, y) => x.nom.localeCompare(y.nom)).map((e) => [e.id, `${e.nom} (${e.ville})`])} />}</Field>
          </Section>
        ) : (
          <Section n={2} t="Où vis-tu ?">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pays de résidence" hint={f.country && paysOrigineById[f.country] ? `Indicatif ${paysOrigineById[f.country].indicatif}` : undefined}>{(i) => <Select id={i} value={f.country} onChange={(e) => setF((x) => ({ ...x, country: e.target.value, city: "", serie: "" }))} placeholder="Choisir…" options={PAYS_OPTIONS.map((o) => [o.value, o.label, o.group])} />}</Field>
              <Field label="Ville">{(i) => <><Input id={i} list="villes" value={f.city} onChange={(e) => set("city")(e.target.value)} autoComplete="address-level2" /><datalist id="villes">{villes.map((v) => <option key={v} value={v} />)}</datalist></>}</Field>
            </div>
          </Section>
        )}
        {isStudent && (
          <Section n={3} t="Ta scolarité">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Niveau actuel">{(i) => <Select id={i} value={f.level} onChange={(e) => set("level")(e.target.value)} placeholder="Choisir…" options={LEVELS} />}</Field>
              {seriesPays.length > 0
                ? <Field label="Série">{(i) => <Select id={i} value={f.serie} onChange={(e) => set("serie")(e.target.value)} placeholder="Choisir…" options={seriesPays.map((s) => [s.id, `${s.code} — ${s.intitule}`])} />}</Field>
                : <Field label="Série / spécialité du bac" hint={f.country ? undefined : "Choisis d'abord ton pays."}>{(i) => <Input id={i} value={f.serie} onChange={(e) => set("serie")(e.target.value)} disabled={!f.country} placeholder="Ex. scientifique, économique, littéraire" maxLength={40} />}</Field>}
              <Field label="Établissement actuel" className="sm:col-span-2">{(i) => <Input id={i} value={f.currentSchool} onChange={(e) => set("currentSchool")(e.target.value)} placeholder="Nom de ton lycée ou de ton université" />}</Field>
            </div>
          </Section>
        )}
        <Section n={isStudent ? 4 : 3} t="Tes identifiants">
          <Tabs value={via} onChange={setVia} items={[["email", "E-mail"], ["phone", "Téléphone"]]} />
          <div className="grid gap-4 sm:grid-cols-2">
            {via === "email"
              ? <Field label="Adresse e-mail" required error={fieldErr.email}>{(i) => <Input id={i} type="email" value={f.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" required />}</Field>
              : <Field label="Numéro de téléphone" required hint="Avec l'indicatif : +241, +212, +221" error={fieldErr.phone}>{(i) => <Input id={i} type="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="tel" placeholder="+241 07 41 22 48" required />}</Field>}
            <Field label="Mot de passe" required hint={f.password ? ["Trop court", "Faible", "Moyen", "Bon mot de passe", "Excellent"][pwScore] : "8 caractères minimum, une lettre et un chiffre"}>
              {(i) => <><PasswordInput id={i} value={f.password} onChange={(e) => set("password")(e.target.value)} autoComplete="new-password" required minLength={8} />
                <div className="mt-1 flex gap-1">{[0, 1, 2, 3].map((k) => <span key={k} className={`h-1 flex-1 rounded-full ${k < pwScore ? (pwScore >= 3 ? "bg-[#0f8a46]" : "bg-sun-500") : "bg-[#e8edfa]"}`} />)}</div></>}
            </Field>
          </div>
        </Section>
        {minor && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
            <div className="flex flex-col gap-3 rounded-2xl border border-[#f6dd9a] bg-[#fff7dd] p-5">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sun-400"><UsersRound size={19} /></span><span><b className="block">Ton parent ou tuteur</b><span className="text-xs text-ink-mute">Obligatoire car tu as moins de 18 ans</span></span></div>
              <Field label="E-mail ou téléphone de ton parent">{(i) => <Input id={i} value={f.guardianContact} onChange={(e) => set("guardianContact")(e.target.value)} required placeholder="+241 06 12 34 56 ou parent@email.com" />}</Field>
              <p className="text-xs text-[#8a4b00]">Il recevra un code pour valider ton inscription. En attendant, tu peux explorer Navigoal ; les candidatures et paiements seront activés après son consentement.</p>
            </div>
          </motion.div>
        )}
        <Check checked={f.terms} onChange={set("terms") as (v: boolean) => void}>J&apos;accepte les <Link href="/cgu" target="_blank" className="font-bold text-brand-600">conditions générales d&apos;utilisation</Link> et la <Link href="/confidentialite" target="_blank" className="font-bold text-brand-600">politique de confidentialité</Link> de Navigoal.</Check>
        <FormError error={a.error} />
        <div className="flex justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => setStep(1)}><ArrowLeft size={18} />Retour</Button>
          <Button loading={a.pending} disabled={!f.terms}>Créer mon compte <ArrowRight size={18} /></Button>
        </div>
      </div>
      <aside className="flex flex-col gap-4">
        <div className="card flex items-center gap-3 rounded-3xl p-5"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${R.bg} ${R.fg}`}><R.I size={22} /></span><span className="flex-1"><span className="block text-xs font-bold text-ink-mute">PROFIL CHOISI</span><b>{R.t}</b></span><button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-brand-600">Modifier</button></div>
        <div className="card flex flex-col gap-3 rounded-3xl p-5 text-[13px] text-ink-soft"><b className="text-base text-ink">Pourquoi ces informations ?</b>
          <span>Ta série et ton niveau filtrent les formations auxquelles tu peux candidater.</span><span>Ton pays adapte les moyens de paiement et les démarches de visa.</span><span>Tes données restent privées : seules les écoles où tu candidates voient ton dossier.</span></div>
        <div className="flex flex-col gap-2 rounded-3xl bg-gradient-to-br from-brand-950 to-brand-700 p-5 text-white"><b className="flex items-center gap-2"><Sparkles size={18} className="text-sun-400" />Après l&apos;inscription</b><span className="text-[13px] text-brand-100">Passe le test d&apos;orientation (10 min) et découvre les métiers, formations et écoles qui te correspondent.</span></div>
      </aside>
    </form></>
  );
}

function Section({ n, t, children }: { n: number; t: string; children: React.ReactNode }) {
  return <section className="flex flex-col gap-4 border-b border-[#eef1f8] pb-6 last:border-0"><h2 className="flex items-center gap-3 text-lg font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm text-brand-600">{n}</span>{t}</h2>{children}</section>;
}
