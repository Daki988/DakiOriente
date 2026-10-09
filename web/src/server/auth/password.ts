import bcrypt from "bcryptjs";

export const hashPassword = (p: string) => bcrypt.hash(p, 11);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

/** Règle : 8 caractères minimum, au moins une lettre et un chiffre. */
export function passwordProblem(p: string) {
  if (p.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  return null;
}
