// src/components/StatStrip.jsx
// One bordered strip of stats instead of N separate boxed cards — the
// "reduce card dependence" pattern real enterprise dashboards (Stripe,
// Linear) use for metric rows. Children are <StatCard bare /> cells,
// divided by a hairline instead of each having its own border/shadow.
export function StatStrip({ children }) {
  return (
    <div className="mb-8 flex flex-col divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white sm:flex-row sm:divide-x sm:divide-y-0">
      {children}
    </div>
  );
}
