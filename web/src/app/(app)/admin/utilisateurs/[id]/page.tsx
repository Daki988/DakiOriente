import type { Metadata } from "next";
import { AdminDossier } from "@/components/admin/AdminDossier";

export const metadata: Metadata = { title: "Back-office · Dossier" };
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <AdminDossier id={id} />;
}
