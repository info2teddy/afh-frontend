const VARIANTS = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 disabled:hover:bg-emerald-600",
  secondary:
    "bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 disabled:hover:bg-white",
  ghost: "text-stone-600 hover:bg-stone-100 disabled:hover:bg-transparent",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function Button({ variant = "secondary", size = "md", className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
