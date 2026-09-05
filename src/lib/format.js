// src/lib/format.js
// Shared date/label formatting so pages don't each invent their own
// convention. Date-only strings ("2026-09-05") are parsed and displayed in
// UTC — treating them as a local Date shifts the displayed day backward in
// timezones behind UTC, since midnight UTC is still "yesterday" locally.

export function formatFriendlyDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// "cpr_first_aid" / "cpr first aid" -> "Cpr First Aid"
export function titleCase(str) {
  return str
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// WA AFH care-level classification tiers. careLevel is a free-text column
// (see prisma/schema.prisma), not a DB enum, so an unrecognized value falls
// back to a title-cased version instead of throwing or showing "undefined".
const CARE_LEVEL_LABELS = {
  level_1: "Level 1 — Minimal Support",
  level_2: "Level 2 — Moderate Support",
  level_3: "Level 3 — Extensive Support",
};

export function careLevelLabel(careLevel) {
  return CARE_LEVEL_LABELS[careLevel] || titleCase(careLevel);
}

// Short form for tight spaces (table cells, stat rows): "Level 2"
export function careLevelShortLabel(careLevel) {
  const full = careLevelLabel(careLevel);
  return full.split(" — ")[0];
}

// payerType: private_pay | medicaid | split (+ medicaidSplitPct on split)
export function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
}

export function payerLabel(resident) {
  if (resident.payerType === "split") return `Medicaid — ${resident.medicaidSplitPct}%`;
  if (resident.payerType === "medicaid") return "Medicaid";
  return "Private Pay";
}
