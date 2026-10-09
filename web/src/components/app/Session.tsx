"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { ClientUser } from "@/server/session-ui";

const Ctx = createContext<ClientUser | null>(null);
export function SessionProvider({ user, children }: { user: ClientUser | null; children: ReactNode }) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}
export const useSession = () => useContext(Ctx);
export function useUser() {
  const u = useContext(Ctx);
  if (!u) throw new Error("useUser hors session");
  return u;
}
