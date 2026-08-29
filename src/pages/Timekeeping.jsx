// src/pages/Timekeeping.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";

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
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>This week's hours</h1>

      <select
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        style={{ padding: 8, fontSize: 14, marginBottom: 20, borderRadius: 6, border: "1px solid #ccc" }}
      >
        <option value="">Select an employee…</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {error && <p style={{ color: "#791f1f" }}>{error}</p>}

      {week && (
        <div style={{ border: "1px solid #e4e2d8", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontWeight: 500 }}>{week.employee.name}</div>
            <div style={{ fontSize: 20, fontWeight: 500 }}>
              {week.totalPaidHours} <span style={{ fontSize: 13, fontWeight: 400, color: "#73726c" }}>hrs paid</span>
            </div>
          </div>

          {week.shiftBreakdown.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderTop: "1px solid #e4e2d8" }}>
              <span>{s.date}</span>
              <span style={{ color: "#73726c" }}>{s.shiftType.replace("_", " ")}</span>
              <span>{s.workedHours} worked</span>
              <span>{s.paidHours} paid</span>
            </div>
          ))}

          {week.flags.map((f, i) => (
            <div
              key={i}
              style={{
                marginTop: 10,
                padding: "8px 12px",
                fontSize: 13,
                borderRadius: 6,
                background: f.level === "overtime" ? "#fcebeb" : "#faeeda",
                color: f.level === "overtime" ? "#791f1f" : "#633806",
              }}
            >
              {f.message}
            </div>
          ))}

          <button
            onClick={handleApprove}
            disabled={approving || week.approved}
            style={{ marginTop: 16, padding: "8px 14px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
          >
            {week.approved ? "Approved" : approving ? "Approving…" : "Approve hours"}
          </button>
        </div>
      )}
    </div>
  );
}
