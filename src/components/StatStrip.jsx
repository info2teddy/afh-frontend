// src/components/StatStrip.jsx
// A responsive grid wrapper for a page's 4 headline stats — 2 columns below
// sm (each cell stays compact instead of stacking into 4 full-width rows),
// unrolling into a single row at sm+. Children are plain <StatCard /> cells
// with their own border/shadow — the user wants four distinct blocks here,
// not one shared strip with internal hairlines.
export function StatStrip({ children }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {children}
    </div>
  );
}
