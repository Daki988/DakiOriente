import type { Config } from '@netlify/functions';
import { createHandler } from '../../server/http';

// La clé API-Football se règle dans Netlify : Project configuration → Environment variables (portée « Functions »).
const handler = createHandler((key) => Netlify.env.get(key));

export default async (req: Request) => handler(req);

export const config: Config = {
  path: ['/api/health', '/api/matches', '/api/results'],
};
