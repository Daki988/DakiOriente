/**
 * Chemin de redirection interne (paramètre « suite » après connexion), sinon null.
 * Refuse tout ce qu'un navigateur pourrait interpréter comme un autre site : « //evil.com », « /\evil.com »,
 * caractères de contrôle (« /<tab>/evil.com » devient « //evil.com » une fois la tabulation supprimée), URL absolues.
 */
export function cheminInterne(s: string | null | undefined): string | null {
  if (!s || s.length > 500 || !s.startsWith("/") || /[\x00-\x1f\x7f\\]/.test(s)) return null;
  try {
    const u = new URL(s, "http://navigoal.local");
    return u.origin === "http://navigoal.local" && !s.startsWith("//") ? u.pathname + u.search + u.hash : null;
  } catch {
    return null;
  }
}
