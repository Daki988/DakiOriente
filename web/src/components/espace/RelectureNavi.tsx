"use client";
// Relecture de la lettre de motivation par Navi : points forts, conseils, questions. Navi ne réécrit pas la lettre.
import { Lightbulb, MessageCircleQuestion, Sparkles, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/app/kit";
import { FormError } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction } from "@/hooks/useApi";

type Relecture = { points_forts: string[]; a_ameliorer: string[]; questions: string[]; avis: string };

export function RelectureNavi({ texte, programmeId }: { texte: string; programmeId?: string | null }) {
  const [r, setR] = useState<Relecture | null>(null);
  const act = useAction();
  const mots = texte.trim() ? texte.trim().split(/\s+/).length : 0;
  const relire = () => act.run(async () => setR(await api<Relecture>("/navi/relire-motivation", { body: { texte, programmeId } })));
  const Bloc = ({ titre, icone: I, items, teinte }: { titre: string; icone: typeof Lightbulb; items: string[]; teinte: string }) => items.length ? (
    <div className="flex flex-col gap-1.5"><b className={`flex items-center gap-1.5 text-[13px] ${teinte}`}><I size={15} />{titre}</b><ul className="list-disc space-y-1 pl-5 text-[13px] text-ink-soft">{items.map((x) => <li key={x}>{x}</li>)}</ul></div>
  ) : null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" icon={Sparkles} loading={act.pending} disabled={mots < 40} onClick={relire}>{r ? "Relire à nouveau" : "Faire relire par Navi"}</Button>
        <span className="text-xs text-ink-mute">{mots < 40 ? "Écris au moins 40 mots pour demander une relecture." : "Navi te donne des conseils ; c'est toi qui écris ta lettre."}</span>
      </div>
      <FormError error={act.error} />
      {r && (
        <div className="flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
          {r.avis && <p className="text-sm font-semibold text-ink">{r.avis}</p>}
          <Bloc titre="Ce qui marche" icone={ThumbsUp} items={r.points_forts} teinte="text-[#0f8a46]" />
          <Bloc titre="À améliorer" icone={Lightbulb} items={r.a_ameliorer} teinte="text-[#8a4b00]" />
          <Bloc titre="Pour t'aider à écrire" icone={MessageCircleQuestion} items={r.questions} teinte="text-brand-700" />
        </div>
      )}
    </div>
  );
}
