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

// One-tap rating buttons, one entry per task that has a fixed vocabulary on
// the real paper form — every one of the 14 categories has one, some sharing
// the same scale (the 5 hygiene tasks all use the form's own Independent/
// Assisted/Total Help column). `options` are the pills; `allowNote: true`
// keeps the free-text box available too (below the pills), for the two
// interval-based safety checks where "no issues" covers most shifts but an
// unusual finding still needs real words, not a code. Frontend-only: the
// backend just stores whatever string ends up in `note`, so this can change
// without touching the schema or API.
const ASSISTANCE_LEVELS = [
  { code: "I", label: "Independent" },
  { code: "A", label: "Assisted" },
  { code: "TH", label: "Total Help" },
];

export const QUICK_OPTIONS = {
  Diet: {
    options: [
      { code: "G", label: "Good (75%)" },
      { code: "F", label: "Fair (50%)" },
      { code: "P", label: "Poor (25%)" },
      { code: "R", label: "Refused" },
      { code: "S", label: "Snack" },
    ],
  },
  Bath: {
    options: [
      { code: "SH", label: "Shower" },
      { code: "TB", label: "Tub Bath" },
      { code: "BB", label: "Bed Bath" },
      { code: "SB", label: "Sponge Bath" },
      { code: "WP", label: "Whirlpool" },
    ],
  },
  "Oral Care": { options: ASSISTANCE_LEVELS },
  "Fingernail Care": { options: ASSISTANCE_LEVELS },
  "Toenail Care": { options: ASSISTANCE_LEVELS },
  Shave: { options: ASSISTANCE_LEVELS },
  Shampoo: { options: ASSISTANCE_LEVELS },
  "Bowel Movement": {
    options: [
      { code: "L", label: "Large" },
      { code: "M", label: "Medium" },
      { code: "S", label: "Small" },
    ],
  },
  "Incontinence Care": {
    options: [
      { code: "U", label: "Urine" },
      { code: "F", label: "Feces" },
      { code: "D", label: "Dry" },
    ],
  },
  "Skin Care/Reposition": {
    options: [
      { code: "TR", label: "Turn & Reposition" },
      { code: "PC", label: "Pericare" },
      { code: "BR", label: "Backrub" },
    ],
  },
  Ambulation: {
    options: [
      { code: "AMB", label: "Ambulatory" },
      { code: "W", label: "Walker" },
      { code: "CA", label: "Cane" },
      { code: "WC", label: "Wheelchair" },
      { code: "CH", label: "Chair" },
      { code: "BF", label: "Partial Bedfast" },
    ],
  },
  "Linen Change": {
    options: [
      { code: "T", label: "Total" },
      { code: "P", label: "Partial" },
    ],
  },
  // Interval-based safety checks (paper form: "checked Q1hr", "Q__ hrs") —
  // one pill covers the common case, but typing is still there for anything
  // that isn't just "checked, no issues".
  "Restraints Check": { options: [{ code: "OK", label: "No issues" }], allowNote: true },
  "Routine Resident Check": { options: [{ code: "OK", label: "No issues" }], allowNote: true },
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
