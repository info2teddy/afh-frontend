// src/pages/PlacementFacilities.jsx
// The facility-directory half of Placement — every AFH CareFit can place
// into, whether or not it's a CareFit Connect customer. See the sibling
// page PlacementInquiries.jsx for the prospective-resident pipeline itself.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatusPill } from "../components/StatusPill";
import { StatCard } from "../components/StatCard";
import { StatStrip } from "../components/StatStrip";
import { Button } from "../components/Button";
import { TableSkeleton } from "../components/TableSkeleton";
import { AddFacilityModal } from "../components/AddFacilityModal";

export function PlacementFacilities() {
  const [facilities, setFacilities] = useState(null);
  const [error, setError] = useState(null);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [reviewingFacility, setReviewingFacility] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const intakeUrl = `${window.location.origin}/afh-intake`;

  function handleCopyLink() {
    navigator.clipboard.writeText(intakeUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function loadFacilities() {
    api.placements.facilities.list().then(setFacilities).catch((err) => setError(err.message));
  }
  useEffect(loadFacilities, []);

  const stats = facilities && {
    openBeds: facilities.reduce((sum, f) => sum + (f.openBeds || 0), 0),
    tenantLinkedCount: facilities.filter((f) => f.isTenantLinked).length,
    externalCount: facilities.filter((f) => !f.isTenantLinked).length,
    pendingReviewCount: facilities.filter((f) => f.pendingReview).length,
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Placement Facilities</h1>
          <p className="mt-1 text-sm text-stone-500">Every AFH CareFit can place into — yours and beyond</p>
        </div>
        <Button variant="secondary" onClick={() => setShowAddFacility(true)}>
          + Add External AFH
        </Button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {stats && (
        <StatStrip>
          <StatCard label="Open beds" value={stats.openBeds} icon="home" />
          <StatCard label="CareFit Connect homes" value={stats.tenantLinkedCount} icon="team" />
          <StatCard label="External AFHs" value={stats.externalCount} icon="resident" />
          <StatCard
            label="Pending review"
            value={stats.pendingReviewCount}
            tone={stats.pendingReviewCount > 0 ? "warning" : undefined}
            icon="warning"
          />
        </StatStrip>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex-1">
          <div className="text-sm font-medium text-stone-900">Let an outside AFH add itself</div>
          <p className="mt-0.5 text-xs text-stone-500">
            Share this link — no CareFit Connect account needed. Submissions land here as "Pending review" until you approve them.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleCopyLink}>
          {linkCopied ? "Copied!" : "Copy intake link"}
        </Button>
      </div>

      {!facilities && <TableSkeleton columns={4} rows={3} />}
      {facilities && facilities.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No facilities tracked yet.
        </div>
      )}
      {facilities && facilities.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3">Facility</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">Care Levels</th>
                  <th className="px-5 py-3">Cultural / Language</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {facilities.map((f) => (
                  <tr key={f.id}>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="font-medium text-stone-900">{f.name}</div>
                      {f.tenantName && <div className="text-xs text-stone-400">{f.tenantName}</div>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">
                      {f.isTenantLinked ? (
                        <StatusPill tone="success">CareFit Connect</StatusPill>
                      ) : f.pendingReview ? (
                        <StatusPill tone="warning">Pending review</StatusPill>
                      ) : (
                        <span className="text-stone-400">External</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">
                      {f.isTenantLinked
                        ? `${f.occupied} / ${f.capacity ?? "—"} (${f.openBeds ?? "—"} open)`
                        : f.capacity != null
                          ? `${f.occupied ?? "—"} / ${f.capacity} beds`
                          : <span className="text-stone-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{f.careLevelsAccepted || <span className="text-stone-400">—</span>}</td>
                    <td className="max-w-[16rem] truncate px-5 py-3.5 text-stone-600" title={f.culturalNotes || ""}>
                      {f.culturalNotes || <span className="text-stone-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      {f.pendingReview && (
                        <Button size="sm" onClick={() => setReviewingFacility(f)}>
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddFacility && (
        <AddFacilityModal
          onClose={() => setShowAddFacility(false)}
          onCreated={() => {
            setShowAddFacility(false);
            loadFacilities();
          }}
        />
      )}

      {reviewingFacility && (
        <AddFacilityModal
          facility={reviewingFacility}
          onClose={() => setReviewingFacility(null)}
          onReviewed={() => {
            setReviewingFacility(null);
            loadFacilities();
          }}
        />
      )}
    </div>
  );
}
