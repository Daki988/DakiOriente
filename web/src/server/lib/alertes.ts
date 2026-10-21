// Alerte par e-mail (ALERTE_EMAIL) quand une erreur serveur inattendue survient en production.
// Une même erreur n'est signalée qu'une fois par quart d'heure, pour ne pas inonder la boîte de réception.
const DELAI = 15 * 60_000;
const derniers = new Map<string, number>();

export function signalerErreur(e: unknown) {
  const dest = process.env.ALERTE_EMAIL;
  if (!dest || process.env.NODE_ENV === "test") return;
  const err = e instanceof Error ? e : new Error(String(e));
  const cle = `${err.name}: ${err.message}`.slice(0, 200);
  const maintenant = Date.now();
  if (maintenant - (derniers.get(cle) ?? 0) < DELAI) return;
  derniers.set(cle, maintenant);
  if (derniers.size > 200) derniers.delete(derniers.keys().next().value!);
  void import("./messaging-channels")
    .then(({ sendEmail }) => sendEmail({ to: dest, subject: `Erreur serveur Navigoal : ${cle.slice(0, 80)}`, text: `${cle}\n\n${(err.stack ?? "").split("\n").slice(0, 8).join("\n")}\n\n${new Date().toISOString()}` }))
    .catch(() => { /* l'alerte ne doit jamais faire échouer la requête */ });
}
