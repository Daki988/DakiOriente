import { describe, expect, it } from "vitest";
import { PERSO_DEFAUT, devis, formationParDefaut } from "@/lib/devis";
import { residencesEtudiantes } from "@/lib/residences";

describe("devis personnalisé", () => {
  const eid = "ma-esa-casa", fid = formationParDefaut("ma-esa-casa");
  it("sans personnalisation, le devis standard est inchangé ; avec, il reste du même ordre et détaille les postes", () => {
    const std = devis(eid, fid, "GA", "studio");
    expect(std.postes).toBeUndefined();
    const p = devis(eid, fid, "GA", "studio", { ...PERSO_DEFAUT });
    expect(p.postes?.length).toBeGreaterThan(5);
    // Studio standard + niveau normal + tramway : même ordre de grandeur que le devis standard (± 20 %)
    expect(p.total[0]).toBeGreaterThan(std.total[0] * 0.8);
    expect(p.total[1]).toBeLessThan(std.total[1] * 1.2);
    expect(p.postes!.some((x) => x.quand === "avant" && /aller/.test(x.libelle))).toBe(true);
  });
  it("chaque choix fait bouger le total dans le bon sens, la bourse est déduite sans total négatif", () => {
    const base = devis(eid, fid, "GA", "studio", { ...PERSO_DEFAUT });
    const plus = devis(eid, fid, "GA", "studio", { ...PERSO_DEFAUT, logement: "standing", niveau: "confortable", transport: "taxi", assurance: "complete", retours: 2, ordinateur: true, soutien: true });
    const moins = devis(eid, fid, "GA", "studio", { ...PERSO_DEFAUT, logement: "colocation", niveau: "econome" });
    expect(plus.total[0]).toBeGreaterThan(base.total[0]);
    expect(moins.total[1]).toBeLessThan(base.total[1]);
    const aide = devis(eid, fid, "GA", "studio", { ...PERSO_DEFAUT, aide: 20000 });
    expect(base.total[1] - aide.total[1]).toBe(20000 * aide.years);
    expect(devis(eid, fid, "GA", "studio", { ...PERSO_DEFAUT, aide: 1e9 }).total[0]).toBe(0);
  });
  it("une résidence universitaire utilise son vrai loyer", () => {
    const r = residencesEtudiantes.find((x) => x.ville === "Casablanca" && x.logements[0]?.loyer_min)!;
    const d = devis(eid, fid, "GA", "studio", { ...PERSO_DEFAUT, logement: `res:${r.id}:0`, residences: residencesEtudiantes });
    const loyer = d.postes!.find((x) => x.quand === "mois" && x.libelle.includes(r.nom))!;
    expect(loyer.v).toEqual([r.logements[0].loyer_min, r.logements[0].loyer_max ?? r.logements[0].loyer_min]);
  });
});
describe("détail du devis par rubrique", () => {
  it("le logement est isolé, les rubriques et les lignes retombent exactement sur le total", () => {
    const eid = "ma-esa-casa", fid = formationParDefaut("ma-esa-casa");
    for (const d of [devis(eid, fid, "GA", "studio"), devis(eid, fid, "GA", "colocation"), devis(eid, fid, "SN", "studio", { ...PERSO_DEFAUT, retours: 1, ordinateur: true, soutien: true, transport: "taxi" })]) {
      expect(d.cats.Logement[1]).toBeGreaterThan(0);
      const somme = (xs: [number, number][]) => xs.reduce((a, x) => [a[0] + x[0], a[1] + x[1]], [0, 0]);
      const parRubrique = somme(Object.values(d.cats));
      const parLigne = somme(d.detail.map((x) => x.v));
      expect(parLigne[0]).toBeCloseTo(parRubrique[0], -1);
      expect(parRubrique[0]).toBeCloseTo(d.total[0] + (d.aides?.[1] ?? 0), -1);
      expect(parRubrique[1]).toBeCloseTo(d.total[1] + (d.aides?.[0] ?? 0), -1);
    }
  });
});
describe("éléments cochés un par un", () => {
  it("décocher une ligne la retire du total (avec ses imprévus et transferts), de l'échéancier et des rubriques", () => {
    const eid = "ma-esa-casa", fid = formationParDefaut("ma-esa-casa");
    const tout = devis(eid, fid, "GA", "studio");
    const sans = devis(eid, fid, "GA", "studio", undefined, ["loyer", "billets"]);
    const loyer = tout.detail.find((x) => x.cle === "loyer")!.v, billets = tout.detail.find((x) => x.cle === "billets")!.v;
    const k = 1 + 0.08 + 0.02;
    expect(tout.total[1] - sans.total[1]).toBeCloseTo((loyer[1] + billets[1]) * k, -2);
    expect(sans.detail.find((x) => x.cle === "loyer")!.inclus).toBe(false);
    expect(sans.cats.Logement[1]).toBeLessThan(tout.cats.Logement[1]);
    expect(sans.rows[0].vie[1]).toBeLessThan(tout.rows[0].vie[1]);
    const p = devis(eid, fid, "GA", "studio", { ...PERSO_DEFAUT }, ["scolarite"]);
    expect(p.postes!.some((x) => /scolarité/i.test(x.libelle))).toBe(false);
  });
});

