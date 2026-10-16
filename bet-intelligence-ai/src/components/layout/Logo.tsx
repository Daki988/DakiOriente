export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#0f1a30" stroke="#273044" />
        <path d="M8 22l5-6 4 3 7-9" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="10" r="2" fill="#22c55e" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <p className="text-[13px] font-bold tracking-[0.08em] text-ink">BET INTELLIGENCE</p>
          <p className="mt-0.5 text-[10px] font-semibold tracking-[0.3em] text-good">AI</p>
        </div>
      )}
    </div>
  );
}
