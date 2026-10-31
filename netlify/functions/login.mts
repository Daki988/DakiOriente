// Connexion au back-office : 5 essais par minute au maximum, pour freiner les tentatives de mot de passe.
import type { Config } from "@netlify/functions";
import { json, fail, checkPassword, createToken } from "../lib/common.mts";

export default async (req: Request) => {
  const { password } = await req.json().catch(() => ({}));
  if (!(await checkPassword(password))) return fail("Mot de passe incorrect.", 401);
  return json({ token: await createToken() });
};

export const config: Config = {
  path: "/api/admin/login",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 5 },
};
