import type { Metadata } from "next";
import { Messages } from "@/components/shared/Messages";

export const metadata: Metadata = { title: "Messages" };
export default function Page({ searchParams }: { searchParams: { c?: string } }) { return <Messages id={searchParams.c} />; }
