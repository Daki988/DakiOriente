export function SectionTitle({
  kicker, title, children, id, align = "left",
}: { kicker?: string; title: string; children?: React.ReactNode; id?: string; align?: "left" | "center" }) {
  return (
    <header className={`reveal mb-8 ${align === "center" ? "text-center mx-auto" : ""} max-w-2xl`}>
      {kicker && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent">{kicker}</p>}
      <h2 id={id} className="font-display text-4xl sm:text-5xl md:text-6xl">{title}</h2>
      {children && <div className="mt-4 text-base text-muted sm:text-lg">{children}</div>}
    </header>
  );
}
