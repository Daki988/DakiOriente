import type { Settings } from '../../types';
import { PRUDENT_MAX_SELECTIONS, PRUDENT_MIN_PROBABILITY } from '../../services/matchService';
import { formatPct } from '../../utils/format';
import { NumberField, Toggle } from '../ui/Fields';
import { MarketPicker } from '../ui/MarketPicker';

export function validateCriteria(s: Settings) {
  const e: Partial<Record<'minProbability' | 'minOdds' | 'maxOdds' | 'minSelections' | 'maxSelections' | 'target' | 'markets', string>> = {};
  if (!Number.isFinite(s.minProbability) || s.minProbability <= 0 || s.minProbability >= 1) e.minProbability = 'Entre 1 % et 99 %.';
  if (!Number.isFinite(s.minOdds) || s.minOdds < 1.01) e.minOdds = 'Au moins 1,01.';
  if (!Number.isFinite(s.maxOdds) || s.maxOdds < 1.01) e.maxOdds = 'Au moins 1,01.';
  else if (Number.isFinite(s.minOdds) && s.maxOdds < s.minOdds) e.maxOdds = 'Doit être ≥ à la cote minimale.';
  if (!Number.isInteger(s.minSelections) || s.minSelections < 1 || s.minSelections > 10) e.minSelections = 'Entier entre 1 et 10.';
  if (!Number.isInteger(s.maxSelections) || s.maxSelections < 1 || s.maxSelections > 10) e.maxSelections = 'Entier entre 1 et 10.';
  else if (Number.isInteger(s.minSelections) && s.maxSelections < s.minSelections) e.maxSelections = 'Doit être ≥ au minimum.';
  if (s.targetTotalOdds != null && (!Number.isFinite(s.targetTotalOdds) || s.targetTotalOdds <= 1)) e.target = 'Supérieure à 1, ou laissez vide.';
  if (s.allowedMarkets.length === 0) e.markets = 'Autorisez au moins un marché.';
  return e;
}

/** Formulaire des critères de sélection — partagé entre le générateur et les paramètres. */
export function CriteriaForm({ settings, onChange }: { settings: Settings; onChange: (patch: Partial<Settings>) => void }) {
  const errors = validateCriteria(settings);
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-night-2 p-4">
        <Toggle
          label="Mode prudent"
          description={`Données de haute qualité uniquement, marchés volatils exclus (nul, BTTS, +2,5), probabilité ≥ ${formatPct(PRUDENT_MIN_PROBABILITY)}, ${PRUDENT_MAX_SELECTIONS} sélections au plus.`}
          checked={settings.prudentMode}
          onChange={(v) => onChange({ prudentMode: v })}
        />
      </div>
      <div>
        <label htmlFor="crit-prob" className="mb-1.5 flex justify-between text-xs font-medium text-ink-2">
          Probabilité minimale par sélection
          <span className="tabular font-semibold text-ink">{Number.isFinite(settings.minProbability) ? formatPct(settings.minProbability) : '—'}</span>
        </label>
        <input
          id="crit-prob"
          type="range"
          min={50}
          max={95}
          step={1}
          className="w-full"
          value={Math.round((settings.minProbability || 0) * 100)}
          onChange={(e) => onChange({ minProbability: Number(e.target.value) / 100 })}
        />
        {errors.minProbability && <p className="mt-1 text-[11px] text-risk">{errors.minProbability}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Cote minimale" value={settings.minOdds} step={0.05} min={1.01} onChange={(v) => onChange({ minOdds: v })} error={errors.minOdds} />
        <NumberField label="Cote maximale" value={settings.maxOdds} step={0.05} min={1.01} onChange={(v) => onChange({ maxOdds: v })} error={errors.maxOdds} />
        <NumberField label="Sélections minimum" value={settings.minSelections} min={1} max={10} onChange={(v) => onChange({ minSelections: v })} error={errors.minSelections} />
        <NumberField label="Sélections maximum" value={settings.maxSelections} min={1} max={10} onChange={(v) => onChange({ maxSelections: v })} error={errors.maxSelections} />
      </div>
      <NumberField
        label="Cote totale indicative souhaitée (facultatif)"
        value={settings.targetTotalOdds ?? Number.NaN}
        step={0.1}
        min={1.01}
        onChange={(v) => onChange({ targetTotalOdds: Number.isFinite(v) ? v : null })}
        hint="Des sélections sont ajoutées (jusqu’au maximum) pour s’en approcher, sans jamais assouplir les critères de qualité."
        error={errors.target}
      />
      <div>
        <MarketPicker value={settings.allowedMarkets} onChange={(v) => onChange({ allowedMarkets: v })} prudent={settings.prudentMode} />
        {errors.markets && <p className="mt-1 text-[11px] text-risk">{errors.markets}</p>}
      </div>
    </div>
  );
}
