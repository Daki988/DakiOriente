"use client";

import { useEffect, useMemo, useState } from "react";
import { browserMeasure, loadEditorFonts, readLogo, readPhoto, resetMeasureCache } from "@/lib/design/browser";
import { resolveDesign, type RSide } from "@/lib/design/layout";
import { colorOf, FIELDS, FONT_PAIRS, PALETTES, type Design, type Field, type LogoPos } from "@/lib/design/model";
import { ICONS, PATTERN_IDS, PATTERNS, type IconId, type Prim } from "@/lib/design/motifs";
import { SECTORS, sectorTexts } from "@/lib/design/sectors";
import { paletteOf } from "@/lib/design/layout";
import { hasVerso, KINDS, kindFor, MOCKUP_LABELS, mockupsFor, type MockupKind } from "@/lib/design/templates";
import { newDesign as baseDesign, orderedTemplates } from "@/lib/design/defaults";
import { ArrowRight, Check, Upload } from "@/components/Icons";
import { DesignSvg } from "./DesignSvg";
import { Mockup } from "./Mockup";

/** Aperçu d'un motif (2 × 2 carreaux) ou d'un pictogramme, en unités de carreau. */
function Swatch({ shapes, colors, tiles = 1, className }: { shapes: Prim[]; colors: string[]; tiles?: number; className?: string }) {
  const cells = [];
  for (let ty = 0; ty < tiles; ty++) for (let tx = 0; tx < tiles; tx++) cells.push([tx, ty]);
  return (
    <svg viewBox={`0 0 ${tiles} ${tiles}`} className={className} aria-hidden="true">
      {tiles > 1 && <rect width={tiles} height={tiles} fill={colors[0]} />}
      <clipPath id={`sw-${tiles}`}><rect width={tiles} height={tiles} /></clipPath>
      <g clipPath={`url(#sw-${tiles})`}>
        {cells.map(([tx, ty]) => shapes.map((p, i) => {
          const c = colors[p.c] ?? colors[0];
          const key = `${tx}-${ty}-${i}`;
          if (p.k === "rect") return <rect key={key} x={tx + p.x} y={ty + p.y} width={p.w} height={p.h} rx={p.r ?? 0} fill={c} />;
          if (p.k === "ellipse") return <ellipse key={key} cx={tx + p.cx} cy={ty + p.cy} rx={p.rx} ry={p.ry} fill={c} />;
          if (p.k === "ring") return <circle key={key} cx={tx + p.cx} cy={ty + p.cy} r={p.r} fill="none" stroke={c} strokeWidth={p.sw} />;
          return <polygon key={key} points={p.pts.map((v, j) => v + (j % 2 ? ty : tx)).join(" ")} fill={c} />;
        }))}
      </g>
    </svg>
  );
}

export type EditorProduct = { slug: string; name: string; categorySlug: string; wMm: number; hMm: number };
export type EditorResult = { design: Design; sides: RSide[]; file: File; scale: number };

const TABS = [["modeles", "Modèles"], ["ajouter", "Ajouter"], ["textes", "Textes"], ["couleurs", "Couleurs"], ["polices", "Polices"]] as const;
const LOGO_POS: [LogoPos, string][] = [["modele", "Selon le modèle"], ["hg", "Haut gauche"], ["hd", "Haut droite"], ["centre", "Centre"], ["bg", "Bas gauche"], ["bd", "Bas droite"]];
const section = "grid gap-3 border-t border-line pt-5 first:border-t-0 first:pt-0";
const h3 = "flex items-baseline gap-2 font-display text-lg font-bold";
type Tab = (typeof TABS)[number][0];

const input = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[16px] outline-none focus:border-brand";

export const newDesign = (p: EditorProduct) => baseDesign(p);

