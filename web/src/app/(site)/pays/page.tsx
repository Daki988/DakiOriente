import { redirect } from "next/navigation";

// Destination unique : le Maroc. La fiche pays (visa selon la nationalité, budget, villes) est /pays/ma.
export default function PaysPage() {
  redirect("/pays/ma/");
}
