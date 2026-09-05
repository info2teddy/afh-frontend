// src/lib/useScrollFade.js
// Shared logic behind the nav's scroll fades — tracks whether a horizontally
// scrollable element has more content past either edge, so a wrapper can
// show a fade/arrow only when there's actually somewhere to scroll to.
import { useEffect, useRef, useState } from "react";

export function useScrollFade() {
  const ref = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function update() {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { ref, canScrollLeft, canScrollRight, onScroll: update, recompute: update };
}