/** Éditeur plein écran : modèle, textes, logo, couleurs, polices, aperçu réaliste, puis PDF d'impression. */
export function Editor({ product, initial, verso: versoWanted = true, onClose, onDone }: {
  product: EditorProduct; initial?: Design; verso?: boolean; onClose: () => void; onDone: (r: EditorResult) => void;
}) {
  const templates = useMemo(() => orderedTemplates(product), [product]);
  const kind = KINDS[kindFor(product.categorySlug, product.slug)];
  const verso = hasVerso(product.categorySlug) && versoWanted;
  const scenes = mockupsFor(product.categorySlug, product.slug);
  const [scene, setScene] = useState<MockupKind>(scenes[0]);

  const [d, setD] = useState<Design>(() => {
    const base = initial ?? newDesign(product);
    return templates.some((t) => t.id === base.template) ? base : { ...base, template: templates[0].id };
  });
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("modeles");
  const [view, setView] = useState<"plat" | "reel">("plat");
  const [face, setFace] = useState(0);
  const [logoMsg, setLogoMsg] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shirt, setShirt] = useState<"white" | "black">("white");

  useEffect(() => {
    let alive = true;
    loadEditorFonts().then(() => { if (alive) { resetMeasureCache(); setReady(true); } });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => { alive = false; document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  const tpl = templates.find((t) => t.id === d.template) ?? templates[0];
  const sides = useMemo(
    () => (ready ? resolveDesign(tpl, d, product.wMm, product.hMm, verso, browserMeasure) : []),
    [ready, tpl, d, product.wMm, product.hMm, verso],
  );
  // Avec un secteur choisi, les miniatures gardent ses couleurs et son motif ; sinon, ceux de chaque modèle.
  const lookOf = (t: (typeof templates)[number]) => (d.sector ? { fonts: t.fonts } : { palette: t.palette, fonts: t.fonts, pattern: t.pattern ?? d.pattern });
  const thumbs = useMemo(
    () => (ready ? templates.map((t) => ({ t, side: resolveDesign(t, { ...d, template: t.id, ...lookOf(t) }, product.wMm, product.hMm, false, browserMeasure)[0] })) : []),
    [ready, templates, d, product.wMm, product.hMm], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [edited, setEdited] = useState(false);
  const hasPattern = tpl.sides.some((s) => s.els.some((e) => e.t === "pattern" && e.pattern === "auto"));
  const pal = paletteOf(d.palette);

  function pickSector(id: string | null) {
    const sec = SECTORS.find((x) => x.id === id);
    if (!sec) return setD({ ...d, sector: undefined, icon: undefined });
    const k = kindFor(product.categorySlug, product.slug);
    setD({
      ...d, sector: sec.id, icon: sec.icon, palette: sec.palette, pattern: sec.pattern,
      // Les textes d'exemple du métier remplacent les nôtres, jamais ceux saisis par le client.
      fields: edited ? d.fields : { ...sectorTexts(sec, k) },
    });
  }
  const used = useMemo(() => {
    const set = new Set<Field>();
    tpl.sides.slice(0, verso ? 2 : 1).forEach((s) => s.els.forEach((e) => { if (e.t === "text") set.add(e.field); }));
    return FIELDS.filter((f) => set.has(f));
  }, [tpl, verso]);
  const multiline = (f: Field) => tpl.sides.some((s) => s.els.some((e) => e.t === "text" && e.field === f && (e.lines ?? 1) > 1));

  const setField = (f: Field, v: string) => { setEdited(true); setD({ ...d, fields: { ...d.fields, [f]: v } }); };
  const current = sides[Math.min(face, sides.length - 1)];

  async function pickPhoto(file: File | null) {
    setPhotoMsg(null);
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return setPhotoMsg("Format accepté : JPG, PNG ou WebP.");
    if (file.size > 25 * 1024 * 1024) return setPhotoMsg("Photo trop lourde (25 Mo maximum).");
    try {
      const photo = await readPhoto(file);
      setD((x) => ({ ...x, bgImage: photo, bgVeil: x.bgVeil ?? 0.55 }));
      // Netteté estimée à la taille d'impression (fond perdu compris).
      const dpi = Math.round(Math.min(photo.w / ((product.wMm + 6) / 25.4), photo.h / ((product.hMm + 6) / 25.4)));
      const need = Math.max(product.wMm, product.hMm) >= 500 ? 60 : 200;
      if (dpi < need) setPhotoMsg(`Photo un peu petite pour ce format (environ ${dpi} dpi) : elle risque d’être floue. Une photo plus grande sera plus nette.`);
    } catch {
      setPhotoMsg("Impossible de lire cette photo.");
    }
  }

  async function pickLogo(file: File | null) {
    setLogoMsg(null);
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return setLogoMsg("Format accepté : PNG, JPG, WebP ou SVG.");
    if (file.size > 15 * 1024 * 1024) return setLogoMsg("Image trop lourde (15 Mo maximum).");
    try {
      const logo = await readLogo(file);
      setD((x) => ({ ...x, logo }));
      if (file.type !== "image/svg+xml" && Math.max(logo.w, logo.h) < 600) setLogoMsg("Logo un peu petit : il risque d’être flou à l’impression. Une version plus grande sera plus nette.");
    } catch {
      setLogoMsg("Impossible de lire cette image.");
    }
  }

  async function finish() {
    setError(null);
    setBusy(true);
    try {
      const { buildPrintPdf } = await import("@/lib/design/pdf");
      const { bytes, scale } = await buildPrintPdf(sides, `${product.name} · design Neam Print`);
      const name = `${product.slug}-design-en-ligne${scale !== 1 ? "-echelle-1-10" : ""}.pdf`;
      const file = new File([bytes as BlobPart], name, { type: "application/pdf" });
      onDone({ design: d, sides, file, scale });
    } catch {
      setError("Le fichier d’impression n’a pas pu être créé. Réessayez, ou choisissez « Un graphiste le crée ».");
    } finally {
      setBusy(false);
    }
  }

  const doneBtn = (
    <button type="button" onClick={finish} disabled={!ready || busy} className="flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-bold text-white disabled:opacity-60">
      {busy ? "Préparation du fichier…" : <>Utiliser ce design <ArrowRight /></>}
    </button>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="Créer mon design" className="fixed inset-0 z-[60] flex flex-col bg-paper">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 md:px-6">
        <button type="button" onClick={onClose} className="rounded-full border border-line px-3.5 py-2 text-sm font-semibold">Fermer</button>
        <div className="min-w-0 text-center">
          <p className="truncate font-display text-base font-bold">Créer mon <em className="accent">design</em></p>
          <p className="truncate text-xs text-muted">{product.name} · {Math.round(product.wMm)} × {Math.round(product.hMm)} mm</p>
        </div>
        <div className="hidden md:block">{doneBtn}</div>
        <span className="w-[68px] md:hidden" aria-hidden="true" />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:grid-rows-1">
        {/* Aperçu */}
        <section className="flex min-h-0 min-w-0 flex-col gap-2 bg-[#ebe6dc] p-3 md:gap-3 md:p-6" aria-label="Aperçu">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-full bg-white p-1 text-sm font-semibold" role="tablist" aria-label="Vue">
              {([["plat", "À plat"], ["reel", "En situation"]] as const).map(([v, l]) => (
                <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`rounded-full px-3.5 py-1.5 ${view === v ? "bg-ink text-white" : ""}`}>{l}</button>
              ))}
            </div>
            {sides.length > 1 && view === "plat" && (
              <div className="flex rounded-full bg-white p-1 text-sm font-semibold" role="tablist" aria-label="Face">
                {["Recto", "Verso"].map((l, i) => (
                  <button key={l} type="button" role="tab" aria-selected={face === i} onClick={() => setFace(i)} className={`rounded-full px-3.5 py-1.5 ${face === i ? "bg-ink text-white" : ""}`}>{l}</button>
                ))}
              </div>
            )}
            {view === "reel" && scenes.length > 1 && (
              <div className="flex rounded-full bg-white p-1 text-sm font-semibold" role="tablist" aria-label="Mise en scène">
                {scenes.map((k) => (
                  <button key={k} type="button" role="tab" aria-selected={scene === k} onClick={() => setScene(k)} className={`whitespace-nowrap rounded-full px-3 py-1.5 ${scene === k ? "bg-ink text-white" : ""}`}>{MOCKUP_LABELS[k]}</button>
                ))}
              </div>
            )}
            {view === "reel" && scene === "tshirt" && (
              <div className="flex gap-1.5" aria-label="Couleur du t-shirt">
                {(["white", "black"] as const).map((c) => (
                  <button key={c} type="button" aria-pressed={shirt === c} onClick={() => setShirt(c)} className={`size-8 rounded-full border-2 ${shirt === c ? "border-brand" : "border-white"}`} style={{ background: c === "white" ? "#f4f4f2" : "#1f1f22" }} aria-label={c === "white" ? "T-shirt blanc" : "T-shirt noir"} />
                ))}
              </div>
            )}
          </div>
          <div className="grid min-h-0 flex-1 place-items-center">
            {!ready || !current ? (
              <p className="text-sm text-muted">Chargement de l’éditeur…</p>
            ) : view === "plat" ? (
              <DesignSvg side={current} className="size-full max-h-full drop-shadow-[0_12px_24px_rgba(0,0,0,.18)]" title={`Aperçu ${face ? "verso" : "recto"}`} />
            ) : (
              <div className="h-full max-h-full w-full max-w-[640px] overflow-hidden" style={{ aspectRatio: "4 / 3", width: "auto" }}><Mockup kind={scene} sides={sides} tshirt={shirt} /></div>
            )}
          </div>
          {view === "plat" && <p className="hidden text-center text-xs text-muted md:block">Le trait rose marque la coupe : ce qui dépasse sera coupé (fond perdu de 3 mm).</p>}
        </section>

        {/* Réglages */}
        <section className="flex min-h-0 min-w-0 flex-col border-t border-line bg-white md:border-l md:border-t-0">
          <nav className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2" role="tablist" aria-label="Réglages">
            {TABS.map(([v, l]) => (
              <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold ${tab === v ? "bg-brand-soft text-brand" : "text-muted"}`}>{l}</button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
            {tab === "modeles" && (
              <div className="grid gap-3">
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" role="radiogroup" aria-label="Votre activité">
                <button type="button" role="radio" aria-checked={!d.sector} onClick={() => pickSector(null)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold ${!d.sector ? "bg-ink text-white" : "border border-line"}`}>Tous</button>
                {SECTORS.map((sec) => (
                  <button key={sec.id} type="button" role="radio" aria-checked={d.sector === sec.id} onClick={() => pickSector(sec.id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold ${d.sector === sec.id ? "bg-ink text-white" : "border border-line"}`}>
                    <Swatch shapes={ICONS[sec.icon]} colors={[d.sector === sec.id ? "#ffffff" : "#6b12ff", d.sector === sec.id ? "#0d0e12" : "#ffffff"]} className="size-4" />
                    {sec.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {thumbs.map(({ t, side }) => (
                  <button key={t.id} type="button" aria-pressed={d.template === t.id}
                    onClick={() => { setD({ ...d, template: t.id, ...lookOf(t) }); setFace(0); }}
                    className={`grid gap-2 rounded-2xl border-2 p-2 text-left ${d.template === t.id ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>
                    <span className="grid h-28 place-items-center"><DesignSvg side={side} trim className="max-h-28 w-full drop-shadow-md" /></span>
                    <span className="flex items-center justify-between text-sm font-semibold">{t.name}{d.template === t.id && <Check className="size-4 text-brand" />}</span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setTab("ajouter")} className="sticky bottom-0 flex items-center justify-center gap-2 rounded-full border-2 border-brand bg-white px-4 py-3 text-sm font-bold text-brand shadow-[0_-8px_16px_rgba(255,255,255,.9)]">
                Ensuite : ajouter un logo, un slogan ou une photo de fond <ArrowRight className="size-4" />
              </button>
              </div>
            )}

            {tab === "textes" && (
              <div className="grid gap-3">
                {used.map((f) => (
                  <label key={f} className="grid gap-1.5">
                    <span className="text-[13px] font-semibold text-muted">{kind.labels[f]}</span>
                    {multiline(f) || f === "texte" ? (
                      <textarea className={`${input} min-h-20`} value={d.fields[f]} maxLength={400} onChange={(e) => setField(f, e.target.value)} />
                    ) : (
                      <input className={input} value={d.fields[f]} maxLength={120} onChange={(e) => setField(f, e.target.value)} />
                    )}
                  </label>
                ))}
                <p className="text-xs text-muted">Laissez une ligne vide pour la retirer. Les textes trop longs rétrécissent automatiquement.</p>
              </div>
            )}

            {tab === "ajouter" && (
              <div className="grid gap-5">
                <section className={section} aria-labelledby="aj-logo">
                  <h3 id="aj-logo" className={h3}><span className="tabular font-sans text-sm font-normal text-muted">(1)</span> Votre logo</h3>
                {d.logo && (
                  <div className="grid place-items-center rounded-2xl border border-line bg-[conic-gradient(#eee_25%,#fff_0_50%,#eee_0_75%,#fff_0)] bg-[length:16px_16px] p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.logo.src} alt="Votre logo" className="max-h-32 w-auto" />
                  </div>
                )}
                <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-6 text-center hover:border-brand">
                  <Upload className="size-7 text-brand" />
                  <span className="font-bold">{d.logo ? "Changer de logo" : "Ajouter mon logo"}</span>
                  <span className="text-sm text-muted">PNG à fond transparent idéalement · JPG, WebP, SVG acceptés</span>
                  <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => pickLogo(e.target.files?.[0] ?? null)} />
                </label>
                {d.logo && (
                  <fieldset className="grid gap-2">
                    <legend className="mb-1 text-[13px] font-semibold text-muted">Position du logo</legend>
                    <div className="flex flex-wrap gap-2">
                      {LOGO_POS.map(([v, l]) => {
                        const on = (d.logoPos ?? "modele") === v;
                        return <button key={v} type="button" aria-pressed={on} onClick={() => setD({ ...d, logoPos: v })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${on ? "bg-ink text-white" : "border border-line"}`}>{l}</button>;
                      })}
                    </div>
                  </fieldset>
                )}
                {d.logo && <button type="button" onClick={() => setD({ ...d, logo: undefined })} className="w-fit text-sm font-semibold text-danger underline">Retirer le logo</button>}
                {logoMsg && <p role="status" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">{logoMsg}</p>}
                {!d.logo && (
                  <fieldset className="grid gap-2">
                    <legend className="mb-1 text-[13px] font-semibold text-muted">Pas de logo ? Un pictogramme prend sa place</legend>
                    <div className="grid grid-cols-5 gap-2">
                      <button type="button" aria-pressed={!d.icon} onClick={() => setD({ ...d, icon: undefined })}
                        className={`grid aspect-square place-items-center rounded-xl border-2 text-[11px] font-semibold ${!d.icon ? "border-brand bg-brand-soft" : "border-line"}`}>Initiales</button>
                      {(Object.keys(ICONS) as IconId[]).map((ic) => (
                        <button key={ic} type="button" aria-pressed={d.icon === ic} aria-label={SECTORS.find((x) => x.icon === ic)?.name ?? ic} onClick={() => setD({ ...d, icon: ic })}
                          className={`grid aspect-square place-items-center rounded-xl border-2 p-2.5 ${d.icon === ic ? "border-brand bg-brand-soft" : "border-line"}`}>
                          <Swatch shapes={ICONS[ic]} colors={[pal.primary, d.icon === ic ? "#efe6ff" : "#ffffff"]} className="size-full" />
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                </section>

                <section className={section} aria-labelledby="aj-slogan">
                  <h3 id="aj-slogan" className={h3}><span className="tabular font-sans text-sm font-normal text-muted">(2)</span> Un slogan</h3>
                  <input className={input} value={d.slogan ?? ""} maxLength={90} placeholder="Ex. : Le goût du Gabon, depuis 2010" onChange={(e) => setD({ ...d, slogan: e.target.value })} aria-label="Slogan" />
                  <div className="flex flex-wrap gap-2" aria-label="Position du slogan">
                    {([["bas", "Bandeau en bas"], ["haut", "Bandeau en haut"]] as const).map(([v, l]) => {
                      const on = (d.sloganPos ?? "bas") === v;
                      return <button key={v} type="button" aria-pressed={on} onClick={() => setD({ ...d, sloganPos: v })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${on ? "bg-ink text-white" : "border border-line"}`}>{l}</button>;
                    })}
                  </div>
                  <p className="text-xs text-muted">Le slogan s’affiche dans un bandeau à la couleur principale{verso ? ", au recto" : ""}. Laissez vide pour ne pas en mettre.</p>
                </section>

                <section className={section} aria-labelledby="aj-photo">
                  <h3 id="aj-photo" className={h3}><span className="tabular font-sans text-sm font-normal text-muted">(3)</span> Une photo en fond</h3>
                  {d.bgImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.bgImage.src} alt="Votre photo de fond" className="max-h-36 w-full rounded-2xl object-cover" />
                  )}
                  <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-5 text-center hover:border-brand">
                    <Upload className="size-6 text-brand" />
                    <span className="font-bold">{d.bgImage ? "Changer de photo" : "Ajouter une photo"}</span>
                    <span className="text-sm text-muted">Votre boutique, vos plats, vos réalisations… JPG ou PNG</span>
                    <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)} />
                  </label>
                  {d.bgImage && (
                    <>
                      <label className="grid gap-1.5">
                        <span className="flex justify-between text-[13px] font-semibold text-muted">Voile pour garder les textes lisibles <span className="tabular">{Math.round((d.bgVeil ?? 0.55) * 100)} %</span></span>
                        <input type="range" min={0} max={0.9} step={0.05} value={d.bgVeil ?? 0.55} onChange={(e) => setD({ ...d, bgVeil: Number(e.target.value) })} className="w-full accent-[var(--brand)]" />
                      </label>
                      <button type="button" onClick={() => { setD({ ...d, bgImage: undefined }); setPhotoMsg(null); }} className="w-fit text-sm font-semibold text-danger underline">Retirer la photo</button>
                    </>
                  )}
                  {photoMsg && <p role="status" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">{photoMsg}</p>}
                  <p className="text-xs text-muted">Utilisez uniquement vos propres photos ou des photos dont vous avez les droits.</p>
                </section>
              </div>
            )}

            {tab === "couleurs" && (
              <div className="grid gap-4">
                {hasPattern && (
                  <fieldset className="grid gap-2">
                    <legend className="mb-1 text-[13px] font-semibold text-muted">Motif africain</legend>
                    <div className="grid grid-cols-3 gap-2">
                      {PATTERN_IDS.map((id) => {
                        const on = (d.pattern ?? tpl.pattern) === id;
                        return (
                          <button key={id} type="button" aria-pressed={on} onClick={() => setD({ ...d, pattern: id })}
                            className={`grid gap-1 rounded-xl border-2 p-1.5 text-xs font-semibold ${on ? "border-brand bg-brand-soft" : "border-line"}`}>
                            <Swatch shapes={PATTERNS[id].shapes} colors={[colorOf(pal, "primary"), colorOf(pal, "accent"), colorOf(pal, "bg")]} tiles={2} className="aspect-square w-full rounded-lg" />
                            {PATTERNS[id].name}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {PALETTES.map((p) => (
                    <button key={p.id} type="button" aria-pressed={d.palette === p.id} onClick={() => setD({ ...d, palette: p.id })}
                      className={`flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left text-sm font-semibold ${d.palette === p.id ? "border-brand bg-brand-soft" : "border-line"}`}>
                      <span className="flex -space-x-1.5">
                        {[p.primary, p.accent, p.soft, p.ink].map((c) => <span key={c} className="size-5 rounded-full border-2 border-white" style={{ background: c }} />)}
                      </span>
                      {p.name}
                    </button>
                  ))}
                </div>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm font-semibold">
                  Ma couleur (celle de mon logo)
                  <input type="color" className="h-9 w-14 cursor-pointer rounded" value={d.palette.startsWith("custom:") ? d.palette.slice(7) : "#6b12ff"}
                    onChange={(e) => setD({ ...d, palette: `custom:${e.target.value}` })} />
                </label>
              </div>
            )}

            {tab === "polices" && (
              <div className="grid gap-2">
                {FONT_PAIRS.map((f) => (
                  <button key={f.id} type="button" aria-pressed={d.fonts === f.id} onClick={() => setD({ ...d, fonts: f.id })}
                    className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left ${d.fonts === f.id ? "border-brand bg-brand-soft" : "border-line"}`}>
                    <span className="grid">
                      <span style={{ fontFamily: `np-${f.head}` }} className="text-2xl leading-tight">{f.name}</span>
                      <span style={{ fontFamily: `np-${f.body}` }} className="text-sm text-muted">Texte courant, coordonnées</span>
                    </span>
                    {d.fonts === f.id && <Check className="size-5 text-brand" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-2 border-t border-line p-3 md:hidden">
            {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
            {doneBtn}
          </div>
          {error && <p role="alert" className="mx-4 mb-4 hidden rounded-xl bg-danger-soft p-3 text-sm text-danger md:block">{error}</p>}
        </section>
      </div>
    </div>
  );
}
