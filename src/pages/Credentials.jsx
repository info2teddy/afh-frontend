// src/pages/Credentials.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatusPill } from "../components/StatusPill";
import { TableSkeleton } from "../components/TableSkeleton";

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
}

function toneForDays(days) {
  if (days < 0) return "danger";
  if (days <= 30) return "danger";
  if (days <= 60) return "warning";
  return "success";
}

export function Credentials() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.employees
      .expiringCredentials(90) // show anything expiring within 90 days, plus already-expired
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Credentials</h1>
        <p className="mt-1 text-sm text-stone-500">Expiring within 90 days, or already expired</p>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {!error && !items && <TableSkeleton columns={4} rows={3} />}

      {items && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          Nothing expiring soon.
        </div>
      )}

      {items && items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Credential</th>
                  <th className="px-5 py-3">Expires</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((c) => {
                  const days = daysUntil(c.expirationDate);
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-stone-50">
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-900">{c.employee.name}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{c.credentialType.replaceAll("_", " ")}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">
                        {new Date(c.expirationDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <StatusPill tone={toneForDays(days)}>
                          {days < 0 ? "Expired" : `${days} days`}
                        </StatusPill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
