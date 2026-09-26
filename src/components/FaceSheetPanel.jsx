// src/components/FaceSheetPanel.jsx
// Editable source data for the printable resident face sheet (see
// ResidentFaceSheetPrint.jsx) — lives in the resident's Documents tab.
// Contacts are the 10 fixed "slots" the real paper form has (emergency
// contacts, social/financial worker, nurse delegator, pharmacy, doctor, up
// to 3 specialists); CONTACT_FIELDS mirrors the backend's CONTACT_ROLES.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatRevision } from "../lib/format";
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

// Blank contact fields come back from the server as null; inputs need "".
function toFormContacts(contacts) {
  const byRole = Object.fromEntries((contacts || []).map((c) => [c.role, c]));
  return Object.fromEntries(
    CONTACT_FIELDS.map(({ role }) => [
      role,
      Object.fromEntries(Object.keys(EMPTY_CONTACT).map((k) => [k, byRole[role]?.[k] ?? ""])),
    ])
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
  const [removeSsn, setRemoveSsn] = useState(false);

  function load() {
    api.residents.get(residentId).then((r) => {
      setResident(r);
      setForm({
        middleName: r.middleName || "",
        // Deliberately never pre-filled: the server no longer sends the number, only
        // its last four digits. Typing here REPLACES what is stored; leaving it
        // blank leaves it alone.
        socialSecurityNumber: "",
        dnrStatus: r.dnrStatus || "",
        advancedDirectivesType: r.advancedDirectivesType || "",
        medicareNumber: r.medicareNumber || "",
        medicaidNumber: r.medicaidNumber || "",
        supplementaryInsurance: r.supplementaryInsurance || "",
        diagnosis: r.diagnosis || "",
        allergies: r.allergies || "",
        diet: r.diet || "",
        mobility: r.mobility || "",
        fallRisk: r.fallRisk || "",
        cognition: r.cognition || "",
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
      const updated = await api.residents.saveFaceSheet(residentId, {
        ...form,
        ...(removeSsn && !form.socialSecurityNumber.trim() ? { clearSocialSecurityNumber: true } : {}),
        contacts,
      });
      setResident(updated);
      setForm((f) => ({ ...f, socialSecurityNumber: "" }));
      setRemoveSsn(false);
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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-stone-100 px-5 py-3">
        <Button size="sm" variant="secondary" onClick={() => window.open(`/residents/${residentId}/face-sheet`, "_blank", "noopener,noreferrer")}>
          Print / Download Face Sheet
        </Button>
        {/* Mirrors the "Last updated" stamp printed on the sheet itself, so
            staff can tell whether the binder copy is stale without printing
            a new one to compare. */}
        <span className="text-xs text-stone-500">
          {resident?.faceSheetUpdatedAt
            ? `Last updated ${formatRevision(resident.faceSheetUpdatedAt)}`
            : "Not yet saved — printed sheet will show a blank date line"}
        </span>
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
                <label className={labelClass} htmlFor="face-sheet-ssn">Social Security Number</label>
                {resident?.socialSecurityLast4 && !removeSsn && (
                  <p className="mb-1 flex items-center gap-2 text-xs text-stone-500">
                    <span>On file: ***-**-{resident.socialSecurityLast4}</span>
                    <button
                      type="button"
                      onClick={() => { setRemoveSsn(true); setSaved(false); }}
                      className="text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    >
                      Remove
                    </button>
                  </p>
                )}
                {removeSsn && (
                  <p className="mb-1 text-xs text-stone-500">
                    Will be removed when you save.{" "}
                    <button type="button" onClick={() => setRemoveSsn(false)} className="text-brand-600 hover:underline">Undo</button>
                  </p>
                )}
                {/* autoComplete off + a non-"ssn" name: keep the browser from offering to remember it. */}
                <input
                  id="face-sheet-ssn"
                  name="resident-ident-number"
                  autoComplete="off"
                  inputMode="numeric"
                  className={inputClass}
                  value={form.socialSecurityNumber}
                  onChange={(e) => set("socialSecurityNumber", e.target.value)}
                  placeholder={resident?.socialSecurityLast4 && !removeSsn ? "Enter a new number to replace it" : "XXX-XX-XXXX"}
                />
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
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Daily Care</h3>
            <p className="mb-3 text-xs text-stone-500">Shown on the resident's card and quick view, so staff see it at a glance.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="face-sheet-diet" className={labelClass}>Diet</label>
                <input id="face-sheet-diet" className={inputClass} value={form.diet} onChange={(e) => set("diet", e.target.value)} placeholder="e.g. Mechanical soft, diabetic" />
              </div>
              <div>
                <label htmlFor="face-sheet-mobility" className={labelClass}>Mobility</label>
                <input id="face-sheet-mobility" className={inputClass} value={form.mobility} onChange={(e) => set("mobility", e.target.value)} placeholder="e.g. Walker, 1-person assist" />
              </div>
              <div>
                <label htmlFor="face-sheet-fall-risk" className={labelClass}>Fall Risk</label>
                <Select id="face-sheet-fall-risk" className="w-full" value={form.fallRisk} onChange={(e) => set("fallRisk", e.target.value)}>
                  <option value="">Not set</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </Select>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="face-sheet-cognition" className={labelClass}>Cognition &amp; Communication</label>
                <textarea id="face-sheet-cognition" rows={2} className={inputClass} value={form.cognition} onChange={(e) => set("cognition", e.target.value)} placeholder="e.g. Needs cues; speaks Amharic; hard of hearing on the left" />
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
