import { describe, expect, it } from "vitest";
import { bourseById, boursesPour, eligibilite } from "@/lib/bourses";

const nov2026 = new Date("2026-11-19T12:00:00Z");
const anbg = bourseById["ga-anbg"];

describe("éligibilité aux bourses", () => {
  it("Gabonais de 18 ans avec 12/20 : éligible à l'ANBG", () => {
    expect(eligibilite(anbg, { pays: "GA", anneeNaissance: 2008, moyenne: 12 }, nov2026).statut).toBe("eligible");
  });
  it("autre nationalité : non éligible, avec la raison", () => {
    const v = eligibilite(anbg, { pays: "CM", anneeNaissance: 2008, moyenne: 14 }, nov2026);
    expect(v.statut).toBe("non_eligible");
    expect(v.raisons.join(" ")).toMatch(/Gabon/);
  });
  it("moyenne sous 10 : non éligible", () => {
    expect(eligibilite(anbg, { pays: "GA", anneeNaissance: 2008, moyenne: 9.5 }, nov2026).statut).toBe("non_eligible");
  });
  it("24 ans : à vérifier (bac professionnel jusqu'à 27 ans) ; 30 ans : non éligible", () => {
    expect(eligibilite(anbg, { pays: "GA", anneeNaissance: 2002, moyenne: 12 }, nov2026).statut).toBe("a_verifier");
    expect(eligibilite(anbg, { pays: "GA", anneeNaissance: 1996, moyenne: 12 }, nov2026).statut).toBe("non_eligible");
  });
  it("profil incomplet : à vérifier", () => {
    expect(eligibilite(anbg, { pays: "GA" }, nov2026).statut).toBe("a_verifier");
  });
  it("bourses réservées au public : jamais « éligible » pour les écoles privées de Navigoal", () => {
    const v = eligibilite(bourseById["ma-amci"], { pays: "SN", anneeNaissance: 2008, moyenne: 15, destination: "MA" }, nov2026);
    expect(v.statut).toBe("a_verifier");
    expect(v.raisons.join(" ")).toMatch(/PUBLIC/);
  });
  it("classement : éligibles d'abord", () => {
    const r = boursesPour({ pays: "GA", anneeNaissance: 2008, moyenne: 12, destination: "MA" }, nov2026);
    expect(r[0].verdict.statut).toBe("eligible");
    expect(r.map((x) => x.verdict.statut)).toEqual([...r.map((x) => x.verdict.statut)].sort((a, b) => ["eligible", "a_verifier", "non_eligible"].indexOf(a) - ["eligible", "a_verifier", "non_eligible"].indexOf(b)));
  });
});
