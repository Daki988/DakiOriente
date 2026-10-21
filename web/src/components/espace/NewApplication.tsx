"use client";
import Link from "@/components/ui/Link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Bookmark, Check, CheckCircle2, Clock, Download, FileText, GraduationCap, MapPin, PartyPopper, ShieldCheck, Upload, UsersRound, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { LabelChip } from "@/components/ui/Cards";
import { Prix } from "@/components/ui/Devise";
import { Alert, Button, Empty, Loading, PageHeader, Panel, useToast } from "@/components/app/kit";
import { Check as Checkbox, FileDrop, FormError, Textarea, docLabel, type Doc } from "@/components/app/form";
import { api, apiUrl } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";
import { etabById, niveauLabel, serieById, type Label } from "@/lib/data";
import { useUser } from "@/components/app/Session";
import { visaResume } from "@/lib/pays-origine";
import { AppProgress } from "./AppProgress";
import type { AppDetail, Program } from "./types";

type Methods = Record<string, { id: string; label: string }[]>;
type Me = { profile: { serie: string | null } | null; birthYear: number | null };
type Guardian = { link: { status: string; consentAt: string | null }; parent: { id: string; firstName: string; lastName: string } | null }[];
const STEPS = ["Choix de la formation", "Dossier", "Paiement", "Confirmation"];

