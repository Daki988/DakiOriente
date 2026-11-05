// Mention « BY OAPS » : Navigoal est conçu et opéré par OAPS Consulting Group.
/* eslint-disable @next/next/no-img-element */
export function ParOapsPied() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#c9d6ff]">By</span>
      <span className="flex items-center rounded-xl bg-white px-2.5 py-1.5"><img src="/brand/oaps-logo-sm.webp" alt="OAPS Consulting Group" width={84} height={59} className="h-[30px] w-auto" loading="lazy" /></span>
      <span className="sr-only">BY OAPS</span>
    </span>
  );
}

/** Encart de la page qui présente la plateforme. */
export function ParOapsEncart() {
  return (
    <section className="container mt-16">
      <div className="card flex flex-col items-center gap-5 rounded-[26px] p-7 text-center sm:flex-row sm:text-left">
        <img src="/brand/oaps-logo.webp" alt="OAPS Consulting Group" width={240} height={169} className="h-24 w-auto shrink-0" loading="lazy" />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-[.18em] text-brand-600">By OAPS</span>
          <h2 className="text-2xl font-extrabold tracking-tight">Une plateforme conçue par OAPS Consulting Group</h2>
          <p className="text-ink-soft">Navigoal est développée et opérée par OAPS Consulting Group, « l&apos;efficience au service de vos ambitions ».</p>
        </div>
      </div>
    </section>
  );
}
