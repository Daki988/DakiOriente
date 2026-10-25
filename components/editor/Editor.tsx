"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { browserMeasure, loadEditorFonts, readLogo, readPhoto, resetMeasureCache } from "@/lib/design/browser";
import { elKey, paletteOf, resolveDesign, type RSide } from "@/lib/design/layout";
import { colorOf, FIELDS, FONT_PAIRS, PALETTES, type Color, type Design, type Field, type FontKey, type LogoPos, type Qr } from "@/lib/design/model";
import { ICONS, PATTERN_IDS, PATTERNS, type IconId, type Prim } from "@/lib/design/motifs";
import { SECTORS, sectorTexts } from "@/lib/design/sectors";
import { TEMPLATE_PALETTES } from "@/lib/design/canva";
import { CLIPART_IDS, CLIPARTS } from "@/lib/design/clipart";
import { drawLogo, renderLogo, type LogoSpec } from "@/lib/design/logo-maker";
import { hasVerso, KINDS, kindFor, MOCKUP_LABELS, mockupsFor, type MockupKind } from "@/lib/design/templates";
import { newDesign as baseDesign, orderedTemplates, sampleFields } from "@/lib/design/defaults";
import { Check, Upload } from "@/components/Icons";
import { DesignSvg } from "./DesignSvg";
import { Mockup } from "./Mockup";
import {
  CartIcon, ClipartIcon, CloseIcon, CubeIcon, DotsIcon, ImageIcon, LogoIcon, MenuIcon, PaletteIcon, QrIcon,
  RedoIcon, TemplatesIcon, TextIcon, TrashIcon, UndoIcon, ZoomInIcon, ZoomOutIcon,
} from "./ToolIcons";

/** Aperçu d'un motif (2 × 2 carreaux) ou d'un pictogramme, en unités de carreau. */
function Swatch({ shapes, colors, tiles = 1, className }: { shapes: Prim[]; colors: string[]; tiles?: number; className?: string }) {
  const cells = [];
  for (let ty = 0; ty < tiles; ty++) for (let tx = 0; tx < tiles; tx++) cells.push([tx, ty]);
  return (
    <svg viewBox={`0 0 ${tiles} ${tiles}`} className={className} aria-hidden="true" overflow="visible">
      {tiles > 1 && <rect width={tiles} height={tiles} fill={colors[0]} />}
      {cells.map(([tx, ty]) => shapes.map((p, i) => {
        const c = colors[p.c] ?? colors[0];
        const key = `${tx}-${ty}-${i}`;
        if (p.k === "rect") return <rect key={key} x={tx + p.x} y={ty + p.y} width={p.w} height={p.h} rx={p.r ?? 0} fill={c} />;
        if (p.k === "ellipse") return <ellipse key={key} cx={tx + p.cx} cy={ty + p.cy} rx={p.rx} ry={p.ry} fill={c} />;
        if (p.k === "ring") return <circle key={key} cx={tx + p.cx} cy={ty + p.cy} r={p.r} fill="none" stroke={c} strokeWidth={p.sw} />;
        return <polygon key={key} points={p.pts.map((v, j) => v + (j % 2 ? ty : tx)).join(" ")} fill={c} />;
      }))}
    </svg>
  );
}

export type EditorProduct = { slug: string; name: string; categorySlug: string; wMm: number; hMm: number };
export type EditorResult = { design: Design; sides: RSide[]; file: File; scale: number };

type Sheet = "texte" | "images" | "modeles" | "clipart" | "logo" | "qr" | "couleurs";
const BOTTOM: [Sheet, string, (p: { className?: string }) => React.ReactNode][] = [
  ["texte", "Texte", TextIcon], ["images", "Images", ImageIcon], ["modeles", "Modèles", TemplatesIcon],
  ["clipart", "Clipart", ClipartIcon], ["logo", "Créer Logo", LogoIcon], ["qr", "Code QR", QrIcon],
];
const TITLES: Record<Sheet, string> = {
  texte: "Textes et polices", images: "Images", modeles: "Modèles", clipart: "Clipart", logo: "Créer mon logo", qr: "Code QR", couleurs: "Couleurs et motifs",
};
const LOGO_POS: [LogoPos, string][] = [["modele", "Selon le modèle"], ["hg", "Haut gauche"], ["hd", "Haut droite"], ["centre", "Centre"], ["bg", "Bas gauche"], ["bd", "Bas droite"]];
const QR_POS: [Qr["pos"], string][] = [["hg", "Haut gauche"], ["hd", "Haut droite"], ["centre", "Centre"], ["bg", "Bas gauche"], ["bd", "Bas droite"]];
const ZOOMS = [1, 1.5, 2, 3];

const input = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[16px] outline-none focus:border-brand";
const label = "text-[13px] font-semibold text-muted";
const chip = (on: boolean) => `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${on ? "bg-ink text-white" : "border border-line bg-white"}`;
const drop = "flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-5 text-center hover:border-brand";
const toolBtn = "grid size-10 shrink-0 place-items-center rounded-full text-ink hover:bg-paper disabled:opacity-30";

export const newDesign = (p: EditorProduct) => baseDesign(p);

/**
 * Éditeur plein écran, disposé comme une appli mobile : barre d'outils en haut, onglets Recto / Verso,
 * plan de travail avec repères (coupe en rouge, zone de sécurité en vert) et barre d'onglets en bas.
 */
