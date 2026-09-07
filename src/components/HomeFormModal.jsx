// src/components/HomeFormModal.jsx
// Shared add/edit form for a Home (physical AFH property). Passing `home`
// puts it in edit mode; omitting it creates a new one.
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export function HomeFormModal({ home, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: home?.name || "",
    licenseNumber: home?.licenseNumber || "",
    address: home?.address || "",
    capacity: home?.capacity ?? "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.licenseNumber || !form.capacity) {
      setError("Name, license number, and capacity are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = home ? await api.homes.update(home.id, form) : await api.homes.create(form);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={home ? "Edit facility" : "Add facility"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Willow Creek Main House" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>License number *</label>
            <input className={inputClass} value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} placeholder="AFH-000001" />
          </div>
          <div>
            <label className={labelClass}>Capacity *</label>
            <input type="number" min="1" className={inputClass} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="6" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Address</label>
          <input className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Willow Creek Rd, Mill Creek, WA" />
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : home ? "Save changes" : "Add facility"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
