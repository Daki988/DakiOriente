import { describe, expect, it } from 'vitest';
import { calendarEventInput, connectorErrorMessage, extractLink, localIso, ticketsCsv } from '../services/connectorService';
import type { Ticket } from '../types';

const ticket: Ticket = {
  id: 'TV-1', createdAt: '2026-01-01T10:00:00.000Z', status: 'PENDING', totalOdds: 1.56, probability: 0.64, virtualStake: 1000, risks: [],
  legs: [{ selectionId: 'm1:OVER_1_5', matchId: 'm1', market: 'OVER_1_5', odds: 1.2, probability: 0.8, homeName: 'FC Horizon', awayName: 'Dynamo Quartz',
    competitionName: 'Ligue, "fictive"', kickoff: '2026-01-02T15:00:00.000Z', reason: '' }],
};

describe('connecteurs', () => {
  it('événement agenda marqué démo, heure locale sans décalage, durée 2 h', () => {
    const e = calendarEventInput({ homeName: 'A', awayName: 'B', competitionName: 'C', kickoff: new Date(2026, 0, 2, 15, 0).toISOString() });
    expect(e.summary).toBe('[DÉMO] A – B');
    expect(e.startTime).toBe('2026-01-02T15:00:00');
    expect(e.endTime).toBe('2026-01-02T17:00:00');
    expect(String(e.description)).toContain('FICTIVE');
    expect(localIso(new Date(2026, 11, 31, 23, 5))).toBe('2026-12-31T23:05:00');
  });
  it('CSV : une ligne par sélection, champs échappés', () => {
    const lines = ticketsCsv([ticket]).split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Ligue, ""fictive"""');
  });
  it('liens et messages d’erreur', () => {
    expect(extractLink({ viewUrl: 'https://mail.google.com/x' }, 'gmail')).toBe('https://mail.google.com/x');
    expect(extractLink({ id: 'abc' }, 'drive')).toBe('https://drive.google.com/open?id=abc');
    expect(extractLink({ link: 'javascript:alert(1)' }, 'calendar')).toBeNull();
    expect(connectorErrorMessage({ code: 'needs_reauth' }, 'Gmail')).toContain('Reconnectez');
    expect(connectorErrorMessage({ code: 'server_unavailable' }, 'Gmail')).toContain('peut-être abouti');
  });
});

import { explainProviderError } from '../services/matchService';
describe('erreurs fournisseur', () => {
  it('traduit le refus de saison de l’offre gratuite', () => {
    expect(explainProviderError('Cotes indisponibles : plan: Free plans do not have access to this season, try from 2022 to 2024.')).toContain('offre Pro');
    expect(explainProviderError('token: Error/Missing application key.')).toContain('API_FOOTBALL_KEY');
  });
});
