// src/pages/Placement.jsx
// CareFit's placement/referral business — matching a prospective resident
// to whichever AFH has an open bed that fits their needs, whether or not
// that AFH is a CareFit Connect customer. Admin-only and cross-tenant (see
// the backend's placements.js) — the only page in the app that isn't
// scoped to "the current business."
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
import { AddFacilityModal } from "../components/AddFacilityModal";
import { PlaceInquiryModal } from "../components/PlaceInquiryModal";

const PAYER_LABELS = { private_pay: "Private Pay", medicaid: "Medicaid", split: "Split" };
const REFERRAL_LABELS = { hospital: "Hospital", dshs_hca: "DSHS/HCA", family: "Family/Self", other: "Other" };
const STATUS_TONE = { new: "warning", touring: "warning", pending: "warning", placed: "success", declined: "neutral" };
const SELECTABLE_STATUSES = ["new", "touring", "pending", "declined"];

export function Placement() {
  const [inquiries, setInquiries] = useState(null);
  const [facilities, setFacilities] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showAddInquiry, setShowAddInquiry] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);
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

  const stats = inquiries &&
    facilities && {
      newCount: inquiries.filter((i) => i.status === "new").length,
      urgentCount: inquiries.filter((i) => i.urgency === "urgent" && !["placed", "declined"].includes(i.status)).length,
      openBeds: facilities.reduce((sum, f) => sum + (f.openBeds || 0), 0),
      facilitiesTracked: facilities.length,
    };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Placement</h1>
          <p className="mt-1 text-sm text-stone-500">Match prospective residents to an open bed, across every AFH — yours or not</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddInquiry(true)}>
          + New Inquiry
        </Button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {stats && (
        <StatStrip>
          <StatCard label="New inquiries" value={stats.newCount} icon="resident" />
          <StatCard label="Urgent" value={stats.urgentCount} tone={stats.urgentCount > 0 ? "warning" : undefined} icon="warning" />
          <StatCard label="Open beds" value={stats.openBeds} icon="home" />
          <StatCard label="Facilities tracked" value={stats.facilitiesTracked} icon="team" />
        </StatStrip>
      )}

      <div className="mb-8">
        <h2 className="mb-4 text-base font-semibold text-stone-900">Inquiries</h2>
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
                          {!isFinal && (
                            <Button size="sm" onClick={() => setPlacingInquiry(inq)}>
                              Place
                            </Button>
                          )}
                          {inq.status === "placed" && inq.placedFacility && (
                            <span className="text-xs text-stone-500">at {inq.placedFacility.name}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">Facilities</h2>
          <Button variant="secondary" size="sm" onClick={() => setShowAddFacility(true)}>
            + Add External AFH
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
                        {f.isTenantLinked ? <StatusPill tone="success">CareFit Connect</StatusPill> : <span className="text-stone-400">External</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">
                        {f.isTenantLinked
                          ? `${f.occupied} / ${f.capacity ?? "—"} (${f.openBeds ?? "—"} open)`
                          : f.capacity != null
                            ? `${f.capacity} beds`
                            : <span className="text-stone-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{f.careLevelsAccepted || <span className="text-stone-400">—</span>}</td>
                      <td className="max-w-[16rem] truncate px-5 py-3.5 text-stone-600" title={f.culturalNotes || ""}>
                        {f.culturalNotes || <span className="text-stone-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddInquiry && (
        <AddInquiryModal
          onClose={() => setShowAddInquiry(false)}
          onCreated={() => {
            setShowAddInquiry(false);
            loadInquiries();
          }}
        />
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

      {placingInquiry && facilities && (
        <PlaceInquiryModal
          inquiry={placingInquiry}
          facilities={facilities}
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
