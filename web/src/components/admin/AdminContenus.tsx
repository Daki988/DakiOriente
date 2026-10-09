"use client";
import { Bold, ExternalLink, Handshake, Heading2, Italic, Link2, List, ListOrdered, Newspaper, Plus, Quote, Smartphone } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Chip, Loading, Panel, Tabs, dateFr, since, useToast } from "@/components/app/kit";
import { Check, Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { Markdown } from "./Markdown";
import { AdminHeader, LoadError, PAYS_OPTS, Reveal, Toggle } from "./shared";

type Article = { id: string; slug: string; title: string; category: string; excerpt: string; body: string; cover: string | null; pays: string[]; published: boolean; publishedAt: string | null; createdAt: string; updatedAt: string };
type Draft = Omit<Article, "id" | "publishedAt" | "createdAt" | "updatedAt">;
const BLANK: Draft = { slug: "", title: "", category: "Orientation", excerpt: "", body: "", cover: null, pays: [], published: false };
const CATS = ["Orientation", "International", "Bourses", "Vie étudiante", "Navilease", "Concours", "Métiers"];
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function AdminContenus() {
  const [tab, setTab] = useState<"articles" | "temoignages" | "partenaires">("articles");
  return (
    <div className="min-w-0">
      <AdminHeader title="Contenus" sub="Articles du blog, témoignages et partenaires affichés sur le site" />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} items={[["articles", "Articles"], ["temoignages", "Témoignages"], ["partenaires", "Partenaires"]]} /></div>
      {tab === "articles" ? <Articles /> : tab === "temoignages" ? <Testimonials /> : <Partners />}
    </div>
  );
}

