import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadCloudState, saveCloudState } from '../services/cloudSync';
import { fetchCompetitions, fetchMatches, toSelections } from '../services/matchService';
import { loadSettings, saveSettings, sanitizeSettings, DEFAULT_SETTINGS } from '../services/settingsService';
import { readJson, removeKey, STORAGE_KEYS, writeJson } from '../services/storage';
import { loadTickets, saveTickets } from '../services/ticketService';
import type { Competition, Match, Selection, Settings, Ticket } from '../types';
import { useHashRoute, type RouteId } from './useHashRoute';

export interface Toast {
  id: number;
  tone: 'good' | 'warn' | 'risk' | 'info';
  message: string;
}

interface AppState {
  route: RouteId;
  navigate: (r: RouteId) => void;
  matches: Match[];
  competitions: Competition[];
  selections: Selection[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  tickets: Ticket[];
  addTicket: (t: Ticket) => void;
  updateTicket: (t: Ticket) => void;
  deleteTicket: (id: string) => void;
  resetDemo: () => void;
  analysisMatchId: string | null;
  openAnalysis: (matchId: string) => void;
  setAnalysisMatchId: (id: string | null) => void;
  toasts: Toast[];
  notify: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
  storageOk: boolean;
  /** Sauvegarde liée au compte claude.ai (version en ligne uniquement). */
  cloud: CloudStatus;
}

export type CloudStatus = 'off' | 'loading' | 'synced' | 'saving' | 'error';

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, navigate] = useHashRoute();
  const [oddsSeed, setOddsSeed] = useState<number>(() => readJson<number>(STORAGE_KEYS.seed, 1));
  const [matches, setMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [tickets, setTickets] = useState<Ticket[]>(loadTickets);
  const [analysisMatchId, setAnalysisMatchId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storageOk, setStorageOk] = useState(true);
  const toastId = useRef(0);
  const [cloud, setCloud] = useState<CloudStatus>('loading');
  const hydrated = useRef(false);
  const [cloudCheck, setCloudCheck] = useState(0);

  const notify = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, tone, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchMatches(oddsSeed), fetchCompetitions()])
      .then(([m, c]) => {
        if (cancelled) return;
        setMatches(m);
        setCompetitions(c);
        setLastUpdated(new Date());
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur inconnue lors du chargement des données.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [oddsSeed]);

  const refresh = useCallback(() => {
    setOddsSeed((s) => {
      const next = (s % 9973) + 1;
      writeJson(STORAGE_KEYS.seed, next);
      return next;
    });
  }, []);

  useEffect(() => {
    setStorageOk(saveSettings(settings));
  }, [settings]);
  useEffect(() => {
    setStorageOk(saveTickets(tickets));
  }, [tickets]);

  // Restaure l'état sauvegardé sur le compte (en ligne) ; sinon y pousse l'état local.
  useEffect(() => {
    let cancelled = false;
    loadCloudState()
      .then((remote) => {
        if (cancelled) return;
        if (remote) {
          setSettings(remote.settings);
          setTickets(remote.tickets);
          setOddsSeed(remote.oddsSeed);
          writeJson(STORAGE_KEYS.seed, remote.oddsSeed);
        }
        hydrated.current = true;
        setCloud(remote ? 'synced' : 'loading');
        if (!remote) setCloudCheck((n) => n + 1);
      })
      .catch(() => {
        if (cancelled) return;
        hydrated.current = true;
        setCloud('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const t = window.setTimeout(() => {
      setCloud((c) => (c === 'off' ? c : 'saving'));
      saveCloudState({ settings: sanitizeSettings(settings), tickets, oddsSeed })
        .then((r) => setCloud(r === 'saved' ? 'synced' : 'off'))
        .catch(() => setCloud('error'));
    }, 800);
    return () => window.clearTimeout(t);
  }, [settings, tickets, oddsSeed, cloudCheck]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const resetSettings = useCallback(() => setSettings(sanitizeSettings(DEFAULT_SETTINGS)), []);
  const addTicket = useCallback((t: Ticket) => setTickets((all) => [t, ...all]), []);
  const updateTicket = useCallback((t: Ticket) => setTickets((all) => all.map((x) => (x.id === t.id ? t : x))), []);
  const deleteTicket = useCallback((id: string) => setTickets((all) => all.filter((x) => x.id !== id)), []);
  const resetDemo = useCallback(() => {
    removeKey(STORAGE_KEYS.tickets);
    removeKey(STORAGE_KEYS.settings);
    removeKey(STORAGE_KEYS.seed);
    setTickets([]);
    setSettings(sanitizeSettings(DEFAULT_SETTINGS));
    setOddsSeed(1);
  }, []);
  const openAnalysis = useCallback(
    (id: string) => {
      setAnalysisMatchId(id);
      navigate('analyse');
    },
    [navigate],
  );

  const selections = useMemo(() => toSelections(matches, competitions), [matches, competitions]);

  const value: AppState = {
    route, navigate, matches, competitions, selections, loading, error, lastUpdated, refresh,
    settings, updateSettings, resetSettings, tickets, addTicket, updateTicket, deleteTicket, resetDemo,
    analysisMatchId, openAnalysis, setAnalysisMatchId, toasts, notify, dismissToast, storageOk, cloud,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp doit être utilisé dans <AppProvider>.');
  return v;
}
