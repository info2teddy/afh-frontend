// src/pages/FireDrills.jsx
// One card per home — fire drills are a facility requirement, not a
// per-employee one, so this doesn't follow Credentials' flat cross-employee
// table. Status is computed server-side (GET /homes/fire-drill-status) from
// each home's most recent logged drill; logging/reviewing drills happens in
// LogFireDrillModal, opened per home.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatFriendlyDate } from "../lib/format";
import { StatusPill } from "../components/StatusPill";
import { Button } from "../components/Button";
import { CardSkeleton } from "../components/CardSkeleton";
import { LogFireDrillModal } from "../components/LogFireDrillModal";

const STATUS_LABEL = { ok: "Compliant", due_soon: "Due soon", overdue: "Overdue" };
const STATUS_TONE = { ok: "success", due_soon: "warning", overdue: "danger" };

export function FireDrills() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [openHome, setOpenHome] = useState(null); // { id, name } or null

  function load() {
    api.fireDrills
      .status()
      .then(setStatus)
      .catch((err) => setError(err.message));
  }
  useEffect(load, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Fire Drills</h1>
        <p className="mt-1 text-sm text-stone-500">Each home is due for a drill every 60 days</p>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {!error && !status && <CardSkeleton lines={3} />}

      {status && status.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No homes set up yet — add one in Settings → Facilities first.
        </div>
      )}

      {status && status.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {status.map((s) => (
            <div key={s.homeId} className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold text-stone-900">{s.homeName}</div>
                <StatusPill tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</StatusPill>
              </div>
              <div className="text-xs text-stone-500">
                {s.lastDrilledAt ? (
                  <>Last drilled {formatFriendlyDate(s.lastDrilledAt)}</>
                ) : (
                  "No drill logged yet"
                )}
              </div>
              {s.dueAt && (
                <div className="text-xs text-stone-400">
                  {s.status === "overdue" ? "Was due" : "Due"} {formatFriendlyDate(s.dueAt)}
                </div>
              )}
              <Button size="sm" className="mt-1 self-start" onClick={() => setOpenHome({ id: s.homeId, name: s.homeName })}>
                {s.lastDrilledAt ? "Log / view drills" : "Log first drill"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {openHome && (
        <LogFireDrillModal home={openHome} onClose={() => setOpenHome(null)} onLogged={load} />
      )}
    </div>
  );
}
