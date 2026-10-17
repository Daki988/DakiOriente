import { Alerte } from '@casier/design-system';

import { lireFlash, type Session } from '@/lib/session';

/** Résultat de la dernière action (affiché une seule fois). */
export async function MessageAction(_: { session: Session }) {
  const f = await lireFlash();
  if (!f) return null;
  return <Alerte type={f.type} titre={f.type === 'succes' ? 'C’est fait' : 'Action impossible'}>{f.texte}</Alerte>;
}
