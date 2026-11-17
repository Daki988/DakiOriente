import type { Metadata } from "next";
import { Alerte } from "@/components/ui";

export const metadata: Metadata = { title: "Guide de l'importateur Chine / Corée → Gabon" };

const SECTIONS: { titre: string; points: string[] }[] = [
  {
    titre: "1. Avion ou bateau ?",
    points: [
      "Avion (groupage aérien) : facturé au kilo, quelques jours à deux semaines selon les départs. Adapté aux petits volumes de valeur (vêtements, téléphones, cosmétiques).",
      "Bateau (groupage maritime / LCL) : facturé au m³ (CBM), généralement plusieurs semaines. Bien plus économique pour les objets lourds ou volumineux.",
      "Conteneur complet (20' ou 40') : pour les gros volumes ; vous louez tout le conteneur.",
      "Véhicule (Ro-Ro) : le véhicule roule directement dans le navire ; fréquent depuis la Corée du Sud.",
    ],
  },
  {
    titre: "2. Comprendre le prix total",
    points: [
      "En avion, le prix est calculé sur le plus élevé entre le poids réel et le poids volumétrique (volume en cm³ ÷ 6 000, en général).",
      "En bateau, le prix est calculé sur le plus élevé entre le volume et le poids (1 tonne = 1 m³).",
      "Demandez toujours ce qui est inclus : dédouanement, droits et taxes, manutention, livraison, stockage. Les « frais à l'arrivée » non annoncés sont la première source de litige.",
      "Faites préciser le minimum facturable et les frais en cas de retard de retrait (stockage).",
    ],
  },
  {
    titre: "3. Bien préparer l'envoi avec votre fournisseur",
    points: [
      "Communiquez à votre fournisseur l'adresse de l'entrepôt du transitaire et votre marquage (shipping mark : nom + code client) à inscrire sur chaque carton.",
      "Demandez une photo des cartons et la liste de colisage (nombre de cartons, poids, dimensions).",
      "Gardez la facture du fournisseur : elle est utile au dédouanement.",
    ],
  },
  {
    titre: "4. Marchandises sensibles ou interdites",
    points: [
      "Batteries lithium, power banks, liquides, poudres, parfums, produits alimentaires : beaucoup de transitaires les refusent en avion ou appliquent un tarif spécial.",
      "Les contrefaçons et produits réglementés (médicaments, armes, etc.) exposent à une saisie et à des sanctions.",
      "Pour les véhicules, renseignez-vous sur les règles d'importation en vigueur (âge du véhicule, normes) avant d'acheter.",
    ],
  },
  {
    titre: "5. Éviter les arnaques",
    points: [
      "Ne payez qu'aux numéros et comptes affichés sur la fiche vérifiée du transitaire sur Neam Transit.",
      "Méfiez-vous des prix très en dessous du marché et des demandes de paiement total avant même la réception des cartons à l'entrepôt.",
      "Exigez un reçu pour chaque paiement et conservez toutes les conversations.",
      "Un problème ? Signalez-le à Neam Transit : nous enquêtons et pouvons suspendre un transitaire.",
    ],
  },
];

export default function Guide() {
  return (
    <div className="conteneur max-w-3xl py-8">
      <h1 className="titre-page">Guide de l&apos;importateur</h1>
      <p className="mt-2 text-sm text-slate-600">Les bases pour importer de Chine ou de Corée du Sud vers le Gabon sans mauvaise surprise.</p>
      <div className="mt-6 space-y-5">
        {SECTIONS.map((s) => (
          <section key={s.titre} className="carte p-5 sm:p-6">
            <h2 className="text-lg font-bold text-marine-900">{s.titre}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {s.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-6">
        <Alerte>
          Ce guide donne des repères généraux. Les droits, taxes et règles douanières évoluent : faites-les confirmer par votre transitaire ou par l&apos;administration des douanes gabonaise avant d&apos;importer.
        </Alerte>
      </div>
    </div>
  );
}
