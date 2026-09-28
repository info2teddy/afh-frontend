// src/pages/EmployeeResidents.jsx
// A caregiver's own landing page — just the residents their login is scoped
// to (GET /residents already filters this server-side for role "employee",
// see backend/src/routes/residents.js). Tap one to log ADL tasks, read the
// care plan, or add a note. Photo cards or a compact list, same toggle as the
// admin Residents page, remembered per browser.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { careLevelShortLabel } from "../lib/format";
import { CardSkeleton } from "../components/CardSkeleton";
import { ResidentPhoto } from "../components/ResidentPhoto";
import { ResidentCard } from "../components/ResidentCard";

const LAYOUT_KEY = "afh_caregiver_residents_layout";

export function EmployeeResidents() {
  const [residents, setResidents] = useState(null);
  const [error, setError] = useState(null);
  const [layout, setLayoutState] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) === "list" ? "list" : "cards";
    } catch {
      return "cards";
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    api.residents.list().then(setResidents).catch((err) => setError(err.message));
  }, []);

  function setLayout(next) {
    setLayoutState(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      // a remembered layout is only a convenience
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-semibold tracking-tight text-stone-900">Your residents</h1>
          <p className="text-sm text-stone-500">Tap a resident to log ADL tasks, read their care plan, or add a note.</p>
        </div>
        {residents && residents.length > 0 && (
          <div role="group" aria-label="Layout" className="inline-flex overflow-hidden rounded-lg border border-stone-300 bg-white">
            {[
              ["cards", "Photo cards"],
              ["list", "List"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={layout === key}
                onClick={() => setLayout(key)}
                className={`px-3 py-2 text-sm ${layout === key ? "bg-brand-50 font-medium text-brand-700" : "text-stone-600 hover:text-stone-900"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!error && !residents && <CardSkeleton lines={3} />}

      {residents && residents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No residents assigned to your home yet — ask a manager.
        </div>
      )}

      {residents && residents.length > 0 && layout === "cards" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-4">
          {residents.map((r) => (
            <ResidentCard key={r.id} resident={r} variant="caregiver" onOpen={() => navigate(`/residents/${r.id}`)} />
          ))}
        </div>
      )}

      {residents && residents.length > 0 && layout === "list" && (
        <div className="flex flex-col gap-2">
          {residents.map((r) => (
            <Link
              key={r.id}
              to={`/residents/${r.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm transition-colors hover:bg-stone-50"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                  <ResidentPhoto resident={r} size="thumb" />
                </span>
                <div>
                  <div className="text-sm font-medium text-stone-900">{r.name}</div>
                  <div className="text-xs text-stone-500">
                    {r.room ? `Room ${r.room} · ` : ""}{careLevelShortLabel(r.careLevel)}
                  </div>
                </div>
              </span>
              <span className="text-stone-300">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