describe("coûts par ville, annonce Navilease et prix « à partir de »", () => {
  it("le coût de la vie dépend de la ville d'études", async () => {
    const { devis, coutVille, budgetVille, COUTS } = await import("@/lib/devis");
    const { etablissements } = await import("@/lib/data");
    expect(coutVille(COUTS.MA, "Ben Guérir")).not.toBeNull();
    expect(coutVille(COUTS.MA, "Bouskoura")).toBe(coutVille(COUTS.MA, "Casablanca"));
    const casa = etablissements.find((e) => e.pays === "MA" && e.ville === "Casablanca")!;
    const fes = etablissements.find((e) => e.pays === "MA" && e.ville === "Fès")!;
    const vie = (eid: string) => devis(eid, casa.id === eid ? casa.formations[0] : fes.formations[0]).detail.find((l) => l.cle === "loyer")!.unitaire[0];
    expect(vie(casa.id)).toBeGreaterThan(vie(fes.id));
    expect(budgetVille("MA", "Fès")!.total_mensuel.min).toBeLessThan(budgetVille("MA", "Casablanca")!.total_mensuel.min);
  });
  it("une annonce Navilease fixe le loyer et la caution du devis personnalisé", async () => {
    const { devis, PERSO_DEFAUT } = await import("@/lib/devis");
    const { etablissements } = await import("@/lib/data");
    const e = etablissements.find((x) => x.pays === "MA" && x.ville === "Rabat")!;
    const annonces = [{ id: "h1", titre: "Studio Agdal", ville: "Rabat", quartier: "Agdal", type: "studio", loyer: 3200, caution: 3200 }];
    const d = devis(e.id, e.formations[0], "GA", "studio", { ...PERSO_DEFAUT, logement: "nl:h1", annonces });
    const loyer = d.detail.find((l) => l.cle === "loyer")!;
    expect(loyer.unitaire).toEqual([3200, 3200]);
    expect(loyer.libelle).toContain("Studio Agdal");
    expect(d.detail.find((l) => l.cle === "caution")!.v).toEqual([6400, 6400]);
  });
  it("jamais de fourchette : montant seul s'il est unique, sinon « à partir de »", async () => {
    const { prixTexte, prefixePrix } = await import("@/lib/prix");
    const f = (n: number) => `${n} MAD`;
    expect(prixTexte({ min: 3000, max: 3000 }, f)).toBe("3000 MAD");
    expect(prixTexte({ min: 3000, max: 5000 }, f)).toBe("à partir de 3000 MAD");
    expect(prixTexte([1200, 1500], f, { majuscule: true })).toBe("À partir de 1200 MAD");
    expect(prefixePrix([10, 10])).toBe("");
  });
});