export function Editor({ product, initial, verso: versoWanted = true, onClose, onDone }: {
  product: EditorProduct; initial?: Design; verso?: boolean; onClose: () => void; onDone: (r: EditorResult) => void;
}) {
  const templates = useMemo(() => orderedTemplates(product), [product]);
  const kindId = kindFor(product.categorySlug, product.slug);
  const kind = KINDS[kindId];
  const verso = hasVerso(product.categorySlug) && versoWanted;
  const scenes = mockupsFor(product.categorySlug, product.slug);
  const [scene, setScene] = useState<MockupKind>(scenes[0]);

  /* ───── Design et historique (annuler / rétablir) ───── */
  const [d, setRaw] = useState<Design>(() => {
    const base = initial ?? newDesign(product);
    return templates.some((t) => t.id === base.template) ? base : { ...base, template: templates[0].id };
  });
  const cur = useRef(d);
  cur.current = d;
  const past = useRef<Design[]>([]);
  const future = useRef<Design[]>([]);
  const lastPush = useRef(0);
  const setD = useCallback((next: Design | ((x: Design) => Design)) => {
    const prev = cur.current;
    const n = typeof next === "function" ? next(prev) : next;
    if (n === prev) return;
    // La frappe continue ne crée qu'une étape d'historique.
    const now = Date.now();
    if (now - lastPush.current > 700) past.current = [...past.current.slice(-59), prev];
    lastPush.current = now;
    future.current = [];
    cur.current = n;
    setRaw(n);
  }, []);
  const undo = useCallback(() => {
    const p = past.current.pop();
    if (!p) return;
    future.current.push(cur.current);
    lastPush.current = 0;
    cur.current = p;
    setRaw(p);
  }, []);
  const redo = useCallback(() => {
    const n = future.current.pop();
    if (!n) return;
    past.current.push(cur.current);
    lastPush.current = 0;
    cur.current = n;
    setRaw(n);
  }, []);

  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [menu, setMenu] = useState<"menu" | "more" | null>(null);
  const [view3d, setView3d] = useState(false);
  const [guides, setGuides] = useState(true);
  const [zoom, setZoom] = useState(0);
  const [face, setFace] = useState(0);
  const [clipSel, setClipSel] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ logo?: string; photo?: string; tplPhoto?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shirt, setShirt] = useState<"white" | "black">("white");
  const [edited, setEdited] = useState(Boolean(initial));
  const stage = useRef<HTMLDivElement>(null);
  // Le zoom part du centre du plan de travail.
  useEffect(() => {
    const el = stage.current;
    if (el) el.scrollTo({ left: (el.scrollWidth - el.clientWidth) / 2, top: (el.scrollHeight - el.clientHeight) / 2 });
  }, [zoom, sheet]);

  useEffect(() => {
    let alive = true;
    loadEditorFonts().then(() => { if (alive) { resetMeasureCache(); setReady(true); } });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { alive = false; document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
      if (e.key === "Escape") {
        if (view3d) setView3d(false); else if (menu) setMenu(null); else if (sheet) setSheet(null); else onClose();
      } else if (!typing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, undo, redo, sheet, menu, view3d]);

  const tpl = templates.find((t) => t.id === d.template) ?? templates[0];
  const sides = useMemo(
    () => (ready ? resolveDesign(tpl, d, product.wMm, product.hMm, verso, browserMeasure) : []),
    [ready, tpl, d, product.wMm, product.hMm, verso],
  );
  const faceIdx = Math.min(face, Math.max(sides.length - 1, 0));
  const current = sides[faceIdx];
  const pal = paletteOf(d.palette);
  // Avec un secteur choisi, les miniatures gardent ses couleurs et son motif ; sinon, ceux de chaque modèle.
  const lookOf = (t: (typeof templates)[number]) => (d.sector ? { fonts: t.fonts } : { palette: t.palette, fonts: t.fonts, pattern: t.pattern ?? d.pattern });
  const thumbs = useMemo(
    () => (ready && sheet === "modeles"
      ? templates.map((t) => ({ t, side: resolveDesign(t, { ...d, template: t.id, ...lookOf(t), fields: edited ? d.fields : sampleFields(t, kindId) }, product.wMm, product.hMm, false, browserMeasure)[0] }))
      : []),
    [ready, sheet, templates, d, product.wMm, product.hMm, edited], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const shown = tpl.sides.slice(0, verso ? 2 : 1);
  const hasPattern = shown.some((s) => s.els.some((e) => e.t === "pattern" && e.pattern === "auto"));
  const used = useMemo(() => {
    const set = new Set<Field>();
    shown.forEach((s) => s.els.forEach((e) => { if (e.t === "text" && e.field) set.add(e.field); }));
    return FIELDS.filter((f) => set.has(f));
  }, [shown]);
  const multiline = (f: Field) => shown.some((s) => s.els.some((e) => e.t === "text" && e.field === f && (e.lines ?? 1) > 1));
  // Textes et photos propres au modèle, modifiables par le client.
  const literals = shown.flatMap((s, i) => s.els.flatMap((e) => (e.t === "text" && e.id && e.text ? [{ face: i, id: e.id, text: e.text, lines: e.lines ?? 1 }] : [])));
  const tplPhotos = shown.flatMap((s) => s.els.flatMap((e) => (e.t === "photo" && e.id ? [{ id: e.id, src: e.src }] : [])));
  const uniquePhotos = tplPhotos.filter((p, i) => tplPhotos.findIndex((q) => q.id === p.id) === i);

  const setField = (f: Field, v: string) => { setEdited(true); setD((x) => ({ ...x, fields: { ...x.fields, [f]: v } })); };
  const setLiteral = (id: string, v: string) => setD((x) => ({ ...x, texts: { ...x.texts, [elKey(tpl, id)]: v } }));
  const open = (s: Sheet) => { setMenu(null); setSheet((x) => (x === s ? null : s)); };

  function pickTemplate(t: (typeof templates)[number]) {
    setD((x) => ({ ...x, template: t.id, ...lookOf(t), fields: edited ? x.fields : sampleFields(t, kindId) }));
    setFace(0);
    setClipSel(null);
  }

  function pickSector(id: string | null) {
    const sec = SECTORS.find((x) => x.id === id);
    if (!sec) return setD((x) => ({ ...x, sector: undefined, icon: undefined }));
    setD((x) => ({
      ...x, sector: sec.id, icon: sec.icon, palette: sec.palette, pattern: sec.pattern,
      // Les textes d'exemple du métier remplacent les nôtres, jamais ceux saisis par le client.
      fields: edited ? x.fields : { ...sectorTexts(sec, kindId) },
    }));
  }

  /** Photo lue et contrôlée (netteté estimée à la taille d'impression, fond perdu compris). */
  async function loadPhoto(file: File | null, key: "photo" | "tplPhoto", frac = 1) {
    setMsg((m) => ({ ...m, [key]: undefined }));
    if (!file) return null;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setMsg((m) => ({ ...m, [key]: "Format accepté : JPG, PNG ou WebP." })); return null; }
    if (file.size > 25 * 1024 * 1024) { setMsg((m) => ({ ...m, [key]: "Photo trop lourde (25 Mo maximum)." })); return null; }
    try {
      const photo = await readPhoto(file);
      const dpi = Math.round(Math.min(photo.w / (((product.wMm + 6) * frac) / 25.4), photo.h / (((product.hMm + 6) * frac) / 25.4)));
      const need = Math.max(product.wMm, product.hMm) >= 500 ? 60 : 200;
      if (dpi < need) setMsg((m) => ({ ...m, [key]: `Photo un peu petite pour ce format (environ ${dpi} dpi) : elle risque d’être floue.` }));
      return photo;
    } catch {
      setMsg((m) => ({ ...m, [key]: "Impossible de lire cette photo." }));
      return null;
    }
  }

  async function pickLogo(file: File | null) {
    setMsg((m) => ({ ...m, logo: undefined }));
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return setMsg((m) => ({ ...m, logo: "Format accepté : PNG, JPG, WebP ou SVG." }));
    if (file.size > 15 * 1024 * 1024) return setMsg((m) => ({ ...m, logo: "Image trop lourde (15 Mo maximum)." }));
    try {
      const logo = await readLogo(file);
      setD((x) => ({ ...x, logo }));
      if (file.type !== "image/svg+xml" && Math.max(logo.w, logo.h) < 600) setMsg((m) => ({ ...m, logo: "Logo un peu petit : il risque d’être flou à l’impression." }));
    } catch {
      setMsg((m) => ({ ...m, logo: "Impossible de lire cette image." }));
    }
  }

  /* ───── Cliparts ───── */
  const clips = d.clips ?? [];
  const sel = clipSel !== null && clips[clipSel]?.side === faceIdx ? clipSel : null;
  const addClip = (art: string) => {
    setD((x) => ({ ...x, clips: [...(x.clips ?? []), { art, side: faceIdx, x: 0.5, y: 0.5, s: 0.25, color: "accent" }] }));
    setClipSel(clips.length);
  };
  const editClip = (patch: Partial<(typeof clips)[number]>) => {
    if (sel === null) return;
    setD((x) => ({ ...x, clips: (x.clips ?? []).map((c, i) => (i === sel ? { ...c, ...patch } : c)) }));
  };
  const removeClip = () => {
    if (sel === null) return;
    setD((x) => ({ ...x, clips: (x.clips ?? []).filter((_, i) => i !== sel) }));
    setClipSel(null);
  };

  /** Corbeille : retire le clipart choisi, sinon remet le modèle à zéro (annulable). */
  function trash() {
    if (sheet === "clipart" && sel !== null) return removeClip();
    const fresh = newDesign(product);
    setD({ ...fresh, template: tpl.id, palette: tpl.palette, fonts: tpl.fonts, fields: sampleFields(tpl, kindId) });
    setEdited(false);
    setClipSel(null);
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

  const scale = d.textScale ?? 1;
  const setScale = (v: number) => setD((x) => ({ ...x, textScale: Math.round(Math.min(1.5, Math.max(0.7, v)) * 10) / 10 }));
  const colorRoles: [Color, string][] = [["primary", pal.primary], ["accent", pal.accent], ["ink", pal.ink], ["soft", pal.soft], ["#ffffff", "#ffffff"], ["#0d0e12", "#0d0e12"]];

  return (
    <div role="dialog" aria-modal="true" aria-label="Créer mon design" className="fixed inset-0 z-[60] flex flex-col bg-[#e9e8ee]">
      {/* Barre d'outils */}
      <header className="relative flex items-center gap-0.5 border-b border-line bg-white px-1.5 py-1.5 sm:gap-1 sm:px-3">
        <button type="button" className={toolBtn} aria-label="Menu" aria-expanded={menu === "menu"} onClick={() => setMenu(menu === "menu" ? null : "menu")}><MenuIcon /></button>
        <button type="button" className={toolBtn} aria-label={sheet === "clipart" && sel !== null ? "Supprimer le clipart" : "Tout recommencer"} onClick={trash}><TrashIcon /></button>
        <button type="button" className={toolBtn} aria-label="Annuler" onClick={undo} disabled={!past.current.length}><UndoIcon /></button>
        <button type="button" className={toolBtn} aria-label="Rétablir" onClick={redo} disabled={!future.current.length}><RedoIcon /></button>
        <button type="button" className={toolBtn} aria-label="Zoomer" onClick={() => setZoom((z) => Math.min(z + 1, ZOOMS.length - 1))} disabled={zoom === ZOOMS.length - 1}><ZoomInIcon /></button>
        <button type="button" className={toolBtn} aria-label="Dézoomer" onClick={() => setZoom((z) => Math.max(z - 1, 0))} disabled={zoom === 0}><ZoomOutIcon /></button>
        <button type="button" className={toolBtn} aria-label="Plus d’options" aria-expanded={menu === "more"} onClick={() => setMenu(menu === "more" ? null : "more")}><DotsIcon /></button>
        <button type="button" className={toolBtn} aria-label="Voir en situation (3D)" onClick={() => setView3d(true)} disabled={!ready}><CubeIcon /></button>
        <span className="flex-1" />
        <button type="button" onClick={finish} disabled={!ready || busy} aria-label="Utiliser ce design"
          className="flex h-10 items-center gap-2 rounded-full bg-brand px-4 font-bold text-white disabled:opacity-60">
          <CartIcon className="size-5" /><span className="hidden sm:inline">{busy ? "Préparation…" : "Utiliser ce design"}</span>
        </button>

        {menu && (
          <>
            <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(null)} />
            <div className={`absolute top-full z-20 mt-1 grid w-64 gap-0.5 rounded-2xl border border-line bg-white p-2 shadow-xl ${menu === "menu" ? "left-2" : "left-1/2 -translate-x-1/2 sm:left-56 sm:translate-x-0"}`} role="menu">
              {menu === "menu" ? (
                <>
                  <p className="px-3 pb-1 pt-1.5 text-xs text-muted">{product.name} · {Math.round(product.wMm)} × {Math.round(product.hMm)} mm</p>
                  {(["modeles", "texte", "images", "couleurs"] as Sheet[]).map((s) => (
                    <button key={s} type="button" role="menuitem" onClick={() => open(s)} className="rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-paper">{TITLES[s]}</button>
                  ))}
                  <button type="button" role="menuitem" onClick={() => { setMenu(null); setView3d(true); }} className="rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-paper">Voir en situation</button>
                  <button type="button" role="menuitem" onClick={onClose} className="rounded-xl px-3 py-2.5 text-left font-semibold text-danger hover:bg-paper">Fermer l’éditeur</button>
                </>
              ) : (
                <>
                  <button type="button" role="menuitemcheckbox" aria-checked={guides} onClick={() => setGuides(!guides)} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-paper">
                    Repères de coupe {guides && <Check className="size-4 text-brand" />}
                  </button>
                  <p className="px-3 pb-2 text-xs leading-relaxed text-muted">
                    <span className="font-semibold text-[#e5262b]">Rouge</span> : ligne de coupe, ce qui dépasse sera coupé (fond perdu de 3 mm).{" "}
                    <span className="font-semibold text-[#17a34a]">Vert</span> : zone de sécurité, gardez-y les textes importants.
                  </p>
                  <button type="button" role="menuitem" onClick={() => { setMenu(null); trash(); }} className="rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-paper">Recommencer ce modèle</button>
                </>
              )}
            </div>
          </>
        )}
      </header>

      {/* Recto / Verso */}
      <div className="flex border-b border-line bg-white" role="tablist" aria-label="Face">
        {verso && sides.length > 1 ? ["Recto", "Verso"].map((l, i) => (
          <button key={l} type="button" role="tab" aria-selected={faceIdx === i} onClick={() => { setFace(i); setClipSel(null); }}
            className={`flex-1 border-b-[3px] py-2.5 text-sm font-bold ${faceIdx === i ? "border-brand text-brand" : "border-transparent text-muted"}`}>{l}</button>
        )) : (
          <p className="flex-1 border-b-[3px] border-brand py-2.5 text-center text-sm font-bold text-brand">Recto <span className="font-normal text-muted">· {product.name}</span></p>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Plan de travail */}
        <section className={`flex min-h-0 flex-1 flex-col ${sheet ? "md:pr-[432px]" : ""}`} aria-label="Plan de travail">
          <div ref={stage} className="min-h-0 flex-1 overflow-auto">
            <div className="grid place-items-center p-4 sm:p-8" style={{ width: `${ZOOMS[zoom] * 100}%`, height: `${ZOOMS[zoom] * 100}%`, minWidth: "100%", minHeight: "100%" }}>
              {!ready || !current ? (
                <p className="text-sm text-muted">Chargement de l’éditeur…</p>
              ) : (
                <DesignSvg side={current} guides={guides} className="size-full max-h-full drop-shadow-[0_10px_22px_rgba(0,0,0,.16)]" title={`Aperçu ${faceIdx ? "verso" : "recto"}`} />
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-center gap-2 px-3 pb-3">
            <label className="relative grid size-10 cursor-pointer place-items-center rounded-full bg-[conic-gradient(#f43f5e,#f59e0b,#eab308,#22c55e,#06b6d4,#6366f1,#d946ef,#f43f5e)] shadow" aria-label="Couleur principale">
              <span className="size-4 rounded-full border-2 border-white" style={{ background: pal.primary }} />
              <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={d.palette.startsWith("custom:") ? d.palette.slice(7) : pal.primary.length === 7 ? pal.primary : "#6b12ff"}
                onChange={(e) => setD((x) => ({ ...x, palette: `custom:${e.target.value}` }))} />
            </label>
            <button type="button" onClick={() => open("images")} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold shadow"><ImageIcon className="size-5" />Images</button>
            <button type="button" onClick={() => open("couleurs")} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold shadow"><PaletteIcon className="size-5" />Couleur / Motif</button>
          </div>
        </section>

        {/* Panneau de l'onglet choisi (en bas sur mobile, à droite sur ordinateur) */}
        {sheet && (
          <aside aria-label={TITLES[sheet]} className="flex max-h-[52vh] shrink-0 flex-col rounded-t-3xl bg-white shadow-[0_-10px_30px_rgba(0,0,0,.12)] md:absolute md:bottom-3 md:right-3 md:top-3 md:max-h-none md:w-[420px] md:rounded-3xl">
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <h2 className="font-display text-lg font-bold">{TITLES[sheet]}</h2>
              <button type="button" onClick={() => setSheet(null)} className="grid size-9 place-items-center rounded-full bg-paper" aria-label="Fermer le panneau"><CloseIcon className="size-5" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
              {sheet === "texte" && (
                <div className="grid gap-3">
                  {used.map((f) => (
                    <label key={f} className="grid gap-1.5">
                      <span className={label}>{kind.labels[f]}</span>
                      {multiline(f) || f === "texte" ? (
                        <textarea className={`${input} min-h-20`} value={d.fields[f]} maxLength={400} onChange={(e) => setField(f, e.target.value)} />
                      ) : (
                        <input className={input} value={d.fields[f]} maxLength={120} onChange={(e) => setField(f, e.target.value)} />
                      )}
                    </label>
                  ))}
                  {literals.map((l) => {
                    const v = d.texts?.[elKey(tpl, l.id)] ?? l.text;
                    return (
                      <label key={l.id} className="grid gap-1.5">
                        <span className={label}>Texte du modèle{verso ? ` (${l.face ? "verso" : "recto"})` : ""}</span>
                        {l.lines > 1 ? (
                          <textarea className={`${input} min-h-20`} value={v} maxLength={300} onChange={(e) => setLiteral(l.id, e.target.value)} />
                        ) : (
                          <input className={input} value={v} maxLength={120} onChange={(e) => setLiteral(l.id, e.target.value)} />
                        )}
                      </label>
                    );
                  })}
                  <label className="grid gap-1.5">
                    <span className={label}>Slogan en bandeau (facultatif)</span>
                    <input className={input} value={d.slogan ?? ""} maxLength={90} placeholder="Ex. : Le goût du Gabon, depuis 2010" onChange={(e) => setD((x) => ({ ...x, slogan: e.target.value }))} />
                  </label>
                  {d.slogan?.trim() && (
                    <div className="flex gap-2">
                      {([["bas", "Bandeau en bas"], ["haut", "Bandeau en haut"]] as const).map(([v, l]) => (
                        <button key={v} type="button" aria-pressed={(d.sloganPos ?? "bas") === v} onClick={() => setD((x) => ({ ...x, sloganPos: v }))} className={chip((d.sloganPos ?? "bas") === v)}>{l}</button>
                      ))}
                    </div>
                  )}
                  <fieldset className="grid gap-2">
                    <legend className={`${label} mb-1`}>Polices</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_PAIRS.map((f) => (
                        <button key={f.id} type="button" aria-pressed={d.fonts === f.id} onClick={() => setD((x) => ({ ...x, fonts: f.id }))}
                          className={`rounded-xl border-2 px-3 py-2 text-left ${d.fonts === f.id ? "border-brand bg-brand-soft" : "border-line"}`}>
                          <span style={{ fontFamily: `np-${f.head}` }} className="block text-xl leading-tight">{f.name}</span>
                          <span style={{ fontFamily: `np-${f.body}` }} className="block text-xs text-muted">Coordonnées</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <p className="text-xs text-muted">Laissez un texte vide pour le retirer. Les boutons « A » en bas règlent la taille des textes.</p>
                </div>
              )}

              {sheet === "images" && (
                <div className="grid gap-5">
                  <section className="grid gap-2.5">
                    <h3 className="font-bold">Votre logo</h3>
                    {d.logo && (
                      <div className="grid place-items-center rounded-2xl border border-line bg-[conic-gradient(#eee_25%,#fff_0_50%,#eee_0_75%,#fff_0)] bg-[length:16px_16px] p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.logo.src} alt="Votre logo" className="max-h-24 w-auto" />
                      </div>
                    )}
                    <label className={drop}>
                      <Upload className="size-6 text-brand" />
                      <span className="font-bold">{d.logo ? "Changer de logo" : "Ajouter mon logo"}</span>
                      <span className="text-sm text-muted">PNG à fond transparent idéalement</span>
                      <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => pickLogo(e.target.files?.[0] ?? null)} />
                    </label>
                    {!d.logo && <button type="button" onClick={() => open("logo")} className="w-fit text-sm font-bold text-brand underline">Pas de logo ? Créez-en un</button>}
                    {d.logo && (
                      <>
                        <div className="flex flex-wrap gap-2" aria-label="Position du logo">
                          {LOGO_POS.map(([v, l]) => <button key={v} type="button" aria-pressed={(d.logoPos ?? "modele") === v} onClick={() => setD((x) => ({ ...x, logoPos: v }))} className={chip((d.logoPos ?? "modele") === v)}>{l}</button>)}
                        </div>
                        <button type="button" onClick={() => setD((x) => ({ ...x, logo: undefined }))} className="w-fit text-sm font-semibold text-danger underline">Retirer le logo</button>
                      </>
                    )}
                    {msg.logo && <p role="status" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">{msg.logo}</p>}
                  </section>

                  {uniquePhotos.map((p) => {
                    const key = elKey(tpl, p.id);
                    const own = d.photos?.[key];
                    return (
                      <section key={p.id} className="grid gap-2.5 border-t border-line pt-4">
                        <h3 className="font-bold">Photo du modèle</h3>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={own?.src ?? p.src} alt="" className="max-h-36 w-full rounded-2xl object-cover" />
                        <label className={drop}>
                          <Upload className="size-6 text-brand" />
                          <span className="font-bold">Remplacer par ma photo</span>
                          <span className="text-sm text-muted">Votre visage, vos plats, vos réalisations…</span>
                          <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                            const ph = await loadPhoto(e.target.files?.[0] ?? null, "tplPhoto", 0.6);
                            if (ph) setD((x) => ({ ...x, photos: { ...x.photos, [key]: ph } }));
                          }} />
                        </label>
                        {own && <button type="button" onClick={() => setD((x) => { const ph = { ...x.photos }; delete ph[key]; return { ...x, photos: ph }; })} className="w-fit text-sm font-semibold underline">Remettre la photo du modèle</button>}
                        {msg.tplPhoto && <p role="status" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">{msg.tplPhoto}</p>}
                      </section>
                    );
                  })}

                  <section className="grid gap-2.5 border-t border-line pt-4">
                    <h3 className="font-bold">Photo en fond</h3>
                    {d.bgImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.bgImage.src} alt="Votre photo de fond" className="max-h-32 w-full rounded-2xl object-cover" />
                    )}
                    <label className={drop}>
                      <Upload className="size-6 text-brand" />
                      <span className="font-bold">{d.bgImage ? "Changer de photo" : "Ajouter une photo de fond"}</span>
                      <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                        const ph = await loadPhoto(e.target.files?.[0] ?? null, "photo");
                        if (ph) setD((x) => ({ ...x, bgImage: ph, bgVeil: x.bgVeil ?? 0.55 }));
                      }} />
                    </label>
                    {d.bgImage && (
                      <>
                        <label className="grid gap-1.5">
                          <span className={`${label} flex justify-between`}>Voile pour garder les textes lisibles <span className="tabular">{Math.round((d.bgVeil ?? 0.55) * 100)} %</span></span>
                          <input type="range" min={0} max={0.9} step={0.05} value={d.bgVeil ?? 0.55} onChange={(e) => setD((x) => ({ ...x, bgVeil: Number(e.target.value) }))} className="w-full accent-[var(--brand)]" />
                        </label>
                        <button type="button" onClick={() => setD((x) => ({ ...x, bgImage: undefined }))} className="w-fit text-sm font-semibold text-danger underline">Retirer la photo</button>
                      </>
                    )}
                    {msg.photo && <p role="status" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">{msg.photo}</p>}
                    <p className="text-xs text-muted">Utilisez uniquement vos photos ou des photos dont vous avez les droits.</p>
                  </section>
                </div>
              )}

              {sheet === "modeles" && (
                <div className="grid gap-3">
                  <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label="Votre activité">
                    <button type="button" role="radio" aria-checked={!d.sector} onClick={() => pickSector(null)} className={chip(!d.sector)}>Tous</button>
                    {SECTORS.map((sec) => (
                      <button key={sec.id} type="button" role="radio" aria-checked={d.sector === sec.id} onClick={() => pickSector(sec.id)} className={`${chip(d.sector === sec.id)} flex items-center gap-1.5`}>
                        <Swatch shapes={ICONS[sec.icon]} colors={[d.sector === sec.id ? "#ffffff" : "#6b12ff", d.sector === sec.id ? "#0d0e12" : "#ffffff"]} className="size-4" />
                        {sec.name}
                      </button>
                    ))}
                  </div>
                  {!thumbs.length && <p className="text-sm text-muted">Chargement des modèles…</p>}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2">
                    {thumbs.map(({ t, side }) => (
                      <button key={t.id} type="button" aria-pressed={d.template === t.id} onClick={() => pickTemplate(t)}
                        className={`grid gap-1.5 rounded-2xl border-2 p-2 text-left ${d.template === t.id ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>
                        <span className="grid h-28 place-items-center"><DesignSvg side={side} trim className="max-h-28 w-full drop-shadow-md" /></span>
                        <span className="flex items-center justify-between text-sm font-semibold">{t.name}{d.template === t.id && <Check className="size-4 text-brand" />}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sheet === "clipart" && (
                <div className="grid gap-4">
                  {sel !== null && (
                    <section className="grid gap-3 rounded-2xl bg-paper p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">Clipart choisi</h3>
                        <button type="button" onClick={removeClip} className="text-sm font-semibold text-danger underline">Supprimer</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="grid grid-cols-3 gap-1" aria-label="Position">
                          {[0.18, 0.5, 0.82].flatMap((y) => [0.18, 0.5, 0.82].map((x) => {
                            const on = Math.abs(clips[sel].x - x) < 0.01 && Math.abs(clips[sel].y - y) < 0.01;
                            return <button key={`${x}-${y}`} type="button" aria-label={`Position ${x}, ${y}`} aria-pressed={on} onClick={() => editClip({ x, y })} className={`size-7 rounded-md ${on ? "bg-brand" : "bg-white"}`} />;
                          }))}
                        </div>
                        <label className="grid flex-1 gap-1">
                          <span className={label}>Taille</span>
                          <input type="range" min={0.06} max={0.7} step={0.02} value={clips[sel].s} onChange={(e) => editClip({ s: Number(e.target.value) })} className="w-full accent-[var(--brand)]" />
                        </label>
                      </div>
                      <label className="grid gap-1">
                        <span className={label}>Déplacer finement</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="range" aria-label="Horizontal" min={0} max={1} step={0.01} value={clips[sel].x} onChange={(e) => editClip({ x: Number(e.target.value) })} className="accent-[var(--brand)]" />
                          <input type="range" aria-label="Vertical" min={0} max={1} step={0.01} value={clips[sel].y} onChange={(e) => editClip({ y: Number(e.target.value) })} className="accent-[var(--brand)]" />
                        </div>
                      </label>
                      <div className="flex gap-2" aria-label="Couleur">
                        {colorRoles.map(([role, hex]) => (
                          <button key={role} type="button" aria-label={`Couleur ${role}`} aria-pressed={clips[sel].color === role} onClick={() => editClip({ color: role })}
                            className={`size-8 rounded-full border-2 ${clips[sel].color === role ? "border-brand" : "border-line"}`} style={{ background: hex }} />
                        ))}
                      </div>
                    </section>
                  )}
                  {clips.some((c) => c.side === faceIdx) && (
                    <div className="flex flex-wrap gap-2" aria-label="Cliparts posés">
                      {clips.map((c, i) => c.side === faceIdx && (
                        <button key={i} type="button" aria-pressed={sel === i} onClick={() => setClipSel(i)} className={`grid size-11 place-items-center rounded-xl border-2 p-2 ${sel === i ? "border-brand bg-brand-soft" : "border-line"}`} aria-label={`Modifier ${CLIPARTS[c.art]?.name}`}>
                          <Swatch shapes={CLIPARTS[c.art]?.shapes ?? []} colors={[colorOf(pal, c.color), "#ffffff"]} className="size-full" />
                        </button>
                      ))}
                    </div>
                  )}
                  <p className={label}>Touchez une forme pour l’ajouter {verso ? `au ${faceIdx ? "verso" : "recto"}` : "au design"}</p>
                  <div className="grid grid-cols-5 gap-2">
                    {CLIPART_IDS.map((id) => (
                      <button key={id} type="button" onClick={() => addClip(id)} aria-label={`Ajouter : ${CLIPARTS[id].name}`} title={CLIPARTS[id].name}
                        className="grid aspect-square place-items-center rounded-xl border border-line bg-white p-2.5 hover:border-brand">
                        <Swatch shapes={CLIPARTS[id].shapes} colors={[pal.primary, "#ffffff"]} className="size-full" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sheet === "logo" && <LogoMaker d={d} pal={pal} onUse={(logo) => { setD((x) => ({ ...x, logo })); setSheet(null); }} />}

              {sheet === "qr" && (
                <QrPanel qr={d.qr} verso={sides.length > 1} defaultSide={sides.length > 1 ? 1 : 0}
                  onChange={(qr) => setD((x) => ({ ...x, qr }))} onFace={(i) => setFace(i)} />
              )}

              {sheet === "couleurs" && (
                <div className="grid gap-4">
                  {hasPattern && (
                    <fieldset className="grid gap-2">
                      <legend className={`${label} mb-1`}>Motif africain</legend>
                      <div className="grid grid-cols-3 gap-2">
                        {PATTERN_IDS.map((id) => {
                          const on = (d.pattern ?? tpl.pattern) === id;
                          return (
                            <button key={id} type="button" aria-pressed={on} onClick={() => setD((x) => ({ ...x, pattern: id }))}
                              className={`grid gap-1 rounded-xl border-2 p-1.5 text-xs font-semibold ${on ? "border-brand bg-brand-soft" : "border-line"}`}>
                              <Swatch shapes={PATTERNS[id].shapes} colors={[colorOf(pal, "primary"), colorOf(pal, "accent"), colorOf(pal, "bg")]} tiles={2} className="aspect-square w-full overflow-hidden rounded-lg" />
                              {PATTERNS[id].name}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {[...TEMPLATE_PALETTES.filter((p) => p.id === tpl.palette).map((p) => ({ ...p, name: "Couleurs du modèle" })), ...PALETTES].map((p) => (
                      <button key={p.id} type="button" aria-pressed={d.palette === p.id} onClick={() => setD((x) => ({ ...x, palette: p.id }))}
                        className={`flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left text-sm font-semibold ${d.palette === p.id ? "border-brand bg-brand-soft" : "border-line"}`}>
                        <span className="flex -space-x-1.5">
                          {[p.primary, p.accent, p.soft, p.ink].map((c, i) => <span key={i} className="size-5 rounded-full border-2 border-white" style={{ background: c }} />)}
                        </span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm font-semibold">
                    Ma couleur (celle de mon logo)
                    <input type="color" className="h-9 w-14 cursor-pointer rounded" value={d.palette.startsWith("custom:") ? d.palette.slice(7) : "#6b12ff"}
                      onChange={(e) => setD((x) => ({ ...x, palette: `custom:${e.target.value}` }))} />
                  </label>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {error && <p role="alert" className="mx-3 mb-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}

      {/* Barre d'onglets */}
      <nav className="flex shrink-0 items-center gap-1 bg-gradient-to-r from-ink to-brand px-1.5 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 text-white" aria-label="Outils">
        <div className="flex min-w-0 flex-1">
          {BOTTOM.map(([s, l, Icon]) => (
            <button key={s} type="button" aria-pressed={sheet === s} onClick={() => open(s)}
              className={`grid min-w-[50px] flex-1 content-start justify-items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-center text-[10.5px] font-semibold leading-tight sm:text-[11px] ${sheet === s ? "bg-white/20" : ""}`}>
              <Icon className="size-6" />{l}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center rounded-full bg-white text-ink" aria-label="Taille des textes">
          <button type="button" onClick={() => setScale(scale - 0.1)} disabled={scale <= 0.7} className="py-1.5 pl-2.5 pr-1.5 text-xs font-bold disabled:opacity-30" aria-label="Textes plus petits">A</button>
          <button type="button" onClick={() => setScale(scale + 0.1)} disabled={scale >= 1.5} className="py-1 pl-1 pr-2.5 text-lg font-bold leading-none disabled:opacity-30" aria-label="Textes plus grands">A</button>
        </div>
      </nav>

      {/* Vue en situation */}
      {view3d && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#ebe6dc]" role="dialog" aria-label="Vue en situation">
          <div className="flex flex-wrap items-center gap-2 p-3">
            <button type="button" onClick={() => setView3d(false)} className="grid size-10 place-items-center rounded-full bg-white" aria-label="Retour à l’édition"><CloseIcon /></button>
            {scenes.length > 1 && (
              <div className="flex overflow-x-auto rounded-full bg-white p-1 text-sm font-semibold" role="tablist" aria-label="Mise en scène">
                {scenes.map((k) => (
                  <button key={k} type="button" role="tab" aria-selected={scene === k} onClick={() => setScene(k)} className={`whitespace-nowrap rounded-full px-3 py-1.5 ${scene === k ? "bg-ink text-white" : ""}`}>{MOCKUP_LABELS[k]}</button>
                ))}
              </div>
            )}
            {scene === "tshirt" && (
              <div className="flex gap-1.5" aria-label="Couleur du t-shirt">
                {(["white", "black"] as const).map((c) => (
                  <button key={c} type="button" aria-pressed={shirt === c} onClick={() => setShirt(c)} className={`size-8 rounded-full border-2 ${shirt === c ? "border-brand" : "border-white"}`} style={{ background: c === "white" ? "#f4f4f2" : "#1f1f22" }} aria-label={c === "white" ? "T-shirt blanc" : "T-shirt noir"} />
                ))}
              </div>
            )}
          </div>
          <div className="grid min-h-0 flex-1 place-items-center p-3">
            <div className="w-full max-w-[720px] overflow-hidden" style={{ aspectRatio: "4 / 3" }}><Mockup kind={scene} sides={sides} tshirt={shirt} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Deux couleurs trop proches pour se distinguer l'une sur l'autre. */
function near(a: string, b: string) {
  const lum = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  return /^#[0-9a-f]{6}/i.test(a) && /^#[0-9a-f]{6}/i.test(b) && Math.abs(lum(a) - lum(b)) < 0.18;
}

/** Créateur de logo simple : forme, pictogramme, initiales ou nom court, police et couleurs du design. */
function LogoMaker({ d, pal, onUse }: { d: Design; pal: ReturnType<typeof paletteOf>; onUse: (logo: NonNullable<Design["logo"]>) => void }) {
  const source = d.fields[d.monogram ?? "titre"] || d.fields.titre || "";
  const initialsOf = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toLocaleUpperCase("fr-FR")).join("");
  const [text, setText] = useState(() => initialsOf(source) || "NP");
  const [font, setFont] = useState<FontKey>("bebas");
  const [shape, setShape] = useState<LogoSpec["shape"]>("rond");
  const [icon, setIcon] = useState<IconId | "etoile" | null>(d.icon ?? null);
  // Rond de la couleur principale, sauf s'il se confondrait avec le fond de la carte.
  const [inv, setInv] = useState(() => near(pal.primary, colorOf(pal, "bg")));
  const ref = useRef<HTMLCanvasElement>(null);
  const spec: LogoSpec = {
    text, font, shape,
    icon: icon === "etoile" ? CLIPARTS.etoile.shapes : icon ? ICONS[icon] : undefined,
    bg: inv ? pal.accent : pal.primary, ink: inv ? pal.primary : "#ffffff",
  };
  useEffect(() => { if (ref.current) drawLogo(ref.current, spec, 400); });
  const fonts: [FontKey, string][] = [["bebas", "Affiche"], ["poppins-xb", "Moderne"], ["serif", "Élégant"], ["script", "Manuscrit"], ["black", "Impact"], ["mont-semi", "Sobre"]];
  return (
    <div className="grid gap-4">
      <div className="grid place-items-center rounded-2xl border border-line bg-[conic-gradient(#eee_25%,#fff_0_50%,#eee_0_75%,#fff_0)] bg-[length:16px_16px] p-4">
        <canvas ref={ref} className="size-32" aria-label="Aperçu du logo" />
      </div>
      <label className="grid gap-1.5">
        <span className={label}>Initiales ou nom court</span>
        <input className={input} value={text} maxLength={12} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="grid gap-1.5">
        <span className={label}>Police</span>
        <div className="flex flex-wrap gap-2">
          {fonts.map(([k, n]) => <button key={k} type="button" aria-pressed={font === k} onClick={() => setFont(k)} className={chip(font === k)} style={{ fontFamily: `np-${k}` }}>{n}</button>)}
        </div>
      </div>
      <div className="grid gap-1.5">
        <span className={label}>Forme</span>
        <div className="flex flex-wrap gap-2">
          {([["rond", "Rond"], ["carre", "Carré"], ["aucun", "Sans forme"]] as const).map(([v, l]) => <button key={v} type="button" aria-pressed={shape === v} onClick={() => setShape(v)} className={chip(shape === v)}>{l}</button>)}
          <button type="button" aria-pressed={inv} onClick={() => setInv(!inv)} className={chip(inv)}>Couleurs inversées</button>
        </div>
      </div>
      <div className="grid gap-1.5">
        <span className={label}>Pictogramme</span>
        <div className="grid grid-cols-6 gap-2">
          <button type="button" aria-pressed={!icon} onClick={() => setIcon(null)} className={`grid aspect-square place-items-center rounded-xl border-2 text-[11px] font-semibold ${!icon ? "border-brand bg-brand-soft" : "border-line"}`}>Aucun</button>
          {(["etoile", ...Object.keys(ICONS)] as (IconId | "etoile")[]).map((ic) => (
            <button key={ic} type="button" aria-pressed={icon === ic} aria-label={ic} onClick={() => setIcon(ic)}
              className={`grid aspect-square place-items-center rounded-xl border-2 p-2 ${icon === ic ? "border-brand bg-brand-soft" : "border-line"}`}>
              <Swatch shapes={ic === "etoile" ? CLIPARTS.etoile.shapes : ICONS[ic]} colors={[pal.primary, "#ffffff"]} className="size-full" />
            </button>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => onUse(renderLogo(spec))} disabled={!text.trim() && !icon} className="rounded-full bg-brand px-5 py-3 font-bold text-white disabled:opacity-50">
        Utiliser ce logo
      </button>
      <p className="text-xs text-muted">Le logo prend la place prévue par le modèle. Vous pourrez le déplacer dans « Images ».</p>
    </div>
  );
}

/** Code QR : site, WhatsApp ou téléphone, sur la face et au coin choisis. */
function QrPanel({ qr, verso, defaultSide, onChange, onFace }: {
  qr?: Qr; verso: boolean; defaultSide: number; onChange: (qr: Qr | undefined) => void; onFace: (i: number) => void;
}) {
  const presets: [string, string, string][] = [
    ["Site web", "https://", "https://www.monsite.ga"],
    ["WhatsApp", "https://wa.me/241", "https://wa.me/24177123456"],
    ["Téléphone", "tel:+241", "tel:+24177123456"],
  ];
  const v: Qr = qr ?? { text: "", side: defaultSide, pos: "bd" };
  const set = (patch: Partial<Qr>) => onChange({ ...v, ...patch });
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {presets.map(([l, start]) => <button key={l} type="button" onClick={() => { set({ text: start }); onFace(v.side); }} className={chip(false)}>{l}</button>)}
      </div>
      <label className="grid gap-1.5">
        <span className={label}>Lien ou numéro encodé</span>
        <input className={input} value={v.text} maxLength={300} placeholder={presets[0][2]} inputMode="url" onChange={(e) => { set({ text: e.target.value }); onFace(v.side); }} />
      </label>
      {verso && (
        <div className="flex gap-2">
          {["Recto", "Verso"].map((l, i) => <button key={l} type="button" aria-pressed={v.side === i} onClick={() => { set({ side: i }); onFace(i); }} className={chip(v.side === i)}>{l}</button>)}
        </div>
      )}
      <div className="flex flex-wrap gap-2" aria-label="Position du code QR">
        {QR_POS.map(([p, l]) => <button key={p} type="button" aria-pressed={v.pos === p} onClick={() => set({ pos: p })} className={chip(v.pos === p)}>{l}</button>)}
      </div>
      {qr && <button type="button" onClick={() => onChange(undefined)} className="w-fit text-sm font-semibold text-danger underline">Retirer le code QR</button>}
      <p className="text-xs text-muted">Le code est vectoriel : il reste net à l’impression. Testez-le avec votre téléphone sur l’aperçu avant de commander.</p>
    </div>
  );
}
