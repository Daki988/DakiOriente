import { redirect } from "next/navigation";

// Les notifications pointent ici : le détail est commun au locataire, au parent et au bailleur.
export default async function BailleurReservationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/navilease/reservations/${params.id}/`);
}
