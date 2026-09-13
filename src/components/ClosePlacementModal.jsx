// src/components/ClosePlacementModal.jsx
// Closing a placement is the one stage change worth a confirm-and-explain
// step — everything else is just picking a stage from a dropdown. Doesn't
// delete anything; the placement (and its full timeline) stays exactly
// where it is, just marked closed. Reopen it later by picking a different
// stage from the dropdown, same as any other stage change.
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";
import { CLOSURE_REASONS, CLOSURE_REASON_LABELS } from "../lib/placementStages";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export function ClosePlacementModal({ placement, onClose, onClosed }) {
  const [closureReason, setClosureReason] = useState(CLOSURE_REASONS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.placements.inquiries.update(placement.id, { stage: "CLOSED", closureReason, note: note || undefined });
      onClosed(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Close placement for ${placement.residentName}?`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-stone-600">
          This removes it from the active pipeline. Nothing is deleted — the full history stays, and you can reopen it later by changing its stage again.
        </p>
        <div>
          <label className={labelClass} htmlFor="close-reason">Reason *</label>
          <Select id="close-reason" className="w-full" value={closureReason} onChange={(e) => setClosureReason(e.target.value)}>
            {CLOSURE_REASONS.map((r) => (
              <option key={r} value={r}>{CLOSURE_REASON_LABELS[r]}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className={labelClass} htmlFor="close-note">Note</label>
          <textarea id="close-note" rows={2} className={`${inputClass} resize-none`} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Closing…" : "Close Placement"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
