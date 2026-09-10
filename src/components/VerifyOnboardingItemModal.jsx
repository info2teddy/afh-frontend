// src/components/VerifyOnboardingItemModal.jsx
// Upload the actual document for a requiresDocument onboarding item (I.D.,
// CPR/First Aid card, HCA Certificate, etc.), auto-scan it for a name and
// expiration date, then let the manager review/edit before confirming.
// Items tied to a renewable credentialType (see onboarding.js) also create
// a Credential row on confirm, so mirrors AddExpenseModal's upload+scan+
// review pattern.
import { useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export function VerifyOnboardingItemModal({ item, onClose, onVerified }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState(null);
  const [name, setName] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const expirationRequired = !!item.credentialType;

  async function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > 10 * 1024 * 1024) {
      setError("File is too large — 10MB max.");
      return;
    }
    setError(null);
    setFile(selected);
    setScanNote(null);
    if (!selected) return;

    setScanning(true);
    try {
      const extracted = await api.onboarding.extract(item.id, selected);
      setName(extracted.name || "");
      setExpirationDate(extracted.expirationDate || "");
      setScanNote("Fields below were read from the document — review before confirming.");
    } catch (err) {
      setScanNote(`Couldn't auto-read the document (${err.message}) — enter details manually.`);
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Upload the document first.");
      return;
    }
    if (!name.trim()) {
      setError("Confirm the name on the document.");
      return;
    }
    if (expirationRequired && !expirationDate) {
      setError("Confirm the expiration date on the document.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.onboarding.verify(item.id, { name: name.trim(), expirationDate, document: file });
      onVerified(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={item.name} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="verify-document">Document</label>
          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700">
            {scanning ? "Scanning document…" : file ? file.name : "Upload a photo or scan"}
            <input
              id="verify-document"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              disabled={scanning}
              className="hidden"
            />
          </label>
          {scanNote && <p className="mt-1.5 text-xs text-stone-500">{scanNote}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="verify-name">Name on document</label>
          <input
            id="verify-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name as shown"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="verify-expiration">
            Expiration date{expirationRequired ? "" : " (if any)"}
          </label>
          <input
            id="verify-expiration"
            type="date"
            className={inputClass}
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
          {item.credentialType && (
            <p className="mt-1.5 text-xs text-stone-500">
              This also adds a credential to Credentials, tracked for renewal alerts.
            </p>
          )}
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving || scanning}>
            {saving ? "Saving…" : "Confirm & mark verified"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
