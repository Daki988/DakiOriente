import type { MarketId } from '../../types';
import { MARKETS, VOLATILE_MARKETS } from '../../utils/markets';

export function MarketPicker({ value, onChange, prudent = false }: { value: MarketId[]; onChange: (v: MarketId[]) => void; prudent?: boolean }) {
  const toggle = (id: MarketId) => onChange(value.includes(id) ? value.filter((m) => m !== id) : [...value, id]);
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-ink-2">Marchés autorisés</legend>
      <div className="flex flex-wrap gap-2">
        {MARKETS.map((m) => {
          const on = value.includes(m.id);
          const blocked = prudent && VOLATILE_MARKETS.includes(m.id);
          return (
            <label
              key={m.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                on ? 'border-good/40 bg-good-soft text-ink' : 'border-line bg-night-2 text-muted hover:text-ink-2'
              } ${blocked ? 'opacity-60' : ''}`}
              title={blocked ? 'Exclu par le mode prudent' : undefined}
            >
              <input type="checkbox" className="size-3.5" checked={on} onChange={() => toggle(m.id)} />
              {m.label}
              {blocked && <span className="text-[10px] text-warn">(prudent : exclu)</span>}
            </label>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3 text-[11px]">
        <button type="button" className="text-[#7fb2f0] hover:underline" onClick={() => onChange(MARKETS.map((m) => m.id))}>Tout sélectionner</button>
        <button type="button" className="text-muted hover:text-ink-2 hover:underline" onClick={() => onChange([])}>Tout désélectionner</button>
      </div>
    </fieldset>
  );
}
