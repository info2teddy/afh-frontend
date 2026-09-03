// src/pages/ResidentList.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { StatusPill } from "../components/StatusPill";

const STATUS_TONE = { active: "success", discharging: "warning", discharged: "neutral" };

export function ResidentList() {
  const [residents, setResidents] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.residents
      .list()
      .then(setResidents)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-stone-900">Residents</h1>
        <p className="mt-1 text-sm text-stone-500">
          {residents ? `${residents.length} resident${residents.length === 1 ? "" : "s"}` : "Loading…"}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn't load residents: {error}
        </p>
      )}

      {!error && !residents && (
        <div className="animate-pulse rounded-2xl border border-stone-200 bg-white p-6">
          <div className="h-4 w-1/3 rounded bg-stone-100" />
        </div>
      )}

      {residents && residents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No residents yet.
        </div>
      )}

      {residents && residents.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Care level</th>
                <th className="px-5 py-3">Payer</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {residents.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/residents/${r.id}`)}
                  className="cursor-pointer transition-colors hover:bg-stone-50"
                >
                  <td className="px-5 py-3.5 font-medium text-stone-900">
                    <Link to={`/residents/${r.id}`} className="hover:text-emerald-700">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-stone-600">{r.careLevel}</td>
                  <td className="px-5 py-3.5 text-stone-600">
                    {r.payerType === "split" ? `${r.medicaidSplitPct}% Medicaid` : r.payerType.replace("_", " ")}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill tone={STATUS_TONE[r.status] || "neutral"}>{r.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
