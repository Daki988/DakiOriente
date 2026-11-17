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
    const loyer = d.postes!.find((x) => x.quand === "mois" && x.libelle.startsWith(r.nom))!;
    expect(loyer.v).toEqual([r.logements[0].loyer_min, r.logements[0].loyer_max ?? r.logements[0].loyer_min]);
  });
});
