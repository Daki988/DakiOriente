import type { Metadata } from "next";
import { Messages } from "@/components/shared/Messages";

export const metadata: Metadata = { title: "Messages" };
export default function Page({ params }: { params: { id: string } }) { return <Messages id={params.id} />; }
