import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthTop } from "@/components/auth/AuthTop";
import { Signup } from "@/components/auth/Signup";
import { redirectIfSignedIn } from "@/server/session-ui";

export const metadata: Metadata = { title: "Créer un compte", description: "Inscription gratuite à Navigoal : élève, étudiant, parent, établissement ou bailleur Navilease." };
export const dynamic = "force-dynamic";

export default async function InscriptionPage({ searchParams }: { searchParams: { suite?: string } }) {
  await redirectIfSignedIn(searchParams.suite);
  return (
    <>
      <AuthTop />
      <main className="container px-4 py-5 sm:py-10"><Suspense><Signup /></Suspense></main>
    </>
  );
}
