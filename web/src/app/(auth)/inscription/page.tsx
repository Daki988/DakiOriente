import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthTop } from "@/components/auth/AuthTop";
import { Signup } from "@/components/auth/Signup";

export const metadata: Metadata = { title: "Créer un compte" };

export default function InscriptionPage() {
  return (
    <>
      <AuthTop />
      <main className="container py-10"><Suspense><Signup /></Suspense></main>
    </>
  );
}
