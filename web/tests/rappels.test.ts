import { describe, expect, it } from "vitest";
import { echeance, prochaineEcheance, rappelsDuJour } from "@/lib/rappels";

describe("rappels de paiement", () => {
  it("garde le jour du mois et le ramène à la fin des mois courts", () => {
    expect(echeance("2026-01-31", "mensuel", 1)).toBe("2026-02-28");
    expect(echeance("2026-01-31", "mensuel", 2)).toBe("2026-03-31");
    expect(echeance("2026-11-05", "mensuel", 2)).toBe("2027-01-05");
    expect(echeance("2026-09-15", "trimestriel", 2)).toBe("2027-03-15");
    expect(echeance("2028-02-29", "annuel", 1)).toBe("2029-02-28");
  });
  it("trouve la prochaine échéance, jusqu'à la date de fin", () => {
    const r = { premiereEcheance: "2026-09-05", frequence: "mensuel" };
    expect(prochaineEcheance(r, "2026-11-20")).toBe("2026-12-05");
    expect(prochaineEcheance(r, "2026-12-05")).toBe("2026-12-05");
    expect(prochaineEcheance({ ...r, finLe: "2026-11-30" }, "2026-11-20")).toBeNull();
    expect(prochaineEcheance({ premiereEcheance: "2026-12-01", frequence: "unique" }, "2026-11-20")).toBe("2026-12-01");
    expect(prochaineEcheance({ premiereEcheance: "2026-10-01", frequence: "unique" }, "2026-11-20")).toBeNull();
  });
  it("prévient X jours avant (avec rattrapage) et le jour même si demandé", () => {
    expect(rappelsDuJour("2026-12-05", "2026-11-28", 7, true)).toEqual(["avant"]);
    expect(rappelsDuJour("2026-12-05", "2026-11-27", 7, true)).toEqual([]);
    expect(rappelsDuJour("2026-12-05", "2026-12-03", 2, false)).toEqual(["avant"]);
    expect(rappelsDuJour("2026-12-05", "2026-12-05", 3, true)).toEqual(["jour"]);
    expect(rappelsDuJour("2026-12-05", "2026-12-05", 3, false)).toEqual([]);
  });
});
