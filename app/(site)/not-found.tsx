import { Button } from "@/components/Button";
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl">Cette page s&apos;est perdue dans la nuit.</h1>
      <div className="mt-8 flex gap-3"><Button href="/">Accueil</Button><Button href="/menu" variant="ghost">Le menu</Button></div>
    </div>
  );
}
