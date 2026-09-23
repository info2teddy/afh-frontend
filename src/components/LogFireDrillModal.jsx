// src/components/LogFireDrillModal.jsx
// Logs one fire drill against a home. Add/list/remove, same shape as
// RateSchedulesModal — a drill is a record of something that happened, not
// something edited in place, so past entries are removed, never rewritten.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";
import { CardSkeleton } from "./CardSkeleton";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const textareaClass = inputClass + " min-h-[4.5rem] resize-y";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

const nowLocalDateTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const emptyForm = {
  drilledAt: nowLocalDateTime(),
  shift: "",
  conductedByName: "",
  staffPresent: "",
  residentsParticipated: "",
  residentsExempted: "",
  exemptionReason: "",
  evacuationSeconds: "",
  issuesNoted: "",
  correctiveAction: "",
};

function evacuationLabel(seconds) {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function LogFireDrillModal({ home, onClose, onLogged }) {
  const [drills, setDrills] = useState(null);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    api.fireDrills.list(home.id).then(setDrills).catch((err) => setError(err.message));
  }
  useEffect(load, [home.id]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleLog(e) {
    e.preventDefault();
    if (!form.drilledAt || !form.conductedByName.trim()) {
      setError("Date/time and who conducted the drill are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const evacuationSeconds = form.evacuationMinutes ? Math.round(Number(form.evacuationMinutes) * 60) : "";
      await api.fireDrills.create(home.id, {
        ...form,
        shift: form.shift || undefined,
        evacuationSeconds: evacuationSeconds || "",
      });
      setShowForm(false);
      setForm(emptyForm);
      load();
      onLogged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(drill) {
    setRemovingId(drill.id);
    setError(null);
    try {
      await api.fireDrills.delete(home.id, drill.id);
      setDrills((prev) => prev.filter((d) => d.id !== drill.id));
      onLogged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Modal title={`Fire drills — ${home.name}`} onClose={onClose}>
      <p className="mb-4 text-sm text-stone-500">
        A log of drills actually conducted at this home. Compliance is tracked from the most recent one — a home is due again 60 days after it.
      </p>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {drills === null && <CardSkeleton lines={2} />}
      {drills && drills.length === 0 && !showForm && (
        <p className="mb-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-500">
          No fire drills logged yet for this home.
        </p>
      )}

      {drills && drills.length > 0 && (
        <div className="mb-4 max-h-64 divide-y divide-stone-100 overflow-y-auto rounded-xl border border-stone-200">
          {drills.map((d) => (
            <div key={d.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-stone-900">
                  {formatDateTime(d.drilledAt)}
                  {d.shift && <span className="ml-1.5 font-normal text-stone-400">· {d.shift} shift</span>}
                </div>
                <div className="text-xs text-stone-500">Conducted by {d.conductedByName}</div>
                <div className="text-xs text-stone-400">
                  {d.residentsParticipated != null && `${d.residentsParticipated} residents participated`}
                  {d.residentsExempted ? ` · ${d.residentsExempted} exempted` : ""}
                  {d.evacuationSeconds != null && ` · evacuated in ${evacuationLabel(d.evacuationSeconds)}`}
                </div>
                {d.issuesNoted && <div className="mt-1 text-xs text-accent-700">Issue: {d.issuesNoted}</div>}
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleDelete(d)} disabled={removingId === d.id}>
                {removingId === d.id ? "Removing…" : "Remove"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <Button size="sm" onClick={() => setShowForm(true)}>+ Log a drill</Button>
      ) : (
        <form onSubmit={handleLog} className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="drill-when">Date & time *</label>
              <input id="drill-when" type="datetime-local" className={inputClass} value={form.drilledAt} onChange={(e) => set("drilledAt", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="drill-shift">Shift</label>
              <Select id="drill-shift" className="w-full" value={form.shift} onChange={(e) => set("shift", e.target.value)}>
                <option value="">Not recorded</option>
                <option value="day">Day</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="drill-by">Conducted by *</label>
              <input id="drill-by" className={inputClass} placeholder="Name" value={form.conductedByName} onChange={(e) => set("conductedByName", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="drill-staff">Staff present</label>
              <input id="drill-staff" className={inputClass} placeholder="Names, comma-separated" value={form.staffPresent} onChange={(e) => set("staffPresent", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="drill-participated">Residents participated</label>
              <input id="drill-participated" type="number" min="0" className={inputClass} value={form.residentsParticipated} onChange={(e) => set("residentsParticipated", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="drill-exempted">Residents exempted</label>
              <input id="drill-exempted" type="number" min="0" className={inputClass} value={form.residentsExempted} onChange={(e) => set("residentsExempted", e.target.value)} />
            </div>
            {Number(form.residentsExempted) > 0 && (
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="drill-exempt-reason">Exemption reason</label>
                <input id="drill-exempt-reason" className={inputClass} placeholder="e.g. bedbound, hospitalized" value={form.exemptionReason} onChange={(e) => set("exemptionReason", e.target.value)} />
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="drill-evac">Evacuation time (minutes)</label>
              <input id="drill-evac" type="number" min="0" step="0.5" className={inputClass} placeholder="3.5" value={form.evacuationMinutes || ""} onChange={(e) => set("evacuationMinutes", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="drill-issues">Issues noted</label>
              <textarea id="drill-issues" className={textareaClass} value={form.issuesNoted} onChange={(e) => set("issuesNoted", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="drill-fix">Corrective action</label>
              <textarea id="drill-fix" className={textareaClass} value={form.correctiveAction} onChange={(e) => set("correctiveAction", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save drill"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
