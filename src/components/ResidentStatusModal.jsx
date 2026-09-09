// src/components/ResidentStatusModal.jsx
// Move a resident through discharge (or back to active, e.g. a data-entry
// correction). Never deletes anything — care plans, notes, and invoices all
// stay exactly as they are; a licensed AFH needs those records to survive a
// resident leaving, for as long as compliance requires.
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "discharging", label: "Discharging (in progress)" },
  { value: "discharged", label: "Discharged" },
];

const DISCHARGE_REASONS = [
  { value: "higher_level_of_care", label: "Moved to a higher level of care" },
  { value: "moved_in_with_family", label: "Moved in with family" },
  { value: "transferred", label: "Transferred to another AFH" },
  { value: "deceased", label: "Deceased" },
  { value: "other", label: "Other" },
];

export function ResidentStatusModal({ resident, onClose, onSaved }) {
  const [status, setStatus] = useState(resident.status);
  const [moveOutDate, setMoveOutDate] = useState(
    resident.moveOutDate?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  );
  const [dischargeReason, setDischargeReason] = useState(resident.dischargeReason || "higher_level_of_care");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.residents.setStatus(resident.id, {
        status,
        moveOutDate: status === "active" ? undefined : moveOutDate,
        dischargeReason: status === "active" ? undefined : dischargeReason,
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`${resident.name}'s status`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div>
          <label className={labelClass} htmlFor="resident-status">Status</label>
          {STATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="mb-1.5 flex items-center gap-2 text-sm text-stone-700 last:mb-0">
              <input
                type="radio"
                name="resident-status"
                value={opt.value}
                checked={status === opt.value}
                onChange={() => setStatus(opt.value)}
                className="h-4 w-4 border-stone-300 text-brand-600 focus:ring-brand-500/40"
              />
              {opt.label}
            </label>
          ))}
        </div>

        {status !== "active" && (
          <>
            <div>
              <label className={labelClass} htmlFor="resident-move-out-date">Move-out date</label>
              <input
                id="resident-move-out-date"
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="resident-discharge-reason">Reason</label>
              <Select
                id="resident-discharge-reason"
                value={dischargeReason}
                onChange={(e) => setDischargeReason(e.target.value)}
                className="w-full"
              >
                {DISCHARGE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </div>
          </>
        )}

        <p className="text-xs text-stone-500">
          Their care plans, notes, and invoices stay exactly as they are — this only updates their status and
          discharge record.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
