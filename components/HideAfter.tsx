"use client";
import { useEffect, useState } from "react";

/** Masque son contenu une fois la date passée (utile en hébergement statique, sans régénération serveur). */
export function HideAfter({ date, children }: { date: string; children: React.ReactNode }) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    // fin de journée à Libreville (UTC+1) + nuit de fête jusqu'à 6 h
    setPast(Date.now() > new Date(`${date}T06:00:00+01:00`).getTime() + 24 * 3600 * 1000);
  }, [date]);
  return past ? null : <>{children}</>;
}