// ---------------------------------------------------------------- Articles
function Articles() {
  const toast = useToast();
  const list = useApi<Article[]>("/admin/articles");
  const [sel, setSel] = useState<string | "new" | null>(null);
  const [d, setD] = useState<Draft>(BLANK);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [view, setView] = useState<"ecrire" | "apercu">("ecrire");
  const act = useAction();
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (sel === null && list.data?.length) open(list.data[0]); }, [list.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = (a: Article | null) => {
    setErrs({}); act.setError(null); setView("ecrire");
    if (!a) { setSel("new"); setD(BLANK); setSlugTouched(false); return; }
    setSel(a.id); setSlugTouched(true);
    setD({ slug: a.slug, title: a.title, category: a.category, excerpt: a.excerpt, body: a.body, cover: a.cover, pays: a.pays, published: a.published });
  };
  const current = list.data?.find((a) => a.id === sel);
  const dirty = useMemo(() => sel === "new" ? JSON.stringify(d) !== JSON.stringify(BLANK) : current ? JSON.stringify(d) !== JSON.stringify({ slug: current.slug, title: current.title, category: current.category, excerpt: current.excerpt, body: current.body, cover: current.cover, pays: current.pays, published: current.published }) : false, [d, sel, current]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v, ...(k === "title" && !slugTouched ? { slug: slugify(String(v)) } : {}) }));
  const wrap = (before: string, after = "", placeholder = "texte") => {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const inner = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + inner + after + value.slice(e);
    set("body", next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + inner.length); });
  };
  const line = (prefix: string) => {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, value } = el;
    const ls = value.lastIndexOf("\n", s - 1) + 1;
    set("body", value.slice(0, ls) + prefix + value.slice(ls));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + prefix.length, s + prefix.length); });
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const er: Record<string, string> = {};
    if (!/^[a-z0-9-]+$/.test(d.slug)) er.slug = "Minuscules, chiffres et tirets uniquement.";
    if (d.title.trim().length < 5) er.title = "5 caractères minimum.";
    if (d.category.trim().length < 2) er.category = "Catégorie obligatoire.";
    if (d.excerpt.trim().length < 10) er.excerpt = "10 caractères minimum.";
    else if (d.excerpt.length > 400) er.excerpt = "400 caractères maximum.";
    if (d.body.trim().length < 20) er.body = "Le contenu doit faire au moins 20 caractères.";
    setErrs(er);
    if (Object.keys(er).length) return;
    const body = { ...d, title: d.title.trim(), excerpt: d.excerpt.trim(), cover: d.cover?.trim() || null };
    const r = await act.run(() => sel === "new" ? api<Article>("/admin/articles", { body }) : api<Article>(`/admin/articles/${sel}`, { method: "PATCH", body }));
    if (r) {
      toast(sel === "new" ? "Article créé." : "Article enregistré.");
      list.setData((xs) => sel === "new" ? [r, ...(xs ?? [])] : xs?.map((x) => (x.id === r.id ? r : x)));
      setSel(r.id);
    }
  };

  return (
    <div className="grid items-start gap-5 [&>*]:min-w-0 xl:grid-cols-[340px_1fr]">
      <Panel title="Articles" icon={Newspaper} action={<Button size="sm" className="!bg-ink hover:!bg-ink/90" icon={Plus} onClick={() => open(null)}>Nouvel article</Button>}>
        {list.error ? <LoadError error={list.error} reload={list.reload} /> : list.loading && !list.data ? <Loading /> : !list.data?.length ? <p className="text-sm text-ink-mute">Aucun article. Créez le premier.</p> : (
          <ul className="flex max-h-[720px] flex-col gap-2 overflow-y-auto pr-1">
            {sel === "new" && <li className="rounded-2xl border-2 border-ink p-3.5 text-sm"><b>{d.title || "Nouvel article"}</b><span className="block text-xs text-ink-mute">Brouillon non enregistré</span></li>}
            {list.data.map((a, i) => (
              <Reveal key={a.id} i={i} as="li">
                <button onClick={() => open(a)} aria-current={sel === a.id} className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${sel === a.id ? "border-2 border-ink" : "border-slate-200/80 hover:border-brand-300"}`}>
                  <span className="flex min-w-0 flex-1 flex-col"><b className="text-sm leading-snug">{a.title}</b><span className="text-xs text-ink-mute">{a.category} · {a.published ? `publié ${dateFr(a.publishedAt)}` : `modifié ${since(a.updatedAt)}`}</span></span>
                  {a.published ? <Chip tone="green">Publié</Chip> : <Chip tone="grey">Brouillon</Chip>}
                </button>
              </Reveal>
            ))}
          </ul>
        )}
      </Panel>

      {sel && (
        <form onSubmit={save} noValidate className="card flex flex-col gap-4 rounded-[22px] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-extrabold">{sel === "new" ? "Nouvel article" : "Modifier l'article"}</h2>
            <div className="flex items-center gap-3 text-sm">
              {current?.published && <a href={`/actualites/${current.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-bold text-brand-600"><ExternalLink size={14} />Voir</a>}
              <span className={dirty ? "font-semibold text-[#a55a00]" : "text-ink-mute"}>{dirty ? "Modifications non enregistrées" : current ? `Enregistré ${since(current.updatedAt)}` : ""}</span>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titre" required error={errs.title} className="md:col-span-2">{(id) => <Input id={id} value={d.title} onChange={(e) => set("title", e.target.value)} maxLength={200} />}</Field>
            <Field label="Slug (adresse)" required error={errs.slug} hint={`/actualites/${d.slug || "…"}`}>{(id) => <Input id={id} value={d.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase()); }} />}</Field>
            <Field label="Catégorie" required error={errs.category}>{(id) => <><Input id={id} list="cats" value={d.category} onChange={(e) => set("category", e.target.value)} maxLength={40} /><datalist id="cats">{CATS.map((c) => <option key={c} value={c} />)}</datalist></>}</Field>
            <Field label="Chapeau" required error={errs.excerpt} hint={`${d.excerpt.length} / 400`} className="md:col-span-2">{(id) => <Textarea id={id} value={d.excerpt} onChange={(e) => set("excerpt", e.target.value)} className="!min-h-[70px]" maxLength={400} />}</Field>
            <Field label="Image de couverture (URL, facultatif)">{(id) => <Input id={id} value={d.cover ?? ""} onChange={(e) => set("cover", e.target.value)} placeholder="/images/…" />}</Field>
            <fieldset className="flex flex-col gap-1.5"><legend className="mb-1.5 text-[13px] font-bold">Pays ciblés</legend>
              <div className="flex flex-wrap gap-4 pt-2">{PAYS_OPTS.map(([c, n]) => <Check key={c} checked={d.pays.includes(c)} onChange={(v) => set("pays", v ? [...d.pays, c] : d.pays.filter((x) => x !== c))}>{n}</Check>)}</div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="md-body" className="text-[13px] font-bold">Contenu (Markdown) <span className="text-[#d42a50]">*</span></label>
              <div className="xl:hidden"><Tabs value={view} onChange={setView} items={[["ecrire", "Écrire"], ["apercu", "Aperçu"]]} /></div>
            </div>
            <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
              <div className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100 ${view === "apercu" ? "hidden xl:flex" : ""}`}>
                <div className="flex flex-wrap gap-0.5 border-b border-slate-200 bg-[#fafbff] p-1.5" role="toolbar" aria-label="Mise en forme">
                  {([[Heading2, "Titre", () => line("## ")], [Bold, "Gras", () => wrap("**", "**")], [Italic, "Italique", () => wrap("*", "*")], [List, "Liste à puces", () => line("- ")], [ListOrdered, "Liste numérotée", () => line("1. ")], [Quote, "Citation", () => line("> ")], [Link2, "Lien", () => wrap("[", "](https://)", "lien")]] as const).map(([I, l, f]) => (
                    <button key={l} type="button" onClick={f} aria-label={l} title={l} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-white hover:text-ink"><I size={16} /></button>
                  ))}
                </div>
                <textarea ref={ta} id="md-body" value={d.body} onChange={(e) => set("body", e.target.value)} aria-invalid={!!errs.body} className="min-h-[340px] resize-y p-4 font-mono text-[13px] leading-relaxed outline-none" placeholder={"## Intertitre\n\nTexte du paragraphe avec **gras** et [un lien](/formations)."} />
              </div>
              <div className={`${view === "ecrire" ? "hidden xl:block" : ""}`}>
                <div className="mx-auto w-full max-w-[300px] rounded-[30px] border-[6px] border-ink bg-white p-1 shadow-lift" aria-label="Aperçu mobile">
                  <div className="flex items-center justify-center gap-1 py-1 text-[10px] font-bold text-ink-mute"><Smartphone size={11} />Aperçu mobile</div>
                  <div className="h-[420px] overflow-y-auto rounded-[22px] bg-[#f8f9fd] p-4">
                    <span className="eyebrow !text-[10px]">{d.category || "Catégorie"}</span>
                    <h3 className="mt-1 text-lg font-extrabold leading-tight">{d.title || "Titre de l'article"}</h3>
                    {d.excerpt && <p className="mt-2 text-[13px] font-semibold text-ink-soft">{d.excerpt}</p>}
                    <Markdown text={d.body || "*Le contenu apparaîtra ici.*"} className="mt-3 !text-[13px]" />
                  </div>
                </div>
              </div>
            </div>
            {errs.body && <span className="text-xs font-semibold text-[#d42a50]">{errs.body}</span>}
          </div>

          <FormError error={act.error} />
          <div className="flex flex-col gap-3 border-t border-[#eef1f8] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm font-semibold"><Toggle on={d.published} onChange={(v) => set("published", v)} label="Publié" />{d.published ? "Publié sur le site" : "Brouillon (non visible)"}</label>
            <Button type="submit" loading={act.pending} disabled={!dirty && sel !== "new"}>{sel === "new" ? "Créer l'article" : "Enregistrer"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Témoignages et partenaires (création)
function useCreated<T>() { const [items, setItems] = useState<T[]>([]); return { items, add: (t: T) => setItems((x) => [t, ...x]) }; }

function Testimonials() {
  const toast = useToast();
  const act = useAction();
  const created = useCreated<{ id: string; name: string; role: string; quote: string; pays: string | null; published: boolean }>();
  const [f, setF] = useState({ name: "", role: "", quote: "", pays: "", published: true });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Nom obligatoire.";
    if (f.role.trim().length < 2) er.role = "Profil obligatoire (ex. Étudiant · ESCA Casablanca).";
    if (f.quote.trim().length < 15) er.quote = "15 caractères minimum.";
    setErrs(er);
    if (Object.keys(er).length) return;
    const r = await act.run(() => api<typeof created.items[number]>("/admin/temoignages", { body: { name: f.name.trim(), role: f.role.trim(), quote: f.quote.trim(), pays: f.pays || undefined, published: f.published } }));
    if (r) { toast("Témoignage ajouté."); created.add(r); setF({ name: "", role: "", quote: "", pays: "", published: true }); }
  };
  return (
    <div className="grid items-start gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_1fr]">
      <Panel title="Nouveau témoignage" icon={Quote}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom affiché" required error={errs.name}>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ousmane T." />}</Field>
            <Field label="Profil" required error={errs.role}>{(id) => <Input id={id} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="ESCA · Sénégalais" />}</Field>
          </div>
          <Field label="Citation" required error={errs.quote}>{(id) => <Textarea id={id} value={f.quote} onChange={(e) => setF({ ...f, quote: e.target.value })} maxLength={600} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pays">{(id) => <Select id={id} value={f.pays} onChange={(e) => setF({ ...f, pays: e.target.value })} options={PAYS_OPTS} placeholder="—" />}</Field>
            <div className="flex flex-col gap-1.5"><span className="text-[13px] font-bold">Publication</span><label className="flex items-center gap-3 py-2 text-sm"><Toggle on={f.published} onChange={(v) => setF({ ...f, published: v })} label="Publié" />{f.published ? "Publié" : "Masqué"}</label></div>
          </div>
          <FormError error={act.error} />
          <div className="flex justify-end"><Button type="submit" icon={Plus} loading={act.pending}>Ajouter le témoignage</Button></div>
        </form>
      </Panel>
      <Panel title="Ajoutés pendant cette session" icon={Quote}>
        {!created.items.length ? <p className="text-sm text-ink-mute">Les témoignages créés apparaîtront ici. Ils sont affichés sur la page d&apos;accueil lorsqu&apos;ils sont publiés.</p> : created.items.map((t) => (
          <figure key={t.id} className="rounded-2xl border border-slate-200/80 p-4"><blockquote className="text-sm text-ink-soft">« {t.quote} »</blockquote><figcaption className="mt-2 flex items-center justify-between text-sm"><b>{t.name} <span className="font-normal text-ink-mute">· {t.role}</span></b>{t.published ? <Chip tone="green">Publié</Chip> : <Chip tone="grey">Masqué</Chip>}</figcaption></figure>
        ))}
      </Panel>
    </div>
  );
}

function Partners() {
  const toast = useToast();
  const act = useAction();
  const created = useCreated<{ id: string; name: string; kind: string; url: string | null; featured: boolean }>();
  const [f, setF] = useState({ name: "", kind: "etablissement", url: "", logo: "", featured: false });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Nom obligatoire.";
    if (f.url && !/^https?:\/\/\S+\.\S+/.test(f.url)) er.url = "Adresse web invalide (https://…).";
    setErrs(er);
    if (Object.keys(er).length) return;
    const r = await act.run(() => api<typeof created.items[number]>("/admin/partenaires", { body: { name: f.name.trim(), kind: f.kind, url: f.url || undefined, logo: f.logo || undefined, featured: f.featured } }));
    if (r) { toast("Partenaire ajouté."); created.add(r); setF({ name: "", kind: "etablissement", url: "", logo: "", featured: false }); }
  };
  const KINDS: [string, string][] = [["etablissement", "Établissement"], ["institution", "Institution / ministère"], ["entreprise", "Entreprise"], ["paiement", "Partenaire de paiement"], ["media", "Média"], ["association", "Association"]];
  return (
    <div className="grid items-start gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_1fr]">
      <Panel title="Nouveau partenaire" icon={Handshake}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom" required error={errs.name}>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
            <Field label="Type">{(id) => <Select id={id} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} options={KINDS} />}</Field>
            <Field label="Site web" error={errs.url}>{(id) => <Input id={id} type="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://" />}</Field>
            <Field label="Logo (chemin ou URL)">{(id) => <Input id={id} value={f.logo} onChange={(e) => setF({ ...f, logo: e.target.value })} placeholder="/logos/…" />}</Field>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold"><Toggle on={f.featured} onChange={(v) => setF({ ...f, featured: v })} label="Mis en avant" />Mis en avant sur la page d&apos;accueil</label>
          <FormError error={act.error} />
          <div className="flex justify-end"><Button type="submit" icon={Plus} loading={act.pending}>Ajouter le partenaire</Button></div>
        </form>
      </Panel>
      <Panel title="Ajoutés pendant cette session" icon={Handshake}>
        {!created.items.length ? <p className="text-sm text-ink-mute">Les partenaires créés apparaîtront ici.</p> : created.items.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 p-3.5 text-sm"><span><b>{p.name}</b> <span className="text-ink-mute">· {KINDS.find(([k]) => k === p.kind)?.[1] ?? p.kind}</span></span>{p.featured && <Chip tone="sun">Mis en avant</Chip>}</div>
        ))}
      </Panel>
    </div>
  );
}

