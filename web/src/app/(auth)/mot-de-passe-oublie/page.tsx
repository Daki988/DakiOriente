import type { Metadata } from "next";
import { AuthTop } from "@/components/auth/AuthTop";
import { ForgotPassword } from "@/components/auth/Otp";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  return <><AuthTop /><main className="container py-14"><ForgotPassword /></main></>;
}
