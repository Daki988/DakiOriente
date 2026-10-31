// Tous les jours à 3 h (heure de Libreville = 2 h UTC) : efface les données personnelles
// des commandes livrées ou annulées depuis plus de 30 jours (minimisation des données).
// Le contenu de la commande (articles, montants, dates) est conservé comme preuve de la vente.
import type { Config } from "@netlify/functions";
import { store } from "../lib/common.mts";

const KEEP_DAYS = 30;

export default async () => {
  const orders = store("orders");
  const { blobs } = await orders.list();
  const limit = Date.now() - KEEP_DAYS * 86400000;
  let purged = 0;
  for (const { key } of blobs) {
    const o = (await orders.get(key, { type: "json" })) as Record<string, any> | null;
    if (!o || !["livree", "annulee"].includes(o.status) || o.customer?.purged) continue;
    const closedAt = new Date(o.deliveredAt || o.updatedAt || o.createdAt).getTime();
    if (closedAt > limit) continue;
    o.internal = "";
    o.customer = { name: "", phone: "", address: "", slot: o.customer?.slot || "", pay: o.customer?.pay || "", call: false, purged: new Date().toISOString() };
    await orders.setJSON(key, o);
    purged++;
  }
  console.log(`Données personnelles effacées sur ${purged} commande(s).`);
};

export const config: Config = { schedule: "0 2 * * *" };
