import { Alerte } from '@casier/design-system';

import { lireFlash, type Session } from '@/lib/session';

/** Résultat de la dernière action (affiché une seule fois). */
export function MessageAction({ session }: { session: Session }) {
  const f = lireFlash(session);
  if (!f) return null;
  return <Alerte type={f.type} titre={f.type === 'succes' ? 'C’est fait' : 'Action impossible'}>{f.texte}</Alerte>;
}