/** Candidature en étapes (planche) : formation et campus → dossier (pièces requises) → paiement → confirmation. */
export function NewApplication() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const user = useUser();
  const [appId, setAppId] = useState<string | null>(params.get("id"));
  const [boot, setBoot] = useState<string | null>(null);
  const start = useAction();

  // Démarrage : à partir d'une offre (établissement + formation type, ou programme) on crée ou reprend le brouillon.
  useEffect(() => {
    if (appId) return;
    const etab = params.get("etab"), formation = params.get("formation"), program = params.get("programme");
    if (!etab && !program) { setBoot("Choisis d'abord une formation dans le catalogue."); return; }
    start.run(async () => {
      let pid = program;
      if (!pid) {
        const list = await api<Program[]>(`/etablissements/${etab}/formations`);
        const p = list.find((x) => x.formationId === formation) ?? (formation ? undefined : list[0]);
        if (!p) { setBoot("Cette formation n'est pas ouverte aux candidatures en ligne dans cet établissement."); return; }
        pid = p.id;
      }
      const a = await api<{ id: string }>("/candidatures", { body: { programId: pid } });
      setAppId(a.id);
      router.replace(`/espace/candidatures/nouvelle?id=${a.id}`, { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = useApi<AppDetail>(appId ? `/candidatures/${appId}` : null);
  const me = useApi<Me>("/moi");
  const docs = useApi<Doc[]>("/documents");
  const methods = useApi<Methods>("/paiements/moyens");
  const guardians = useApi<Guardian>("/moi/tuteurs");
  const [step, setStep] = useState(params.get("etape") === "confirmation" ? 3 : 0);
  const [motivation, setMotivation] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [method, setMethod] = useState("");
  const [certify, setCertify] = useState(false);
  const [campus, setCampus] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const save = useAction();
  const submit = useAction();

  const status = d.data?.application.status;
  const editable = status === "brouillon" || status === "piece_demandee";
  useEffect(() => {
    if (!d.data) return;
    if (!editable && step !== 3) router.replace(`/espace/candidatures/${d.data.application.id}`);
    setMotivation(d.data.application.motivation ?? "");
    setCampus(d.data.application.campus ?? (d.data.program.campuses.length === 1 ? d.data.program.campuses[0] : ""));
    setSelected(d.data.application.documentIds);
    if (status === "piece_demandee" && step === 0) setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.data]);

  const p = d.data?.program, e = d.data?.establishment;
  const required = useMemo(() => [...new Set([...(p?.requiredDocuments ?? []), ...(d.data?.application.requestedDocuments ?? [])])], [p, d.data]);
  const chosenTypes = new Set((docs.data ?? []).filter((x) => selected.includes(x.id)).map((x) => x.type));
  const missing = required.filter((t) => !chosenTypes.has(t));
  const serie = me.data?.profile?.serie;
  const serieOk = !p?.admission.series?.length || !serie || p.admission.series.includes(serie);
  const words = motivation.trim() ? motivation.trim().split(/\s+/).length : 0;
  const payMethods = methods.data?.MA ?? [];
  const parent = guardians.data?.find((g) => g.link.status === "actif" && g.parent)?.parent;
  const minor = !!me.data?.birthYear && new Date().getFullYear() - me.data.birthYear < 18;
  const consent = (guardians.data ?? []).some((g) => g.link.consentAt);
  const needCampus = (p?.campuses.length ?? 0) > 1;
  const fee = p?.applicationFee ?? 0;

  const persist = () => save.run(async () => { await api(`/candidatures/${appId}`, { method: "PATCH", body: { motivation, documentIds: selected, campus: campus || null } }); return true; });
  const go = async (n: number) => {
    if (n > step && step === 0 && needCampus && !campus) { save.setError("Choisis ton campus pour continuer."); return; }
    if (editable && !(await persist())) return;
    setStep(n); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const send = () => submit.run(async () => {
    await api(`/candidatures/${appId}`, { method: "PATCH", body: { motivation, documentIds: selected, campus: campus || null } });
    const r = await api<{ redirectUrl: string | null }>(`/candidatures/${appId}/envoyer`, { body: status === "brouillon" && fee > 0 ? { moyen: method === "parent" ? payMethods[0]?.id : method, payeur: method === "parent" ? parent?.id : undefined } : {} });
    if (r.redirectUrl?.startsWith("/paiement/")) { router.push(r.redirectUrl); return; } // paiement par l'étudiant : page de paiement, puis retour à la confirmation
    if (r.redirectUrl && !r.redirectUrl.startsWith("/")) { window.location.assign(r.redirectUrl); return; } // agrégateur externe
    toast(method === "parent" ? "Candidature envoyée : ton parent a reçu la demande de paiement." : "Candidature envoyée !");
    await d.reload(); setStep(3); window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if (boot) return <Empty icon={FileText} title="Impossible de démarrer la candidature" text={boot} action={<Link href="/formations" className="btn-primary">Explorer les formations</Link>} />;
  if (start.error) return <Alert tone="error" title="Erreur">{start.error}</Alert>;
  if (d.error) return <Alert tone="error" title="Candidature introuvable">{d.error.message}</Alert>;
  if (!d.data || !p || !e) return <Loading label="Préparation de ton dossier…" />;
  const a = d.data.application;
  const etab = etabById[e.id];

  return (
    <>
      <PageHeader crumbs={[["Mes candidatures", "/espace/candidatures"], [step === 3 ? "Confirmation" : "Nouvelle candidature"]]}
        title={`Candidature – ${p.title}`}
        sub={`${e.nom} · ${campus || e.ville} · n° ${a.number}`}
        actions={editable && step < 3 ? <Button variant="ghost" icon={Bookmark} loading={save.pending} onClick={async () => { if (await persist()) toast("Brouillon enregistré"); }}>Enregistrer le brouillon</Button> : undefined} />

      <ol className="card mb-5 grid grid-cols-4 gap-1 rounded-[22px] p-3 sm:mb-6 sm:p-5" aria-label="Étapes de la candidature">
        {STEPS.map((t, i) => {
          const done = i < step || (i === 3 && step === 3);
          return (
            <li key={t} className="relative flex flex-col items-center gap-1.5 text-center" aria-current={i === step ? "step" : undefined}>
              {i > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full sm:top-[18px] ${i <= step ? "bg-brand-600" : "bg-[#dbe3f7]"}`} aria-hidden />}
              <button type="button" onClick={() => editable && i < step && go(i)} disabled={!editable || i >= step} className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold sm:h-9 sm:w-9 ${done && i !== step ? "bg-brand-600 text-white" : i === step ? "bg-brand-600 text-white ring-4 ring-brand-100" : "border-2 border-[#dbe3f7] bg-white text-ink-mute"}`} aria-label={t}>{done && i !== step ? <Check size={16} /> : i + 1}</button>
              <span className={`text-[11px] font-bold leading-tight sm:text-[13px] ${i === step ? "text-ink" : "text-ink-mute"}`}>{t}</span>
            </li>
          );
        })}
      </ol>
      {status === "piece_demandee" && step < 3 && <div className="mb-5"><Alert tone="warn" title="L'établissement demande une pièce complémentaire">{a.requestedDocuments.map(docLabel).join(", ")}. Ajoute-la ci-dessous, puis renvoie ton dossier.</Alert></div>}

      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {step === 0 && (
          <>
            <Panel title="Formation choisie" icon={GraduationCap}>
              <div className="flex items-start gap-3 sm:gap-4">
                <EtabLogo e={etab ?? e} size={56} />
                <div className="flex min-w-0 flex-col gap-1">
                  <b className="text-[17px] leading-snug">{p.title}</b>
                  <span className="text-sm text-ink-mute">{e.nom}</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {e.label && <LabelChip label={e.label as Label} court />}
                    {p.homologated ? <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><ShieldCheck size={12} />Filière homologuée</span> : p.homologation?.statut === "recente" ? <span className="chip bg-brand-50 text-brand-700"><ShieldCheck size={12} />Accrédité</span> : <span className="chip bg-[#eef1f8] text-ink-soft">Diplôme d&apos;établissement</span>}
                    {p.level && <span className="chip bg-[#eef1f8] text-ink-soft">{niveauLabel(p.level)}</span>}
                    {p.durationYears && <span className="chip bg-[#eef1f8] text-ink-soft"><Clock size={12} />{p.durationYears} an{p.durationYears > 1 ? "s" : ""}</span>}
                  </div>
                </div>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                {p.diploma && <div className="rounded-xl bg-[#f6f8fe] p-3"><span className="block text-xs font-bold uppercase text-ink-mute">Diplôme</span>{p.diploma}</div>}
                <div className="rounded-xl bg-[#f6f8fe] p-3"><span className="block text-xs font-bold uppercase text-ink-mute">Scolarité annuelle{p.feesConfirmed ? "" : " (indicative)"}</span>{p.tuitionMin ? <Prix mad={p.tuitionMin} /> : "Sur demande"}{p.tuitionMax && p.tuitionMax !== p.tuitionMin ? <> – <Prix mad={p.tuitionMax} /></> : null}</div>
                <div className="rounded-xl bg-[#f6f8fe] p-3"><span className="block text-xs font-bold uppercase text-ink-mute">Frais de dossier</span>{fee ? <Prix mad={fee} /> : "Aucun"}</div>
                <div className="rounded-xl bg-[#f6f8fe] p-3"><span className="block text-xs font-bold uppercase text-ink-mute">Rentrée</span>{p.startDate ?? "Septembre"}</div>
              </div>
            </Panel>
            <Panel title={needCampus ? "Choisis ton campus" : "Campus"} icon={MapPin}>
              {needCampus ? (
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Campus">
                  {p.campuses.map((c) => (
                    <button key={c} type="button" role="radio" aria-checked={campus === c} onClick={() => { setCampus(c); save.setError(null); }} className={`flex min-h-[52px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold ${campus === c ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white hover:border-brand-300"}`}>
                      <MapPin size={17} className="shrink-0" /><span className="flex-1">Campus de {c}</span>{campus === c && <Check size={17} />}
                    </button>
                  ))}
                </div>
              ) : <p className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-brand-600" />{campus || p.campus || e.ville}, Maroc</p>}
              {needCampus && <span className="text-xs text-ink-mute">{e.nom} est un réseau multi-campus : cette formation est ouverte dans {p.campuses.length} villes. Compare quartiers et transports sur <Link href={`/etablissements/${e.id}/#campus`} className="font-bold text-brand-600">la fiche de l&apos;établissement</Link>.</span>}
            </Panel>
            <Panel title="Conditions d'admission" icon={CheckCircle2}>
              <Cond ok={serieOk} t="Série du bac" s={p.admission.series?.length ? `Séries admises : ${p.admission.series.map((x) => serieById[x]?.code ?? x).slice(0, 10).join(", ")}${serie ? ` · ta série : ${serieById[serie]?.code ?? serie}` : " · renseigne ta série dans ton profil"}` : "Toutes séries acceptées"} />
              {p.admission.noteMin != null && <Cond ok t="Moyenne minimale" s={`Moyenne exigée : ${p.admission.noteMin}/20, vérifiée sur tes relevés de notes.`} />}
              <Cond ok t="Venir étudier au Maroc" s={user.country && user.country !== "MA" ? `Depuis ton pays : ${visaResume(user.country)}.` : "Candidatures ouvertes aux étudiants de tous les pays."} />
              {(p.admission.concours || p.admission.entretien) && <Alert tone="warn">Admission {p.admission.concours ? "sur concours" : "avec entretien"}{p.admission.prerequis ? ` : ${p.admission.prerequis}` : " (épreuves organisées par l'établissement, souvent à distance pour l'international)."}</Alert>}
              {minor && !consent && <Alert tone="error" title="Consentement parental requis" action={<Link href="/espace/profil#parent" className="btn-sun py-2.5">Inviter mon parent</Link>}>Tu peux préparer ton dossier, mais l&apos;envoi nécessite l&apos;accord de ton parent ou tuteur.</Alert>}
              {!serieOk && <Alert tone="warn">Ta série ne figure pas parmi les séries habituellement admises. Tu peux candidater : l&apos;établissement étudiera ton dossier.</Alert>}
            </Panel>
            <FormError error={save.error} />
            <div className="flex justify-end"><Button onClick={() => go(1)} loading={save.pending} className="min-h-[46px] w-full sm:w-auto">Suivant <ArrowRight size={17} /></Button></div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid items-start gap-4 lg:grid-cols-[1fr_280px]">
              <Panel title="Documents requis" icon={FileText} action={<span className="chip bg-brand-50 text-brand-700">{required.length - missing.length} / {required.length}</span>}>
                {!!(docs.data ?? []).length && <p className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-[13px] font-semibold text-brand-700">Tes documents déjà déposés sont réutilisables : coche ceux à joindre.</p>}
                <ul className="flex flex-col gap-2">
                  {required.map((t) => {
                    const mine = (docs.data ?? []).filter((x) => x.type === t);
                    const chosen = mine.find((x) => selected.includes(x.id));
                    return (
                      <li key={t} className="rounded-2xl border border-[#eef1f8] p-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${chosen ? "bg-brand-600 text-white" : "border-2 border-[#dbe3f7]"}`} aria-hidden>{chosen && <Check size={14} strokeWidth={3} />}</span>
                          <span className="min-w-0 flex-1 text-sm font-semibold">{docLabel(t)}{chosen && <span className="block truncate text-xs font-normal text-ink-mute">{chosen.fileName}</span>}</span>
                          {chosen ? <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><Check size={12} />Ajouté</span>
                            : <button type="button" onClick={() => setOpen(open === t ? null : t)} className="btn-ghost min-h-[36px] px-3 py-1.5 text-[13px]"><Upload size={14} />Ajouter</button>}
                        </div>
                        {(open === t || (!chosen && mine.length > 0)) && (
                          <div className="mt-3 flex flex-col gap-2 border-t border-[#eef1f8] pt-3">
                            {mine.map((x) => <label key={x.id} className="flex min-h-[36px] cursor-pointer items-center gap-2.5 text-[13px]"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={selected.includes(x.id)} onChange={(ev) => setSelected((s) => ev.target.checked ? [...s, x.id] : s.filter((y) => y !== x.id))} /><span className="truncate">{x.fileName}</span><span className="shrink-0 text-ink-mute">· {new Date(x.createdAt).toLocaleDateString("fr-FR")}</span></label>)}
                            {!chosen && <FileDrop type={t} compact onUploaded={(doc) => { docs.setData([doc, ...(docs.data ?? [])]); setSelected((s) => [...s, doc.id]); setOpen(null); toast("Document ajouté"); }} />}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <details className="rounded-2xl border border-dashed border-slate-300 p-3"><summary className="cursor-pointer text-sm font-bold">Ajouter une autre pièce (facultatif)</summary><div className="mt-3"><FileDrop onUploaded={(doc) => { docs.setData([doc, ...(docs.data ?? [])]); setSelected((s) => [...s, doc.id]); }} /></div></details>
              </Panel>
              <aside className="card flex flex-col gap-2.5 rounded-[22px] p-4 text-sm sm:p-5">
                <b>Format accepté</b>
                <span className="flex items-center gap-2 text-ink-soft"><FileText size={15} className="text-brand-600" />PDF, JPG, PNG ou WebP</span>
                <span className="flex items-center gap-2 text-ink-soft"><Upload size={15} className="text-brand-600" />Taille maximale : 8 Mo</span>
                <span className="flex items-center gap-2 text-ink-soft"><Check size={15} className="text-brand-600" />Documents lisibles et complets</span>
                <span className="text-xs text-ink-mute">Pièces en langue étrangère : joins une traduction en français si l&apos;établissement la demande.</span>
              </aside>
            </div>
            <Panel title="Lettre de motivation" icon={FileText} action={<span className="text-xs text-ink-mute">{words} mots</span>}>
              <Textarea id="motiv" aria-label="Lettre de motivation" value={motivation} onChange={(ev) => setMotivation(ev.target.value)} rows={8} placeholder={`Pourquoi ${p.title} à ${e.sigle} ? Parle de ton parcours, de ce qui te motive et de ton projet professionnel.`} />
              <span className="text-xs text-ink-mute">Conseil : 250 à 500 mots. Ton brouillon est enregistré à chaque étape.</span>
            </Panel>
            <FormError error={save.error} />
            <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row">
              {status === "brouillon" ? <Button variant="ghost" onClick={() => go(0)} className="min-h-[46px]"><ArrowLeft size={17} />Précédent</Button> : <span />}
              <Button onClick={() => go(2)} loading={save.pending} className="min-h-[46px]">Suivant <ArrowRight size={17} /></Button>
            </div>
          </>
        )}

        {step === 2 && (
          <Panel title={status === "piece_demandee" ? "Renvoyer le dossier" : "Récapitulatif et paiement"} icon={Wallet}>
            <dl className="flex flex-col gap-2 text-sm">
              {[["Établissement", e.nom], ["Formation", p.title], ["Campus", campus || e.ville], ["Pièces jointes", `${required.length - missing.length} / ${required.length}`], ["Motivation", `${words} mots`]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-ink-mute">{k}</dt><dd className="text-right font-bold">{v}</dd></div>)}
            </dl>
            {missing.length > 0 && <Alert tone="error" title="Pièces manquantes" action={<button onClick={() => go(1)} className="btn-ghost py-2">Compléter</button>}>{missing.map(docLabel).join(", ")}.</Alert>}
            {status === "brouillon" && fee > 0 ? (
              <>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-950 to-brand-700 px-4 py-4 text-white sm:px-5"><span className="font-bold">Frais de dossier</span><b className="text-right text-lg [&_span]:text-brand-100"><Prix mad={fee} bloc /></b></div>
                <span className="text-[13px] font-bold">Payer avec</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {payMethods.map((m) => <button key={m.id} type="button" onClick={() => setMethod(m.id)} aria-pressed={method === m.id} className={`min-h-[48px] rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-bold ${method === m.id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white"}`}>{m.label}</button>)}
                  {parent && <button type="button" onClick={() => setMethod("parent")} aria-pressed={method === "parent"} className={`flex min-h-[48px] items-center gap-1.5 rounded-2xl border-2 px-3 py-2.5 text-sm font-bold ${method === "parent" ? "border-[#a55a00] bg-sun-100" : "border-slate-200 bg-white"}`}><UsersRound size={16} />Demander à mon parent</button>}
                </div>
                {method === "parent" && parent && <p className="text-[13px] text-ink-mute">{parent.firstName} {parent.lastName} recevra la demande de paiement par SMS et e-mail.</p>}
              </>
            ) : status === "brouillon" ? <Alert tone="success">Aucun frais de dossier pour cette candidature.</Alert> : null}
            <Checkbox checked={certify} onChange={setCertify}>Je certifie l&apos;exactitude des informations et j&apos;accepte la transmission de mon dossier à {e.nom}.</Checkbox>
            <FormError error={submit.error} />
            <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row"><Button variant="ghost" onClick={() => go(1)} className="min-h-[46px]"><ArrowLeft size={17} />Précédent</Button>
              <Button onClick={send} loading={submit.pending} className="min-h-[46px]" disabled={!certify || missing.length > 0 || (status === "brouillon" && fee > 0 && !method)}>{status === "piece_demandee" ? "Renvoyer le dossier" : fee > 0 && method !== "parent" ? "Envoyer et payer" : "Envoyer ma candidature"} <ArrowRight size={17} /></Button></div>
          </Panel>
        )}

        {step === 3 && (
          <Panel>
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span className={`flex h-16 w-16 items-center justify-center rounded-full ${editable ? "bg-sun-100 text-[#a55a00]" : "bg-[#e8f8ef] text-[#0f8a46]"}`}>{editable ? <AlertCircle size={32} /> : <PartyPopper size={32} />}</span>
              <h2 className="text-2xl font-extrabold">{editable ? "Candidature pas encore envoyée" : "Candidature envoyée !"}</h2>
              <p className="max-w-lg text-sm text-ink-soft">{editable ? "Termine ton dossier puis envoie-le pour qu'il soit transmis à l'établissement." : `Ton dossier n° ${a.number} a été transmis à ${e.nom}. Tu recevras une notification (et un e-mail) à chaque étape.`}</p>
            </div>
            <div className="rounded-2xl border border-[#eef1f8] p-4"><AppProgress status={a.status} fee={fee > 0} /></div>
            {a.status === "soumise" && fee > 0 && <Alert tone="warn" title="Paiement des frais de dossier en attente">Ton dossier sera étudié après la confirmation du paiement (<Prix mad={fee} />).</Alert>}
            <div className="flex flex-col gap-2 sm:flex-row">
              {editable ? <Button onClick={() => setStep(status === "piece_demandee" ? 1 : 0)} className="min-h-[46px]">Reprendre mon dossier</Button> : <>
                <Link href={`/espace/candidatures/${a.id}`} className="btn-primary min-h-[46px]">Suivre ma candidature</Link>
                {a.submittedAt && <a href={apiUrl(`/candidatures/${a.id}/bordereau.pdf`)} className="btn-ghost min-h-[46px]"><Download size={16} />Bordereau PDF</a>}
              </>}
              <Link href="/formations" className="btn-ghost min-h-[46px]">Candidater à une autre formation</Link>
            </div>
          </Panel>
        )}
        <p className="text-center text-xs text-ink-mute">Connecté·e en tant que {user.firstName} {user.lastName}.</p>
      </div>
    </>
  );
}

function Cond({ ok, t, s }: { ok: boolean; t: string; s: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-[#eef1f8] p-3.5">{ok ? <CheckCircle2 size={20} className="shrink-0 text-[#0f8a46]" /> : <AlertCircle size={20} className="shrink-0 text-[#a55a00]" />}<span><b className="block text-sm">{t}</b><span className="text-[13px] text-ink-mute">{s}</span></span></div>;
}
