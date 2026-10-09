"use client";
/* eslint-disable @next/next/no-img-element -- photos privées servies par l'API, non optimisables par next/image */
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, FileText, Gavel, Home, Lock, MapPin, ScanFace, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Avatar, Button, Chip, Dialog, Empty, Kpi, Loading, Panel, StatusBadge, Table, dateFr, money, since, useToast } from "@/components/app/kit";
import { Field, FormError, Select, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { AdminHeader, Flag, LoadError, Reveal } from "./shared";

type Housing = { id: string; title: string; type: string; description: string; pays: string; ville: string; quartier: string | null; address: string | null; rent: number; charges: number; deposit: number; currency: string; surface: number | null; rooms: number | null; capacity: number; gender: string; furnished: boolean; amenities: string[]; rules: string | null; minMonths: number; availableFrom: string | null; photos: string[]; verification: string; moderationNote: string | null; updatedAt: string };
type Queue = {
  housings: { h: Housing; l: { firstName: string; lastName: string } }[];
  kyc: { l: { userId: string; kind: string; company: string | null; kycDocumentIds: string[]; payoutMethod: string | null; payoutAccount: string | null; updatedAt: string }; u: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null } }[];
  disputes: { d: { id: string; bookingId: string; reason: string; description: string; status: string; createdAt: string }; b: { number: string; currency: string } }[];
};
type Pay = { p: { id: string; reference: string; kind: string; amount: number; currency: string; escrow: string; status: string; bookingId: string | null; createdAt: string }; payer: { firstName: string; lastName: string } };

const TYPE: Record<string, string> = { studio: "Studio", chambre: "Chambre", colocation: "Colocation", appartement: "Appartement", residence: "Résidence", chez_habitant: "Chez l'habitant" };
const VERIF: [string, string][] = [["non_verifie", "Non vérifié"], ["identite", "Identité vérifiée"], ["visite", "Visité par Navigoal"], ["partenaire", "Partenaire certifié"]];
const photoUrl = (key: string) => `/api/fichiers/${key}/`;

/** Contrôles automatiques simples (coordonnées, photos, caution). */
function checks(h: Housing): { ok: boolean; t: string }[] {
  const contact = /(\+?\d[\d .-]{7,}\d)|(@[a-z0-9-]+\.[a-z]{2,})|whats ?app/i.test(`${h.description} ${h.rules ?? ""}`);
  return [
    { ok: h.photos.length >= 3, t: `${h.photos.length} photo${h.photos.length > 1 ? "s" : ""} fournie${h.photos.length > 1 ? "s" : ""}` },
    { ok: !contact, t: contact ? "Coordonnées détectées dans la description" : "Aucune coordonnée dans la description" },
    { ok: h.deposit <= h.rent * 3, t: h.deposit <= h.rent * 3 ? "Caution ≤ 3 mois de loyer" : "Caution supérieure à 3 mois de loyer" },
    { ok: !!h.address, t: h.address ? "Adresse renseignée (masquée au public)" : "Adresse manquante" },
  ];
}

