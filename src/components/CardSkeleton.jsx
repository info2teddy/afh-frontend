// A loading placeholder shaped like a data card (title row + a couple of
// detail lines), for pages that render one card rather than a table.
export function CardSkeleton({ lines = 2 }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-1/3 animate-pulse rounded bg-stone-100" />
        <div className="h-4 w-16 animate-pulse rounded bg-stone-100" style={{ animationDelay: "60ms" }} />
      </div>
      <div className="space-y-2.5 border-t border-stone-100 pt-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 animate-pulse rounded bg-stone-100"
            style={{ width: `${85 - i * 15}%`, animationDelay: `${(i + 2) * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
