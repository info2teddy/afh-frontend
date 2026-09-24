// src/lib/personalCareTasks.js
// Must match backend/src/lib/personalCareTasks.js exactly (separate
// codebases, same discipline as lib/adlDomains.js / CARE_LEVELS). Daily
// charting categories from the real paper "Personal Care Record" the user's
// AFHs use — see the backend file's own comment for what's deliberately
// left out (the per-resident care-profile settings, Loss of Senses/
// Communication panel).
export const PERSONAL_CARE_TASKS = [
  "Diet",
  "Bath",
  "Oral Care",
  "Fingernail Care",
  "Toenail Care",
  "Shave",
  "Shampoo",
  "Bowel Movement",
  "Incontinence Care",
  "Skin Care/Reposition",
  "Ambulation",
  "Restraints Check",
  "Routine Resident Check",
  "Linen Change",
];

// One-tap rating buttons for the 3 categories the real paper form itself
// charts with a fixed shorthand code, rather than free text — Diet's G/F/P/R/S
// scale, Bath's care-method codes, Bowel Movement's L/M/S size. Every other
// task has no fixed vocabulary on the real form, so it stays a plain
// Log-with-an-optional-note like before. Frontend-only: the backend still
// just stores whatever string ends up in `note`, so this list can grow
// without a schema change — it only decides which categories get pills
// instead of a textarea.
export const QUICK_OPTIONS = {
  Diet: [
    { code: "G", label: "Good (75%)" },
    { code: "F", label: "Fair (50%)" },
    { code: "P", label: "Poor (25%)" },
    { code: "R", label: "Refused" },
    { code: "S", label: "Snack" },
  ],
  Bath: [
    { code: "SH", label: "Shower" },
    { code: "TB", label: "Tub Bath" },
    { code: "BB", label: "Bed Bath" },
    { code: "SB", label: "Sponge Bath" },
    { code: "WP", label: "Whirlpool" },
  ],
  "Bowel Movement": [
    { code: "L", label: "Large" },
    { code: "M", label: "Medium" },
    { code: "S", label: "Small" },
  ],
};

export const SHIFTS = [
  { value: "day", label: "Day" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

// A sensible default shift from the current time, matching typical AFH shift
// boundaries — the caregiver can always override it before logging.
export function currentShift(date = new Date()) {
  const h = date.getHours();
  if (h >= 6 && h < 14) return "day";
  if (h >= 14 && h < 22) return "evening";
  return "night";
}
