"use client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Download, FileUp, History, Pencil, Plus, Search, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Chip, Loading, Panel, Tabs, dateFr, useToast } from "@/components/app/kit";
import { Field, FormError, Input, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { AdminHeader, Confirm, LoadError, Toggle, nf, qs, useDebounced } from "./shared";

type Ref = "formations" | "metiers" | "series" | "competences" | "domaines" | "pays";
type Item = Record<string, unknown> & { id: string; published?: boolean };
type FieldDef = { k: string; l: string; type?: "number" | "long"; required?: boolean; list?: "domaines" };
type Version = { v: { id: string; referentiel: string; action: string; itemId: string | null; before: unknown; after: unknown; createdAt: string }; author: { firstName: string; lastName: string } | null };

const CONF: Record<Ref, { label: string; main: string; fields: FieldDef[]; cols: [string, string][]; publishable?: boolean; template: Item }> = {
  formations: { label: "Formations", main: "intitule", publishable: true, cols: [["diplome", "Diplôme"], ["duree_annees", "Durée"], ["domaine", "Domaine"]],
    fields: [{ k: "intitule", l: "Intitulé", required: true }, { k: "domaine", l: "Domaine", list: "domaines" }, { k: "diplome", l: "Diplôme" }, { k: "niveau", l: "Niveau (ex. niv-bac3)" }, { k: "duree_annees", l: "Durée (années)", type: "number" }, { k: "mode_admission", l: "Mode d'admission" }],
    template: { id: "frm-", intitule: "", domaine: "", diplome: "", niveau: "", duree_annees: 3, mode_admission: "dossier", metiers: [], competences: [], etablissements: [], series_recommandees: {} } },
  metiers: { label: "Métiers", main: "nom", publishable: true, cols: [["domaine", "Domaine"], ["niveau_min", "Niveau min."], ["riasec", "RIASEC"]],
    fields: [{ k: "nom", l: "Nom", required: true }, { k: "domaine", l: "Domaine", list: "domaines" }, { k: "niveau_min", l: "Niveau minimum" }, { k: "description", l: "Description", type: "long" }],
    template: { id: "met-", nom: "", domaine: "", niveau_min: "", description: "", riasec: [], missions: [], secteurs: [], formations: [], competences: [] } },
  series: { label: "Séries", main: "intitule", cols: [["code", "Code"], ["pays", "Pays"], ["filiere", "Filière"]],
    fields: [{ k: "code", l: "Code" }, { k: "pays", l: "Pays (GA, MA, SN)", required: true }, { k: "intitule", l: "Intitulé" }, { k: "filiere", l: "Filière" }],
    template: { id: "", code: "", pays: "GA", intitule: "", filiere: "générale", riasec: [], domaines_ouverts: [], matieres_dominantes: [] } },
  competences: { label: "Compétences", main: "libelle", cols: [["categorie", "Catégorie"], ["domaine", "Domaine"]],
    fields: [{ k: "libelle", l: "Libellé", required: true }, { k: "categorie", l: "Catégorie" }, { k: "domaine", l: "Domaine", list: "domaines" }],
    template: { id: "cmp-", libelle: "", categorie: "transversale", domaine: null } },
  domaines: { label: "Domaines", main: "libelle", cols: [["description", "Description"]],
    fields: [{ k: "libelle", l: "Libellé", required: true }, { k: "description", l: "Description", type: "long" }],
    template: { id: "dom-", libelle: "", description: "" } },
  pays: { label: "Pays", main: "nom", cols: [["capitale", "Capitale"], ["monnaie", "Monnaie"], ["indicatif", "Indicatif"]],
    fields: [{ k: "nom", l: "Nom", required: true }, { k: "capitale", l: "Capitale" }, { k: "monnaie", l: "Monnaie (code ISO)" }, { k: "indicatif", l: "Indicatif" }],
    template: { id: "", nom: "", capitale: "", monnaie: "", indicatif: "", villes_universitaires: [], paiement_mobile: [] } },
};
const REFS = Object.keys(CONF) as Ref[];
const show = (v: unknown) => v == null || v === "" ? "—" : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? "{…}" : String(v);
const ACTION: Record<string, string> = { creation: "Création", modification: "Modification", suppression: "Suppression", import_json: "Import JSON", import_csv: "Import CSV" };

export function AdminReferentiels() {
  const toast = useToast();
  const [nom, setNom] = useState<Ref>("formations");
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const list = useApi<Item[]>(`/admin/referentiels/${nom}${qs({ q: dq })}`);
  const domaines = useApi<Item[]>("/admin/referentiels/domaines");
  const hist = useApi<Version[]>(`/admin/referentiels-historique${qs({ nom })}`);
  const [edit, setEdit] = useState<{ item: Item; isNew: boolean } | null>(null);
  const [del, setDel] = useState<Item | null>(null);
  const delAct = useAction();
  const c = CONF[nom];
  const domLabel = useMemo(() => Object.fromEntries((domaines.data ?? []).map((d) => [d.id, String(d.libelle ?? d.id)])), [domaines.data]);

  useEffect(() => { setQ(""); setEdit(null); }, [nom]);
  const refresh = () => { list.reload(); hist.reload(); };

  const remove = async () => {
    if (!del) return;
    const r = await delAct.run(() => api(`/admin/referentiels/${nom}/${encodeURIComponent(del.id)}`, { method: "DELETE" }));
    if (r) { toast("Élément supprimé (version conservée dans l'historique)."); setDel(null); refresh(); }
  };

  return (
    <div className="min-w-0">
      <AdminHeader title="Référentiels" sub="Données de référence partagées par tout Navigoal · versionnées à chaque modification"
        actions={<>
          <a className="btn-ghost" href={`/api/admin/referentiels/${nom}/?format=json`} download><Download size={17} />Export JSON</a>
          <a className="btn-ghost" href={`/api/admin/referentiels/${nom}/?format=csv`} download><Download size={17} />Export CSV</a>
          <Button className="!bg-ink hover:!bg-ink/90" icon={Plus} onClick={() => setEdit({ item: structuredClone(c.template), isNew: true })}>Ajouter</Button>
        </>} />

      <div className="mb-4"><Tabs value={nom} onChange={setNom} items={REFS.map((r) => [r, <>{CONF[r].label}{r === nom && list.data && !dq ? ` (${list.data.length})` : ""}</>])} /></div>

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative sm:w-80"><span className="sr-only">Rechercher</span><Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Rechercher dans les ${c.label.toLowerCase()}`} className="pl-10" /></label>
        {list.data && <span className="text-sm text-ink-mute">{nf(list.data.length)} élément{list.data.length > 1 ? "s" : ""}{dq ? ` pour « ${dq} »` : ""}</span>}
      </div>

      <Panel className="mb-5">
        {list.error ? <LoadError error={list.error} reload={list.reload} /> : list.loading && !list.data ? <Loading /> : list.data && (
          !list.data.length ? <p className="py-8 text-center text-sm text-ink-mute">Aucun élément.</p> : (
            <div className="-mx-5 max-h-[620px] overflow-auto sm:-mx-6">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-white"><tr className="border-b border-[#eef1f8] text-left text-[11px] font-extrabold uppercase text-ink-mute">
                  <th className="px-5 py-2.5 sm:px-6">{CONF[nom].fields[0].l} · identifiant</th>
                  {c.cols.map(([k, l]) => <th key={k} className="px-3 py-2.5">{l}</th>)}
                  {c.publishable && <th className="px-3 py-2.5">Statut</th>}
                  <th className="px-5 py-2.5 sm:px-6"><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>
                  {list.data.map((it) => (
                    <tr key={it.id} className={`border-b border-[#f1f4fb] last:border-0 ${edit?.item.id === it.id ? "bg-brand-50/60" : "hover:bg-[#fafbff]"}`}>
                      <td className="px-5 py-3 sm:px-6"><b className="block">{show(it[c.main])}</b><span className="text-xs text-ink-mute">{it.id}</span></td>
                      {c.cols.map(([k]) => <td key={k} className="max-w-[260px] truncate px-3 py-3 text-ink-soft">{k === "duree_annees" && it[k] != null ? `${it[k]} an${Number(it[k]) > 1 ? "s" : ""}` : k === "domaine" && domLabel[String(it[k])] ? domLabel[String(it[k])] : show(it[k])}</td>)}
                      {c.publishable && <td className="px-3 py-3">{it.published === false ? <Chip tone="grey">Masqué</Chip> : <Chip tone="green">Publié</Chip>}</td>}
                      <td className="px-5 py-3 text-right sm:px-6">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setEdit({ item: structuredClone(it), isNew: false })} aria-label={`Modifier ${it.id}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f5fb] text-ink-soft hover:bg-[#e8ecf8]"><Pencil size={15} /></button>
                          <button onClick={() => { delAct.setError(null); setDel(it); }} aria-label={`Supprimer ${it.id}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f5fb] text-[#d42a50] hover:bg-[#ffecef]"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Panel>

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-2">
        <Import nom={nom} onDone={refresh} />
        <Panel title="Historique des versions" icon={History}>
          {hist.error ? <LoadError error={hist.error} reload={hist.reload} /> : hist.loading && !hist.data ? <Loading /> : <HistoryList rows={hist.data ?? []} />}
        </Panel>
      </div>

      <datalist id="ref-domaines">{domaines.data?.map((d) => <option key={d.id} value={d.id}>{String(d.libelle ?? "")}</option>)}</datalist>
      <EditDrawer nom={nom} edit={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); refresh(); }} />
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} pending={delAct.pending} error={delAct.error} tone="danger" title="Supprimer cet élément ?" confirm="Supprimer">
        {del && <p><b>{show(del[c.main])}</b> ({del.id}) sera retiré du référentiel {c.label.toLowerCase()}. Les liens croisés (métiers, formations, séries) qui le citent ne seront plus résolus. La version précédente reste consultable dans l&apos;historique.</p>}
      </Confirm>
    </div>
  );
}

function EditDrawer({ nom, edit, onClose, onSaved }: { nom: Ref; edit: { item: Item; isNew: boolean } | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const act = useAction();
  const c = CONF[nom];
  const [obj, setObj] = useState<Item | null>(null);
  const [text, setText] = useState("");
  const [jsonErr, setJsonErr] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!edit) return;
    setObj(edit.item); setText(JSON.stringify(edit.item, null, 2)); setJsonErr(null); setErrs({}); act.setError(null);
  }, [edit]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!edit) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [edit, onClose]);

  const setField = (k: string, v: unknown) => { if (!obj) return; const n = { ...obj, [k]: v }; setObj(n); setText(JSON.stringify(n, null, 2)); setJsonErr(null); };
  const onJson = (t: string) => {
    setText(t);
    try {
      const v = JSON.parse(t);
      if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("L'élément doit être un objet JSON { … }.");
      setObj(v); setJsonErr(null);
    } catch (e) { setJsonErr(e instanceof SyntaxError ? `JSON invalide : ${e.message}` : (e as Error).message); }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obj || jsonErr) return;
    const er: Record<string, string> = {};
    if (!/^[A-Za-z0-9-]+$/.test(String(obj.id ?? ""))) er.id = "Identifiant : lettres, chiffres et tirets uniquement.";
    c.fields.filter((f) => f.required).forEach((f) => { if (!String(obj[f.k] ?? "").trim()) er[f.k] = "Champ obligatoire."; });
    setErrs(er);
    if (Object.keys(er).length) return;
    const r = await act.run(() => api(`/admin/referentiels/${nom}`, { method: "PUT", body: obj }));
    if (r) { toast(edit?.isNew ? "Élément ajouté au référentiel." : "Modification enregistrée (nouvelle version)."); onSaved(); }
  };
  const dirty = useMemo(() => edit && obj && JSON.stringify(edit.item) !== JSON.stringify(obj), [edit, obj]);

  return (
    <AnimatePresence>
      {edit && obj && (
        <motion.div className="fixed inset-0 z-[90] flex justify-end bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.form role="dialog" aria-modal="true" aria-label={edit.isNew ? "Ajouter un élément" : "Modifier l'élément"} onSubmit={save} noValidate onClick={(e) => e.stopPropagation()}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="flex h-full w-full max-w-[560px] flex-col bg-white shadow-lift">
            <div className="flex items-center justify-between gap-3 border-b border-[#eef1f8] px-5 py-4 sm:px-6">
              <div className="min-w-0"><span className="eyebrow">{c.label}</span><h2 className="truncate text-lg font-extrabold">{edit.isNew ? "Nouvel élément" : "Modifier"} <span className="font-semibold text-ink-mute">· {obj.id || "…"}</span></h2></div>
              <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f1f4fd]"><X size={18} /></button>
            </div>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Identifiant" required error={errs.id} hint={edit.isNew ? "Unique, non modifiable ensuite." : "Non modifiable."}>{(id) => <Input id={id} value={String(obj.id ?? "")} readOnly={!edit.isNew} onChange={(e) => setField("id", e.target.value.trim())} className={!edit.isNew ? "bg-[#f6f8fc] text-ink-mute" : ""} />}</Field>
                {c.publishable && (
                  <div className="flex flex-col gap-1.5"><span className="text-[13px] font-bold">Publication</span>
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"><Toggle on={obj.published !== false} onChange={(v) => setField("published", v)} label="Publié" />{obj.published !== false ? "Publié" : "Masqué"}</label>
                  </div>
                )}
                {c.fields.map((f) => (
                  <Field key={f.k} label={f.l} required={f.required} error={errs[f.k]} className={f.type === "long" || f.k === c.main ? "sm:col-span-2" : ""}>
                    {(id) => f.type === "long"
                      ? <Textarea id={id} value={String(obj[f.k] ?? "")} onChange={(e) => setField(f.k, e.target.value)} className="!min-h-[80px]" />
                      : <Input id={id} type={f.type === "number" ? "number" : "text"} list={f.list ? "ref-domaines" : undefined} value={obj[f.k] == null ? "" : String(obj[f.k])}
                          onChange={(e) => setField(f.k, f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} />}
                  </Field>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ref-json" className="flex items-center justify-between text-[13px] font-bold">Élément complet (JSON)
                  {jsonErr ? <span className="flex items-center gap-1 text-xs text-[#d42a50]"><AlertCircle size={13} />Invalide</span> : <span className="flex items-center gap-1 text-xs text-[#0f8a46]"><CheckCircle2 size={13} />JSON valide</span>}
                </label>
                <textarea id="ref-json" value={text} onChange={(e) => onJson(e.target.value)} spellCheck={false} aria-invalid={!!jsonErr} aria-describedby="ref-json-msg"
                  className={`input min-h-[280px] resize-y font-mono text-[12px] leading-relaxed ${jsonErr ? "!border-[#d42a50] focus:!ring-[#ffd0d9]" : ""}`} />
                <span id="ref-json-msg" className={`text-xs ${jsonErr ? "font-semibold text-[#d42a50]" : "text-ink-mute"}`}>{jsonErr ?? "Les champs ci-dessus et le JSON restent synchronisés. Les listes (métiers, compétences, séries…) s'éditent ici."}</span>
              </div>
              <FormError error={act.error} />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-[#eef1f8] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
              <Button type="submit" className="!bg-ink hover:!bg-ink/90" loading={act.pending} disabled={!!jsonErr || (!edit.isNew && !dirty)}>{edit.isNew ? "Ajouter" : "Enregistrer"}</Button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Import({ nom, onDone }: { nom: Ref; onDone: () => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ n: number; ids: string[] } | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const act = useAction();
  useEffect(() => { setFile(null); setPreview(null); setLocalErr(null); }, [nom]);

  const pick = async (f: File) => {
    setLocalErr(null); setPreview(null); act.setError(null);
    if (!/\.(json|csv)$/i.test(f.name)) { setFile(null); setLocalErr("Format accepté : .json ou .csv"); return; }
    if (f.size > 5 * 1024 * 1024) { setFile(null); setLocalErr("Fichier trop volumineux (5 Mo maximum)."); return; }
    setFile(f);
    const t = await f.text();
    try {
      if (/\.json$/i.test(f.name)) {
        const j = JSON.parse(t);
        const items = Array.isArray(j) ? j : j.items;
        if (!Array.isArray(items)) throw new Error("Le JSON doit être un tableau ou un objet { items: [...] }.");
        setPreview({ n: items.length, ids: items.slice(0, 6).map((x: Item) => String(x?.id ?? "?")) });
      } else {
        const lines = t.trim().split(/\r?\n/);
        const cols = lines[0].split(";").map((x) => x.trim());
        if (!cols.includes("id")) throw new Error("La première ligne du CSV doit contenir une colonne « id » (séparateur « ; »).");
        const idx = cols.indexOf("id");
        setPreview({ n: lines.length - 1, ids: lines.slice(1, 7).map((l) => l.split(";")[idx]?.trim() ?? "?") });
      }
    } catch (e) { setLocalErr(e instanceof SyntaxError ? `JSON invalide : ${e.message}` : (e as Error).message); }
  };
  const send = async () => {
    if (!file) return;
    const fd = new FormData(); fd.append("fichier", file);
    const r = await act.run(() => api<{ importes: number }>(`/admin/referentiels/${nom}/import`, { form: fd }));
    if (r) { toast(`${r.importes} élément${r.importes > 1 ? "s" : ""} importé${r.importes > 1 ? "s" : ""}.`); setFile(null); setPreview(null); if (input.current) input.current.value = ""; onDone(); }
  };

  return (
    <Panel title="Import" icon={FileUp}>
      <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
        className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${over ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-[#fbfcff] hover:border-brand-400"}`}>
        <UploadCloud className="text-brand-600" />
        <b className="text-sm">{file ? file.name : `Dépose un fichier CSV ou JSON (${CONF[nom].label.toLowerCase()})`}</b>
        <span className="text-xs text-ink-mute">JSON : tableau ou {"{ items: [...] }"} · CSV : séparateur « ; », listes séparées par « | »</span>
      </button>
      <input ref={input} type="file" accept=".json,.csv,application/json,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }} aria-label="Fichier à importer" />
      {localErr && <p className="text-xs font-semibold text-[#d42a50]" role="alert">{localErr}</p>}
      {preview && !localErr && (
        <div className="flex flex-col gap-2 rounded-2xl bg-[#f6f8fc] p-3.5 text-sm">
          <span><b>{preview.n}</b> élément{preview.n > 1 ? "s" : ""} détecté{preview.n > 1 ? "s" : ""} · les identifiants existants seront mis à jour, les nouveaux créés.</span>
          <div className="flex flex-wrap gap-1.5">{preview.ids.map((id, i) => <Chip key={i} tone="grey">{id}</Chip>)}{preview.n > preview.ids.length && <Chip tone="grey">+{preview.n - preview.ids.length}</Chip>}</div>
        </div>
      )}
      <FormError error={act.error} />
      <div className="flex justify-end"><Button icon={act.pending ? undefined : FileUp} loading={act.pending} disabled={!file || !!localErr} onClick={send}>Importer dans « {CONF[nom].label} »</Button></div>
    </Panel>
  );
}

function HistoryList({ rows }: { rows: Version[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-mute">Aucune modification enregistrée pour ce référentiel.</p>;
  return (
    <ol className="flex max-h-[420px] flex-col overflow-y-auto pr-1">
      {rows.map(({ v, author }, i) => (
        <li key={v.id} className="flex gap-3">
          <div className="flex flex-col items-center"><span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${i === 0 ? "bg-ink" : v.action === "suppression" ? "bg-[#d42a50]" : "bg-brand-200"}`} />{i < rows.length - 1 && <span className="my-1 w-0.5 flex-1 bg-[#e3e8f5]" />}</div>
          <div className="flex min-w-0 flex-1 flex-col pb-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <b className="text-sm">{ACTION[v.action] ?? v.action}{v.itemId ? <span className="font-semibold text-ink-mute"> · {v.itemId}</span> : ""}</b>
              <span className="text-xs text-ink-mute">{dateFr(v.createdAt, true)}</span>
            </div>
            <span className="text-xs text-ink-mute">{author ? `${author.firstName} ${author.lastName}` : "Système"}{v.action.startsWith("import") && v.after ? ` · ${(v.after as { count?: number }).count ?? 0} éléments` : ""}</span>
            {(v.before != null || (v.after != null && !v.action.startsWith("import"))) && (
              <button onClick={() => setOpen(open === v.id ? null : v.id)} className="mt-1 self-start text-xs font-bold text-brand-600" aria-expanded={open === v.id}>{open === v.id ? "Masquer le détail" : "Voir le détail"}</button>
            )}
            {open === v.id && <Diff before={v.before} after={v.after} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Diff({ before, after }: { before: unknown; after: unknown }) {
  const b = (before ?? {}) as Record<string, unknown>, a = (after ?? {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]));
  if (!keys.length) return <p className="mt-1 text-xs text-ink-mute">Aucune différence de contenu.</p>;
  return (
    <ul className="mt-2 flex flex-col gap-1.5 rounded-xl bg-[#f6f8fc] p-3 font-mono text-[11px]">
      {keys.slice(0, 12).map((k) => (
        <li key={k} className="break-all"><b className="text-ink">{k}</b> : {before != null && <span className="bg-[#ffecef] text-[#a3133b] line-through">{JSON.stringify(b[k]) ?? "∅"}</span>} {after != null && <span className="bg-[#e8f8ef] text-[#0b6b37]">{JSON.stringify(a[k]) ?? "∅"}</span>}</li>
      ))}
      {keys.length > 12 && <li className="text-ink-mute">… {keys.length - 12} autres champs</li>}
    </ul>
  );
}

