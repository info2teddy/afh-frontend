// A loading placeholder shaped like the table it's standing in for, rather
// than a single generic gray bar — reads as "data is coming" instead of
// "something is broken."
export function TableSkeleton({ columns = 4, rows = 3 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="divide-y divide-stone-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-6 px-5 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 flex-1 animate-pulse rounded bg-stone-100"
                style={{ animationDelay: `${(r * columns + c) * 60}ms`, maxWidth: c === 0 ? "40%" : "100%" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
