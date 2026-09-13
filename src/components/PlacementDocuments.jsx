// src/components/PlacementDocuments.jsx
// Placement documents (spec §23), grouped by category. Small file list, not
// a full document-management system — same "just enough" scope as the rest
// of this app's document handling (Expense receipts, CarePlan source docs).
import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { Button } from "./Button";
import { Select } from "./Select";
import { StatusPill } from "./StatusPill";
import { CardSkeleton } from "./CardSkeleton";
import { formatDateTime } from "../lib/format";

const CATEGORIES = ["family", "provider", "placement", "agreement", "other"];
const CATEGORY_LABELS = { family: "Family", provider: "Provider", placement: "Placement", agreement: "Agreement", other: "Other" };

export function PlacementDocuments({ placementId }) {
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("placement");
  const [required, setRequired] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const fileInputRef = useRef(null);

  function load() {
    api.placements.inquiries.documents.list(placementId).then(setDocuments).catch((err) => setError(err.message));
  }
  useEffect(load, [placementId]);

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await api.placements.inquiries.documents.upload(placementId, { file, category, required });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(docId) {
    setBusyId(docId);
    setError(null);
    try {
      await api.placements.inquiries.documents.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const grouped = CATEGORIES.map((c) => ({ category: c, items: (documents || []).filter((d) => d.category === c) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
        <Select className="text-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </Select>
        <label className="flex items-center gap-1.5 text-xs text-stone-600">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="h-3.5 w-3.5 rounded border-stone-300" />
          Required
        </label>
        <input ref={fileInputRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={handleFileChosen} className="hidden" />
        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "+ Upload document"}
        </Button>
      </div>

      {!documents && <CardSkeleton lines={2} />}
      {documents && documents.length === 0 && <p className="text-sm text-stone-500">No documents yet.</p>}

      <div className="flex flex-col gap-4">
        {grouped.map((g) => (
          <div key={g.category}>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">{CATEGORY_LABELS[g.category]}</h3>
            <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
              {g.items.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="flex-1 truncate text-sm text-stone-800">{d.name}</span>
                  {d.required && <StatusPill tone="warning">Required</StatusPill>}
                  <span className="text-xs text-stone-400">{formatDateTime(d.createdAt)}</span>
                  <Button size="sm" variant="secondary" onClick={() => api.placements.inquiries.documents.view(d.id)}>
                    View
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDelete(d.id)} disabled={busyId === d.id}>
                    {busyId === d.id ? "Removing…" : "Remove"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
