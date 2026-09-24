// src/pages/EmployeeResidentDetail.jsx
// A caregiver's view of one assigned resident: chart personal-care tasks and
// vitals against the same categories as the real paper "Personal Care
// Record" (lib/personalCareTasks.js), read (not edit) the latest care plan,
// and add notes — exactly what role "employee" is allowed to do here (see
// backend/src/middleware/employeeRestrict.js). Every call is already scoped
// server-side to this login's assigned homes; a 404 here just means "not
// your resident."
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { PERSONAL_CARE_TASKS, QUICK_OPTIONS, SHIFTS, currentShift } from "../lib/personalCareTasks";
import { formatDateTime, formatFriendlyDate } from "../lib/format";
import { Button } from "../components/Button";
import { CardSkeleton } from "../components/CardSkeleton";

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2";
const SHIFT_LABEL = Object.fromEntries(SHIFTS.map((s) => [s.value, s.label]));

function isToday(dateStr) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

// The segmented Day/Evening/Night picker — same visual language as Clock.jsx's
// shift-type control, reused here so the two feel like one app.
function ShiftPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SHIFTS.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          className={`rounded-xl border-[1.5px] px-1.5 py-2 text-[13.5px] font-semibold transition-colors ${FOCUS_RING} ${
            value === s.value ? "border-brand-600 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-600 hover:border-stone-300"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function TaskCard({ domain, shift, entries, onLog }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickingCode, setPickingCode] = useState(null); // which pill is mid-save, for its own spinner state
  const quickOptions = QUICK_OPTIONS[domain];

  // "Done this shift" tracks the paper form's own grain: a checkbox per task,
  // per shift, per day — not just "done today" — so Bath done on Day shift
  // still shows as outstanding once the caregiver switches to Evening.
  const thisShift = entries.filter((e) => isToday(e.loggedAt) && e.shift === shift);
  const latest = thisShift[0]; // entries arrive newest-first

  async function handleSave() {
    setSaving(true);
    try {
      await onLog(domain, note);
      setNote("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  // A pill tap logs immediately — no separate Save step. That's the whole
  // point of quick options: Diet's G/F/P/R/S, Bath's care method, Bowel
  // Movement's L/M/S are exactly what the paper form charts as a single mark,
  // so typing a note for them would be slower than the paper it's replacing.
  async function handlePick(option) {
    setPickingCode(option.code);
    try {
      await onLog(domain, `${option.code} — ${option.label}`);
      setOpen(false);
    } finally {
      setPickingCode(null);
    }
  }

  return (
    <div className={`rounded-xl border px-3.5 py-3 transition-colors ${latest ? "border-emerald-200 bg-emerald-50/40" : "border-stone-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-stone-900">{domain}</div>
          <div className="text-xs text-stone-500">
            {latest ? (
              <span className="text-emerald-700">
                ✓ {latest.note || formatDateTime(latest.loggedAt)}
                {thisShift.length > 1 ? ` (+${thisShift.length - 1} more)` : ""}
              </span>
            ) : (
              "Not yet this shift"
            )}
          </div>
        </div>
        <Button size="sm" variant={latest ? "secondary" : "primary"} onClick={() => setOpen((o) => !o)}>
          {open ? "Cancel" : "Log"}
        </Button>
      </div>
      {open && quickOptions && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-stone-100 pt-3">
          {quickOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => handlePick(option)}
              disabled={pickingCode !== null}
              className={`rounded-lg border-[1.5px] border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50 ${FOCUS_RING.replace("ring-offset-2", "")}`}
            >
              {pickingCode === option.code ? "…" : option.label}
            </button>
          ))}
        </div>
      )}
      {open && !quickOptions && (
        <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional detail (e.g. shower, assisted)"
            rows={2}
            className={`w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm ${FOCUS_RING.replace("ring-offset-2", "")} focus:border-brand-500`}
          />
          <Button size="sm" variant="primary" className="self-end" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

const vitalsInputClass = `w-full rounded-lg border border-stone-300 px-3 py-2 text-sm tabular-nums ${FOCUS_RING.replace("ring-offset-2", "")} focus:border-brand-500`;
const vitalsLabelClass = "mb-1 block text-xs font-medium text-stone-600";

function VitalsSection({ residentId, shift }) {
  const [entries, setEntries] = useState(null);
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const emptyForm = { temperature: "", temperatureRoute: "", pulse: "", respirations: "", bloodPressure: "", weight: "", intake: "", output: "", rom: "", notes: "" };
  const [form, setForm] = useState(emptyForm);

  function load() {
    api.residents.vitals.list(residentId).then(setEntries).catch((err) => setError(err.message));
  }
  useEffect(load, [residentId]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await api.residents.vitals.create(residentId, { ...form, shift });
      setForm(emptyForm);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const latest = entries?.[0];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-stone-500">Vitals</h2>
        <Button size="sm" variant={open ? "secondary" : "primary"} onClick={() => setOpen((o) => !o)}>
          {open ? "Cancel" : "+ Log vitals"}
        </Button>
      </div>

      {error && <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

      {!open && (
        <div className="rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-xs text-stone-500">
          {entries === null ? "Loading…" : latest ? `Last logged ${formatDateTime(latest.loggedAt)}` : "Nothing logged yet — most residents only need this occasionally."}
        </div>
      )}

      {open && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={vitalsLabelClass} htmlFor="v-temp">Temperature (°F)</label>
              <input id="v-temp" type="number" step="0.1" inputMode="decimal" className={vitalsInputClass} value={form.temperature} onChange={(e) => set("temperature", e.target.value)} />
            </div>
            <div>
              <label className={vitalsLabelClass} htmlFor="v-temp-route">Route</label>
              <select id="v-temp-route" className={vitalsInputClass} value={form.temperatureRoute} onChange={(e) => set("temperatureRoute", e.target.value)}>
                <option value="">—</option>
                <option value="oral">Oral</option>
                <option value="rectal">Rectal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={vitalsLabelClass} htmlFor="v-pulse">Pulse</label>
              <input id="v-pulse" type="number" inputMode="numeric" className={vitalsInputClass} value={form.pulse} onChange={(e) => set("pulse", e.target.value)} />
            </div>
            <div>
              <label className={vitalsLabelClass} htmlFor="v-resp">Respirations</label>
              <input id="v-resp" type="number" inputMode="numeric" className={vitalsInputClass} value={form.respirations} onChange={(e) => set("respirations", e.target.value)} />
            </div>
            <div>
              <label className={vitalsLabelClass} htmlFor="v-bp">Blood pressure</label>
              <input id="v-bp" placeholder="120/80" className={vitalsInputClass} value={form.bloodPressure} onChange={(e) => set("bloodPressure", e.target.value)} />
            </div>
            <div>
              <label className={vitalsLabelClass} htmlFor="v-weight">Weight (lb)</label>
              <input id="v-weight" type="number" step="0.1" inputMode="decimal" className={vitalsInputClass} value={form.weight} onChange={(e) => set("weight", e.target.value)} />
            </div>
            <div>
              <label className={vitalsLabelClass} htmlFor="v-intake">Intake</label>
              <input id="v-intake" className={vitalsInputClass} value={form.intake} onChange={(e) => set("intake", e.target.value)} />
            </div>
            <div>
              <label className={vitalsLabelClass} htmlFor="v-output">Output</label>
              <input id="v-output" className={vitalsInputClass} value={form.output} onChange={(e) => set("output", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={vitalsLabelClass} htmlFor="v-rom">ROM (range of motion)</label>
              <input id="v-rom" className={vitalsInputClass} value={form.rom} onChange={(e) => set("rom", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={vitalsLabelClass} htmlFor="v-notes">Notes</label>
              <textarea id="v-notes" rows={2} className={`${vitalsInputClass} resize-none`} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-stone-400">Logging for {SHIFT_LABEL[shift]} shift</span>
            <Button size="sm" variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save vitals"}
            </Button>
          </div>
        </div>
      )}

      {entries && entries.length > 0 && (
        <button type="button" onClick={() => setShowHistory((s) => !s)} className="mt-2 text-xs font-medium text-brand-600 hover:underline">
          {showHistory ? "Hide history" : `Show history (${entries.length})`}
        </button>
      )}
      {showHistory && (
        <div className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
          {entries.map((e) => (
            <div key={e.id} className="px-3.5 py-2.5 text-xs">
              <span className="font-medium text-stone-900">{formatDateTime(e.loggedAt)}</span>
              <span className="text-stone-400"> {e.shift ? `· ${SHIFT_LABEL[e.shift]}` : ""} · {e.loggedBy?.email}</span>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-stone-600 tabular-nums">
                {e.temperature != null && <span>Temp {e.temperature}°F{e.temperatureRoute ? ` (${e.temperatureRoute})` : ""}</span>}
                {e.pulse != null && <span>Pulse {e.pulse}</span>}
                {e.respirations != null && <span>Resp {e.respirations}</span>}
                {e.bloodPressure && <span>BP {e.bloodPressure}</span>}
                {e.weight != null && <span>Weight {e.weight} lb</span>}
                {e.intake && <span>Intake {e.intake}</span>}
                {e.output && <span>Output {e.output}</span>}
                {e.rom && <span>ROM {e.rom}</span>}
              </div>
              {e.notes && <div className="mt-0.5 text-stone-600">{e.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmployeeResidentDetail() {
  const { id } = useParams();
  const [resident, setResident] = useState(null);
  const [adlEntries, setAdlEntries] = useState(null);
  const [carePlan, setCarePlan] = useState(null);
  const [notes, setNotes] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCarePlan, setShowCarePlan] = useState(false);
  const [error, setError] = useState(null);
  const [shift, setShift] = useState(currentShift);

  function loadAdl() {
    api.residents.adl.list(id).then(setAdlEntries).catch((err) => setError(err.message));
  }
  function loadNotes() {
    api.residents.notes.list(id).then(setNotes).catch((err) => setError(err.message));
  }

  useEffect(() => {
    api.residents.get(id).then(setResident).catch((err) => setError(err.message));
    loadAdl();
    loadNotes();
    api.carePlans
      .list(id)
      .then((plans) => setCarePlan(plans[0] || null))
      .catch(() => {}); // a resident with no plan yet is a normal state, not an error to surface
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleLogAdl(domain, note) {
    await api.residents.adl.create(id, { domain, shift, note });
    loadAdl();
  }

  async function handleAddNote() {
    if (!noteDraft.trim()) return;
    setSavingNote(true);
    try {
      await api.residents.notes.create(id, noteDraft);
      setNoteDraft("");
      loadNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingNote(false);
    }
  }

  const doneThisShiftCount = useMemo(() => {
    if (!adlEntries) return 0;
    const domains = new Set(adlEntries.filter((e) => isToday(e.loggedAt) && e.shift === shift).map((e) => e.domain));
    return domains.size;
  }, [adlEntries, shift]);

  if (error) return <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!resident) return <CardSkeleton lines={4} />;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <Link to="/" className="text-xs text-stone-500 hover:underline">‹ Your residents</Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-stone-900">{resident.name}</h1>
        {resident.room && <p className="text-sm text-stone-500">Room {resident.room}</p>}
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-stone-500">Personal care record</h2>
          {adlEntries && (
            <span className="text-xs text-stone-400 tabular-nums">{doneThisShiftCount}/{PERSONAL_CARE_TASKS.length} this shift</span>
          )}
        </div>
        <div className="mb-3">
          <ShiftPicker value={shift} onChange={setShift} />
        </div>
        {!adlEntries ? (
          <CardSkeleton lines={3} />
        ) : (
          <div className="flex flex-col gap-2">
            {PERSONAL_CARE_TASKS.map((domain) => (
              <TaskCard
                key={domain}
                domain={domain}
                shift={shift}
                entries={adlEntries.filter((e) => e.domain === domain)}
                onLog={handleLogAdl}
              />
            ))}
          </div>
        )}
        {adlEntries && adlEntries.length > 0 && (
          <button type="button" onClick={() => setShowHistory((s) => !s)} className="mt-3 text-xs font-medium text-brand-600 hover:underline">
            {showHistory ? "Hide full history" : "Show full history"}
          </button>
        )}
        {showHistory && (
          <div className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {adlEntries.map((e) => (
              <div key={e.id} className="px-4 py-2.5 text-xs">
                <span className="font-medium text-stone-900">{e.domain}</span>
                <span className="text-stone-400"> · {formatDateTime(e.loggedAt)}{e.shift ? ` · ${SHIFT_LABEL[e.shift]}` : ""} · {e.loggedBy?.email}</span>
                {e.note && <div className="mt-0.5 text-stone-600">{e.note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <VitalsSection residentId={id} shift={shift} />

      <div>
        <button
          type="button"
          onClick={() => setShowCarePlan((s) => !s)}
          className="mb-2 flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-stone-500"
        >
          Care plan (read-only)
          <span>{showCarePlan ? "▾" : "▸"}</span>
        </button>
        {showCarePlan && (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            {carePlan ? (
              <>
                <p className="mb-2 text-xs text-stone-400">Last updated {formatFriendlyDate(carePlan.planDate)}</p>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{carePlan.content}</div>
              </>
            ) : (
              <p className="text-sm text-stone-500">No care plan on file yet.</p>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Notes</h2>
        <div className="mb-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note about this resident…"
            rows={2}
            className={`mb-2 w-full resize-none rounded-lg border border-stone-300 px-3 py-2.5 text-sm ${FOCUS_RING.replace("ring-offset-2", "")} focus:border-brand-500`}
          />
          <Button size="sm" variant="primary" onClick={handleAddNote} disabled={savingNote || !noteDraft.trim()}>
            {savingNote ? "Adding…" : "Add note"}
          </Button>
        </div>
        {notes === null ? (
          <CardSkeleton lines={2} />
        ) : notes.length === 0 ? (
          <p className="text-sm text-stone-500">No notes yet.</p>
        ) : (
          <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {notes.map((n) => (
              <div key={n.id} className="px-4 py-3 text-sm">
                <p className="text-stone-700">{n.content}</p>
                <p className="mt-1 text-xs text-stone-400">{n.author?.email} · {formatDateTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
