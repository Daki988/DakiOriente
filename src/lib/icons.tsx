import {
  BadgePercent, Baby, BookOpen, Box, Briefcase, Brush, BrushCleaning, Building2, CalendarDays, ChefHat, Check, ClipboardList,
  ConciergeBell, Droplet, Ellipsis, FileText, Flame, FlaskConical, Folder, Gem, Gift, Globe, GraduationCap, Hammer, HardHat,
  Headphones, Heart, House, Lamp, Laptop, LayoutGrid, Lightbulb, Lock, Mail, MapPin, Megaphone, Milk, Monitor, Package,
  PaintRoller, Pill, Plug, Plus, Printer, Receipt, Route, Salad, Sandwich, Scale, Scissors, Search, Share2, ShieldCheck, Shirt,
  ShoppingBasket, ShoppingCart, Smartphone, Smile, Snowflake, Soup, Sparkles, SprayCan, Sprout, Star, Stethoscope, Tag,
  ToolCase, Truck, User, Users, Wallet, WashingMachine, Wheat, Wrench, Zap, type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

const REGISTRY = {
  cart: ShoppingCart, truck: Truck, percent: BadgePercent, shield: ShieldCheck, basket: ShoppingBasket, wheat: Wheat,
  bottle: Milk, sparkles: Sparkles, spray: SprayCan, baby: Baby, washer: WashingMachine, more: Ellipsis, tag: Tag,
  home: House, grid: LayoutGrid, package: Package, chef: ChefHat, menu: BookOpen, route: Route, soup: Soup,
  burger: Sandwich, flame: Flame, salad: Salad, box: Box, zap: Zap, pin: MapPin, mail: Mail, receipt: Receipt,
  monitor: Monitor, pill: Pill, calendar: CalendarDays, clipboard: ClipboardList, heart: Heart, doctor: Stethoscope,
  flask: FlaskConical, printer: Printer, gift: Gift, megaphone: Megaphone, laptop: Laptop, shirt: Shirt, folder: Folder,
  concierge: ConciergeBell, wallet: Wallet, broom: BrushCleaning, wrench: Wrench, plug: Plug, snow: Snowflake,
  sprout: Sprout, tools: ToolCase, hardhat: HardHat, hammer: Hammer, lamp: Lamp, paint: PaintRoller, bulb: Lightbulb,
  droplet: Droplet, lock: Lock, check: Check, brush: Brush, smile: Smile, scissors: Scissors, user: User, gem: Gem,
  star: Star, phone: Smartphone, globe: Globe, headphones: Headphones, search: Search, file: FileText,
  graduation: GraduationCap, building: Building2, briefcase: Briefcase, share: Share2, users: Users, plus: Plus,
  scale: Scale,
} satisfies Record<string, ComponentType<LucideProps>>

/** `neam` = symbole NEAM (rendu à part), les autres viennent de lucide. */
export type IconName = keyof typeof REGISTRY | 'neam'

export function Icon({ name, ...props }: { name: Exclude<IconName, 'neam'> } & LucideProps) {
  const C = REGISTRY[name]
  return <C {...props} />
}
