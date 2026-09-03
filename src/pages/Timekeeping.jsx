// src/pages/Timekeeping.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { Select } from "../components/Select";

// Simple hardcoded picker for now — a real version would list employees and
// let the manager pick one, but this proves the approval flow end to end.
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export function Timekeeping() {
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [week, setWeek] = useState(null);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const weekStart = mondayOf(new Date());

  useEffect(() => {
    api.employees.list().then(setEmployees).catch((err) => setError(err.message));
  }, []);

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
        <h1 className="text-xl font-semibold text-stone-900">This week's hours</h1>
        <p className="mt-1 text-sm text-stone-500">Week of {weekStart}</p>
      </div>

      <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mb-6 w-64">
        <option value="">Select an employee…</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </Select>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {employeeId && !week && (
        <div className="animate-pulse rounded-2xl border border-stone-200 bg-white p-6">
          <div className="h-4 w-1/3 rounded bg-stone-100" />
        </div>
      )}

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
                f.level === "overtime" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
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
