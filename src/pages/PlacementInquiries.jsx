// src/pages/PlacementInquiries.jsx
// The list view of Placement's lifecycle pipeline — see the sibling page
// PlacementFacilities.jsx for the facility directory, and PlacementDetail.jsx
// for the actual staged-workflow view (stepper, timeline, next action).
// This page stays a compact, scannable list; stage changes and history live
// on the detail page. Both are admin-only and cross-tenant (see the
// backend's placements.js).
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { careLevelShortLabel, titleCase } from "../lib/format";
import { STAGE_LABELS, STAGE_TONE } from "../lib/placementStages";
import { StatusPill } from "../components/StatusPill";
import { StatCard } from "../components/StatCard";
import { StatStrip } from "../components/StatStrip";
import { Button } from "../components/Button";
import { TableSkeleton } from "../components/TableSkeleton";
import { AddInquiryModal } from "../components/AddInquiryModal";
import { PlaceInquiryModal } from "../components/PlaceInquiryModal";

const PAYER_LABELS = { private_pay: "Private Pay", medicaid: "Medicaid", split: "Split" };
const REFERRAL_LABELS = { hospital: "Hospital", dshs_hca: "DSHS/HCA", family: "Family/Self", other: "Other" };

export function PlacementInquiries() {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState(null);
  const [facilities, setFacilities] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showAddInquiry, setShowAddInquiry] = useState(false);
  const [placingInquiry, setPlacingInquiry] = useState(null);

  function loadPlacements() {
    api.placements.inquiries.list().then(setPlacements).catch((err) => setError(err.message));
  }
  function loadFacilities() {
    api.placements.facilities.list().then(setFacilities).catch((err) => setError(err.message));
  }
  useEffect(() => {
    loadPlacements();
    loadFacilities();
  }, []);

  async function handleDelete(placement) {
    setBusyId(placement.id);
    setError(null);
    try {
      await api.placements.inquiries.delete(placement.id);
      setPlacements((prev) => prev.filter((p) => p.id !== placement.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const stats = placements && {
    newCount: placements.filter((p) => p.stage === "NEW").length,
    urgentCount: placements.filter((p) => p.urgency === "urgent" && !["COMPLETED", "CLOSED"].includes(p.stage)).length,
    inProgressCount: placements.filter((p) => !["NEW", "COMPLETED", "CLOSED"].includes(p.stage)).length,
    placedCount: placements.filter((p) => p.placedFacilityId).length,
  };

  const placeableFacilities = facilities?.filter((f) => !f.pendingReview) || [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Placements</h1>
          <p className="mt-1 text-sm text-stone-500">Prospective residents, tracked from first contact to move-in and follow-up</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddInquiry(true)}>
          + New Placement
        </Button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {stats && (
        <StatStrip>
          <StatCard label="New" value={stats.newCount} icon="resident" />
          <StatCard label="Urgent" value={stats.urgentCount} tone={stats.urgentCount > 0 ? "warning" : undefined} icon="warning" />
          <StatCard label="In Progress" value={stats.inProgressCount} icon="clock" />
          <StatCard label="Placed" value={stats.placedCount} icon="home" />
        </StatStrip>
      )}

      {!placements && <TableSkeleton columns={5} rows={3} />}
      {placements && placements.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No placements yet.
        </div>
      )}
      {placements && placements.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Care Level</th>
                  <th className="px-5 py-3">Payer</th>
                  <th className="px-5 py-3">Referral</th>
                  <th className="px-5 py-3">Cultural / Language</th>
                  <th className="px-5 py-3">Urgency</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {placements.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/placement/inquiries/${p.id}`)} className="cursor-pointer hover:bg-stone-50">
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-900">
                      <Link
                        to={`/placement/inquiries/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40"
                      >
                        {p.residentName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{careLevelShortLabel(p.careLevelNeeded)}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{PAYER_LABELS[p.payerType] || titleCase(p.payerType)}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">
                      {p.referralSource ? REFERRAL_LABELS[p.referralSource] || titleCase(p.referralSource) : <span className="text-stone-400">—</span>}
                    </td>
                    <td className="max-w-[16rem] truncate px-5 py-3.5 text-stone-600" title={p.culturalPreferences || ""}>
                      {p.culturalPreferences || <span className="text-stone-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {p.urgency === "urgent" ? <StatusPill tone="danger">Urgent</StatusPill> : <span className="text-stone-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <StatusPill tone={STAGE_TONE[p.stage]}>{STAGE_LABELS[p.stage] || titleCase(p.stage)}</StatusPill>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {!p.placedFacilityId && (
                          <Button size="sm" onClick={() => setPlacingInquiry(p)}>
                            Place
                          </Button>
                        )}
                        {p.placedFacilityId && p.placedFacility && (
                          <span className="text-xs text-stone-500">at {p.placedFacility.name}</span>
                        )}
                        {!p.placedFacilityId && (
                          <Button size="sm" variant="secondary" onClick={() => handleDelete(p)} disabled={busyId === p.id}>
                            {busyId === p.id ? "Removing…" : "Remove"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddInquiry && (
        <AddInquiryModal
          onClose={() => setShowAddInquiry(false)}
          onCreated={() => {
            setShowAddInquiry(false);
            loadPlacements();
          }}
        />
      )}

      {placingInquiry && facilities && (
        <PlaceInquiryModal
          inquiry={placingInquiry}
          facilities={placeableFacilities}
          onClose={() => setPlacingInquiry(null)}
          onPlaced={() => {
            setPlacingInquiry(null);
            loadPlacements();
            loadFacilities();
          }}
        />
      )}
    </div>
  );
}
