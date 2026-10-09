"use client";
import { Eye, EyeOff, Loader2, UploadCloud } from "lucide-react";
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
      <Input {...p} type={show ? "text" : "password"} className="pr-11" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
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
  ["certificat", "Certificat"], ["attestation_admission", "Attestation d'admission"], ["attestation_scolarite", "Attestation de scolarité"], ["piece_garant", "Pièce d'identité du garant"], ["justificatif_ressources", "Justificatif de ressources"], ["autre", "Autre document"],
];
export const docLabel = (t: string) => DOC_TYPES.find(([k]) => k === t)?.[1] ?? ({ kyc_identite: "Pièce d'identité (bailleur)", kyc_propriete: "Titre de propriété ou mandat" } as Record<string, string>)[t] ?? t;

export type Doc = { id: string; type: string; fileName: string; size: number; mime: string; status: string; createdAt: string; label: string | null };

/** Dépôt de document (glisser-déposer ou sélection) vers le coffre-fort. */
export function FileDrop({ type, onUploaded, compact, types = DOC_TYPES }: { type?: string; onUploaded: (d: Doc) => void; compact?: boolean; types?: [string, string][] }) {
  const [t, setT] = useState(type ?? types[0][0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const send = async (f: File) => {
    setBusy(true); setErr(null);
    const fd = new FormData();
    fd.append("fichier", f); fd.append("type", t);
    try { onUploaded(await api<Doc>("/documents", { form: fd })); } catch (e) { setErr(e instanceof Error ? e.message : "Échec du dépôt."); } finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  return (
    <div className="flex flex-col gap-2">
      {!type && <Select value={t} onChange={(e) => setT(e.target.value)} options={types} aria-label="Type de document" />}
      <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) send(f); }}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 text-center transition ${compact ? "py-4" : "py-8"} ${over ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-[#fbfcff] hover:border-brand-400"}`}>
        {busy ? <Loader2 className="animate-spin text-brand-600" /> : <UploadCloud className="text-brand-600" />}
        <b className="text-sm">{busy ? "Envoi en cours…" : "Glissez-déposez le fichier ici ou cliquez pour choisir"}</b>
        <span className="text-xs text-ink-mute">PDF, JPG, PNG ou WebP · 8 Mo maximum</span>
      </button>
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); }} />
      {err && <span className="text-xs font-semibold text-[#d42a50]">{err}</span>}
    </div>
  );
}

export const FormError = ({ error }: { error: string | null }) => error ? <p className="rounded-xl bg-[#fff1f3] px-4 py-3 text-sm font-semibold text-[#a3133b]" role="alert">{error}</p> : null;
export const Spinner = () => <Loader2 size={16} className="animate-spin" />;
