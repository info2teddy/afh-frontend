// Success/warning/danger stay their conventional semantic colors regardless
// of brand — "green means good" shouldn't change just because the brand
// palette did. Only interactive/brand chrome (buttons, links, nav) uses
// brand-*/accent-* elsewhere in the app.
const TONES = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-accent-50 text-accent-700 ring-accent-600/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20",
  neutral: "bg-stone-100 text-stone-600 ring-stone-500/10",
};

const DOTS = {
  success: "bg-emerald-500",
  warning: "bg-accent-500",
  danger: "bg-rose-500",
  neutral: "bg-stone-400",
};

export function StatusPill({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${TONES[tone] || TONES.neutral}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone] || DOTS.neutral}`} />
      {children}
    </span>
  );
}
