// src/components/AddInquiryModal.jsx
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

const REFERRAL_SOURCES = [
  { value: "", label: "Not set" },
  { value: "hospital", label: "Hospital discharge planner" },
  { value: "dshs_hca", label: "DSHS / HCA case manager" },
  { value: "family", label: "Family / self-referral" },
  { value: "other", label: "Other" },
];

export function AddInquiryModal({ onClose, onCreated }) {
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    residentName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    referralSource: "",
    careLevelNeeded: "level_2",
    payerType: "medicaid",
    culturalPreferences: "",
    specialtyCareNeeded: "",
    urgency: "normal",
    notes: "",
  });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.residentName.trim()) {
      setError("Resident name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const inquiry = await api.placements.inquiries.create(form);
      onCreated(inquiry);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New placement" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="inquiry-name">Resident name *</label>
          <input
            id="inquiry-name"
            className={inputClass}
            value={form.residentName}
            onChange={(e) => set("residentName", e.target.value)}
            placeholder="Full name"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="inquiry-contact-name">Contact name</label>
            <input
              id="inquiry-contact-name"
              className={inputClass}
              value={form.contactName}
              onChange={(e) => set("contactName", e.target.value)}
              placeholder="Family member / POA"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="inquiry-referral">Referral source</label>
            <Select id="inquiry-referral" className="w-full" value={form.referralSource} onChange={(e) => set("referralSource", e.target.value)}>
              {REFERRAL_SOURCES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="inquiry-phone">Phone</label>
            <input
              id="inquiry-phone"
              type="tel"
              className={inputClass}
              value={form.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="inquiry-email">Email</label>
            <input
              id="inquiry-email"
              type="email"
              className={inputClass}
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="inquiry-care-level">Care level needed *</label>
            <Select id="inquiry-care-level" className="w-full" value={form.careLevelNeeded} onChange={(e) => set("careLevelNeeded", e.target.value)}>
              <option value="level_1">Level 1 — Minimal Support</option>
              <option value="level_2">Level 2 — Moderate Support</option>
              <option value="level_3">Level 3 — Extensive Support</option>
            </Select>
          </div>
          <div>
            <label className={labelClass} htmlFor="inquiry-payer">Payer *</label>
            <Select id="inquiry-payer" className="w-full" value={form.payerType} onChange={(e) => set("payerType", e.target.value)}>
              <option value="private_pay">Private Pay</option>
              <option value="medicaid">Medicaid</option>
              <option value="split">Split (Medicaid + Private)</option>
            </Select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="inquiry-urgency">Urgency</label>
          <Select id="inquiry-urgency" className="w-full" value={form.urgency} onChange={(e) => set("urgency", e.target.value)}>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <div>
          <label className={labelClass} htmlFor="inquiry-cultural">Language / faith / cultural preferences</label>
          <input
            id="inquiry-cultural"
            className={inputClass}
            value={form.culturalPreferences}
            onChange={(e) => set("culturalPreferences", e.target.value)}
            placeholder="e.g. Amharic-speaking, Ethiopian Orthodox preferred"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="inquiry-specialty">Specialty care needed</label>
          <input
            id="inquiry-specialty"
            className={inputClass}
            value={form.specialtyCareNeeded}
            onChange={(e) => set("specialtyCareNeeded", e.target.value)}
            placeholder="e.g. Dementia care, non-ambulatory support"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="inquiry-notes">Notes</label>
          <textarea
            id="inquiry-notes"
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
            {saving ? "Adding…" : "Add placement"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
