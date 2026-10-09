import type { Metadata } from "next";
import { Account } from "@/components/shared/Account";

export const metadata: Metadata = { title: "Compte et sécurité" };
export default function Page() { return <Account />; }
