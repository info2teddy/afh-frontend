// src/pages/PlacementFamilyReview.jsx
// Public, unauthenticated Family Review page — a family opens this link
// (see PlacementShortlist.jsx's "Generate link") to see the shortlisted
// AFHs CareFit picked for them. Deliberately NOT a permanent public page:
// the token is opaque/unguessable, expires in 30 days, and staff can revoke
// it anytime (see backend's POST/DELETE /placements/inquiries/:id/share).
// Only shows facilities that consented to family sharing, and only
// family-safe fields — no internal notes, no match scores.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import carefitIcon from "../assets/carefit-icon.svg";

const bgStyle = { background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(61,90,128,0.08), transparent), #fafaf9" };

export function PlacementFamilyReview() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.publicIntake.familyReview(token).then(setData).catch((err) => setError(err.message));
  }, [token]);

  return (
    <div className="min-h-screen px-4 py-10" style={bgStyle}>
      <div className="mx-auto w-full max-w-2xl" style={{ animation: "panel-in 300ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div className="mb-8 text-center">
          <img src={carefitIcon} alt="" className="mx-auto mb-4 h-14 w-auto" />
          <div className="mb-1.5 text-lg font-semibold tracking-tight text-stone-900">
            CareFit <span className="text-brand-600">Connect</span>
          </div>
          {data && <p className="text-sm text-stone-500">Homes CareFit has recommended for {data.residentName}</p>}
        </div>

        {error && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-stone-600">{error}</p>
          </div>
        )}

        {!error && !data && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-stone-500">Loading…</p>
          </div>
        )}

        {data && data.facilities.length === 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-stone-500">Nothing to show yet — check back soon, or reach out to CareFit for an update.</p>
          </div>
        )}

        {data && data.facilities.length > 0 && (
          <div className="flex flex-col gap-4">
            {data.facilities.map((f) => (
              <div key={f.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-stone-900">{f.name}</h2>
                {f.address && <p className="mt-0.5 text-sm text-stone-500">{f.address}</p>}

                <dl className="mt-4 flex flex-col gap-2 text-sm">
                  {f.careLevelsAccepted && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">Care levels</dt>
                      <dd className="text-right text-stone-800">{f.careLevelsAccepted}</dd>
                    </div>
                  )}
                  {f.specialtyCare && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">Specialty care</dt>
                      <dd className="text-right text-stone-800">{f.specialtyCare}</dd>
                    </div>
                  )}
                  {f.culturalNotes && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">Language / culture</dt>
                      <dd className="text-right text-stone-800">{f.culturalNotes}</dd>
                    </div>
                  )}
                  {(f.privateRoomPricing || f.sharedRoomPricing) && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">Room pricing</dt>
                      <dd className="text-right text-stone-800">
                        {[f.privateRoomPricing && `Private: ${f.privateRoomPricing}`, f.sharedRoomPricing && `Shared: ${f.sharedRoomPricing}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </dd>
                    </div>
                  )}
                  {(f.contactName || f.contactPhone) && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">Contact</dt>
                      <dd className="text-right text-stone-800">{[f.contactName, f.contactPhone].filter(Boolean).join(" · ")}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-stone-400">Questions? Reach out to your CareFit Connect contact directly.</p>
      </div>
    </div>
  );
}
