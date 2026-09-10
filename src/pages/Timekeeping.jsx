// src/pages/Timekeeping.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatFriendlyDate } from "../lib/format";
import { Button } from "../components/Button";
import { StatusPill } from "../components/StatusPill";
import { TableSkeleton } from "../components/TableSkeleton";
import { CardSkeleton } from "../components/CardSkeleton";

// Deliberately avoids a toISOString() round-trip: converting a local Date
// that still carries the current time-of-day to UTC can roll it into the
// next calendar day in the evening (any local time is because past ~5pm
// Pacific is already tomorrow in UTC) — silently turning "Monday" into
// "Tuesday" and dropping Monday's shifts from every query below. Reading
// the local Y/M/D fields straight off the Date avoids that entirely.
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// Mirrors the tone the same evaluateWeeklyHours flags render with on the
// detail card below — danger once actually over 40 hours this week, warning
// from 36 up to 40 (WA law requires 1.5x pay past 40; the warning band is
// the window where a manager can still do something about it).
function overtimeTone(row) {
  if (row.overtimeHours > 0) return "danger";
  if (row.totalPaidHours >= 36) return "warning";
  return null;
}

export function Timekeeping() {
  const [overview, setOverview] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [week, setWeek] = useState(null);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const weekStart = mondayOf(new Date());

  function loadOverview() {
    api.shifts.weekOverview(weekStart).then(setOverview).catch((err) => setError(err.message));
  }
  useEffect(loadOverview, []);

  useEffect(() => {
    if (!employeeId) return;
    setWeek(null);
    api.shifts
      .week(employeeId, weekStart)
      .then(setWeek)
      .catch((err) => setError(err.message));
  }, [employeeId]);

  async function handleApprove() {
    setApproving(true);
    setError(null);
    try {
      await api.shifts.approve(week.shiftIds, "manager"); // placeholder until real auth exists
      setWeek({ ...week, approved: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Timekeeping</h1>
        <p className="mt-1 text-sm text-stone-500">Week of {formatFriendlyDate(weekStart)}</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {!overview && <TableSkeleton columns={3} rows={4} />}

      {overview && overview.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No shifts clocked yet this week.
        </div>
      )}

      {overview && overview.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Hours this week</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {overview.map((row) => {
                const tone = overtimeTone(row);
                const selected = row.employeeId === employeeId;
                return (
                  <tr
                    key={row.employeeId}
                    onClick={() => setEmployeeId(row.employeeId)}
                    className={`cursor-pointer transition-colors ${selected ? "bg-brand-50/60" : "hover:bg-stone-50"}`}
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-900">{row.name}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{row.totalPaidHours} hrs</td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {tone === "danger" && <StatusPill tone="danger">{row.overtimeHours} hrs overtime</StatusPill>}
                      {tone === "warning" && <StatusPill tone="warning">Approaching overtime</StatusPill>}
                      {!tone && <span className="text-stone-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-stone-400">→</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {employeeId && !week && <CardSkeleton lines={3} />}

      {week && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-medium text-stone-900">{week.employee.name}</div>
            <div className="text-2xl font-semibold text-stone-900">
              {week.totalPaidHours} <span className="text-sm font-normal text-stone-500">hrs paid</span>
            </div>
          </div>

          <div className="divide-y divide-stone-100 border-t border-stone-100">
            {week.shiftBreakdown.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-stone-900">{s.date}</span>
                <span className="text-stone-500">{s.shiftType.replace("_", " ")}</span>
                <span className="text-stone-600">{s.workedHours} worked</span>
                <span className="font-medium text-stone-900">{s.paidHours} paid</span>
              </div>
            ))}
          </div>

          {week.flags.map((f, i) => (
            <div
              key={i}
              className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                f.level === "overtime" ? "bg-rose-50 text-rose-700" : "bg-accent-50 text-accent-700"
              }`}
            >
              {f.message}
            </div>
          ))}

          <Button
            variant="primary"
            className="mt-5"
            onClick={handleApprove}
            disabled={approving || week.approved}
          >
            {week.approved ? "Approved" : approving ? "Approving…" : "Approve hours"}
          </Button>
        </div>
      )}
    </div>
  );
}
