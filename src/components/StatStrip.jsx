// src/components/StatStrip.jsx
// One bordered strip of stats instead of N separate boxed cards — the
// "reduce card dependence" pattern real enterprise dashboards (Stripe,
// Linear) use for metric rows. Children are <StatCard bare /> cells,
// divided by a hairline instead of each having its own border/shadow.
//
// A single column below sm meant 4 full-width rows — each ~180px tall on a
// real phone, so you scrolled through 3 screens of stats before reaching
// anything else. A 2x2 grid keeps the same cells at roughly half the total
// height, then unrolls into a single row at sm+.
//
// `divide-x`/`divide-y` only work along one axis (they're really a flex-row
// or flex-col thing) — combined on a 2D grid they'd put a stray top border
// on the row-1/col-2 cell and a stray left border on row-2/col-1. The gap +
// background trick sidesteps that: the container's background IS the
// divider color, showing through a 1px gap between opaque white cells.
export function StatStrip({ children }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 sm:grid-cols-4">
      {children}
    </div>
  );
}
