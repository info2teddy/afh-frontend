// src/components/PlacementMatches.jsx
// Ranked candidate facilities for a placement (spec §10-11 "Why this
// match?"). The score is a real computed percentage (matched/applicable
// criteria — see buildMatchCriteria in the backend), never a fake ML-style
// number — a facility with no comparable data shows "Not enough info to
// score" instead of a misleading 0% or 100%.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatusPill } from "./StatusPill";
import { Button } from "./Button";
import { CardSkeleton } from "./CardSkeleton";
import { Icon } from "./icons";

function scoreTone(score) {
  if (score == null) return "neutral";
  if (score >= 75) return "success";
  if (score >= 40) return "warning";
  return "danger";
}

export function PlacementMatches({ placementId, shortlistedIds, onShortlist }) {
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);

  function load() {
    api.placements.inquiries.matches(placementId).then(setMatches).catch((err) => setError(err.message));
  }
  useEffect(load, [placementId]);

  async function handleShortlist(facilityId) {
    setAddingId(facilityId);
    setError(null);
    try {
      await api.placements.inquiries.shortlist.add(placementId, facilityId);
      onShortlist();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingId(null);
    }
  }

  if (error) return <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!matches) return <CardSkeleton lines={3} />;
  if (matches.length === 0) {
    return <p className="text-sm text-stone-500">No facilities currently have an open bed that fits this placement's requirements.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {matches.map(({ facility, criteria, score }) => {
        const alreadyShortlisted = shortlistedIds.has(facility.id);
        return (
          <div key={facility.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-900">{facility.name}</span>
                  {!facility.isTenantLinked && <span className="text-xs text-stone-400">External</span>}
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  {facility.openBeds != null ? `${facility.openBeds} open bed${facility.openBeds === 1 ? "" : "s"}` : "Open beds unknown"}
                  {facility.address ? ` · ${facility.address}` : ""}
                </p>
              </div>
              <StatusPill tone={scoreTone(score)}>{score != null ? `${score}% Match` : "Not enough info to score"}</StatusPill>
            </div>

            {criteria.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1">
                {criteria.map((c) => (
                  <li key={c.key} className="flex items-center gap-1.5 text-xs text-stone-600">
                    <Icon name="check" className={`h-3.5 w-3.5 shrink-0 ${c.matched ? "text-emerald-600" : "text-stone-300"}`} />
                    <span className={c.matched ? "" : "text-stone-400 line-through"}>{c.label}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3">
              <Button
                size="sm"
                variant={alreadyShortlisted ? "secondary" : "primary"}
                disabled={alreadyShortlisted || addingId === facility.id}
                onClick={() => handleShortlist(facility.id)}
              >
                {alreadyShortlisted ? "Shortlisted" : addingId === facility.id ? "Adding…" : "Shortlist"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
