import { BarChart3, BrainCircuit, Gauge, LayoutDashboard, ListChecks, Settings, Ticket } from 'lucide-react';
import type { RouteId } from '../../hooks/useHashRoute';

export const NAV_ITEMS: { id: RouteId; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'matchs', label: 'Matchs', Icon: ListChecks },
  { id: 'analyse', label: 'Analyse IA', Icon: BrainCircuit },
  { id: 'generateur', label: 'Générateur de tickets', Icon: Ticket },
  { id: 'tickets', label: 'Mes tickets', Icon: Gauge },
  { id: 'performances', label: 'Performances', Icon: BarChart3 },
  { id: 'parametres', label: 'Paramètres', Icon: Settings },
];
