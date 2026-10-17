import { redirect } from 'next/navigation';

/** PUB-12 : /reclamation mène au formulaire de la page contact. */
export default function Reclamation() {
  redirect('/contact#reclamation');
}
