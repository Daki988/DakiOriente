"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/admin";

export function AdminNav({ role }: { role: Role }) {
  const path = usePathname();
  const items = [
    { href: "/admin", label: "Commandes", on: path === "/admin" || path.startsWith("/admin/commandes") },
    { href: "/admin/catalogue", label: "Catalogue & prix", on: path.startsWith("/admin/catalogue") },
    ...(role === "super_admin" ? [{ href: "/admin/equipe", label: "Équipe", on: path.startsWith("/admin/equipe") }] : []),
    { href: "/", label: "Voir le site", on: false },
  ];
  return (
    <nav aria-label="Back-office" className="-mx-1 flex gap-1 overflow-x-auto md:mx-0 md:grid">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.on ? "page" : undefined}
          className={`whitespace-nowrap rounded-[10px] px-3 py-2.5 text-[15px] font-medium ${i.on ? "bg-[#9a63ff]/25 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
