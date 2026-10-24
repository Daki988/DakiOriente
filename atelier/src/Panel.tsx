import type { ReactNode, RefObject } from "react";
import type { Doc, Shape, Tool, Background, TextShape, ImageShape } from "./types";
import { NO_FILTERS } from "./types";
import { FONTS } from "./templates";
import { Icon } from "./icons";

const SWATCHES = ["#ffffff", "#1d1b2e", "#ffd23f", "#ff6b8b", "#e0426a", "#6c4cf5", "#39b6ff", "#1f9d55", "#ff8a3d", "#8b5e3c"];

function Color({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="swatches">
      {SWATCHES.map((c) => (
        <button key={c} className={"sw" + (c === value.toLowerCase() ? " on" : "")} style={{ background: c }} onClick={() => onChange(c)} title={c} />
      ))}
      <label className="sw custom" title="Autre couleur">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />+
      </label>
    </div>
  );
}

function Slider(p: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span className="field-head">
        {p.label}
        <b>
          {Math.round(p.value * 100) / 100}
          {p.unit}
        </b>
      </span>
      <input type="range" min={p.min} max={p.max} step={p.step ?? 1} value={p.value} onChange={(e) => p.onChange(Number(e.target.value))} />
    </label>
  );
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="section">
    <h4>{title}</h4>
    {children}
  </section>
);

interface Props {
  doc: Doc;
  selected: Shape | null;
  tool: Tool;
  brush: { color: string; size: number };
  setBrush: (b: { color: string; size: number }) => void;
  update: (patch: Partial<Shape>, mergeKey?: string) => void;
  updateDoc: (fn: (d: Doc) => Doc, mergeKey?: string) => void;
  select: (id: string | null) => void;
  duplicate: () => void;
  remove: () => void;
  move: (id: string, dir: 1 | -1) => void;
  fitImage: () => void;
  textRef: RefObject<HTMLTextAreaElement | null>;
}

const TYPE_ICON: Record<Shape["type"], string> = { text: "text", rect: "rect", ellipse: "ellipse", image: "image", line: "brush" };

