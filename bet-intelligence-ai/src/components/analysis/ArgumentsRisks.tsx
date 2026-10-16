import { CheckCircle2, ShieldAlert } from 'lucide-react';

export function ArgumentsRisks({ args, risks }: { args: string[]; risks: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-good">
          <CheckCircle2 size={14} aria-hidden /> Arguments favorables
        </h3>
        <ul className="space-y-1.5">
          {args.map((a) => (
            <li key={a} className="rounded-lg border border-good/15 bg-good-soft/40 px-3 py-2 text-xs leading-relaxed text-ink-2">{a}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-warn">
          <ShieldAlert size={14} aria-hidden /> Facteurs de risque
        </h3>
        <ul className="space-y-1.5">
          {risks.map((r) => (
            <li key={r} className="rounded-lg border border-warn/15 bg-warn-soft/40 px-3 py-2 text-xs leading-relaxed text-ink-2">{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
