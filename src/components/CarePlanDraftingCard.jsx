// src/components/CarePlanDraftingCard.jsx
// Settings card for Tenant.carePlanDraftingEnabled. Drafting sends resident
// details to Anthropic, so it's off for a business until a BAA covers that
// data; turning it on names the business in a confirm (admins switch between
// AFHs, and this is exactly the wrong-business slip to guard against).
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "./Button";
import { StatusPill } from "./StatusPill";
import { useTenantConfirm } from "./TenantConfirm";

export function CarePlanDraftingCard() {
  const [enabled, setEnabled] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { confirm, dialog } = useTenantConfirm();

  useEffect(() => {
    api.carePlans.drafting.get().then((r) => setEnabled(r.enabled)).catch((err) => setError(err.message));
  }, []);

  async function handleToggle() {
    const next = !enabled;
    if (next) {
      const ok = await confirm({
        title: "Turn on care plan drafting?",
        body: "Resident names, dates of birth, care plans and uploaded documents will be sent to Anthropic to draft care plans for",
        facts: [["Only if", "a signed BAA covers this business"]],
        confirmLabel: "Turn on",
      });
      if (!ok) return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await api.carePlans.drafting.set(next);
      setEnabled(r.enabled);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (enabled === null && !error) return null;

  return (
    <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-stone-900">Care plan drafting</div>
          <p className="mt-1 text-sm text-stone-500">
            {enabled
              ? "On — managers can draft care plans. Resident details are sent to Anthropic to do it."
              : "Off — nothing about this business's residents is sent to Anthropic. Turn on only once a BAA is signed."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <StatusPill tone={enabled ? "success" : "neutral"}>{enabled ? "On" : "Off"}</StatusPill>
          {enabled !== null && (
            <Button size="sm" variant="secondary" onClick={handleToggle} disabled={saving}>
              {saving ? "Saving…" : enabled ? "Turn off" : "Turn on"}
            </Button>
          )}
        </div>
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {dialog}
    </div>
  );
}
