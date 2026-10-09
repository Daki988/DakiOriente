import Link from "next/link";

type Variant = "primary" | "ghost" | "gold";
const styles: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-110",
  ghost: "border border-white/20 text-text hover:border-accent hover:text-accent bg-white/[0.03] backdrop-blur",
  gold: "border border-gold/60 text-gold hover:bg-gold hover:text-accent-ink",
};

export function Button({
  href, children, variant = "primary", external = false, className = "", ariaLabel,
}: { href: string; children: React.ReactNode; variant?: Variant; external?: boolean; className?: string; ariaLabel?: string }) {
  const cls = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold uppercase tracking-wider transition ${styles[variant]} ${className}`;
  if (external || href.startsWith("tel:") || href.startsWith("http")) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return <Link href={href} className={cls} aria-label={ariaLabel}>{children}</Link>;
}
