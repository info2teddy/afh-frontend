// src/components/EmployeeShell.jsx
// Chrome for a caregiver's own login (role: "employee" — their own phone,
// not the shared clock-in tablet; see KioskShell.jsx for that). No sidebar,
// no other pages exist for this login — enforced server-side too, see
// backend/src/middleware/employeeRestrict.js. Just a header identifying the
// business + this caregiver, and a persistent clock in/out control, since
// that's a top-level action rather than something tied to one resident.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, api } from "../lib/api";
import { Button } from "./Button";

function formatClockTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function EmployeeShell({ children }) {
  const navigate = useNavigate();
  const tenant = auth.getTenant();
  const employee = auth.getEmployee();
  const [openShift, setOpenShift] = useState(undefined); // undefined = loading, null = not clocked in
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function loadShift() {
    api.shifts
      .open()
      .then((shifts) => setOpenShift(shifts.find((s) => s.employeeId === employee?.id) || null))
      .catch(() => setOpenShift(null));
  }
  useEffect(loadShift, [employee?.id]);

  async function handleClockIn() {
    setBusy(true);
    setError(null);
    try {
      // Always logs as a "day" shift — a known simplification. Clock.jsx (the
      // shared kiosk) lets the person clocking in pick day/overnight/live_in,
      // since overnight/live_in shifts get a sleep-time-exclusion step at
      // clock-out that changes pay. A caregiver who actually works those
      // should still clock in/out at the shared kiosk for now, not here.
      await api.shifts.clockIn(employee.id, "day", undefined);
      loadShift();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClockOut() {
    setBusy(true);
    setError(null);
    try {
      await api.shifts.clockOut(openShift.id, undefined, {});
      loadShift();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    auth.logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="flex flex-wrap items-center gap-3 border-b border-stone-200 bg-white px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-stone-900">{tenant?.name}</div>
          <div className="text-xs text-stone-500">{employee?.name}</div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          {openShift === undefined ? null : openShift ? (
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs text-stone-500">Since {formatClockTime(openShift.clockIn)}</span>
              <Button size="sm" variant="secondary" onClick={handleClockOut} disabled={busy}>
                {busy ? "…" : "Clock out"}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={handleClockIn} disabled={busy}>
              {busy ? "…" : "Clock in"}
            </Button>
          )}
          <button
            onClick={handleLogout}
            className="rounded p-1.5 text-xs text-stone-400 transition-colors hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2"
          >
            Log out
          </button>
        </div>
      </header>
      {error && <p className="mx-4 mt-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <main className="mx-auto max-w-xl px-4 py-6">{children}</main>
    </div>
  );
}
