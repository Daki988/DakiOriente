import { useMemo } from 'react';
import { eligibleSelections } from '../services/matchService';
import { sanitizeSettings } from '../services/settingsService';
import { useApp } from './useAppStore';

/** Sélections admissibles selon les paramètres courants (recalculées à chaque changement). */
export function useEligible() {
  const { matches, selections, settings } = useApp();
  return useMemo(() => eligibleSelections(matches, selections, sanitizeSettings(settings)), [matches, selections, settings]);
}
