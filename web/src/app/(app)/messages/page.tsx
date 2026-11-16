import type { Metadata } from "next";
import { Messages } from "@/components/shared/Messages";

export const metadata: Metadata = { title: "Messages" };
export default async function Page(props: { searchParams: Promise<{ c?: string }> }) {
  const searchParams = await props.searchParams;
  return <Messages id={searchParams.c} />;
}
