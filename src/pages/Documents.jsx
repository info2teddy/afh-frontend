// src/pages/Documents.jsx
// Cross-resident view of uploaded care-plan reference documents — the only
// kind of "document" the app actually has data for today. Aggregates each
// resident's Documents tab into one place, the way Credentials already
// aggregates expiring items across every employee.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatFriendlyDate } from "../lib/format";
import { TableSkeleton } from "../components/TableSkeleton";
import { Button } from "../components/Button";
import { ScrollFade } from "../components/ScrollFade";

export function Documents() {
  const [docs, setDocs] = useState(null);
  const [residents, setResidents] = useState(null);
  const [error, setError] = useState(null);
  const [showFaceSheetList, setShowFaceSheetList] = useState(false);

  useEffect(() => {
    api.residents
      .list()
      .then(async (residents) => {
        setResidents(residents);
        const perResident = await Promise.all(
          residents.map((r) =>
            api.carePlans
              .list(r.id)
              .then((plans) =>
                plans
                  .filter((p) => p.sourceDocumentName)
                  .map((p) => ({ ...p, residentId: r.id, residentName: r.name }))
              )
              .catch(() => [])
          )
        );
        const flat = perResident.flat().sort((a, b) => new Date(b.planDate) - new Date(a.planDate));
        setDocs(flat);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Documents</h1>
        <p className="mt-1 text-sm text-stone-500">
          Reference documents uploaded when generating care plans, across all residents
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn't load documents: {error}
        </p>
      )}

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowFaceSheetList((s) => !s)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div>
            <div className="text-sm font-semibold text-stone-900">Templates</div>
            <p className="mt-0.5 text-xs text-stone-500">Face Sheet — pre-filled per resident, print or save as PDF</p>
          </div>
          <span className="text-sm text-stone-400">{showFaceSheetList ? "Hide" : "Show"}</span>
        </button>

        {showFaceSheetList && (
          <div className="border-t border-stone-100">
            {!residents && <div className="px-5 py-4"><TableSkeleton columns={2} rows={2} /></div>}
            {residents && residents.length === 0 && (
              <p className="px-5 py-4 text-sm text-stone-500">No residents yet.</p>
            )}
            {residents && residents.length > 0 && (
              <div className="divide-y divide-stone-100">
                {residents.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <Link to={`/residents/${r.id}?tab=documents`} className="text-sm font-medium text-stone-900 hover:text-stone-700">
                      {r.name}
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(`/residents/${r.id}/face-sheet`, "_blank", "noopener,noreferrer")}
                    >
                      Print Face Sheet
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!error && !docs && <TableSkeleton columns={3} rows={3} />}

      {docs && docs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No documents yet — files uploaded when generating a care plan (physician's orders, assessments, etc.)
          show up here.
        </div>
      )}

      {docs && docs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <ScrollFade innerClassName="no-scrollbar overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3">Resident</th>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Attached</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {docs.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-stone-50">
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-900">
                      <Link to={`/residents/${d.residentId}?tab=documents`} className="hover:text-stone-900">
                        {d.residentName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{d.sourceDocumentName}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{formatFriendlyDate(d.planDate)}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <Button variant="secondary" size="sm" onClick={() => api.carePlans.openDocument(d.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollFade>
        </div>
      )}
    </div>
  );
}
