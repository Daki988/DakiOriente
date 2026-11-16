import type { Metadata } from "next";
import { Messages } from "@/components/shared/Messages";

export const metadata: Metadata = { title: "Messages" };
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <Messages id={params.id} />;
}
