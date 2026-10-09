"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Bookmark, Check, CheckCircle2, FileText, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { Alert, Button, Empty, Loading, PageHeader, Panel, money, useToast } from "@/components/app/kit";
import { Check as Checkbox, FileDrop, FormError, Textarea, docLabel, type Doc } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";
import { PAYS_NOM, etabById, serieById, type PaysCode } from "@/lib/data";
import { useUser } from "@/components/app/Session";
import type { AppDetail, Program } from "./types";

type Methods = Record<string, { id: string; label: string }[]>;
type Me = { profile: { serie: string | null } | null; birthYear: number | null };
type Guardian = { link: { status: string; consentAt: string | null }; parent: { id: string; firstName: string; lastName: string } | null }[];
const STEPS = ["Conditions", "Dossier", "Pièces", "Récapitulatif & paiement"];

/** Assistant de candidature (maquette 24) : conditions → dossier → pièces → récapitulatif et paiement. */
export function NewApplication() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const user = useUser();
  const [appId, setAppId] = useState<string | null>(params.get("id"));
  const [boot, setBoot] = useState<string | null>(null);
  const start = useAction();

  // Démarrage : à partir d'une offre (etab + formation type) on crée ou reprend le brouillon.
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
  const [step, setStep] = useState(0);
  const [motivation, setMotivation] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [method, setMethod] = useState("");
  const [certify, setCertify] = useState(false);
  const save = useAction();
  const submit = useAction();

  useEffect(() => {
    if (!d.data) return;
    if (d.data.application.status !== "brouillon" && d.data.application.status !== "piece_demandee") router.replace(`/espace/candidatures/${d.data.application.id}`);
    setMotivation(d.data.application.motivation ?? "");
    setSelected(d.data.application.documentIds);
  }, [d.data, router]);

  const p = d.data?.program, e = d.data?.establishment;
  const required = useMemo(() => [...new Set([...(p?.requiredDocuments ?? []), ...(d.data?.application.requestedDocuments ?? [])])], [p, d.data]);
  const chosenTypes = new Set((docs.data ?? []).filter((x) => selected.includes(x.id)).map((x) => x.type));
  const missing = required.filter((t) => !chosenTypes.has(t));
  const serie = me.data?.profile?.serie;
  const serieOk = !p?.admission.series?.length || !serie || p.admission.series.includes(serie);
  const words = motivation.trim() ? motivation.trim().split(/\s+/).length : 0;
  const country = (e?.pays ?? "GA") as PaysCode;
  const parent = guardians.data?.find((g) => g.link.status === "actif" && g.parent)?.parent;
  const minor = !!me.data?.birthYear && new Date().getFullYear() - me.data.birthYear < 18;
  const consent = (guardians.data ?? []).some((g) => g.link.consentAt);

  const persist = () => save.run(async () => { await api(`/candidatures/${appId}`, { method: "PATCH", body: { motivation, documentIds: selected } }); });
  const go = async (n: number) => { await persist(); setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const send = () => submit.run(async () => {
    await api(`/candidatures/${appId}`, { method: "PATCH", body: { motivation, documentIds: selected } });
    const r = await api<{ redirectUrl: string | null }>(`/candidatures/${appId}/envoyer`, { body: p!.applicationFee > 0 ? { moyen: method === "parent" ? methods.data?.[country]?.[0]?.id : method, payeur: method === "parent" ? parent?.id : undefined } : {} });
    toast(method === "parent" ? "Candidature envoyée : ton parent a reçu la demande de paiement." : "Candidature envoyée !");
    router.push(r.redirectUrl ?? `/espace/candidatures/${appId}`);
  });

  if (boot) return <Empty icon={FileText} title="Impossible de démarrer la candidature" text={boot} action={<Link href="/formations" className="btn-primary">Explorer les formations</Link>} />;
  if (start.error) return <Alert tone="error" title="Erreur">{start.error}</Alert>;
  if (!d.data || !p || !e) return <Loading label="Préparation de ton dossier…" />;

  return (
    <>
      <PageHeader crumbs={[["Mes candidatures", "/espace/candidatures"], ["Nouvelle candidature"]]}
        title={<span className="flex items-center gap-4"><EtabLogo e={etabById[e.id] ?? e} size={56} /><span>Candidater : {p.title}</span></span>}
        sub={`${e.nom} · ${e.ville.split("/")[0].trim()}, ${PAYS_NOM[country]} · candidature n° ${d.data.application.number}`}
        actions={<Button variant="ghost" icon={Bookmark} loading={save.pending} onClick={async () => { await persist(); toast("Brouillon enregistré"); }}>Enregistrer le brouillon</Button>} />
      <ol className="card mb-6 flex items-center gap-2 overflow-x-auto rounded-[22px] p-4 sm:gap-4 sm:p-5">
        {STEPS.map((t, i) => (
          <li key={t} className="flex shrink-0 items-center gap-2 sm:flex-1 sm:gap-3">
            <button onClick={() => i < step && go(i)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i < step ? "bg-[#0f8a46] text-white" : i === step ? "bg-brand-600 text-white ring-4 ring-brand-100" : "border-2 border-[#dbe3f7] text-ink-mute"}`} aria-label={t}>{i < step ? <Check size={16} /> : i + 1}</button>
            <span className={`whitespace-nowrap text-sm font-bold ${i === step ? "" : "text-ink-mute"} ${i === step ? "" : "hidden sm:inline"}`}>{t}</span>
            {i < STEPS.length - 1 && <span className={`hidden h-0.5 flex-1 sm:block ${i < step ? "bg-[#0f8a46]" : "bg-[#dbe3f7]"}`} />}
          </li>
        ))}
      </ol>
      {d.data.application.status === "piece_demandee" && <div className="mb-5"><Alert tone="warn" title="L'établissement demande une pièce complémentaire">{d.data.application.requestedDocuments.map(docLabel).join(", ")}. Ajoute-la à l&apos;étape « Pièces », puis renvoie ton dossier.</Alert></div>}

      <div className="mx-auto max-w-3xl">
        {step === 0 && (
          <Panel title="Vérifier les conditions" icon={CheckCircle2}>
            <Cond ok={serieOk} t="Série acceptée" s={p.admission.series?.length ? `Séries admises : ${p.admission.series.map((x) => serieById[x]?.code ?? x).slice(0, 10).join(", ")}${serie ? ` · ta série : ${serieById[serie]?.code ?? serie}` : " · renseigne ta série dans ton profil"}` : "Toutes séries"} />
            {p.admission.noteMin != null && <Cond ok t="Moyenne minimale" s={`Moyenne exigée : ${p.admission.noteMin}/20. Elle sera vérifiée sur tes relevés de notes.`} />}
            <Cond ok t="Étudiants internationaux" s={`Candidatures ouvertes aux étudiants de tous les pays. Visa et séjour : voir la fiche ${PAYS_NOM[country]}.`} />
            {(p.admission.concours || p.admission.entretien) && <Alert tone="warn">Admission {p.admission.concours ? "sur concours" : "avec entretien"}{p.admission.prerequis ? ` : ${p.admission.prerequis}` : " (épreuves organisées par l'établissement, souvent à distance pour l'international)."}</Alert>}
            {minor && !consent && <Alert tone="error" title="Consentement parental requis" action={<Link href="/espace/profil#parent" className="btn-sun py-2.5">Inviter mon parent</Link>}>Tu pourras préparer ton dossier, mais l&apos;envoi nécessite l&apos;accord de ton parent ou tuteur.</Alert>}
            {!serieOk && <Alert tone="warn">Ta série ne figure pas parmi les séries habituellement admises. Tu peux candidater, l&apos;établissement étudiera ton dossier.</Alert>}
            <div className="flex justify-end"><Button onClick={() => go(1)}>Continuer <ArrowRight size={17} /></Button></div>
          </Panel>
        )}
        {step === 1 && (
          <Panel title="Ton dossier" icon={FileText}>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13px] font-bold"><label htmlFor="motiv">Lettre de motivation</label><span className="font-normal text-ink-mute">{words} mots</span></div>
              <Textarea id="motiv" value={motivation} onChange={(ev) => setMotivation(ev.target.value)} rows={10} placeholder={`Pourquoi ${p.title} à ${e.sigle} ? Parle de ton parcours, de ce qui te motive et de ton projet professionnel.`} />
              <span className="text-xs text-ink-mute">Conseil : 250 à 500 mots. Ton brouillon est enregistré à chaque étape.</span>
            </div>
            <div className="flex justify-between"><Button variant="ghost" onClick={() => go(0)}><ArrowLeft size={17} />Étape précédente</Button><Button onClick={() => go(2)} loading={save.pending}>Continuer <ArrowRight size={17} /></Button></div>
          </Panel>
        )}
        {step === 2 && (
          <Panel title="Pièces justificatives" icon={FileText} action={<span className="chip bg-brand-50 text-brand-700">{required.length - missing.length} / {required.length}</span>}>
            {!!(docs.data ?? []).length && <p className="rounded-xl bg-brand-50 px-4 py-2.5 text-[13px] font-semibold text-brand-700">Tes documents déjà déposés sont réutilisables : coche ceux à joindre.</p>}
            {required.map((t) => {
              const mine = (docs.data ?? []).filter((x) => x.type === t);
              const chosen = mine.find((x) => selected.includes(x.id));
              return (
                <div key={t} className="flex flex-col gap-2 rounded-2xl border border-[#eef1f8] p-4">
                  <div className="flex items-center justify-between gap-3"><b className="text-sm">{docLabel(t)}</b>{chosen ? <span className="chip bg-[#e8f8ef] text-[#0f8a46]">Jointe</span> : <span className="chip bg-[#ffecef] text-[#d42a50]">À ajouter</span>}</div>
                  {mine.map((x) => <label key={x.id} className="flex cursor-pointer items-center gap-2.5 text-[13px]"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={selected.includes(x.id)} onChange={(ev) => setSelected((s) => ev.target.checked ? [...s, x.id] : s.filter((y) => y !== x.id))} />{x.fileName}<span className="text-ink-mute">· déposé le {new Date(x.createdAt).toLocaleDateString("fr-FR")}</span></label>)}
                  {!chosen && <FileDrop type={t} compact onUploaded={(doc) => { docs.setData([doc, ...(docs.data ?? [])]); setSelected((s) => [...s, doc.id]); toast("Document ajouté"); }} />}
                </div>
              );
            })}
            <details className="rounded-2xl border border-dashed border-slate-300 p-4"><summary className="cursor-pointer text-sm font-bold">Ajouter une autre pièce (facultatif)</summary><div className="mt-3"><FileDrop onUploaded={(doc) => { docs.setData([doc, ...(docs.data ?? [])]); setSelected((s) => [...s, doc.id]); }} /></div></details>
            <div className="flex justify-between"><Button variant="ghost" onClick={() => go(1)}><ArrowLeft size={17} />Étape précédente</Button><Button onClick={() => go(3)} loading={save.pending}>Continuer <ArrowRight size={17} /></Button></div>
          </Panel>
        )}
        {step === 3 && (
          <Panel title="Récapitulatif & frais de dossier" icon={CheckCircle2}>
            {[["Établissement", e.nom], ["Formation", p.title], ["Pièces jointes", `${required.length - missing.length} / ${required.length}`], ["Rentrée", p.startDate ?? "Septembre"], ["Motivation", `${words} mots`]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 text-sm"><span className="text-ink-mute">{k}</span><b className="text-right">{v}</b></div>)}
            {missing.length > 0 && <Alert tone="error" title="Pièces manquantes">{missing.map(docLabel).join(", ")}. Reviens à l&apos;étape « Pièces ».</Alert>}
            {d.data.application.status === "brouillon" && p.applicationFee > 0 ? (
              <>
                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-950 to-brand-700 px-5 py-4 text-white"><span className="font-bold">Frais de dossier</span><b className="text-xl">{money(p.applicationFee, p.currency)}</b></div>
                <span className="text-[13px] font-bold">Payer avec</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(methods.data?.[country] ?? []).map((m) => <button key={m.id} type="button" onClick={() => setMethod(m.id)} className={`rounded-2xl border-2 px-3 py-3 text-sm font-bold ${method === m.id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white"}`}>{m.label}</button>)}
                  {parent && <button type="button" onClick={() => setMethod("parent")} className={`flex items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-3 text-sm font-bold ${method === "parent" ? "border-[#a55a00] bg-sun-100" : "border-slate-200 bg-white"}`}><UsersRound size={16} />Mon parent</button>}
                </div>
                {method === "parent" && parent && <p className="text-[13px] text-ink-mute">{parent.firstName} {parent.lastName} recevra la demande de paiement par SMS et e-mail.</p>}
              </>
            ) : <Alert tone="success">Aucun frais de dossier pour cette candidature.</Alert>}
            <Checkbox checked={certify} onChange={setCertify}>Je certifie l&apos;exactitude des informations et j&apos;accepte la transmission de mon dossier à {e.sigle}.</Checkbox>
            <FormError error={submit.error} />
            <div className="flex justify-between gap-3"><Button variant="ghost" onClick={() => go(2)}><ArrowLeft size={17} />Étape précédente</Button>
              <Button onClick={send} loading={submit.pending} disabled={!certify || missing.length > 0 || (d.data.application.status === "brouillon" && p.applicationFee > 0 && !method)}>{d.data.application.status === "piece_demandee" ? "Renvoyer le dossier" : p.applicationFee > 0 ? "Soumettre et payer" : "Soumettre ma candidature"} <ArrowRight size={17} /></Button></div>
          </Panel>
        )}
        <p className="mt-4 text-center text-xs text-ink-mute">Connecté·e en tant que {user.firstName} {user.lastName}.</p>
      </div>
    </>
  );
}

function Cond({ ok, t, s }: { ok: boolean; t: string; s: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-[#eef1f8] p-4">{ok ? <CheckCircle2 size={20} className="shrink-0 text-[#0f8a46]" /> : <AlertCircle size={20} className="shrink-0 text-[#a55a00]" />}<span><b className="block text-sm">{t}</b><span className="text-[13px] text-ink-mute">{s}</span></span></div>;
}
