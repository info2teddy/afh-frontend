// src/components/FaceSheetPanel.jsx
// Editable source data for the printable resident face sheet (see
// ResidentFaceSheetPrint.jsx) — lives in the resident's Documents tab.
// Contacts are the 10 fixed "slots" the real paper form has (emergency
// contacts, social/financial worker, nurse delegator, pharmacy, doctor, up
// to 3 specialists); CONTACT_FIELDS mirrors the backend's CONTACT_ROLES.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "./Button";
import { Select } from "./Select";
import { CardSkeleton } from "./CardSkeleton";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

const CONTACT_FIELDS = [
  { role: "emergency_contact_1", label: "Emergency Contact 1" },
  { role: "emergency_contact_2", label: "Emergency Contact 2" },
  { role: "social_worker", label: "Social Worker" },
  { role: "financial_worker", label: "Financial Worker" },
  { role: "nurse_delegator", label: "Nurse Delegator" },
  { role: "pharmacy", label: "Pharmacy" },
  { role: "primary_care_doctor", label: "Primary Care Doctor" },
  { role: "specialist_1", label: "Specialist 1", hasSpecialty: true },
  { role: "specialist_2", label: "Specialist 2", hasSpecialty: true },
  { role: "specialist_3", label: "Specialist 3", hasSpecialty: true },
];

const EMPTY_CONTACT = { name: "", phone: "", fax: "", email: "", address: "", specialty: "" };

function toFormContacts(contacts) {
  const byRole = Object.fromEntries((contacts || []).map((c) => [c.role, c]));
  return Object.fromEntries(
    CONTACT_FIELDS.map(({ role }) => [role, { ...EMPTY_CONTACT, ...byRole[role] }])
  );
}

export function FaceSheetPanel({ residentId }) {
  const [resident, setResident] = useState(null);
  const [form, setForm] = useState(null);
  const [contacts, setContacts] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function load() {
    api.residents.get(residentId).then((r) => {
      setResident(r);
      setForm({
        middleName: r.middleName || "",
        socialSecurityNumber: r.socialSecurityNumber || "",
        dnrStatus: r.dnrStatus || "",
        advancedDirectivesType: r.advancedDirectivesType || "",
        medicareNumber: r.medicareNumber || "",
        medicaidNumber: r.medicaidNumber || "",
        supplementaryInsurance: r.supplementaryInsurance || "",
        diagnosis: r.diagnosis || "",
        allergies: r.allergies || "",
      });
      setContacts(toFormContacts(r.contacts));
    }).catch((err) => setError(err.message));
  }
  useEffect(load, [residentId]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }
  function setContact(role, field, value) {
    setContacts((c) => ({ ...c, [role]: { ...c[role], [field]: value } }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.residents.saveFaceSheet(residentId, { ...form, contacts });
      setResident(updated);
      setContacts(toFormContacts(updated.contacts));
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <CardSkeleton lines={3} />;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <div className="text-sm font-semibold text-stone-900">Face Sheet</div>
          <p className="mt-0.5 text-xs text-stone-500">Emergency contacts, providers, and key info — printable for the front of the binder</p>
        </div>
        <span className="text-sm text-stone-400">{expanded ? "Hide" : "Edit"}</span>
      </button>

      <div className="flex items-center gap-2 border-t border-stone-100 px-5 py-3">
        <Button size="sm" variant="secondary" onClick={() => window.open(`/residents/${residentId}/face-sheet`, "_blank", "noopener,noreferrer")}>
          Print / Download Face Sheet
        </Button>
      </div>

      {expanded && (
        <form onSubmit={handleSave} className="flex flex-col gap-5 border-t border-stone-100 px-5 py-5">
          {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Resident Info</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Middle Name</label>
                <input className={inputClass} value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Social Security Number</label>
                <input className={inputClass} value={form.socialSecurityNumber} onChange={(e) => set("socialSecurityNumber", e.target.value)} placeholder="XXX-XX-XXXX" />
              </div>
              <div>
                <label className={labelClass}>DNR Status</label>
                <Select className="w-full" value={form.dnrStatus} onChange={(e) => set("dnrStatus", e.target.value)}>
                  <option value="">Not set</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Advanced Directives Type</label>
                <input className={inputClass} value={form.advancedDirectivesType} onChange={(e) => set("advancedDirectivesType", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Medicare Number</label>
                <input className={inputClass} value={form.medicareNumber} onChange={(e) => set("medicareNumber", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Medicaid Number</label>
                <input className={inputClass} value={form.medicaidNumber} onChange={(e) => set("medicaidNumber", e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Supplementary Insurance</label>
                <input className={inputClass} value={form.supplementaryInsurance} onChange={(e) => set("supplementaryInsurance", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Diagnosis &amp; Allergies</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Diagnosis</label>
                <textarea rows={2} className={inputClass} value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Allergies</label>
                <textarea rows={2} className={inputClass} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Contacts &amp; Providers</h3>
            <div className="flex flex-col gap-4">
              {CONTACT_FIELDS.map(({ role, label, hasSpecialty }) => (
                <div key={role} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div className="mb-2 text-xs font-medium text-stone-700">{label}</div>
                  <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${hasSpecialty ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}>
                    <input className={inputClass} placeholder="Name" value={contacts[role].name} onChange={(e) => setContact(role, "name", e.target.value)} />
                    {hasSpecialty && (
                      <input className={inputClass} placeholder="Specialty/Type" value={contacts[role].specialty} onChange={(e) => setContact(role, "specialty", e.target.value)} />
                    )}
                    <input className={inputClass} placeholder="Phone" value={contacts[role].phone} onChange={(e) => setContact(role, "phone", e.target.value)} />
                    <input className={inputClass} placeholder="Fax" value={contacts[role].fax} onChange={(e) => setContact(role, "fax", e.target.value)} />
                    <input className={inputClass} placeholder="Email" value={contacts[role].email} onChange={(e) => setContact(role, "email", e.target.value)} />
                    <input className={inputClass} placeholder="Address" value={contacts[role].address} onChange={(e) => setContact(role, "address", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-xs text-emerald-700">Saved</span>}
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save Face Sheet"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
