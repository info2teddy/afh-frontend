// src/components/AddFacilityModal.jsx
// Adds a purely external AFH (not a CareFit Connect customer) to the
// placement book. Facilities that ARE CareFit Connect tenants appear
// automatically — see syncFacilitiesFromTenants in the backend's
// placements.js — so this form is only ever for the outside-network case.
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export function AddFacilityModal({ onClose, onCreated }) {
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    capacity: "",
    careLevelsAccepted: "",
    culturalNotes: "",
    notes: "",
  });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Facility name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const facility = await api.placements.facilities.create(form);
      onCreated(facility);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add external AFH" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-stone-500">
          For an AFH outside CareFit Connect — homes that are already customers show up here automatically.
        </p>

        <div>
          <label className={labelClass} htmlFor="facility-name">Facility name *</label>
          <input id="facility-name" className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>

        <div>
          <label className={labelClass} htmlFor="facility-address">Address</label>
          <input id="facility-address" className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="facility-contact-name">Contact name</label>
            <input id="facility-contact-name" className={inputClass} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="facility-phone">Phone</label>
            <input id="facility-phone" type="tel" className={inputClass} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="facility-email">Email</label>
          <input id="facility-email" type="email" className={inputClass} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="facility-capacity">Capacity</label>
            <input
              id="facility-capacity"
              type="number"
              min="0"
              className={inputClass}
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder="6"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="facility-care-levels">Care levels accepted</label>
            <input
              id="facility-care-levels"
              className={inputClass}
              value={form.careLevelsAccepted}
              onChange={(e) => set("careLevelsAccepted", e.target.value)}
              placeholder="e.g. Level 1-2"
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="facility-cultural">Language / cultural specialization</label>
          <input
            id="facility-cultural"
            className={inputClass}
            value={form.culturalNotes}
            onChange={(e) => set("culturalNotes", e.target.value)}
            placeholder="e.g. Amharic-speaking staff, Ethiopian Orthodox household"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="facility-notes">Notes</label>
          <textarea
            id="facility-notes"
            rows={2}
            className={`${inputClass} resize-none`}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Adding…" : "Add facility"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
