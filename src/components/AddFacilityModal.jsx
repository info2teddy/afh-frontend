// src/components/AddFacilityModal.jsx
// Adds a purely external AFH (not a CareFit Connect customer) to the
// placement book, OR — when passed an existing `facility` — reviews/
// corrects a self-submitted one and marks it reviewed on save. Facilities
// that ARE CareFit Connect customers appear automatically (see
// syncFacilitiesFromTenants in the backend's placements.js).
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

function emptyForm(facility) {
  return {
    name: facility?.name || "",
    address: facility?.address || "",
    contactName: facility?.contactName || "",
    contactPhone: facility?.contactPhone || "",
    contactEmail: facility?.contactEmail || "",
    capacity: facility?.capacity ?? "",
    currentResidents: facility?.currentResidents ?? "",
    licenseNumber: facility?.licenseNumber || "",
    licenseExpiryDate: facility?.licenseExpiryDate ? facility.licenseExpiryDate.slice(0, 10) : "",
    genderAccepted: facility?.genderAccepted || "",
    careLevelsAccepted: facility?.careLevelsAccepted || "",
    specialtyCare: facility?.specialtyCare || "",
    culturalNotes: facility?.culturalNotes || "",
    acceptsMedicaid: facility?.acceptsMedicaid === true ? "true" : facility?.acceptsMedicaid === false ? "false" : "",
    medicaidManagedCareOrgs: facility?.medicaidManagedCareOrgs || "",
    privateRoomPricing: facility?.privateRoomPricing || "",
    sharedRoomPricing: facility?.sharedRoomPricing || "",
    okToShareWithFamilies: facility?.okToShareWithFamilies === true ? "true" : facility?.okToShareWithFamilies === false ? "false" : "",
    notes: facility?.notes || "",
  };
}

export function AddFacilityModal({ facility, onClose, onCreated, onReviewed }) {
  const isReview = !!facility;
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm(facility));

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
      if (isReview) {
        await api.placements.facilities.update(facility.id, form);
        const reviewed = await api.placements.facilities.review(facility.id);
        onReviewed(reviewed);
      } else {
        const created = await api.placements.facilities.create(form);
        onCreated(created);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isReview ? `Review ${facility.name}` : "Add external AFH"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isReview && (
          <p className="text-xs text-stone-500">
            For an AFH outside CareFit Connect — homes that are already customers show up here automatically.
          </p>
        )}
        {isReview && (
          <p className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-700">
            This AFH submitted itself via the public intake form. Check the details below, correct anything that
            needs it, then save to mark it reviewed — only then can it be selected when placing a resident.
          </p>
        )}

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <label className={labelClass} htmlFor="facility-current-residents">Current residents</label>
            <input
              id="facility-current-residents"
              type="number"
              min="0"
              className={inputClass}
              value={form.currentResidents}
              onChange={(e) => set("currentResidents", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="facility-gender">Gender accepted</label>
            <Select id="facility-gender" className="w-full" value={form.genderAccepted} onChange={(e) => set("genderAccepted", e.target.value)}>
              <option value="">Not set</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="both">Both</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="facility-license-number">License number</label>
            <input id="facility-license-number" className={inputClass} value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="facility-license-expiry">License expiry</label>
            <input
              id="facility-license-expiry"
              type="date"
              className={inputClass}
              value={form.licenseExpiryDate}
              onChange={(e) => set("licenseExpiryDate", e.target.value)}
            />
          </div>
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

        <div>
          <label className={labelClass} htmlFor="facility-specialty">Specialty care</label>
          <input
            id="facility-specialty"
            className={inputClass}
            value={form.specialtyCare}
            onChange={(e) => set("specialtyCare", e.target.value)}
            placeholder="e.g. Dementia, Hospice, Bedbound/Hoyer Lift"
          />
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="facility-medicaid">Accepts Medicaid</label>
            <Select id="facility-medicaid" className="w-full" value={form.acceptsMedicaid} onChange={(e) => set("acceptsMedicaid", e.target.value)}>
              <option value="">Not set</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </div>
          <div>
            <label className={labelClass} htmlFor="facility-managed-care">Managed care orgs</label>
            <input
              id="facility-managed-care"
              className={inputClass}
              value={form.medicaidManagedCareOrgs}
              onChange={(e) => set("medicaidManagedCareOrgs", e.target.value)}
              placeholder="e.g. Molina, United, Amerigroup, CHPW"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="facility-private-price">Private room pricing</label>
            <input
              id="facility-private-price"
              className={inputClass}
              value={form.privateRoomPricing}
              onChange={(e) => set("privateRoomPricing", e.target.value)}
              placeholder="$3,200-$3,800/mo"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="facility-shared-price">Shared room pricing</label>
            <input
              id="facility-shared-price"
              className={inputClass}
              value={form.sharedRoomPricing}
              onChange={(e) => set("sharedRoomPricing", e.target.value)}
              placeholder="$2,400-$2,800/mo"
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="facility-share-consent">OK to share with families / referral partners</label>
          <Select id="facility-share-consent" className="w-full" value={form.okToShareWithFamilies} onChange={(e) => set("okToShareWithFamilies", e.target.value)}>
            <option value="">Not set</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
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
            {saving ? "Saving…" : isReview ? "Approve & save" : "Add facility"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
