// src/components/icons.jsx
// Small monochrome stroke icons shared across the sidebar and stat cards —
// deliberately plain (no color, no background badge) after the colorful
// icon-badge treatment was tried and explicitly rejected. currentColor lets
// each caller set its own muted tone via className.
const PATHS = {
  home: <path d="M4 11l8-7 8 7M6 9.5V20h5v-6h2v6h5V9.5" />,
  resident: <><circle cx="12" cy="8" r="3.3" /><path d="M5.5 20c0-4 3-6.7 6.5-6.7s6.5 2.7 6.5 6.7" /></>,
  team: <><circle cx="9" cy="8.5" r="2.8" /><circle cx="16.5" cy="9.5" r="2.2" /><path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" /><path d="M15 14.3c2.4.2 4 2.2 4 5.7" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.3 2" /></>,
  shield: <><path d="M12 3.2l7 2.8v5.7c0 4.6-3 7.7-7 9.1-4-1.4-7-4.5-7-9.1V6l7-2.8Z" /><path d="M9 12l2 2 4.2-4.5" /></>,
  finance: <><path d="M4 20V11" /><path d="M10.5 20V6.5" /><path d="M17 20v-8" /><path d="M3 20h18" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.4M12 18.6V21M4.9 6.5l1.9 1.4M17.2 16.1l1.9 1.4M4.9 17.5l1.9-1.4M17.2 7.9l1.9-1.4M3 12h2.4M18.6 12H21" /></>,
  warning: <><path d="M12 3.5l9 15.6H3L12 3.5Z" /><path d="M12 9.5v4.2" /><path d="M12 17h.01" /></>,
};

export function Icon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "h-[18px] w-[18px] shrink-0"} stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}
