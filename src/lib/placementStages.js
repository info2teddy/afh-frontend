// src/lib/placementStages.js
// Single source of truth for the Placement lifecycle stage list/labels/tones,
// shared between the list page and the detail page's stepper. Mirrors
// PLACEMENT_STAGES in the backend's routes/placements.js — keep both in sync
// if the lifecycle changes.
export const PLACEMENT_STAGES = [
  "NEW",
  "QUALIFYING",
  "READY_TO_MATCH",
  "MATCHING",
  "SHORTLISTED",
  "FAMILY_REVIEW",
  "INTRODUCTION",
  "DECISION_PENDING",
  "CONFIRMED",
  "MOVE_IN_SCHEDULED",
  "ACTIVE",
  "FOLLOW_UP",
  "COMPLETED",
  "CLOSED",
];

export const STAGE_LABELS = {
  NEW: "New",
  QUALIFYING: "Qualifying",
  READY_TO_MATCH: "Ready to Match",
  MATCHING: "Matching",
  SHORTLISTED: "Shortlisted",
  FAMILY_REVIEW: "Family Review",
  INTRODUCTION: "Introduction",
  DECISION_PENDING: "Decision Pending",
  CONFIRMED: "Confirmed",
  MOVE_IN_SCHEDULED: "Move-in Scheduled",
  ACTIVE: "Active",
  FOLLOW_UP: "Follow-up",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

// success/warning/danger/neutral — same semantic tones as StatusPill
// elsewhere in the app (never brand/accent for pipeline state).
export const STAGE_TONE = {
  NEW: "warning",
  QUALIFYING: "warning",
  READY_TO_MATCH: "warning",
  MATCHING: "warning",
  SHORTLISTED: "warning",
  FAMILY_REVIEW: "warning",
  INTRODUCTION: "warning",
  DECISION_PENDING: "warning",
  CONFIRMED: "success",
  MOVE_IN_SCHEDULED: "success",
  ACTIVE: "success",
  FOLLOW_UP: "warning",
  COMPLETED: "success",
  CLOSED: "neutral",
};

export const CLOSURE_REASONS = ["family_withdrew", "no_suitable_match", "provider_unavailable", "chose_another_provider", "duplicate", "other"];

export const CLOSURE_REASON_LABELS = {
  family_withdrew: "Family withdrew",
  no_suitable_match: "No suitable match",
  provider_unavailable: "Provider unavailable",
  chose_another_provider: "Family chose another provider",
  duplicate: "Duplicate request",
  other: "Other",
};

// The stepper only shows the "forward" path — CLOSED is an exception state
// reachable from anywhere, not a normal rung on the ladder (spec's own
// framing: "real operations are not linear").
export const STEPPER_STAGES = PLACEMENT_STAGES.filter((s) => s !== "CLOSED");
