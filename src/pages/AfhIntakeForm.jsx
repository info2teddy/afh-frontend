// src/pages/AfhIntakeForm.jsx
// Public, unauthenticated intake form for an AFH outside CareFit Connect —
// the easy alternative to CareFit's paper "Partnership Form" (email/PDF).
// Submissions land in Placement as "Pending review" until an admin approves
// them (see backend's publicIntake.js) — nothing here is trusted blindly.
import { useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import carefitIcon from "../assets/carefit-icon.svg";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1.5 block text-xs font-medium text-stone-600";

const emptyForm = {
  name: "",
  address: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  capacity: "",
  currentResidents: "",
  licenseNumber: "",
  licenseExpiryDate: "",
  genderAccepted: "",
  careLevelsAccepted: "",
  specialtyCare: "",
  culturalNotes: "",
  acceptsMedicaid: "",
  medicaidManagedCareOrgs: "",
  privateRoomPricing: "",
  sharedRoomPricing: "",
  okToShareWithFamilies: "",
  notes: "",
};

export function AfhIntakeForm() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submittedName, setSubmittedName] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Home name is required.");
      return;
    }
    if (!form.contactPhone.trim() && !form.contactEmail.trim()) {
      setError("A phone number or email is required so CareFit can follow up.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await api.publicIntake.submit(form);
      setSubmittedName(result.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (submittedName) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(61,90,128,0.08), transparent), #fafaf9" }}
      >
        <div className="w-full max-w-sm text-center" style={{ animation: "panel-in 300ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <img src={carefitIcon} alt="" className="mx-auto mb-4 h-14 w-auto" />
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-lg font-semibold text-stone-900">Thank you!</h1>
            <p className="text-sm text-stone-600">
              {submittedName} has been submitted to CareFit Connect. A member of our team will review it and follow up soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(61,90,128,0.08), transparent), #fafaf9" }}
    >
      <div className="mx-auto w-full max-w-2xl" style={{ animation: "panel-in 300ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div className="mb-8 text-center">
          <img src={carefitIcon} alt="" className="mx-auto mb-4 h-14 w-auto" />
          <div className="mb-1.5 text-lg font-semibold tracking-tight text-stone-900">
            CareFit <span className="text-brand-600">Connect</span>
          </div>
          <p className="text-sm text-stone-500">
            Tell us about your Adult Family Home so we can match residents to you — no account needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <label className={labelClass} htmlFor="intake-name">Home name *</label>
            <input id="intake-name" className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div>
            <label className={labelClass} htmlFor="intake-address">Address</label>
            <input id="intake-address" className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="intake-contact-name">Your name</label>
              <input id="intake-contact-name" className={inputClass} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="intake-phone">Phone *</label>
              <input id="intake-phone" type="tel" className={inputClass} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="intake-email">Email {form.contactPhone.trim() ? "" : "*"}</label>
            <input id="intake-email" type="email" className={inputClass} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="intake-capacity">Capacity</label>
              <input id="intake-capacity" type="number" min="0" className={inputClass} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="6" />
            </div>
            <div>
              <label className={labelClass} htmlFor="intake-current-residents">Current residents</label>
              <input id="intake-current-residents" type="number" min="0" className={inputClass} value={form.currentResidents} onChange={(e) => set("currentResidents", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="intake-gender">Gender accepted</label>
              <Select id="intake-gender" className="w-full" value={form.genderAccepted} onChange={(e) => set("genderAccepted", e.target.value)}>
                <option value="">Not set</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="both">Both</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="intake-license-number">License number</label>
              <input id="intake-license-number" className={inputClass} value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="intake-license-expiry">License expiry</label>
              <input id="intake-license-expiry" type="date" className={inputClass} value={form.licenseExpiryDate} onChange={(e) => set("licenseExpiryDate", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="intake-care-levels">Care levels accepted</label>
            <input
              id="intake-care-levels"
              className={inputClass}
              value={form.careLevelsAccepted}
              onChange={(e) => set("careLevelsAccepted", e.target.value)}
              placeholder="e.g. Level 1-2"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="intake-specialty">Specialty care offered</label>
            <input
              id="intake-specialty"
              className={inputClass}
              value={form.specialtyCare}
              onChange={(e) => set("specialtyCare", e.target.value)}
              placeholder="e.g. Dementia, Hospice, Bedbound/Hoyer Lift, Behavioral"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="intake-cultural">Languages spoken / cultural specialization</label>
            <input
              id="intake-cultural"
              className={inputClass}
              value={form.culturalNotes}
              onChange={(e) => set("culturalNotes", e.target.value)}
              placeholder="e.g. Amharic, Tigrigna; Ethiopian Orthodox household"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="intake-medicaid">Do you accept Medicaid?</label>
              <Select id="intake-medicaid" className="w-full" value={form.acceptsMedicaid} onChange={(e) => set("acceptsMedicaid", e.target.value)}>
                <option value="">Not set</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </div>
            <div>
              <label className={labelClass} htmlFor="intake-managed-care">If yes, managed by</label>
              <input
                id="intake-managed-care"
                className={inputClass}
                value={form.medicaidManagedCareOrgs}
                onChange={(e) => set("medicaidManagedCareOrgs", e.target.value)}
                placeholder="e.g. Molina, United, Amerigroup, CHPW"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="intake-private-price">Private room monthly pricing</label>
              <input id="intake-private-price" className={inputClass} value={form.privateRoomPricing} onChange={(e) => set("privateRoomPricing", e.target.value)} placeholder="$3,200-$3,800" />
            </div>
            <div>
              <label className={labelClass} htmlFor="intake-shared-price">Shared room monthly pricing</label>
              <input id="intake-shared-price" className={inputClass} value={form.sharedRoomPricing} onChange={(e) => set("sharedRoomPricing", e.target.value)} placeholder="$2,400-$2,800" />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="intake-share-consent">Do you give CareFit Connect permission to share your home's information with referral partners or families?</label>
            <Select id="intake-share-consent" className="w-full" value={form.okToShareWithFamilies} onChange={(e) => set("okToShareWithFamilies", e.target.value)}>
              <option value="">Not set</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </div>

          <div>
            <label className={labelClass} htmlFor="intake-notes">Anything else? (staffing, amenities, special features)</label>
            <textarea
              id="intake-notes"
              rows={3}
              className={`${inputClass} resize-none`}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. near hospital, multilingual caregivers, pet-friendly, 24/7 on-call nurse"
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

          <Button type="submit" variant="primary" disabled={saving} className="mt-1 w-full">
            {saving ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
}
