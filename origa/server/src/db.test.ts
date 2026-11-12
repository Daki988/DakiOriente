import { describe, expect, it } from 'vitest';
import { databaseCa } from './db.js';

describe('autorité de certification de la base', () => {
  it('utilise la racine Supabase pour un hôte Supabase', () => {
    const ca = databaseCa('postgres://u:p@aws-1-eu-west-3.pooler.supabase.com:5432/postgres', {});
    expect(ca).toContain('-----BEGIN CERTIFICATE-----');
  });
  it("garde les autorités du système pour un autre hôte", () => {
    expect(databaseCa('postgres://u:p@db.aninf.ga:5432/origa', {})).toBeUndefined();
  });
  it('accepte une autorité fournie en texte PEM', () => {
    expect(databaseCa('postgres://u:p@db.aninf.ga/origa', { DATABASE_CA: '-----BEGIN CERTIFICATE-----\\nabc\\n-----END CERTIFICATE-----' })).toBe('-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----');
  });
});
