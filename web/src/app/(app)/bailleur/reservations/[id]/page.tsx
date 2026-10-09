import { redirect } from "next/navigation";

// Les notifications pointent ici : le détail est commun au locataire, au parent et au bailleur.
export default function BailleurReservationPage({ params }: { params: { id: string } }) {
  redirect(`/navilease/reservations/${params.id}/`);
}
