/** Erreur métier présentable à l'utilisateur (message en français). */
export class AppError extends Error {
  constructor(message: string, public status = 400, public code = "erreur") {
    super(message);
  }
}
export const notFound = (what = "Élément") => new AppError(`${what} introuvable.`, 404, "introuvable");
export const forbidden = () => new AppError("Accès refusé.", 403, "interdit");
export const unauthorized = () => new AppError("Connexion requise.", 401, "non_connecte");
