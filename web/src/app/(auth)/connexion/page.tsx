import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthAside } from "@/components/auth/AuthAside";
import { Login } from "@/components/auth/Login";
import { Brand } from "@/components/ui/Brand";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[600px_1fr]">
      <AuthAside />
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden"><Brand /></div>
        <div className="flex flex-1 items-center py-10"><Suspense><Login /></Suspense></div>
      </main>
    </div>
  );
}
