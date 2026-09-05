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
