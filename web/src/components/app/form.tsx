"use client";
import { Camera, Eye, EyeOff, Loader2, Plus, UploadCloud, X } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

export function Field({ label, hint, error, children, required, className = "" }: { label: string; hint?: ReactNode; error?: string | null; children: (id: string) => ReactNode; required?: boolean; className?: string }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-bold">{label}{required && <span className="text-[#d42a50]"> *</span>}</label>
      {children(id)}
      {error ? <span className="text-xs font-semibold text-[#d42a50]">{error}</span> : hint ? <span className="text-xs text-ink-mute">{hint}</span> : null}
    </div>
  );
}

export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`input ${p.className ?? ""}`} />;
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`input min-h-[110px] resize-y ${p.className ?? ""}`} />;
/** Liste déroulante. Une option peut porter un groupe (3e valeur) : les options sont alors regroupées (optgroup). */
export function Select({ options, placeholder, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: ([string, string] | [string, string, string])[]; placeholder?: string }) {
  const groups = Array.from(new Set(options.map((o) => o[2]).filter(Boolean))) as string[];
  return (
    <select {...p} className={`input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7493%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[right_12px_center] bg-no-repeat pr-10 ${p.className ?? ""}`}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {groups.length
        ? groups.map((g) => <optgroup key={g} label={g}>{options.filter((o) => o[2] === g).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>)
        : options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
export function PasswordInput(p: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...p} type={show ? "text" : "password"} className={`pr-12 ${p.className ?? ""}`} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink-mute hover:bg-[#f1f4fd] hover:text-ink" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={show}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
  );
}
export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-brand-600" />
      <span>{children}</span>
    </label>
  );
}

export const DOC_TYPES: [string, string][] = [
  ["identite", "Pièce d'identité / passeport"], ["releve_notes", "Relevés de notes"], ["diplome", "Diplôme (bac ou équivalent)"], ["photo", "Photo d'identité"], ["acte_naissance", "Acte de naissance"],
  ["releve_bac", "Relevé de notes du bac"], ["cv", "CV"], ["lettre_motivation", "Lettre de motivation"], ["prise_en_charge", "Engagement de prise en charge (parent ou tuteur)"], ["test_langue", "Test de langue (TOEFL, DELF…)"],
  ["fiche_candidature", "Fiche de candidature de l'école"], ["equivalence_bac", "Équivalence du bac"], ["certificat_medical", "Certificat médical"],
  ["certificat", "Certificat"], ["attestation_admission", "Attestation d'admission"], ["attestation_scolarite", "Attestation de scolarité"], ["piece_garant", "Pièce d'identité du garant"], ["justificatif_ressources", "Justificatif de ressources"], ["autre", "Autre document"],
];
export const docLabel = (t: string) => DOC_TYPES.find(([k]) => k === t)?.[1] ?? ({ kyc_identite: "Pièce d'identité (bailleur)", kyc_propriete: "Titre de propriété ou mandat" } as Record<string, string>)[t] ?? t;

export type Doc = { id: string; type: string; fileName: string; size: number; mime: string; status: string; createdAt: string; label: string | null; scope?: string | null };

/** Photo de téléphone réduite (1 600 px, JPEG) avant envoi : plusieurs pages tiennent dans la limite de 8 Mo. */
async function reduire(f: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return f;
  try {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((r) => c.toBlob((b) => r(b ?? f), "image/jpeg", 0.82));
  } catch { return f; }
}

/** Dépôt de document (glisser-déposer ou sélection) vers le coffre-fort. `pages` : plusieurs photos réunies en un PDF. */
export function FileDrop({ type, onUploaded, compact, types = DOC_TYPES, scope, libelle, pages = false }: { type?: string; onUploaded: (d: Doc) => void; compact?: boolean; types?: [string, string][]; scope?: string | null; libelle?: string; pages?: boolean }) {
  const [t, setT] = useState(type ?? types[0][0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [photos, setPhotos] = useState<{ f: Blob; url: string }[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const send = async (fs: Blob[], nom = "document") => {
    setBusy(true); setErr(null);
    const fd = new FormData();
    for (const [i, f] of fs.entries()) fd.append("fichier", f, f instanceof File ? f.name : `${nom}-${i + 1}.jpg`);
    fd.append("type", t);
    if (scope) fd.append("rattachement", scope);
    if (libelle) fd.append("libelle", libelle);
    try { onUploaded(await api<Doc>("/documents", { form: fd })); setPhotos([]); } catch (e) { setErr(e instanceof Error ? e.message : "Échec du dépôt."); } finally { setBusy(false); if (input.current) input.current.value = ""; if (camera.current) camera.current.value = ""; }
  };
  const one = async (f: File) => send([f.type.startsWith("image/") && f.size > 1.5e6 ? new File([await reduire(f)], f.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : f]);
  const addPhotos = async (list: FileList | null) => { if (!list) return; const add = await Promise.all([...list].slice(0, 10 - photos.length).map(async (f) => { const b = await reduire(f); return { f: b, url: URL.createObjectURL(b) }; })); setPhotos((p) => [...p, ...add]); };
  return (
    <div className="flex flex-col gap-2">
      {!type && <Select value={t} onChange={(e) => setT(e.target.value)} options={types} aria-label="Type de document" />}
      <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) one(f); }}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 text-center transition ${compact ? "py-4" : "py-8"} ${over ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-[#fbfcff] hover:border-brand-400"}`}>
        {busy ? <Loader2 className="animate-spin text-brand-600" /> : <UploadCloud className="text-brand-600" />}
        <b className="text-sm">{busy ? "Envoi en cours…" : "Glissez-déposez le fichier ici ou cliquez pour choisir"}</b>
        <span className="text-xs text-ink-mute">PDF, JPG, PNG ou WebP · 8 Mo maximum</span>
      </button>
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) one(f); }} />
      {pages && (
        <div className="flex flex-col gap-2 rounded-2xl bg-[#f6f8fe] p-3">
          <button type="button" onClick={() => camera.current?.click()} className="flex items-center gap-2 text-sm font-bold text-brand-600"><Camera size={17} />Prendre en photo, page par page</button>
          <input ref={camera} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
          {!!photos.length && (
            <>
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <span key={p.url} className="relative h-24 w-[72px] overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`Page ${i + 1}`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-center text-[10px] font-bold text-white">Page {i + 1}</span>
                    <button type="button" onClick={() => setPhotos((x) => x.filter((_, k) => k !== i))} className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5" aria-label={`Retirer la page ${i + 1}`}><X size={12} /></button>
                  </span>
                ))}
                {photos.length < 10 && <button type="button" onClick={() => camera.current?.click()} className="flex h-24 w-[72px] items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-ink-mute" aria-label="Ajouter une page"><Plus size={20} /></button>}
              </div>
              <button type="button" disabled={busy} onClick={() => send(photos.map((p) => p.f), "page")} className="btn-primary self-start py-2.5">{busy ? "Envoi…" : `Envoyer (${photos.length} page${photos.length > 1 ? "s" : ""} réunie${photos.length > 1 ? "s" : ""} en un PDF)`}</button>
            </>
          )}
        </div>
      )}
      {err && <span className="text-xs font-semibold text-[#d42a50]">{err}</span>}
    </div>
  );
}

export const FormError = ({ error }: { error: string | null }) => error ? <p className="rounded-xl bg-[#fff1f3] px-4 py-3 text-sm font-semibold text-[#a3133b]" role="alert">{error}</p> : null;
export const Spinner = () => <Loader2 size={16} className="animate-spin" />;
