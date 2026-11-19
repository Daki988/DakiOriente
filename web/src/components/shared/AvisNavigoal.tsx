"use client";
import { MessageSquareQuote, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, Button, Chip, Loading, Panel, useToast } from "@/components/app/kit";
import { Check, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

type Avis = { note: number; temoignage: string | null; publier: boolean; affichage: "prenom" | "anonyme"; statut: string; motif: string | null };

/** Étoiles cliquables (clavier : flèches ou chiffres 1 à 5). */
export function Etoiles({ value, onChange, taille = 30 }: { value: number; onChange?: (n: number) => void; taille?: number }) {
  const [survol, setSurvol] = useState(0);
  const v = survol || value;
  return (
    <div role={onChange ? "radiogroup" : "img"} aria-label={onChange ? "Note sur 5" : `${value} sur 5`} className="flex items-center gap-1" onMouseLeave={() => setSurvol(0)}>
      {[1, 2, 3, 4, 5].map((n) => onChange ? (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`} onMouseEnter={() => setSurvol(n)} onClick={() => onChange(n)}
          className="rounded-md p-0.5 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
          <Star size={taille} className={n <= v ? "fill-sun-400 text-sun-400" : "text-slate-300"} />
        </button>
      ) : <Star key={n} size={taille} className={n <= v ? "fill-sun-400 text-sun-400" : "text-slate-300"} aria-hidden />)}
    </div>
  );
}

const STATUT: Record<string, [string, "grey" | "sun" | "green" | "rose"]> = { sans_temoignage: ["Note enregistrée", "grey"], en_attente: ["Témoignage en relecture", "sun"], publie: ["Témoignage publié", "green"], refuse: ["Témoignage non publié", "rose"] };

/** « Votre avis sur Navigoal » : note de 1 à 5 et témoignage facultatif, publié avec votre accord après relecture. */
export function AvisNavigoal() {
  const d = useApi<{ avis: Avis | null }>("/moi/avis-service");
  const act = useAction();
  const toast = useToast();
  const [f, setF] = useState<Avis>({ note: 0, temoignage: "", publier: true, affichage: "prenom", statut: "sans_temoignage", motif: null });
  useEffect(() => { if (d.data?.avis) setF({ ...d.data.avis, temoignage: d.data.avis.temoignage ?? "" }); }, [d.data]);
  const avis = d.data?.avis ?? null;
  const enregistrer = async () => {
    const r = await act.run(() => api<{ avis: Avis }>("/moi/avis-service", { method: "PUT", body: { note: f.note, temoignage: f.temoignage || null, publier: f.publier, affichage: f.affichage } }));
    if (r) { d.setData({ avis: r.avis }); toast(r.avis.statut === "en_attente" ? "Merci ! Votre témoignage sera relu avant publication." : "Merci pour votre note !"); }
  };
  const retirer = async () => {
    if (!confirm("Retirer votre note et votre témoignage ?")) return;
    const r = await act.run(() => api("/moi/avis-service", { method: "DELETE" }));
    if (r !== undefined) { d.setData({ avis: null }); setF({ note: 0, temoignage: "", publier: true, affichage: "prenom", statut: "sans_temoignage", motif: null }); }
  };
  return (
    <section id="avis" className="scroll-mt-24">
      <Panel title="Votre avis sur Navigoal" icon={MessageSquareQuote} action={avis ? <Chip tone={STATUT[avis.statut]?.[1] ?? "grey"}>{STATUT[avis.statut]?.[0]}</Chip> : undefined}>
        {d.loading ? <Loading /> : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">Votre note</span>
              <Etoiles value={f.note} onChange={(n) => setF({ ...f, note: n })} />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">Votre témoignage <span className="font-normal text-ink-mute">(facultatif)</span></span>
              <Textarea value={f.temoignage ?? ""} onChange={(e) => setF({ ...f, temoignage: e.target.value })} maxLength={800} placeholder="Qu'est-ce que Navigoal vous a apporté ? (orientation, choix d'école, candidature, logement…)" />
              <span className="self-end text-xs text-ink-mute">{(f.temoignage ?? "").length} / 800</span>
            </label>
            {!!f.temoignage?.trim() && (
              <div className="flex flex-col gap-2.5 rounded-2xl bg-[#f6f8fe] p-3.5">
                <Check checked={f.publier} onChange={(v) => setF({ ...f, publier: v })}>J&apos;accepte que mon témoignage soit publié sur Navigoal</Check>
                {f.publier && (
                  <div className="flex flex-wrap gap-2 text-sm" role="radiogroup" aria-label="Affichage du nom">
                    {([["prenom", "Avec mon prénom et l'initiale de mon nom"], ["anonyme", "Sans mon nom (profil et pays seulement)"]] as const).map(([k, l]) => (
                      <button key={k} type="button" role="radio" aria-checked={f.affichage === k} onClick={() => setF({ ...f, affichage: k })}
                        className={`chip min-h-[40px] px-3.5 ${f.affichage === k ? "bg-brand-600 text-white" : "bg-white text-ink-soft ring-1 ring-slate-200"}`}>{l}</button>
                    ))}
                  </div>
                )}
                <span className="text-xs text-ink-mute">Chaque témoignage est relu par l&apos;équipe avant publication. Aucune coordonnée n&apos;est affichée.</span>
              </div>
            )}
            {avis?.statut === "refuse" && avis.motif && <Alert tone="warn" title="Témoignage non publié">{avis.motif} Vous pouvez le modifier puis l&apos;enregistrer à nouveau.</Alert>}
            {act.error && <Alert tone="error">{act.error}</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={enregistrer} loading={act.pending} disabled={!f.note}>{avis ? "Mettre à jour" : "Envoyer mon avis"}</Button>
              {avis && <Button type="button" variant="ghost" onClick={retirer} disabled={act.pending}>Retirer</Button>}
            </div>
          </div>
        )}
      </Panel>
    </section>
  );
}
