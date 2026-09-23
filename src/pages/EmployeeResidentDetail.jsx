// src/pages/EmployeeResidentDetail.jsx
// A caregiver's view of one assigned resident: log ADL tasks against the
// same 9 domains the care plan's own ADL table uses (lib/adlDomains.js),
// read (not edit) the latest care plan, and add notes — exactly the three
// things role "employee" is allowed to do here (see
// backend/src/middleware/employeeRestrict.js). Every call below is already
// scoped server-side to this login's assigned homes; a 404 here just means
// "not your resident."
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { ADL_DOMAINS } from "../lib/adlDomains";
import { formatDateTime } from "../lib/format";
import { Button } from "../components/Button";
import { CardSkeleton } from "../components/CardSkeleton";

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function DomainCard({ domain, entries, onLog }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const todays = entries.filter((e) => isToday(e.loggedAt));
  const mostRecentToday = todays[0]; // entries arrive newest-first

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

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-stone-900">{domain}</div>
          <div className="text-xs text-stone-500">
            {mostRecentToday
              ? `Done today at ${formatDateTime(mostRecentToday.loggedAt)}${todays.length > 1 ? ` (+${todays.length - 1} more today)` : ""}`
              : "Not logged yet today"}
          </div>
        </div>
        <Button size="sm" variant={mostRecentToday ? "secondary" : "primary"} onClick={() => setOpen((o) => !o)}>
          {open ? "Cancel" : "Log"}
        </Button>
      </div>
      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (e.g. assisted shower, no issues)"
            rows={2}
            className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <Button size="sm" variant="primary" className="self-end" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
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
    await api.residents.adl.create(id, domain, note);
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

  if (error) return <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!resident) return <CardSkeleton lines={4} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/" className="text-xs text-stone-500 hover:underline">‹ Your residents</Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-stone-900">{resident.name}</h1>
        {resident.room && <p className="text-sm text-stone-500">Room {resident.room}</p>}
      </div>

      <div>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">ADL checklist</h2>
        {!adlEntries ? (
          <CardSkeleton lines={3} />
        ) : (
          <div className="flex flex-col gap-2">
            {ADL_DOMAINS.map((domain) => (
              <DomainCard
                key={domain}
                domain={domain}
                entries={adlEntries.filter((e) => e.domain === domain)}
                onLog={handleLogAdl}
              />
            ))}
          </div>
        )}
        {adlEntries && adlEntries.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="mt-3 text-xs font-medium text-brand-600 hover:underline"
          >
            {showHistory ? "Hide full history" : "Show full history"}
          </button>
        )}
        {showHistory && (
          <div className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {adlEntries.map((e) => (
              <div key={e.id} className="px-4 py-2.5 text-xs">
                <span className="font-medium text-stone-900">{e.domain}</span>
                <span className="text-stone-400"> · {formatDateTime(e.loggedAt)} · {e.loggedBy?.email}</span>
                {e.note && <div className="mt-0.5 text-stone-600">{e.note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

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
                <p className="mb-2 text-xs text-stone-400">Last updated {formatDateTime(carePlan.createdAt)}</p>
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
            className="mb-2 w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
