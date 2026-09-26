// src/lib/residentFacts.js
// What the resident cards, quick view and compare page say about a resident
// at a glance. One place, so the three never disagree.
import { daysUntil } from "./format";

export const FALL_RISK_LABELS = { low: "Low", moderate: "Moderate", high: "High" };

export function residentAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function hasAllergy(r) {
  const a = (r.allergies || "").trim().toLowerCase();
  return !!a && !["none", "nka", "nkda", "none known", "no known allergies", "n/a"].includes(a);
}

// Care plan reassessment within three weeks (or past due), from the
// resident's next assessment date.
export function planDue(r) {
  if (!r.nextAssessmentDate) return null;
  const days = daysUntil(r.nextAssessmentDate);
  if (days < 0) return { days, label: "Assessment overdue" };
  if (days <= 21) return { days, label: days === 0 ? "Assessment due today" : `Assessment due in ${days}d` };
  return null;
}

export function needsAttention(r, carePlanStatus) {
  return !!planDue(r) || r.status === "discharging" || carePlanStatus === "needs_plan";
}
