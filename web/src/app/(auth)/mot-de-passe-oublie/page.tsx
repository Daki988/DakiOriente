import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthTop } from "@/components/auth/AuthTop";
import { ForgotPassword } from "@/components/auth/Otp";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPage() {
  return <><AuthTop /><main className="container px-4 py-6 sm:py-14"><Suspense><ForgotPassword /></Suspense></main></>;
}
