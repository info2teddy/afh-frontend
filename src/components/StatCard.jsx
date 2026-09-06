// src/components/StatCard.jsx
// The single stat-tile implementation for the whole app — previously
// duplicated near-identically in Dashboard, CareTeam, and ResidentList (a
// plain count/percent tile), plus a currency-formatted variant in
// FinanceOverview. Unified here so every stat tile in the app gets the same
// hover feedback and count-up animation for free.
import { useEffect, useRef, useState } from "react";

function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(typeof target === "number" ? 0 : target);
  const fromRef = useRef(0);
  const rafRef = useRef();

  useEffect(() => {
    if (typeof target !== "number") {
      setValue(target);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic — quick start, gentle settle
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// value: a number (animated) or a pre-formatted string like "—" or "42%"
// (rendered as-is, no animation — only a plain number can be counted up).
// format: "currency" renders $ with a sign, and colors by the FINAL value's
// sign when emphasize is set (never flickers mid-count).
export function StatCard({ label, value, tone, emphasize, format, suffix = "" }) {
  const isNumeric = typeof value === "number";
  const animated = useCountUp(value);

  let display;
  if (!isNumeric) {
    display = value;
  } else if (format === "currency") {
    display = `${animated < 0 ? "-" : ""}$${Math.abs(animated).toFixed(2)}`;
  } else {
    display = `${Math.round(animated).toLocaleString()}${suffix}`;
  }

  const colorClass =
    format === "currency"
      ? emphasize
        ? isNumeric && value < 0
          ? "text-rose-600"
          : "text-emerald-700"
        : "text-stone-900"
      : tone === "warning"
        ? "text-amber-600"
        : "text-stone-900";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className={`text-2xl font-semibold tabular-nums ${colorClass}`}>{display}</div>
      <div className="mt-0.5 text-xs text-stone-500">{label}</div>
    </div>
  );
}
