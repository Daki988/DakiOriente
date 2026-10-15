import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthTop } from "@/components/auth/AuthTop";
import { Verification } from "@/components/auth/Otp";

export const metadata: Metadata = { title: "Vérification", robots: { index: false } };

export default function VerificationPage() {
  return <><AuthTop step={3} login={false} /><main className="container px-4 py-6 sm:py-14"><Suspense><Verification /></Suspense></main></>;
}
