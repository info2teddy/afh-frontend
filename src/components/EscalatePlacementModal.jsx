// src/components/EscalatePlacementModal.jsx
// Flag a placement for manager attention (spec §24) — bumps urgency and
// creates a high-priority task server-side (see POST .../escalate).
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function EscalatePlacementModal({ placement, onClose, onEscalated }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.placements.inquiries.escalate(placement.id, note.trim());
      onEscalated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Escalate ${placement.residentName}?`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-stone-600">Marks this urgent and creates a high-priority task for manager attention.</p>
        <textarea
          rows={3}
          autoFocus
          placeholder="What's the issue?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving || !note.trim()}>
            {saving ? "Escalating…" : "Escalate"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
