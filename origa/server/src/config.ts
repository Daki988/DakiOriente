import { randomBytes } from 'node:crypto';

const env = process.env;

export interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  lotSigningKey: string;
  corsOrigins: string[];
  smsProvider: 'console' | 'http';
  smsHttpUrl?: string;
  smsHttpToken?: string;
  otpTtlSeconds: number;
  tokenTtlSeconds: number;
  /** Demandes de code autorisées par adresse IP et par 10 minutes. */
  authRateLimit: number;
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const prod = env.NODE_ENV === 'production';
  const jwtSecret = env.JWT_SECRET ?? '';
  if (prod && jwtSecret.length < 32) throw new Error('JWT_SECRET doit faire au moins 32 caractères en production');
  if (prod && !/^[0-9a-f]{64}$/i.test(env.LOT_SIGNING_KEY ?? '')) throw new Error('LOT_SIGNING_KEY (64 caractères hexadécimaux) est obligatoire en production');
  return {
    port: Number(env.PORT ?? 8080),
    databaseUrl: env.DATABASE_URL ?? 'postgresql://origa:origa@localhost:5432/origa',
    jwtSecret: jwtSecret || randomBytes(32).toString('hex'),
    // Clé de démonstration identique à celle du client hors-ligne ; à remplacer en production.
    lotSigningKey: env.LOT_SIGNING_KEY || '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173,capacitor://localhost,http://localhost').split(',').map((s) => s.trim()),
    smsProvider: env.SMS_PROVIDER === 'http' ? 'http' : 'console',
    smsHttpUrl: env.SMS_HTTP_URL,
    smsHttpToken: env.SMS_HTTP_TOKEN,
    otpTtlSeconds: 300,
    tokenTtlSeconds: 12 * 3600,
    authRateLimit: Number(env.AUTH_RATE_LIMIT ?? 5),
    ...overrides,
  };
}
