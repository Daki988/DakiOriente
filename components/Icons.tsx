type P = { className?: string };
const base = (className = "h-5 w-5") => ({
  className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});
export const IconHome = ({ className }: P) => (<svg {...base(className)}><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></svg>);
export const IconMenu = ({ className }: P) => (<svg {...base(className)}><path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10" /><path d="M17 3c-2 0-3 2.5-3 6s1 4 3 4v8" /></svg>);
export const IconSpark = ({ className }: P) => (<svg {...base(className)}><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>);
export const IconPin = ({ className }: P) => (<svg {...base(className)}><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>);
export const IconPhone = ({ className }: P) => (<svg {...base(className)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>);
export const IconClock = ({ className }: P) => (<svg {...base(className)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const IconArrow = ({ className }: P) => (<svg {...base(className)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconCalendar = ({ className }: P) => (<svg {...base(className)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>);
export const IconStar = ({ className }: P) => (<svg {...base(className)}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>);
export const IconClose = ({ className }: P) => (<svg {...base(className)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
