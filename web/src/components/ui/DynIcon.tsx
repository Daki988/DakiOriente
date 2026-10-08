import { Award, Building, Building2, Compass, Cpu, HardHat, Hotel, House, Plane, Users, type LucideProps } from "lucide-react";

const MAP = { award: Award, building: Building, "building-2": Building2, compass: Compass, cpu: Cpu, "hard-hat": HardHat, hotel: Hotel, house: House, plane: Plane, users: Users };

export function DynIcon({ name, ...p }: { name: string } & LucideProps) {
  const I = MAP[name as keyof typeof MAP] ?? Building;
  return <I {...p} />;
}
