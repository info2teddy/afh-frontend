// src/components/AddResidentModal.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export function AddResidentModal({ onClose, onCreated }) {
  const [homes, setHomes] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    homeId: "",
    careLevel: "level_2",
    payerType: "medicaid",
    medicaidSplitPct: "",
    moveInDate: new Date().toISOString().slice(0, 10),
    dateOfBirth: "",
    room: "",
    nextAssessmentDate: "",
    authorizationStatus: "",
  });

  useEffect(() => {
    api.homes
      .list()
      .then((data) => {
        setHomes(data);
        if (data.length === 1) setForm((f) => ({ ...f, homeId: data[0].id }));
      })
      .catch((err) => setError(err.message));
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.homeId || !form.moveInDate) {
      setError("Name, home, and move-in date are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const resident = await api.residents.create({
        ...form,
        medicaidSplitPct: form.payerType === "split" ? Number(form.medicaidSplitPct) : null,
        dateOfBirth: form.dateOfBirth || null,
        room: form.room || null,
        nextAssessmentDate: form.nextAssessmentDate || null,
        authorizationStatus: form.authorizationStatus || null,
      });
      onCreated(resident);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add resident" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name"
          />
        </div>

        {homes && homes.length > 1 && (
          <div>
            <label className={labelClass}>Home *</label>
            <Select className="w-full" value={form.homeId} onChange={(e) => set("homeId", e.target.value)}>
              <option value="">Select a home…</option>
              {homes.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Date of birth</label>
            <input
              type="date"
              className={inputClass}
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Room</label>
            <input
              className={inputClass}
              value={form.room}
              onChange={(e) => set("room", e.target.value)}
              placeholder="e.g. 2B"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Care level *</label>
            <Select className="w-full" value={form.careLevel} onChange={(e) => set("careLevel", e.target.value)}>
              <option value="level_1">Level 1 — Minimal Support</option>
              <option value="level_2">Level 2 — Moderate Support</option>
              <option value="level_3">Level 3 — Extensive Support</option>
            </Select>
          </div>
          <div>
            <label className={labelClass}>Move-in date *</label>
            <input
              type="date"
              className={inputClass}
              value={form.moveInDate}
              onChange={(e) => set("moveInDate", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Payer *</label>
            <Select className="w-full" value={form.payerType} onChange={(e) => set("payerType", e.target.value)}>
              <option value="private_pay">Private Pay</option>
              <option value="medicaid">Medicaid</option>
              <option value="split">Split (Medicaid + Private)</option>
            </Select>
          </div>
          {form.payerType === "split" && (
            <div>
              <label className={labelClass}>Medicaid %</label>
              <input
                type="number"
                min="0"
                max="100"
                className={inputClass}
                value={form.medicaidSplitPct}
                onChange={(e) => set("medicaidSplitPct", e.target.value)}
                placeholder="70"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Next assessment</label>
            <input
              type="date"
              className={inputClass}
              value={form.nextAssessmentDate}
              onChange={(e) => set("nextAssessmentDate", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Authorization</label>
            <Select
              className="w-full"
              value={form.authorizationStatus}
              onChange={(e) => set("authorizationStatus", e.target.value)}
            >
              <option value="">Not set</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </Select>
          </div>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Adding…" : "Add resident"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
