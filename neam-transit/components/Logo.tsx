export function Logo({ clair = false }: { clair?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={clair ? "#ffffff" : "#0b2545"} />
        <path d="M6 20h20l-3 5H9z" fill="#f2a541" />
        <rect x="9" y="12" width="6" height="6" rx="1" fill={clair ? "#0b2545" : "#ffffff"} />
        <rect x="16" y="9" width="7" height="9" rx="1" fill={clair ? "#1d4477" : "#9db8dc"} />
      </svg>
      <span className={`text-lg font-extrabold tracking-tight ${clair ? "text-white" : "text-marine-900"}`}>
        Neam<span className="text-cargo-500"> Transit</span>
      </span>
    </span>
  );
}
