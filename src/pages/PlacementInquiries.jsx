// src/pages/PlacementInquiries.jsx
// The prospective-resident pipeline half of Placement — see Placement's
// sibling page PlacementFacilities.jsx for the facility directory. Both are
// admin-only and cross-tenant (see the backend's placements.js).
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { careLevelShortLabel, titleCase } from "../lib/format";
import { StatusPill } from "../components/StatusPill";
import { StatCard } from "../components/StatCard";
import { StatStrip } from "../components/StatStrip";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { TableSkeleton } from "../components/TableSkeleton";
import { AddInquiryModal } from "../components/AddInquiryModal";
import { PlaceInquiryModal } from "../components/PlaceInquiryModal";

const PAYER_LABELS = { private_pay: "Private Pay", medicaid: "Medicaid", split: "Split" };
const REFERRAL_LABELS = { hospital: "Hospital", dshs_hca: "DSHS/HCA", family: "Family/Self", other: "Other" };
const STATUS_TONE = { new: "warning", touring: "warning", pending: "warning", placed: "success", declined: "neutral" };
const SELECTABLE_STATUSES = ["new", "touring", "pending", "declined"];

export function PlacementInquiries() {
  const [inquiries, setInquiries] = useState(null);
  const [facilities, setFacilities] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showAddInquiry, setShowAddInquiry] = useState(false);
  const [placingInquiry, setPlacingInquiry] = useState(null);

  function loadInquiries() {
    api.placements.inquiries.list().then(setInquiries).catch((err) => setError(err.message));
  }
  function loadFacilities() {
    api.placements.facilities.list().then(setFacilities).catch((err) => setError(err.message));
  }
  useEffect(() => {
    loadInquiries();
    loadFacilities();
  }, []);

  async function handleStatusChange(inquiry, status) {
    setBusyId(inquiry.id);
    setError(null);
    try {
      const updated = await api.placements.inquiries.update(inquiry.id, { status });
      setInquiries((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(inquiry) {
    setBusyId(inquiry.id);
    setError(null);
    try {
      await api.placements.inquiries.delete(inquiry.id);
      setInquiries((prev) => prev.filter((i) => i.id !== inquiry.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const stats = inquiries && {
    newCount: inquiries.filter((i) => i.status === "new").length,
    urgentCount: inquiries.filter((i) => i.urgency === "urgent" && !["placed", "declined"].includes(i.status)).length,
    touringCount: inquiries.filter((i) => i.status === "touring").length,
    placedCount: inquiries.filter((i) => i.status === "placed").length,
  };

  const placeableFacilities = facilities?.filter((f) => !f.pendingReview) || [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Placement Inquiries</h1>
          <p className="mt-1 text-sm text-stone-500">Prospective residents, tracked from first contact to move-in</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddInquiry(true)}>
          + New Inquiry
        </Button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {stats && (
        <StatStrip>
          <StatCard label="New" value={stats.newCount} icon="resident" />
          <StatCard label="Urgent" value={stats.urgentCount} tone={stats.urgentCount > 0 ? "warning" : undefined} icon="warning" />
          <StatCard label="Touring" value={stats.touringCount} icon="clock" />
          <StatCard label="Placed" value={stats.placedCount} icon="home" />
        </StatStrip>
      )}

      {!inquiries && <TableSkeleton columns={5} rows={3} />}
      {inquiries && inquiries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No placement inquiries yet.
        </div>
      )}
      {inquiries && inquiries.length > 0 && (
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
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inquiries.map((inq) => {
                  const isFinal = inq.status === "placed" || inq.status === "declined";
                  return (
                    <tr key={inq.id} className="hover:bg-stone-50">
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-900">{inq.residentName}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{careLevelShortLabel(inq.careLevelNeeded)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{PAYER_LABELS[inq.payerType] || titleCase(inq.payerType)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">
                        {inq.referralSource ? REFERRAL_LABELS[inq.referralSource] || titleCase(inq.referralSource) : <span className="text-stone-400">—</span>}
                      </td>
                      <td className="max-w-[16rem] truncate px-5 py-3.5 text-stone-600" title={inq.culturalPreferences || ""}>
                        {inq.culturalPreferences || <span className="text-stone-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {inq.urgency === "urgent" ? <StatusPill tone="danger">Urgent</StatusPill> : <span className="text-stone-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {isFinal ? (
                          <StatusPill tone={STATUS_TONE[inq.status]}>{titleCase(inq.status)}</StatusPill>
                        ) : (
                          <Select
                            value={inq.status}
                            onChange={(e) => handleStatusChange(inq, e.target.value)}
                            disabled={busyId === inq.id}
                            className="text-xs"
                          >
                            {SELECTABLE_STATUSES.map((s) => (
                              <option key={s} value={s}>{titleCase(s)}</option>
                            ))}
                          </Select>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          {!isFinal && (
                            <Button size="sm" onClick={() => setPlacingInquiry(inq)}>
                              Place
                            </Button>
                          )}
                          {inq.status === "placed" && inq.placedFacility && (
                            <span className="text-xs text-stone-500">at {inq.placedFacility.name}</span>
                          )}
                          {inq.status !== "placed" && (
                            <Button size="sm" variant="secondary" onClick={() => handleDelete(inq)} disabled={busyId === inq.id}>
                              {busyId === inq.id ? "Removing…" : "Remove"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            loadInquiries();
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
            loadInquiries();
            loadFacilities();
          }}
        />
      )}
    </div>
  );
}
