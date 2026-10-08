import { BookOpen, Brain, Briefcase, Calculator, CalendarCheck, ChartLine, ClipboardList, Cpu, Ear, FlaskConical, Hammer, Hand, HardHat, HeartHandshake, Languages, Leaf, Lightbulb, ListChecks, Megaphone, MessageCircle, Mountain, Music, NotebookPen, Palette, Rocket, Search, Sigma, Sparkles, Stethoscope, Telescope, TrendingUp, Users, Wrench, type LucideProps } from "lucide-react";

const MAP = { "book-open": BookOpen, brain: Brain, briefcase: Briefcase, calculator: Calculator, "calendar-check": CalendarCheck, "chart-line": ChartLine, "clipboard-list": ClipboardList, cpu: Cpu, ear: Ear, "flask-conical": FlaskConical, hammer: Hammer, hand: Hand, "hard-hat": HardHat, "heart-handshake": HeartHandshake, languages: Languages, leaf: Leaf, lightbulb: Lightbulb, "list-checks": ListChecks, megaphone: Megaphone, "message-circle": MessageCircle, mountain: Mountain, music: Music, "notebook-pen": NotebookPen, palette: Palette, rocket: Rocket, search: Search, sigma: Sigma, sparkles: Sparkles, stethoscope: Stethoscope, telescope: Telescope, "trending-up": TrendingUp, users: Users, wrench: Wrench };

export function TestIcon({ name, ...p }: { name: string } & LucideProps) {
  const I = MAP[name as keyof typeof MAP] ?? Sparkles;
  return <I {...p} />;
}
