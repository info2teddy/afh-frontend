// src/components/EmployeeStatusModal.jsx
// Offboard (or reactivate) an employee. Never deletes anything — historical
// shifts, payroll line items, and credentials all stay put; this only
// changes whether they show up on the active roster and the kiosk clock-in
// grid (GET /kiosk/employees already filters to status: "active").
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive (e.g. leave of absence)" },
  { value: "terminated", label: "Terminated" },
];

export function EmployeeStatusModal({ employee, onClose, onSaved }) {
  const [status, setStatus] = useState(employee.status);
  const [endDate, setEndDate] = useState(employee.endDate?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.employees.setStatus(employee.id, {
        status,
        endDate: status === "active" ? undefined : endDate,
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`${employee.name}'s status`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div>
          <label className={labelClass} htmlFor="emp-status">Status</label>
          {STATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="mb-1.5 flex items-center gap-2 text-sm text-stone-700 last:mb-0">
              <input
                type="radio"
                name="emp-status"
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
          <div>
            <label className={labelClass} htmlFor="emp-end-date">Last day</label>
            <input
              id="emp-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <p className="text-xs text-stone-500">
          Their shift history, payroll records, and credentials stay exactly as they are — this only removes them
          from the active roster and the clock-in tablet.
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
