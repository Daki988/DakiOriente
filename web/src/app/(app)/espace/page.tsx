import type { Metadata } from "next";
import { Dashboard } from "@/components/sections/Dashboard";

export const metadata: Metadata = { title: "Mon espace" };
export default function EspacePage() { return <Dashboard />; }
