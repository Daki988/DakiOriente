import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { FORMATS, TEMPLATES, blankDoc } from "./templates";
import { listProjects, deleteProject } from "./storage";
import { readImage, makeImage, pickFile } from "./image";
import { type Doc, type ProjectRecord, uid } from "./types";

export default function Home({ onOpen }: { onOpen: (d: Doc) => void }) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [picker, setPicker] = useState(false);

  const refresh = () => listProjects().then(setProjects).catch(() => setProjects([]));
  useEffect(() => {
    refresh();
  }, []);

  async function openPhoto() {
    const file = await pickFile();
    if (!file) return;
    const img = await readImage(file);
    const name = file.name.replace(/\.[^.]+$/, "");
    onOpen({
      id: uid(),
      name,
      width: img.width,
      height: img.height,
      background: { kind: "color", color: "#ffffff" },
      shapes: [makeImage(img.src, 0, 0, img.width, img.height, name)],
    });
  }

  async function openFile() {
    const file = await pickFile(".atelier,application/json");
    if (!file) return;
    try {
      const d = JSON.parse(await file.text()) as Doc;
      if (!Array.isArray(d.shapes) || !d.width) throw new Error();
      onOpen({ ...d, id: uid() });
    } catch {
      alert("Ce fichier n'est pas un projet Atelier valide.");
    }
  }

  const tools = [
    { icon: "image", color: "#1a8ae0", bg: "#e5f4ff", title: "Retoucher une photo", text: "Recadrer, éclaircir, appliquer un filtre, ajouter du texte.", action: openPhoto },
    { icon: "poster", color: "#6c4cf5", bg: "#f0ebff", title: "Créer une affiche", text: "Affiches, flyers, posts réseaux sociaux à partir de modèles.", action: () => setPicker(true) },
    { icon: "pen", color: "#e0426a", bg: "#ffeef2", title: "Dessiner un logo", text: "Formes et tracés nets, exportables en SVG à toute taille.", soon: true },
    { icon: "video", color: "#1f9d55", bg: "#e8f8ef", title: "Monter une vidéo", text: "Couper, assembler, ajouter du texte et une musique.", soon: true },
  ];

  return (
    <div className="app">
      <header className="top">
        <div className="logo">
          <i />
          Atelier
        </div>
        <div className="row-gap">
          <button className="btn ghost" onClick={openFile}>
            Ouvrir un fichier
          </button>
          <button className="btn" onClick={() => setPicker(true)}>
            + Nouveau projet
          </button>
        </div>
      </header>

      <main className="home">
        <div>
          <h1>Que voulez-vous créer aujourd'hui ?</h1>
          <p className="sub">Choisissez un outil. Vous pourrez toujours changer en cours de route.</p>
        </div>

        <div className="cards">
          {tools.map((t) => (
            <button key={t.title} className="card" disabled={t.soon} onClick={t.action}>
              <span className="ic" style={{ background: t.bg, color: t.color }}>
                <Icon name={t.icon} size={26} />
              </span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
              <span className="go">{t.soon ? "Bientôt disponible" : "Commencer →"}</span>
            </button>
          ))}
        </div>

        <h2>Partir d'un modèle</h2>
        <div className="tpls">
          {TEMPLATES.map((t) => (
            <button key={t.id} className="tpl" onClick={() => onOpen(t.build())}>
              <span className="thumb" style={{ background: `linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})` }} />
              <b>{t.label}</b>
              <small>{FORMATS.find((f) => f.id === t.format)!.label}</small>
            </button>
          ))}
        </div>

        <h2>Projets récents</h2>
        {projects.length === 0 ? (
          <p className="sub">Aucun projet pour l'instant — vos créations s'afficheront ici.</p>
        ) : (
          <div className="tpls">
            {projects.map((p) => (
              <div key={p.id} className="tpl">
                <button className="thumb img" onClick={() => onOpen(p.doc)}>
                  <img src={p.thumb} alt="" />
                </button>
                <div className="tpl-row">
                  <span>{p.name}</span>
                  <button
                    className="icon-btn"
                    title="Supprimer"
                    onClick={async () => {
                      if (confirm(`Supprimer « ${p.name} » ?`)) {
                        await deleteProject(p.id);
                        refresh();
                      }
                    }}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {picker && (
        <div className="modal-bg" onClick={() => setPicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Choisissez un format</h2>
            <p className="sub">Une page blanche à la bonne taille.</p>
            <div className="formats">
              {FORMATS.map((f) => {
                const k = 90 / Math.max(f.width, f.height);
                return (
                  <button key={f.id} className="format" onClick={() => onOpen(blankDoc(f))}>
                    <span className="shape" style={{ width: f.width * k, height: f.height * k }} />
                    <b>{f.label}</b>
                    <small>
                      {f.width} × {f.height} px
                    </small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
