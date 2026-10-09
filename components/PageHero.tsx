export function PageHero({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <section id="top" className="grain relative overflow-hidden border-b border-white/5">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 80% at 85% 0%, rgba(140,198,63,.18), transparent 60%), radial-gradient(60% 80% at 0% 100%, rgba(14,58,44,.8), transparent 70%)" }} />
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 md:pb-14 md:pt-20">
        <p className="rise text-xs font-semibold uppercase tracking-[0.3em] text-accent">{kicker}</p>
        <h1 className="rise rise-1 mt-3 font-display text-5xl sm:text-6xl md:text-7xl">{title}</h1>
        {children && <div className="rise rise-2 mt-4 max-w-2xl text-muted sm:text-lg">{children}</div>}
      </div>
    </section>
  );
}
