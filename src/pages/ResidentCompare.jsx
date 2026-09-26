// src/pages/ResidentCompare.jsx
// Two or three residents side by side (/residents/compare?ids=a,b,c), picked
// from the Residents page. Rows where they differ are marked, which is what
// makes it useful for room moves, staffing a shift or a placement decision.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { careLevelShortLabel, payerLabel, formatFriendlyDate } from "../lib/format";
import { residentAge, FALL_RISK_LABELS } from "../lib/residentFacts";
import { ResidentPhoto } from "../components/ResidentPhoto";
import { CardSkeleton } from "../components/CardSkeleton";

const contactName = (r, role) => r.contacts?.find((c) => c.role === role)?.name || null;

const ROWS = [
  ["Basics"],
  ["Home · room", (r) => [r.home?.name, r.room && `Room ${r.room}`].filter(Boolean).join(" · ")],
  ["Age", (r) => residentAge(r.dateOfBirth)],
  ["Care level", (r) => careLevelShortLabel(r.careLevel)],
  ["Moved in", (r) => formatFriendlyDate(r.moveInDate)],
  ["Health & safety"],
  ["Code status", (r) => (r.dnrStatus === "yes" ? "DNR" : r.dnrStatus === "no" ? "Full code" : null)],
  ["Allergies", (r) => r.allergies],
  ["Diagnosis", (r) => r.diagnosis],
  ["Diet", (r) => r.diet],
  ["Mobility", (r) => r.mobility],
  ["Fall risk", (r) => (r.fallRisk ? FALL_RISK_LABELS[r.fallRisk] : null)],
  ["Cognition & communication", (r) => r.cognition],
  ["Care team"],
  ["Primary doctor", (r) => contactName(r, "primary_care_doctor")],
  ["Pharmacy", (r) => contactName(r, "pharmacy")],
  ["Billing"],
  ["Payer", (r) => payerLabel(r)],
  ["Next assessment", (r) => (r.nextAssessmentDate ? formatFriendlyDate(r.nextAssessmentDate) : null)],
];

export function ResidentCompare() {
  const [params] = useSearchParams();
  const ids = (params.get("ids") || "").split(",").filter(Boolean).slice(0, 3);
  const [residents, setResidents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all(ids.map((id) => api.residents.get(id)))
      .then(setResidents)
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("ids")]);

  return (
    <div>
      <Link to="/residents" className="mb-4 inline-block text-sm text-stone-500 hover:text-stone-800">
        ← Residents
      </Link>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Compare residents</h1>
        <p className="mt-1 text-sm text-stone-500">Rows marked ≠ are where they differ.</p>
      </div>

      {ids.length < 2 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          Pick two or three residents on the Residents page to compare them.
        </p>
      )}
      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {ids.length >= 2 && !residents && !error && <CardSkeleton lines={6} />}

      {residents && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr>
                <th className="w-40 px-4 py-4" />
                {residents.map((r) => (
                  <th key={r.id} className="px-4 py-4 align-bottom font-normal">
                    <Link to={`/residents/${r.id}`} className="grid justify-items-start gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none">
                      <span className="h-[72px] w-[72px] overflow-hidden rounded-2xl">
                        <ResidentPhoto resident={r} size="thumb" />
                      </span>
                      <span>
                        <span className="block font-display text-[17px] font-medium text-stone-900">{r.name}</span>
                        <span className="block text-xs text-stone-500">{r.room ? `Room ${r.room}` : r.home?.name}</span>
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, fn]) => {
                if (!fn) {
                  return (
                    <tr key={label} className="bg-stone-50">
                      <th colSpan={residents.length + 1} className="border-t border-stone-100 px-4 py-2 text-[11.5px] font-semibold tracking-[0.06em] text-stone-700 uppercase">
                        {label}
                      </th>
                    </tr>
                  );
                }
                const values = residents.map((r) => fn(r) ?? null);
                const differ = new Set(values.map((v) => String(v ?? ""))).size > 1;
                return (
                  <tr key={label} className={differ ? "bg-amber-50/40" : ""}>
                    <th scope="row" className="border-t border-stone-100 px-4 py-2.5 align-top text-[12.5px] font-medium text-stone-500">
                      {label}
                      {differ && <span className="ml-1 text-accent-700" title="Differs">≠</span>}
                    </th>
                    {values.map((v, i) => (
                      <td key={residents[i].id} className={`border-t border-stone-100 px-4 py-2.5 align-top ${label === "Code status" && v === "DNR" ? "font-medium text-rose-700" : "text-stone-800"}`}>
                        {v ?? <span className="text-stone-400">—</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
