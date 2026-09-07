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
  const [error, setError] = useState(null);

  useEffect(() => {
    api.residents
      .list()
      .then(async (residents) => {
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
                      <Link to={`/residents/${d.residentId}?tab=documents`} className="hover:text-brand-700">
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
