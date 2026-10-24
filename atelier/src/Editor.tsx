import { useCallback, useEffect, useLayoutEffect, useRef, useState, type DragEvent } from "react";
import type Konva from "konva";
import Canvas, { exportPage } from "./Canvas";
import Panel from "./Panel";
import { Icon } from "./icons";
import { useHistory } from "./useHistory";
import { makeText, makeRect, makeEllipse, FONTS } from "./templates";
import { readImage, makeImage, pickFile } from "./image";
import { saveProject } from "./storage";
import { type Doc, type Shape, type Tool, uid } from "./types";

const TOOLS: { id: Tool; label: string; key: string }[] = [
  { id: "select", label: "Choisir", key: "v" },
  { id: "text", label: "Texte", key: "t" },
  { id: "rect", label: "Rectangle", key: "r" },
  { id: "ellipse", label: "Cercle", key: "o" },
  { id: "image", label: "Image", key: "i" },
  { id: "brush", label: "Pinceau", key: "b" },
];

const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement;
  return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable;
};

function download(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export default function Editor({ initial, onExit }: { initial: Doc; onExit: () => void }) {
  const h = useHistory(initial);
  const doc = h.value;
  const [selectedId, setSelectedId] = useState<string | null>(initial.shapes.length === 1 && initial.shapes[0].type === "image" ? initial.shapes[0].id : null);
  const [tool, setTool] = useState<Tool>("select");
  const [brush, setBrush] = useState({ color: "#e0426a", size: 12 });
  const [zoom, setZoom] = useState<number | null>(null); // null = ajusté à l'écran
  const [fit, setFit] = useState(0.5);
  const [saved, setSaved] = useState<"saved" | "saving" | "idle">("idle");
  const [fontsReady, setFontsReady] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const stageBox = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const scale = zoom ?? fit;
  const selected = doc.shapes.find((s) => s.id === selectedId) ?? null;

  // Les polices doivent être chargées avant de dessiner le texte sur le canevas.
  useEffect(() => {
    const loads = FONTS.flatMap((f) => [`48px "${f}"`, `bold 48px "${f}"`].map((q) => document.fonts.load(q).catch(() => [])));
    const timeout = new Promise((r) => setTimeout(r, 3000));
    Promise.race([Promise.all(loads), timeout]).then(() => setFontsReady(true));
  }, []);

  // Zoom « ajusté à l'écran » qui suit la taille de la fenêtre.
  useLayoutEffect(() => {
    const el = stageBox.current;
    if (!el) return;
    const compute = () => setFit(Math.min((el.clientWidth - 80) / doc.width, (el.clientHeight - 80) / doc.height, 1));
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [doc.width, doc.height]);

  const updateDoc = h.set;
  const update = useCallback(
    (patch: Partial<Shape>, mergeKey?: string) => {
      if (!selectedId) return;
      h.set((d) => ({ ...d, shapes: d.shapes.map((s) => (s.id === selectedId ? ({ ...s, ...patch } as Shape) : s)) }), mergeKey);
    },
    [selectedId, h],
  );
  const changeShape = useCallback(
    (id: string, patch: Partial<Shape>) => h.set((d) => ({ ...d, shapes: d.shapes.map((s) => (s.id === id ? ({ ...s, ...patch } as Shape) : s)) })),
    [h],
  );
  const add = useCallback(
    (s: Shape, select = true) => {
      h.set((d) => ({ ...d, shapes: [...d.shapes, s] }));
      if (select) setSelectedId(s.id);
    },
    [h],
  );

  const remove = useCallback(() => {
    if (!selectedId) return;
    h.set((d) => ({ ...d, shapes: d.shapes.filter((s) => s.id !== selectedId) }));
    setSelectedId(null);
  }, [selectedId, h]);

  const duplicate = useCallback(() => {
    if (!selected) return;
    const off = Math.round(doc.width * 0.02);
    add({ ...structuredClone(selected), id: uid(), x: selected.x + off, y: selected.y + off });
  }, [selected, doc.width, add]);

  const move = (id: string, dir: 1 | -1) =>
    h.set((d) => {
      const i = d.shapes.findIndex((s) => s.id === id);
      const j = i + dir;
      if (j < 0 || j >= d.shapes.length) return d;
      const shapes = [...d.shapes];
      [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
      return { ...d, shapes };
    });

  async function addImageFile(file: File, at?: { x: number; y: number }) {
    if (!file.type.startsWith("image/")) return;
    const img = await readImage(file);
    const k = Math.min(1, (doc.width * 0.8) / img.width, (doc.height * 0.8) / img.height);
    const w = img.width * k;
    const ht = img.height * k;
    const x = at ? at.x - w / 2 : (doc.width - w) / 2;
    const y = at ? at.y - ht / 2 : (doc.height - ht) / 2;
    add(makeImage(img.src, x, y, w, ht, file.name.replace(/\.[^.]+$/, "")));
    setTool("select");
  }

  async function chooseTool(t: Tool) {
    if (t === "image") {
      const file = await pickFile();
      if (file) await addImageFile(file);
      return;
    }
    setTool(t);
    if (t === "brush") setSelectedId(null);
  }

  function place(x: number, y: number) {
    const u = Math.max(doc.width, doc.height) / 1000;
    if (tool === "text") {
      add(makeText({ text: "Votre texte", x, y, width: doc.width * 0.6, fontSize: Math.round(60 * u), fontStyle: "bold" }));
      setTimeout(() => textRef.current?.select(), 50);
    } else if (tool === "rect") add(makeRect({ x, y, width: 300 * u, height: 200 * u, cornerRadius: 0 }));
    else if (tool === "ellipse") add(makeEllipse({ x, y, radiusX: 120 * u, radiusY: 120 * u }));
    setTool("select");
  }

  function fitImage() {
    if (selected?.type !== "image") return;
    const k = Math.max(doc.width / selected.width, doc.height / selected.height);
    const w = selected.width * k;
    const ht = selected.height * k;
    update({ x: (doc.width - w) / 2, y: (doc.height - ht) / 2, width: w, height: ht, rotation: 0 });
  }

  // Sauvegarde automatique dans le navigateur, 1 s après la dernière modification.
  useEffect(() => {
    if (!fontsReady) return;
    setSaved("saving");
    const t = setTimeout(async () => {
      const stage = stageRef.current;
      if (!stage) return;
      const thumb = exportPage(stage, scale, "image/jpeg", 320 / Math.max(doc.width, doc.height));
      try {
        await saveProject({ id: doc.id, name: doc.name, updatedAt: Date.now(), thumb, doc });
        setSaved("saved");
      } catch {
        setSaved("idle");
      }
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, fontsReady]);

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) h.redo();
        else h.undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        h.redo();
      } else if (mod && key === "d") {
        e.preventDefault();
        duplicate();
      } else if (key === "delete" || key === "backspace") {
        remove();
      } else if (key === "escape") {
        setSelectedId(null);
        setTool("select");
      } else if (selected && key.startsWith("arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
        update({ x: selected.x + dx, y: selected.y + dy }, selected.id + "nudge");
      } else if (!mod) {
        const t = TOOLS.find((x) => x.key === key);
        if (t) chooseTool(t.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Coller une image depuis le presse-papiers
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) addImageFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
    if (!file) return;
    const stage = stageRef.current;
    let at: { x: number; y: number } | undefined;
    if (stage) {
      stage.setPointersPositions(e.nativeEvent);
      const pos = stage.getPointerPosition();
      if (pos) at = { x: pos.x / scale, y: pos.y / scale };
    }
    addImageFile(file, at);
  }

  function doExport(kind: "png" | "jpg" | "project") {
    setExportOpen(false);
    const name = doc.name.trim() || "atelier";
    if (kind === "project") {
      const blob = new Blob([JSON.stringify(doc)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      download(url, name + ".atelier");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;
    download(exportPage(stage, scale, kind === "png" ? "image/png" : "image/jpeg"), `${name}.${kind}`);
  }

  return (
    <div className="app">
      <header className="top">
        <div className="logo">
          <button className="icon-btn" onClick={onExit} title="Retour à l'accueil">
            <Icon name="home" />
          </button>
          <i />
          <input className="doc-name" value={doc.name} onChange={(e) => updateDoc((d) => ({ ...d, name: e.target.value }), "name")} aria-label="Nom du projet" />
          <span className="status">{saved === "saving" ? "Enregistrement…" : saved === "saved" ? "Enregistré" : ""}</span>
        </div>
        <div className="row-gap">
          <button className="btn ghost sm" onClick={h.undo} disabled={!h.canUndo} title="Annuler (Ctrl+Z)">
            <Icon name="undo" size={16} /> <span>Annuler</span>
          </button>
          <button className="btn ghost sm" onClick={h.redo} disabled={!h.canRedo} title="Rétablir (Ctrl+Y)">
            <Icon name="redo" size={16} /> <span>Rétablir</span>
          </button>
        </div>
        <div className="row-gap export">
          <button className="btn" onClick={() => setExportOpen((o) => !o)}>
            Exporter ▾
          </button>
          {exportOpen && (
            <div className="menu">
              <button onClick={() => doExport("png")}>
                <b>Image PNG</b>
                <small>Meilleure qualité, idéal pour le web</small>
              </button>
              <button onClick={() => doExport("jpg")}>
                <b>Image JPG</b>
                <small>Fichier plus léger, idéal pour partager</small>
              </button>
              <button onClick={() => doExport("project")}>
                <b>Fichier projet (.atelier)</b>
                <small>Pour continuer plus tard sur un autre appareil</small>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="ed">
        <nav className="tools">
          {TOOLS.map((t) => (
            <button key={t.id} className={"tool" + (tool === t.id ? " on" : "")} onClick={() => chooseTool(t.id)} title={`${t.label} (${t.key.toUpperCase()})`}>
              <Icon name={t.id} size={22} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="stage" ref={stageBox} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <div className="stage-scroll">
            <div className="page-shadow">
              {fontsReady && (
                <Canvas
                  doc={doc}
                  scale={scale}
                  tool={tool}
                  brush={brush}
                  selectedId={selectedId}
                  stageRef={stageRef}
                  onSelect={setSelectedId}
                  onChangeShape={changeShape}
                  onAdd={add}
                  onPlace={place}
                  onEditText={() => textRef.current?.focus()}
                />
              )}
            </div>
          </div>
          <div className="zoom">
            <button onClick={() => setZoom(Math.max(0.05, scale / 1.25))} title="Dézoomer">
              −
            </button>
            <span>{Math.round(scale * 100)} %</span>
            <button onClick={() => setZoom(Math.min(4, scale * 1.25))} title="Zoomer">
              +
            </button>
            <button onClick={() => setZoom(null)}>Ajuster à l'écran</button>
          </div>
        </div>

        <Panel
          doc={doc}
          selected={selected}
          tool={tool}
          brush={brush}
          setBrush={setBrush}
          update={update}
          updateDoc={updateDoc}
          select={(id) => {
            setSelectedId(id);
            setTool("select");
          }}
          duplicate={duplicate}
          remove={remove}
          move={move}
          fitImage={fitImage}
          textRef={textRef}
        />
      </div>
    </div>
  );
}
