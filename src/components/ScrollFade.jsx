// src/components/ScrollFade.jsx
// Wraps horizontally-scrollable content (wide tables, tab bars) with fade +
// arrow affordances on whichever edge still has content to scroll to —
// without this, content past the viewport edge is invisible with no hint
// it exists. Pass the scroll container's own className via `innerClassName`.
import { useScrollFade } from "../lib/useScrollFade";

export function ScrollFade({ children, innerClassName = "" }) {
  const { ref, canScrollLeft, canScrollRight, onScroll } = useScrollFade();

  return (
    <div className="relative">
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-8 items-center bg-gradient-to-r from-white to-transparent">
          <span className="text-stone-400">‹</span>
        </div>
      )}
      <div ref={ref} onScroll={onScroll} className={innerClassName}>
        {children}
      </div>
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-8 items-center justify-end bg-gradient-to-l from-white to-transparent">
          <span className="text-stone-400">›</span>
        </div>
      )}
    </div>
  );
}
