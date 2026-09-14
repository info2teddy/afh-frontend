// src/components/PlacementIntroductions.jsx
// Introductions and decisions (spec §14-15). Recording both sides' decision
// as "accept" auto-advances the placement to CONFIRMED; either side
// declining returns it to SHORTLISTED — see PATCH /placements/introductions/:id
// on the backend. History is never overwritten: a placement can go through
// several introductions and each stays visible here.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDateTime, titleCase } from "../lib/format";
import { StatusPill } from "./StatusPill";
import { Button } from "./Button";
import { Select } from "./Select";
import { CardSkeleton } from "./CardSkeleton";

const METHODS = ["phone", "in_person", "video", "tour"];
const OUTCOMES = ["interested", "needs_followup", "declined", "scheduled_visit", "completed"];
const FAMILY_DECISIONS = ["accept", "decline", "need_another_option"];
const PROVIDER_DECISIONS = ["accept", "decline", "need_more_info"];

export function PlacementIntroductions({ placementId, shortlistEntries, onChanged }) {
  const [introductions, setIntroductions] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [facilityId, setFacilityId] = useState("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  function load() {
    api.placements.inquiries.introductions.list(placementId).then(setIntroductions).catch((err) => setError(err.message));
  }
  useEffect(load, [placementId]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!facilityId) return;
    setSaving(true);
    setError(null);
    try {
      await api.placements.inquiries.introductions.create(placementId, { facilityId, method: method || undefined, notes: notes || undefined });
      setShowForm(false);
      setFacilityId("");
      setMethod("");
      setNotes("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(introId, field, value) {
    setBusyId(introId);
    setError(null);
    try {
      await api.placements.inquiries.introductions.update(introId, { [field]: value || null });
      load();
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {!showForm ? (
        <Button size="sm" onClick={() => setShowForm(true)} disabled={!shortlistEntries?.length}>
          + Schedule Introduction
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="mb-4 flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Facility *</label>
              <Select className="w-full" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
                <option value="">Select…</option>
                {shortlistEntries?.map((e) => (
                  <option key={e.facilityId} value={e.facilityId}>{e.facility.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Method</label>
              <Select className="w-full" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="">Not set</option>
                {METHODS.map((m) => (
                  <option key={m} value={m}>{titleCase(m)}</option>
                ))}
              </Select>
            </div>
          </div>
          <textarea
            rows={2}
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="primary" disabled={saving || !facilityId}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      )}

      {!introductions && <CardSkeleton lines={2} />}
      {introductions && introductions.length === 0 && !showForm && (
        <p className="mt-3 text-sm text-stone-500">No introductions yet.</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {introductions?.map((intro) => (
          <div key={intro.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-stone-900">{intro.facility.name}</div>
              <span className="text-xs text-stone-400">
                {intro.method ? titleCase(intro.method) : "Method not set"} · {formatDateTime(intro.createdAt)}
              </span>
            </div>
            {intro.notes && <p className="mt-1 text-sm text-stone-600">{intro.notes}</p>}

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Outcome</label>
                <Select
                  className="w-full text-xs"
                  value={intro.outcome || ""}
                  disabled={busyId === intro.id}
                  onChange={(e) => handleUpdate(intro.id, "outcome", e.target.value)}
                >
                  <option value="">Not set</option>
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>{titleCase(o)}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Family decision</label>
                <Select
                  className="w-full text-xs"
                  value={intro.familyDecision || ""}
                  disabled={busyId === intro.id}
                  onChange={(e) => handleUpdate(intro.id, "familyDecision", e.target.value)}
                >
                  <option value="">Not set</option>
                  {FAMILY_DECISIONS.map((d) => (
                    <option key={d} value={d}>{titleCase(d)}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Provider decision</label>
                <Select
                  className="w-full text-xs"
                  value={intro.providerDecision || ""}
                  disabled={busyId === intro.id}
                  onChange={(e) => handleUpdate(intro.id, "providerDecision", e.target.value)}
                >
                  <option value="">Not set</option>
                  {PROVIDER_DECISIONS.map((d) => (
                    <option key={d} value={d}>{titleCase(d)}</option>
                  ))}
                </Select>
              </div>
            </div>

            {intro.familyDecision === "accept" && intro.providerDecision === "accept" && (
              <div className="mt-3" style={{ animation: "panel-in 220ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
                <StatusPill tone="success">Both accepted — placement confirmed</StatusPill>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
