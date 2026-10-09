import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthTop } from "@/components/auth/AuthTop";
import { Verification } from "@/components/auth/Otp";

export const metadata: Metadata = { title: "Vérification" };

export default function VerificationPage() {
  return <><AuthTop step={3} /><main className="container py-14"><Suspense><Verification /></Suspense></main></>;
}
