// src/components/PlacementShortlist.jsx
// The ranked shortlist (spec §12) plus the Family Review share link (§13) —
// grouped together since sharing IS what the shortlist is for. The link is
// a controlled, opaque, unguessable token that expires and can be revoked
// anytime — not a permanent public page (see backend's POST/DELETE
// .../share and routes/publicIntake.js's GET /placement-review/:token).
import { useState } from "react";
import { api } from "../lib/api";
import { Button } from "./Button";
import { CardSkeleton } from "./CardSkeleton";
import { formatDateTime } from "../lib/format";

// `entries`/`onChanged` are owned by the parent (PlacementDetail) rather
// than fetched here, since PlacementMatches also mutates the shortlist
// (Shortlist button) and both need to see the same up-to-date list.
export function PlacementShortlist({ placement, entries, onChanged }) {
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareInfo, setShareInfo] = useState(null); // { url, expiresAt } — only known right after generating
  const [copied, setCopied] = useState(false);

  async function handleRemove(facilityId) {
    setBusyId(facilityId);
    setError(null);
    try {
      await api.placements.inquiries.shortlist.remove(placement.id, facilityId);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReorder(index, direction) {
    const order = entries.map((e) => e.facilityId);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= order.length) return;
    [order[index], order[swapWith]] = [order[swapWith], order[index]];
    setError(null);
    try {
      await api.placements.inquiries.shortlist.reorder(placement.id, order);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGenerateLink() {
    setShareBusy(true);
    setError(null);
    try {
      const { shareToken, shareTokenExpiresAt } = await api.placements.inquiries.share.generate(placement.id);
      setShareInfo({ url: `${window.location.origin}/family-review/${shareToken}`, expiresAt: shareTokenExpiresAt });
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setShareBusy(false);
    }
  }

  async function handleRevoke() {
    setShareBusy(true);
    setError(null);
    try {
      await api.placements.inquiries.share.revoke(placement.id);
      setShareInfo(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setShareBusy(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareInfo.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const hasActiveLink = placement.shareToken && placement.shareTokenExpiresAt && new Date(placement.shareTokenExpiresAt) > new Date();

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!entries && <CardSkeleton lines={2} />}
      {entries && entries.length === 0 && <p className="mb-4 text-sm text-stone-500">No facilities shortlisted yet — add some from the matches above.</p>}
      {entries && entries.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {entries.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
              <span className="w-5 text-sm font-medium text-stone-400">{i + 1}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-stone-900">{entry.facility.name}</div>
                {!entry.facility.okToShareWithFamilies && (
                  <div className="text-xs text-accent-700">Hasn't consented to family sharing — hidden from the family link</div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleReorder(i, -1)}
                  disabled={i === 0}
                  className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(i, 1)}
                  disabled={i === entries.length - 1}
                  className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleRemove(entry.facilityId)} disabled={busyId === entry.facilityId}>
                {busyId === entry.facilityId ? "Removing…" : "Remove"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div className="text-sm font-medium text-stone-900">Family Review link</div>
        <p className="mt-0.5 text-xs text-stone-500">
          A private link showing only shortlisted facilities that have consented to family sharing. Expires in 30 days; revoke it anytime.
        </p>
        {hasActiveLink && !shareInfo && (
          <p className="mt-2 text-xs text-stone-600">
            A link is active, expiring {formatDateTime(placement.shareTokenExpiresAt)}. Generate a new one to replace it, or revoke it below.
          </p>
        )}
        {shareInfo && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
            <input readOnly value={shareInfo.url} className="flex-1 truncate bg-transparent text-xs text-stone-700 focus:outline-none" />
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleGenerateLink} disabled={shareBusy || !entries?.length}>
            {shareBusy ? "Working…" : hasActiveLink ? "Regenerate link" : "Generate link"}
          </Button>
          {hasActiveLink && (
            <Button size="sm" variant="secondary" onClick={handleRevoke} disabled={shareBusy}>
              Revoke
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
