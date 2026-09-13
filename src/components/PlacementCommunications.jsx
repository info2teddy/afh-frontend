// src/components/PlacementCommunications.jsx
// A manual log of calls/emails/messages/meetings about a placement (spec
// §22) — NOT a real telephony/email integration (nothing in this app
// places or receives calls/emails), so this is staff writing down what
// happened, same pattern as ResidentNote elsewhere in the app.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDateTime, titleCase } from "../lib/format";
import { Button } from "./Button";
import { Select } from "./Select";
import { CardSkeleton } from "./CardSkeleton";

const METHODS = ["call", "email", "message", "in_person", "other"];

export function PlacementCommunications({ placementId }) {
  const [communications, setCommunications] = useState(null);
  const [error, setError] = useState(null);
  const [method, setMethod] = useState("call");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api.placements.inquiries.communications.list(placementId).then(setCommunications).catch((err) => setError(err.message));
  }
  useEffect(load, [placementId]);

  async function handleAdd() {
    if (!summary.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.placements.inquiries.communications.create(placementId, { method, summary: summary.trim() });
      setSummary("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Select className="text-xs" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>{titleCase(m)}</option>
            ))}
          </Select>
        </div>
        <textarea
          rows={2}
          placeholder="What happened?"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="mb-2 w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <Button size="sm" variant="primary" onClick={handleAdd} disabled={saving || !summary.trim()}>
          {saving ? "Logging…" : "Log it"}
        </Button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!communications && <CardSkeleton lines={2} />}
      {communications && communications.length === 0 && <p className="text-sm text-stone-500">Nothing logged yet.</p>}

      <div className="flex flex-col gap-2">
        {communications?.map((c) => (
          <div key={c.id} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">{titleCase(c.method)}</span>
              <span className="text-xs text-stone-400">
                {c.loggedBy?.email || "Unknown"} · {formatDateTime(c.occurredAt)}
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-700">{c.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