export function AdminNavilease() {
  const { data, error, loading, reload } = useApi<Queue>("/admin/moderation");
  const escrow = useApi<Pay[]>("/admin/paiements?sequestre=bloque");
  const frozen = useApi<Pay[]>("/admin/paiements?sequestre=litige");
  const [review, setReview] = useState<Queue["housings"][number] | null>(null);
  const [kyc, setKyc] = useState<Queue["kyc"][number] | null>(null);
  const [dispute, setDispute] = useState<Queue["disputes"][number] | null>(null);
  const sum = (rows?: Pay[]) => Object.entries((rows ?? []).reduce<Record<string, number>>((a, r) => ((a[r.p.currency] = (a[r.p.currency] ?? 0) + r.p.amount), a), {}));
  const blocked = sum(escrow.data);

  return (
    <div className="min-w-0">
      <AdminHeader title="Navilease · modération" sub="Annonces, identité des bailleurs, litiges et fonds en séquestre" />
      {error ? <LoadError error={error} reload={reload} /> : loading && !data ? <Loading /> : data && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Reveal i={0}><Kpi icon={Home} tone="sun" label="Annonces à modérer" value={data.housings.length} sub={data.housings[0] ? `plus ancienne : ${since(data.housings[0].h.updatedAt)}` : "file vide"} /></Reveal>
            <Reveal i={1}><Kpi icon={ScanFace} tone="violet" label="KYC à valider" value={data.kyc.length} sub="identité + propriété" /></Reveal>
            <Reveal i={2}><Kpi icon={Gavel} tone="rose" label="Litiges ouverts" value={data.disputes.length} sub="ouverts ou en médiation" /></Reveal>
            <Reveal i={3}><Kpi icon={Lock} tone="green" label="Fonds bloqués" value={blocked.length ? <span className="flex flex-col text-[22px]">{blocked.map(([c, n]) => <span key={c}>{money(n, c)}</span>)}</span> : "0"} sub={`${escrow.data?.length ?? 0} paiement${(escrow.data?.length ?? 0) > 1 ? "s" : ""} en séquestre`} /></Reveal>
          </div>

          <Panel title="Annonces à modérer" icon={Home} action={<Chip tone="sun">{data.housings.length}</Chip>}>
            {!data.housings.length ? <Empty icon={CheckCircle2} title="Aucune annonce en attente" text="Les annonces soumises par les bailleurs apparaîtront ici." /> : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.housings.map((x, i) => (
                  <Reveal key={x.h.id} i={i}>
                    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                      <div className="grid h-40 grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 bg-[#eef1f8]">
                        {[0, 1, 2].map((k) => x.h.photos[k]
                          ? <img key={k} src={photoUrl(x.h.photos[k])} alt={`Photo ${k + 1} de ${x.h.title}`} className={`h-full w-full object-cover ${k === 0 ? "row-span-2" : ""}`} loading="lazy" />
                          : <div key={k} className={`flex items-center justify-center text-ink-mute ${k === 0 ? "row-span-2" : ""}`}><Home size={20} /></div>)}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <b className="leading-tight">{x.h.title}</b>
                        <span className="text-xs text-ink-mute">{x.l.firstName} {x.l.lastName[0]}. · {x.h.ville} · {TYPE[x.h.type] ?? x.h.type} · <b className="text-ink">{money(x.h.rent, x.h.currency)}</b></span>
                        <ul className="flex flex-col gap-1 text-[13px]">{checks(x.h).slice(0, 3).map((c) => <li key={c.t} className="flex items-center gap-1.5">{c.ok ? <CheckCircle2 size={14} className="shrink-0 text-[#0f8a46]" /> : <AlertTriangle size={14} className="shrink-0 text-[#dd7f02]" />}{c.t}</li>)}</ul>
                        <Button size="sm" className="mt-auto" onClick={() => setReview(x)}>Examiner l&apos;annonce</Button>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
          </Panel>

          <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-2">
            <Panel title="KYC bailleurs à valider" icon={ScanFace} className="scroll-mt-24" action={<Chip tone="violet">{data.kyc.length}</Chip>}>
              <div id="kyc" className="flex flex-col gap-3">
                {!data.kyc.length ? <p className="py-4 text-sm text-ink-mute">Aucune vérification d&apos;identité en attente.</p> : data.kyc.map((k, i) => (
                  <Reveal key={k.u.id} i={i}>
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 p-3.5">
                      <Avatar name={`${k.u.firstName} ${k.u.lastName}`} size={38} />
                      <div className="flex min-w-0 flex-1 flex-col"><b className="text-sm">{k.l.company ?? `${k.u.firstName} ${k.u.lastName}`}</b><span className="truncate text-xs text-ink-mute">{k.l.kind} · {k.l.kycDocumentIds.length} pièce{k.l.kycDocumentIds.length > 1 ? "s" : ""} · {k.u.email ?? k.u.phone}</span></div>
                      <Chip tone="sun">À valider</Chip>
                      <Button size="sm" variant="ghost" onClick={() => setKyc(k)}>Examiner</Button>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Panel>
            <Panel title="Litiges en médiation" icon={Gavel} action={<Chip tone="rose">{data.disputes.length}</Chip>}>
              <div id="litiges" className="scroll-mt-24">
                <Table rows={data.disputes} rowKey={(r) => r.d.id} onRow={setDispute} empty="Aucun litige ouvert." cols={[
                  { h: "Réservation", c: (r) => <b className="whitespace-nowrap">{r.b.number}</b> },
                  { h: "Objet", c: (r) => <div className="flex max-w-[240px] flex-col"><b className="truncate">{r.d.reason}</b><span className="truncate text-xs text-ink-mute">{r.d.description}</span></div> },
                  { h: "Statut", c: (r) => <StatusBadge status={r.d.status} /> },
                  { h: "Ouvert", c: (r) => <span className="whitespace-nowrap text-ink-mute">{since(r.d.createdAt)}</span> },
                  { h: <span className="sr-only">Action</span>, className: "text-right", c: () => <span className="text-[13px] font-bold text-brand-600">Résoudre</span> },
                ]} />
              </div>
            </Panel>
          </div>

          <Panel title="Séquestre" icon={Lock} action={<span className="flex flex-wrap gap-2 text-xs font-bold">{blocked.map(([c, n]) => <Chip key={c} tone="violet"><Lock size={12} />Bloqués {money(n, c)}</Chip>)}{sum(frozen.data).map(([c, n]) => <Chip key={c} tone="rose">Gelés {money(n, c)}</Chip>)}</span>}>
            {escrow.error ? <LoadError error={escrow.error} reload={escrow.reload} /> : (
              <Table rows={[...(frozen.data ?? []), ...(escrow.data ?? [])]} rowKey={(r) => r.p.id} empty="Aucun fonds en séquestre." cols={[
                { h: "Référence", c: (r) => <b className="whitespace-nowrap">{r.p.reference}</b> },
                { h: "Payeur", c: (r) => `${r.payer.firstName} ${r.payer.lastName}` },
                { h: "Montant", c: (r) => <b className="whitespace-nowrap">{money(r.p.amount, r.p.currency)}</b> },
                { h: "Depuis", c: (r) => <span className="text-ink-mute">{dateFr(r.p.createdAt)}</span> },
                { h: "État", c: (r) => r.p.escrow === "litige" ? <Chip tone="rose">Gelé (litige)</Chip> : <StatusBadge status="bloque" /> },
              ]} />
            )}
            <p className="text-xs text-ink-mute">Les fonds sont versés automatiquement au bailleur 48 h après l&apos;entrée confirmée ; en cas de litige, la décision de médiation libère ou rembourse le séquestre.</p>
          </Panel>
        </div>
      )}

      <Dialog open={!!review} onClose={() => setReview(null)} title="Examen de l'annonce" wide>{review && <ReviewHousing x={review} onDone={() => { setReview(null); reload(); }} />}</Dialog>
      <Dialog open={!!kyc} onClose={() => setKyc(null)} title="Vérification d'identité du bailleur">{kyc && <ReviewKyc k={kyc} onDone={() => { setKyc(null); reload(); }} />}</Dialog>
      <Dialog open={!!dispute} onClose={() => setDispute(null)} title={dispute ? `Litige · ${dispute.b.number}` : ""}>{dispute && <ResolveDispute x={dispute} onDone={() => { setDispute(null); reload(); escrow.reload(); frozen.reload(); }} />}</Dialog>
    </div>
  );
}

function ReviewHousing({ x, onDone }: { x: Queue["housings"][number]; onDone: () => void }) {
  const toast = useToast();
  const act = useAction();
  const h = x.h;
  const [idx, setIdx] = useState(0);
  const [note, setNote] = useState("");
  const [verif, setVerif] = useState(h.verification);
  const [noteErr, setNoteErr] = useState<string | null>(null);
  const decide = async (publier: boolean) => {
    if (!publier && note.trim().length < 10) { setNoteErr("Expliquez au bailleur ce qu'il doit corriger (10 caractères minimum)."); return; }
    setNoteErr(null);
    const r = await act.run(() => api(`/admin/logements/${h.id}/moderation`, { body: { publier, note: note.trim() || undefined, verification: verif } }));
    if (r) { toast(publier ? "Annonce publiée, le bailleur est notifié." : "Annonce renvoyée au bailleur pour correction."); onDone(); }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-[#eef1f8]">
        {h.photos.length ? <img src={photoUrl(h.photos[idx])} alt={`Photo ${idx + 1} sur ${h.photos.length}`} className="aspect-[16/9] w-full object-cover" /> : <div className="flex aspect-[16/9] items-center justify-center text-ink-mute">Aucune photo</div>}
        {h.photos.length > 1 && <>
          <button onClick={() => setIdx((idx - 1 + h.photos.length) % h.photos.length)} aria-label="Photo précédente" className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"><ChevronLeft size={18} /></button>
          <button onClick={() => setIdx((idx + 1) % h.photos.length)} aria-label="Photo suivante" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"><ChevronRight size={18} /></button>
          <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-bold text-white">{idx + 1} / {h.photos.length}</span>
        </>}
      </div>
      {h.photos.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1">{h.photos.map((p, i) => <button key={p} onClick={() => setIdx(i)} aria-label={`Afficher la photo ${i + 1}`} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === idx ? "border-brand-600" : "border-transparent"}`}><img src={photoUrl(p)} alt="" className="h-full w-full object-cover" /></button>)}</div>}
      <div>
        <h3 className="text-lg font-extrabold">{h.title}</h3>
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-ink-mute"><MapPin size={14} /><Flag code={h.pays} /> {h.ville}{h.quartier ? ` · ${h.quartier}` : ""} · {TYPE[h.type] ?? h.type} · bailleur {x.l.firstName} {x.l.lastName}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[["Loyer", money(h.rent, h.currency)], ["Charges", money(h.charges, h.currency)], ["Caution", money(h.deposit, h.currency)], ["Capacité", `${h.capacity} pers.${h.surface ? ` · ${h.surface} m²` : ""}`]].map(([l, v]) => <div key={l} className="rounded-xl bg-[#f6f8fc] p-2.5"><span className="block text-[11px] font-bold uppercase text-ink-mute">{l}</span><b>{v}</b></div>)}
      </div>
      {h.moderationNote && <p className="rounded-xl bg-[#fff7dd] px-3.5 py-2.5 text-sm text-[#8a4b00]"><b>Note précédente / alerte : </b>{h.moderationNote}</p>}
      <p className="whitespace-pre-line text-sm text-ink-soft">{h.description}</p>
      {h.amenities.length > 0 && <div className="flex flex-wrap gap-1.5">{h.amenities.map((a) => <Chip key={a} tone="grey">{a.replace(/_/g, " ")}</Chip>)}</div>}
      <div className="rounded-2xl border border-slate-200/80 p-3.5">
        <b className="mb-2 block text-sm">Contrôles automatiques</b>
        <ul className="grid gap-1.5 text-[13px] sm:grid-cols-2">{checks(h).map((c) => <li key={c.t} className="flex items-center gap-1.5">{c.ok ? <CheckCircle2 size={14} className="shrink-0 text-[#0f8a46]" /> : <AlertTriangle size={14} className="shrink-0 text-[#dd7f02]" />}{c.t}</li>)}</ul>
      </div>
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <Field label="Niveau de vérification">{(id) => <Select id={id} value={verif} onChange={(e) => setVerif(e.target.value)} options={VERIF} />}</Field>
        <Field label="Note au bailleur" hint="Obligatoire en cas de refus ; visible par le bailleur." error={noteErr}>{(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} className="!min-h-[80px]" placeholder="Ex. : merci d'ajouter une photo de la salle d'eau." />}</Field>
      </div>
      <FormError error={act.error} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" className="!border-[#ffd0d9] !text-[#d42a50]" disabled={act.pending} onClick={() => decide(false)}>Refuser / demander une correction</Button>
        <Button className="!bg-[#0f8a46] hover:!bg-[#0b7a3c]" icon={CheckCircle2} loading={act.pending} onClick={() => decide(true)}>Publier l&apos;annonce</Button>
      </div>
    </div>
  );
}

function ReviewKyc({ k, onDone }: { k: Queue["kyc"][number]; onDone: () => void }) {
  const toast = useToast();
  const act = useAction();
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState<string | null>(null);
  const decide = async (valider: boolean) => {
    if (!valider && note.trim().length < 10) { setNoteErr("Indiquez le motif du refus (10 caractères minimum)."); return; }
    setNoteErr(null);
    const r = await act.run(() => api(`/admin/bailleurs/${k.u.id}/kyc`, { body: { valider, note: note.trim() || undefined } }));
    if (r) { toast(valider ? "Identité validée : les annonces passent au niveau « identité vérifiée »." : "KYC refusé, le bailleur est notifié."); onDone(); }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3"><Avatar name={`${k.u.firstName} ${k.u.lastName}`} size={44} /><div><b className="block">{k.u.firstName} {k.u.lastName}{k.l.company ? ` · ${k.l.company}` : ""}</b><span className="text-sm text-ink-mute">{k.l.kind} · {k.u.email ?? "—"} · {k.u.phone ?? "—"}</span></div></div>
      <div className="flex flex-col gap-2">
        <b className="text-sm">Pièces justificatives</b>
        {k.l.kycDocumentIds.length ? k.l.kycDocumentIds.map((id, i) => (
          <a key={id} href={`/api/documents/${id}/fichier/`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-200/80 p-3 text-sm hover:border-brand-300 hover:bg-brand-50/40">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><FileText size={17} /></span>
            <span className="flex-1 font-semibold">Pièce {i + 1}{i === 0 ? " (identité)" : i === 1 ? " (propriété / mandat)" : ""}</span>
            <span className="text-[13px] font-bold text-brand-600">Ouvrir</span>
          </a>
        )) : <p className="text-sm text-ink-mute">Aucune pièce jointe.</p>}
      </div>
      {k.l.payoutMethod && <p className="rounded-xl bg-[#f6f8fc] px-3.5 py-2.5 text-sm">Versements : <b>{k.l.payoutMethod.replace(/_/g, " ")}</b> · {k.l.payoutAccount}</p>}
      <Field label="Note" hint="Obligatoire en cas de refus ; transmise au bailleur." error={noteErr}>{(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} className="!min-h-[80px]" placeholder="Ex. : appel de contrôle effectué le…" />}</Field>
      <FormError error={act.error} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" className="!border-[#ffd0d9] !text-[#d42a50]" disabled={act.pending} onClick={() => decide(false)}>Refuser</Button>
        <Button className="!bg-[#0f8a46] hover:!bg-[#0b7a3c]" icon={ShieldCheck} loading={act.pending} onClick={() => decide(true)}>Valider l&apos;identité</Button>
      </div>
    </div>
  );
}

function ResolveDispute({ x, onDone }: { x: Queue["disputes"][number]; onDone: () => void }) {
  const toast = useToast();
  const act = useAction();
  const [resolution, setResolution] = useState("");
  const [seq, setSeq] = useState<"" | "libere" | "rembourse">("");
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resolution.trim().length < 10) { setErr("Décrivez la décision de médiation (10 caractères minimum)."); return; }
    setErr(null);
    const r = await act.run(() => api(`/admin/litiges/${x.d.id}/resolution`, { body: { resolution: resolution.trim(), sequestre: seq || undefined } }));
    if (r) { toast("Litige résolu, les deux parties sont notifiées."); onDone(); }
  };
  const opts: ["" | "libere" | "rembourse", string, string][] = [["libere", "Libérer au bailleur", "Les fonds bloqués sont versés au bailleur ; la location se poursuit."], ["rembourse", "Rembourser le locataire", "Les fonds sont restitués ; la réservation est annulée."], ["", "Ne pas toucher au séquestre", "Décision sans mouvement de fonds."]];
  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="rounded-2xl bg-[#fff1f3] p-3.5 text-sm"><div className="mb-1 flex items-center justify-between gap-2"><b>{x.d.reason}</b><StatusBadge status={x.d.status} /></div><p className="whitespace-pre-line text-ink-soft">{x.d.description}</p><span className="mt-1 block text-xs text-ink-mute">Ouvert le {dateFr(x.d.createdAt, true)}</span></div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[13px] font-bold">Séquestre</legend>
        {opts.map(([v, l, d]) => (
          <label key={v || "none"} className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm ${seq === v ? "border-brand-500 bg-brand-50/60" : "border-slate-200"}`}>
            <input type="radio" name="seq" checked={seq === v} onChange={() => setSeq(v)} className="mt-1 accent-brand-600" />
            <span><b className="block">{l}</b><span className="text-xs text-ink-mute">{d}</span></span>
          </label>
        ))}
      </fieldset>
      <Field label="Décision de médiation" required error={err}>{(id) => <Textarea id={id} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Ex. : remboursement de 70 % de la caution après constat." />}</Field>
      <FormError error={act.error} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="submit" icon={Gavel} loading={act.pending}>Clore le litige</Button></div>
    </form>
  );
}

