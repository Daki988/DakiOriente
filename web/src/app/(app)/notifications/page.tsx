import type { Metadata } from "next";
import { Notifications } from "@/components/shared/Notifications";

export const metadata: Metadata = { title: "Notifications" };
export default function Page() { return <Notifications />; }