export default function Panel(p: Props) {
  const s = p.selected;
  const k = (name: string) => (s ? s.id + name : name);

  return (
    <aside className="side">
      {p.tool === "brush" && (
        <Section title="Pinceau">
          <Slider label="Épaisseur" value={p.brush.size} min={2} max={120} unit=" px" onChange={(size) => p.setBrush({ ...p.brush, size })} />
          <div className="field">
            Couleur
            <Color value={p.brush.color} onChange={(color) => p.setBrush({ ...p.brush, color })} />
          </div>
          <p className="help">Dessinez librement sur la page en maintenant le clic.</p>
        </Section>
      )}

      {p.tool !== "brush" && s?.type === "text" && <TextProps s={s} {...p} k={k} />}

      {p.tool !== "brush" && (s?.type === "rect" || s?.type === "ellipse") && (
        <Section title={s.type === "rect" ? "Rectangle" : "Cercle"}>
          <div className="field">
            Couleur
            <Color value={s.fill} onChange={(fill) => p.update({ fill }, k("fill"))} />
          </div>
          {s.type === "rect" && <Slider label="Coins arrondis" value={s.cornerRadius} min={0} max={Math.round(Math.min(s.width, s.height) / 2)} onChange={(cornerRadius) => p.update({ cornerRadius }, k("radius"))} />}
        </Section>
      )}

      {p.tool !== "brush" && s?.type === "line" && (
        <Section title="Trait">
          <div className="field">
            Couleur
            <Color value={s.stroke} onChange={(stroke) => p.update({ stroke }, k("stroke"))} />
          </div>
          <Slider label="Épaisseur" value={s.strokeWidth} min={1} max={120} unit=" px" onChange={(strokeWidth) => p.update({ strokeWidth }, k("sw"))} />
        </Section>
      )}

      {p.tool !== "brush" && s?.type === "image" && <ImageProps s={s} {...p} k={k} />}

      {p.tool !== "brush" && s && (
        <Section title="Disposition">
          <Slider label="Opacité" value={Math.round(s.opacity * 100)} min={0} max={100} unit=" %" onChange={(v) => p.update({ opacity: v / 100 }, k("op"))} />
          <Slider label="Rotation" value={Math.round(s.rotation)} min={-180} max={180} unit="°" onChange={(rotation) => p.update({ rotation }, k("rot"))} />
          <div className="btn-row">
            <button className="btn ghost sm" onClick={() => p.move(s.id, 1)} title="Mettre devant">
              <Icon name="up" size={16} /> Devant
            </button>
            <button className="btn ghost sm" onClick={() => p.move(s.id, -1)} title="Mettre derrière">
              <Icon name="down" size={16} /> Derrière
            </button>
            <button className="btn ghost sm" onClick={p.duplicate} title="Dupliquer (Ctrl+D)">
              <Icon name="copy" size={16} />
            </button>
            <button className="btn danger sm" onClick={p.remove} title="Supprimer (Suppr)">
              <Icon name="trash" size={16} />
            </button>
          </div>
        </Section>
      )}

      {p.tool !== "brush" && !s && <PageProps {...p} />}

      <Section title="Calques">
        {p.doc.shapes.length === 0 && <p className="help">Ajoutez du texte, une forme ou une image avec les outils de gauche.</p>}
        <div className="layers">
          {[...p.doc.shapes].reverse().map((l) => (
            <div key={l.id} className={"layer" + (l.id === s?.id ? " on" : "")} onClick={() => p.select(l.id)}>
              <Icon name={TYPE_ICON[l.type]} size={15} />
              <span className="layer-name">{l.type === "text" ? l.text.split("\n")[0] || "Texte" : l.name}</span>
              <button
                className="icon-btn"
                title={l.visible ? "Masquer" : "Afficher"}
                onClick={(e) => {
                  e.stopPropagation();
                  p.updateDoc((d) => ({ ...d, shapes: d.shapes.map((x) => (x.id === l.id ? { ...x, visible: !x.visible } : x)) }));
                }}
              >
                <Icon name={l.visible ? "eye" : "eyeOff"} size={15} />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </aside>
  );
}

function TextProps({ s, update, k, textRef }: Props & { s: TextShape; k: (n: string) => string }) {
  const bold = s.fontStyle.includes("bold");
  const italic = s.fontStyle.includes("italic");
  const style = (b: boolean, i: boolean) => ((i ? "italic" : "") + (i && b ? " " : "") + (b ? "bold" : "") || "normal") as TextShape["fontStyle"];
  return (
    <Section title="Texte">
      <textarea ref={textRef} className="input" rows={3} value={s.text} onChange={(e) => update({ text: e.target.value }, k("text"))} />
      <label className="field">
        Police
        <select className="input" value={s.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })} style={{ fontFamily: s.fontFamily }}>
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </label>
      <Slider label="Taille" value={s.fontSize} min={8} max={400} unit=" px" onChange={(fontSize) => update({ fontSize }, k("size"))} />
      <div className="btn-row">
        <button className={"toggle" + (bold ? " on" : "")} onClick={() => update({ fontStyle: style(!bold, italic) })} title="Gras">
          <b>G</b>
        </button>
        <button className={"toggle" + (italic ? " on" : "")} onClick={() => update({ fontStyle: style(bold, !italic) })} title="Italique">
          <i>I</i>
        </button>
        {(["left", "center", "right"] as const).map((a) => (
          <button key={a} className={"toggle" + (s.align === a ? " on" : "")} onClick={() => update({ align: a })}>
            {a === "left" ? "Gauche" : a === "center" ? "Centre" : "Droite"}
          </button>
        ))}
      </div>
      <Slider label="Espacement des lettres" value={s.letterSpacing} min={-10} max={40} onChange={(letterSpacing) => update({ letterSpacing }, k("ls"))} />
      <div className="field">
        Couleur
        <Color value={s.fill} onChange={(fill) => update({ fill }, k("fill"))} />
      </div>
    </Section>
  );
}

function ImageProps({ s, update, k, fitImage }: Props & { s: ImageShape; k: (n: string) => string }) {
  const f = s.filters;
  const set = (patch: Partial<typeof f>, key?: string) => update({ filters: { ...f, ...patch } }, key && k(key));
  const presets: [string, Partial<typeof f>][] = [
    ["Original", NO_FILTERS],
    ["Lumineux", { brightness: 15, contrast: 10, saturation: 15, blur: 0, grayscale: false }],
    ["Vif", { brightness: 0, contrast: 25, saturation: 60, blur: 0, grayscale: false }],
    ["Doux", { brightness: 10, contrast: -20, saturation: -20, blur: 0, grayscale: false }],
    ["Noir & blanc", { brightness: 0, contrast: 20, saturation: 0, blur: 0, grayscale: true }],
  ];
  return (
    <Section title="Retouche photo">
      <div className="presets">
        {presets.map(([label, v]) => (
          <button key={label} className="toggle" onClick={() => set({ ...NO_FILTERS, ...v })}>
            {label}
          </button>
        ))}
      </div>
      <Slider label="Luminosité" value={f.brightness} min={-100} max={100} onChange={(brightness) => set({ brightness }, "b")} />
      <Slider label="Contraste" value={f.contrast} min={-100} max={100} onChange={(contrast) => set({ contrast }, "c")} />
      <Slider label="Saturation" value={f.saturation} min={-100} max={100} onChange={(saturation) => set({ saturation }, "s")} />
      <Slider label="Flou" value={f.blur} min={0} max={40} onChange={(blur) => set({ blur }, "bl")} />
      <label className="check">
        <input type="checkbox" checked={f.grayscale} onChange={(e) => set({ grayscale: e.target.checked })} /> Noir et blanc
      </label>
      <button className="btn ghost sm" onClick={fitImage}>
        Remplir toute la page
      </button>
    </Section>
  );
}

function PageProps({ doc, updateDoc }: Props) {
  const bg = doc.background;
  const setBg = (b: Background, key?: string) => updateDoc((d) => ({ ...d, background: b }), key);
  const first = bg.kind === "color" ? bg.color : bg.from;
  return (
    <Section title="Page">
      <div className="btn-row">
        <button className={"toggle" + (bg.kind === "color" ? " on" : "")} onClick={() => setBg({ kind: "color", color: first })}>
          Couleur unie
        </button>
        <button className={"toggle" + (bg.kind === "gradient" ? " on" : "")} onClick={() => setBg({ kind: "gradient", from: first, to: "#ff6b8b" })}>
          Dégradé
        </button>
      </div>
      {bg.kind === "color" ? (
        <div className="field">
          Fond
          <Color value={bg.color} onChange={(color) => setBg({ kind: "color", color }, "bg")} />
        </div>
      ) : (
        <>
          <div className="field">
            Couleur 1
            <Color value={bg.from} onChange={(from) => setBg({ ...bg, from }, "bg1")} />
          </div>
          <div className="field">
            Couleur 2
            <Color value={bg.to} onChange={(to) => setBg({ ...bg, to }, "bg2")} />
          </div>
        </>
      )}
      <div className="size-row">
        <label className="field">
          Largeur
          <input className="input" type="number" min={50} max={8000} value={doc.width} onChange={(e) => updateDoc((d) => ({ ...d, width: clamp(+e.target.value) }), "w")} />
        </label>
        <label className="field">
          Hauteur
          <input className="input" type="number" min={50} max={8000} value={doc.height} onChange={(e) => updateDoc((d) => ({ ...d, height: clamp(+e.target.value) }), "h")} />
        </label>
      </div>
      <p className="help">💡 Cliquez sur un élément de la page pour le modifier. Glissez une photo depuis votre ordinateur pour l'ajouter.</p>
    </Section>
  );
}

const clamp = (v: number) => Math.min(8000, Math.max(50, Math.round(v) || 50));
