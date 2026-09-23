// src/pages/EmployeeResidents.jsx
// A caregiver's own landing page — just the residents their login is scoped
// to (GET /residents already filters this server-side for role "employee",
// see backend/src/routes/residents.js). Tap one to log ADL tasks, read the
// care plan, or add a note.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { careLevelShortLabel } from "../lib/format";
import { CardSkeleton } from "../components/CardSkeleton";

export function EmployeeResidents() {
  const [residents, setResidents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.residents.list().then(setResidents).catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-stone-900">Your residents</h1>
      <p className="mb-6 text-sm text-stone-500">Tap a resident to log ADL tasks, read their care plan, or add a note.</p>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!error && !residents && <CardSkeleton lines={3} />}

      {residents && residents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No residents assigned to your home yet — ask a manager.
        </div>
      )}

      {residents && residents.length > 0 && (
        <div className="flex flex-col gap-2">
          {residents.map((r) => (
            <Link
              key={r.id}
              to={`/residents/${r.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm transition-colors hover:bg-stone-50"
            >
              <div>
                <div className="text-sm font-medium text-stone-900">{r.name}</div>
                <div className="text-xs text-stone-500">
                  {r.room ? `Room ${r.room} · ` : ""}{careLevelShortLabel(r.careLevel)}
                </div>
              </div>
              <span className="text-stone-300">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
