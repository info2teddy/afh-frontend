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
