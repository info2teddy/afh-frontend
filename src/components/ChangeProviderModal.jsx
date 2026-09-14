// src/components/ChangeProviderModal.jsx
// Swap which facility a placement is heading to (spec §24), only before
// it's actually finalized — see the guard in POST .../change-provider.
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";

export function ChangeProviderModal({ placement, facilities, onClose, onChanged }) {
  const [facilityId, setFacilityId] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!facilityId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.placements.inquiries.changeProvider(placement.id, facilityId);
      onChanged(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Change provider for ${placement.residentName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="change-provider-facility">New facility *</label>
          <Select id="change-provider-facility" className="w-full" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
            <option value="">Select a facility…</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
                {f.id === placement.placedFacilityId ? " (current)" : ""}
              </option>
            ))}
          </Select>
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving || !facilityId}>
            {saving ? "Saving…" : "Change provider"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
