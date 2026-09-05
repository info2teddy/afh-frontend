// src/components/AddEmployeeModal.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export function AddEmployeeModal({ onClose, onCreated }) {
  const [homes, setHomes] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    homeId: "",
    role: "caregiver",
    employmentType: "hourly",
    payRate: "",
    hireDate: new Date().toISOString().slice(0, 10),
    liveIn: false,
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
    if (!form.name || !form.homeId || !form.hireDate || form.payRate === "") {
      setError("Name, home, hire date, and pay rate are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const employee = await api.employees.create({ ...form, payRate: Number(form.payRate) });
      onCreated(employee);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add team member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
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
            <label className={labelClass}>Role *</label>
            <Select className="w-full" value={form.role} onChange={(e) => set("role", e.target.value)}>
              <option value="caregiver">Caregiver</option>
              <option value="resident_manager">Resident Manager</option>
              <option value="rn_delegator">RN Delegator</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div>
            <label className={labelClass}>Hire date *</label>
            <input type="date" className={inputClass} value={form.hireDate} onChange={(e) => set("hireDate", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Employment type *</label>
            <Select className="w-full" value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
              <option value="hourly">Hourly</option>
              <option value="salary">Salary</option>
            </Select>
          </div>
          <div>
            <label className={labelClass}>Pay rate *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.payRate}
              onChange={(e) => set("payRate", e.target.value)}
              placeholder={form.employmentType === "hourly" ? "22.00 / hr" : "50000 / yr"}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={form.liveIn} onChange={(e) => set("liveIn", e.target.checked)} className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500/20" />
          Live-in caregiver
        </label>

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Adding…" : "Add team member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
