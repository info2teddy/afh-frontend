// src/components/PlaceInquiryModal.jsx
// Marks an inquiry placed at a facility. Tenant-linked facilities also get
// a real Resident record created (needs a move-in date, matching how
// AddResidentModal works); a purely external facility is just a logged
// outcome, since there's no CareFit Connect record to create there.
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export function PlaceInquiryModal({ inquiry, facilities, onClose, onPlaced }) {
  const [facilityId, setFacilityId] = useState("");
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().slice(0, 10));
  const [room, setRoom] = useState("");
  const [medicaidSplitPct, setMedicaidSplitPct] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const facility = facilities.find((f) => f.id === facilityId);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!facilityId) {
      setError("Select a facility.");
      return;
    }
    if (facility?.isTenantLinked && !moveInDate) {
      setError("Move-in date is required for a CareFit Connect facility.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.placements.inquiries.place(inquiry.id, {
        facilityId,
        moveInDate: facility?.isTenantLinked ? moveInDate : undefined,
        room: room || undefined,
        medicaidSplitPct:
          facility?.isTenantLinked && inquiry.payerType === "split" && medicaidSplitPct ? Number(medicaidSplitPct) : undefined,
      });
      onPlaced(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Place ${inquiry.residentName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="place-facility">Facility *</label>
          <Select id="place-facility" className="w-full" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
            <option value="">Select a facility…</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
                {f.isTenantLinked ? ` — ${f.openBeds} open bed${f.openBeds === 1 ? "" : "s"}` : " (external)"}
              </option>
            ))}
          </Select>
        </div>

        {facility?.isTenantLinked ? (
          <>
            <p className="text-xs text-stone-500">
              This creates a real resident record at {facility.name} ({facility.tenantName}).
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="place-move-in">Move-in date *</label>
                <input
                  id="place-move-in"
                  type="date"
                  className={inputClass}
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="place-room">Room</label>
                <input id="place-room" className={inputClass} value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 2B" />
              </div>
            </div>
            {inquiry.payerType === "split" && (
              <div>
                <label className={labelClass} htmlFor="place-medicaid-pct">Medicaid %</label>
                <input
                  id="place-medicaid-pct"
                  type="number"
                  min="0"
                  max="100"
                  className={inputClass}
                  value={medicaidSplitPct}
                  onChange={(e) => setMedicaidSplitPct(e.target.value)}
                  placeholder="70"
                />
              </div>
            )}
          </>
        ) : facility ? (
          <p className="text-xs text-stone-500">
            {facility.name} isn't a CareFit Connect facility — this just logs the referral outcome, no resident record is created.
          </p>
        ) : null}

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Placing…" : "Confirm placement"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
