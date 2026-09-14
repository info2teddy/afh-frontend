// src/pages/PlacementInquiries.jsx
// The operational list for Placement (spec §25/§26) — every placement,
// filterable and searchable, with the real signals that matter at a
// glance: stage, move-in date, who owns it, when it last moved, what's
// next, and whether it needs attention. See PlacementFacilities.jsx for
// the facility directory, and PlacementDetail.jsx for the full staged-
// workflow view. Both are admin-only and cross-tenant (see the backend's
// placements.js).
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth } from "../lib/api";
import { titleCase, formatDateTime } from "../lib/format";
import { STAGE_LABELS, STAGE_TONE } from "../lib/placementStages";
import { StatusPill } from "../components/StatusPill";
import { StatCard } from "../components/StatCard";
import { StatStrip } from "../components/StatStrip";
import { Button } from "../components/Button";
import { TableSkeleton } from "../components/TableSkeleton";
import { AddInquiryModal } from "../components/AddInquiryModal";
import { PlaceInquiryModal } from "../components/PlaceInquiryModal";

function shortDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "mine", label: "My Placements" },
  { key: "active", label: "Active" },
  { key: "needs_attention", label: "Needs Attention" },
  { key: "NEW", label: "New" },
  { key: "matching", label: "Matching" },
  { key: "DECISION_PENDING", label: "Pending Decision" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "FOLLOW_UP", label: "Follow-Up" },
  { key: "closed", label: "Closed" },
];

export function PlacementInquiries() {
  const navigate = useNavigate();
  const currentUserId = auth.getUser()?.id;
  const [placements, setPlacements] = useState(null);
  const [facilities, setFacilities] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showAddInquiry, setShowAddInquiry] = useState(false);
  const [placingInquiry, setPlacingInquiry] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

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
    needsAttentionCount: placements.filter((p) => p.needsAttention?.length > 0).length,
  };

  const filtered = useMemo(() => {
    if (!placements) return null;
    let rows = placements;
    if (filter === "mine") rows = rows.filter((p) => p.assignedToId === currentUserId);
    else if (filter === "active") rows = rows.filter((p) => !["COMPLETED", "CLOSED"].includes(p.stage));
    else if (filter === "needs_attention") rows = rows.filter((p) => p.needsAttention?.length > 0);
    else if (filter === "matching") rows = rows.filter((p) => ["READY_TO_MATCH", "MATCHING"].includes(p.stage));
    else if (filter === "closed") rows = rows.filter((p) => ["CLOSED", "COMPLETED"].includes(p.stage));
    else if (filter !== "all") rows = rows.filter((p) => p.stage === filter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((p) => p.residentName.toLowerCase().includes(q) || p.contactName?.toLowerCase().includes(q));
    }
    return rows;
  }, [placements, filter, search, currentUserId]);

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
          <StatCard label="Needs Attention" value={stats.needsAttentionCount} tone={stats.needsAttentionCount > 0 ? "danger" : undefined} icon="warning" />
        </StatStrip>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key ? "bg-brand-600 text-white" : "bg-white text-stone-600 ring-1 ring-inset ring-stone-200 hover:bg-stone-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto w-full max-w-[220px] rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {!placements && <TableSkeleton columns={5} rows={3} />}
      {filtered && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          {placements.length === 0 ? "No placements yet." : "No placements match this filter."}
        </div>
      )}
      {filtered && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3">Placement</th>
                  <th className="px-5 py-3">Family</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Move-In</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3">Last Activity</th>
                  <th className="px-5 py-3">Next Action</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/placement/inquiries/${p.id}`)} className="cursor-pointer hover:bg-stone-50">
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-900">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/placement/inquiries/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40"
                        >
                          {p.residentName}
                        </Link>
                        {p.urgency === "urgent" && <StatusPill tone="danger">Urgent</StatusPill>}
                      </div>
                      {p.needsAttention?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.needsAttention.map((n, i) => (
                            <StatusPill key={i} tone={n.tone}>{n.reason}</StatusPill>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{p.contactName || <span className="text-stone-400">—</span>}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">
                      {p.placedFacility?.name || <span className="text-stone-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <StatusPill tone={STAGE_TONE[p.stage]}>{STAGE_LABELS[p.stage] || titleCase(p.stage)}</StatusPill>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{shortDate(p.moveInDate) || <span className="text-stone-400">—</span>}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">
                      {p.assignedTo?.email?.split("@")[0] || <span className="text-stone-400">Unassigned</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-500">{p.lastActivityAt ? formatDateTime(p.lastActivityAt) : "—"}</td>
                    <td className="max-w-[14rem] truncate px-5 py-3.5 text-stone-600" title={p.nextAction?.message || ""}>
                      {p.nextAction?.overdue && <StatusPill tone="danger">Overdue</StatusPill>} {p.nextAction?.message}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {!p.placedAt && (
                          <Button size="sm" onClick={() => setPlacingInquiry(p)}>
                            Place
                          </Button>
                        )}
                        {!p.placedAt && (
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
