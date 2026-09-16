// src/components/RateSchedulesModal.jsx
// Manage a home's price per care level. Rates are versioned by
// effectiveDate rather than edited in place (see homes.js) — adding a new
// one schedules a future change without touching past invoices, so this is
// an add/list/remove screen, not an edit-in-place form.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { careLevelLabel } from "../lib/format";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";
import { CardSkeleton } from "./CardSkeleton";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

function money(n) {
  return Number(n).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function RateSchedulesModal({ home, onClose }) {
  const [rates, setRates] = useState(null);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ careLevel: "level_2", roomAndBoardRate: "", monthlyRate: "", effectiveDate: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  function load() {
    api.homes.rateSchedules.list(home.id).then(setRates).catch((err) => setError(err.message));
  }
  useEffect(load, [home.id]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.monthlyRate || !form.effectiveDate) {
      setError("Monthly rate and effective date are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.homes.rateSchedules.create(home.id, form);
      setShowForm(false);
      setForm({ careLevel: "level_2", roomAndBoardRate: "", monthlyRate: "", effectiveDate: new Date().toISOString().slice(0, 10) });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rate) {
    setRemovingId(rate.id);
    setError(null);
    try {
      await api.homes.rateSchedules.delete(home.id, rate.id);
      setRates((prev) => prev.filter((r) => r.id !== rate.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Modal title={`Rates — ${home.name}`} onClose={onClose}>
      <p className="mb-4 text-sm text-stone-500">
        What this home charges per care level. Invoices use whichever rate is in effect on the billing date, so scheduling a future rate here won't change past invoices.
      </p>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {rates === null && <CardSkeleton lines={2} />}
      {rates && rates.length === 0 && !showForm && (
        <p className="mb-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-500">
          No rates set yet — residents at this home can't be invoiced until at least one is added.
        </p>
      )}

      {rates && rates.length > 0 && (
        <div className="mb-4 divide-y divide-stone-100 rounded-xl border border-stone-200">
          {rates.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-stone-900">{careLevelLabel(r.careLevel)}</div>
                <div className="text-xs text-stone-500">
                  {money(Number(r.roomAndBoardRate) + Number(r.monthlyRate))}/mo total · room & board {money(r.roomAndBoardRate)} + care {money(r.monthlyRate)}
                </div>
                <div className="text-xs text-stone-400">Effective {formatDate(r.effectiveDate)}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleDelete(r)} disabled={removingId === r.id}>
                {removingId === r.id ? "Removing…" : "Remove"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <Button size="sm" onClick={() => setShowForm(true)}>+ Add rate</Button>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="rate-level">Care level *</label>
              <Select id="rate-level" className="w-full" value={form.careLevel} onChange={(e) => set("careLevel", e.target.value)}>
                <option value="level_1">Level 1 — Minimal Support</option>
                <option value="level_2">Level 2 — Moderate Support</option>
                <option value="level_3">Level 3 — Extensive Support</option>
              </Select>
            </div>
            <div>
              <label className={labelClass} htmlFor="rate-effective">Effective date *</label>
              <input id="rate-effective" type="date" className={inputClass} value={form.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="rate-room">Room & board</label>
              <input id="rate-room" type="number" min="0" step="0.01" className={inputClass} placeholder="1200.00" value={form.roomAndBoardRate} onChange={(e) => set("roomAndBoardRate", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="rate-monthly">Care rate *</label>
              <input id="rate-monthly" type="number" min="0" step="0.01" className={inputClass} placeholder="1600.00" value={form.monthlyRate} onChange={(e) => set("monthlyRate", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save rate"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
