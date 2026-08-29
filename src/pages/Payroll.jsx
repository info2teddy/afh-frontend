// src/pages/Payroll.jsx
import { useState } from "react";
import { api } from "../lib/api";

export function Payroll() {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleCreateRun() {
    if (!periodStart || !periodEnd) {
      setError("Enter both a start and end date first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.payroll.createRun({ periodStart, periodEnd });
      setRun(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.payroll.submitRun(run.id);
      setRun({ ...run, status: result.status });
      if (result.warnings?.length) setError(result.warnings.join(" "));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Payroll</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={{ padding: 8, fontSize: 14 }} />
        <span style={{ color: "#73726c" }}>to</span>
        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={{ padding: 8, fontSize: 14 }} />
        <button onClick={handleCreateRun} disabled={busy} style={{ padding: "8px 14px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
          Calculate payroll
        </button>
      </div>

      {error && <p style={{ color: "#791f1f", fontSize: 14 }}>{error}</p>}

      {run && (
        <div style={{ border: "1px solid #e4e2d8", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontWeight: 500 }}>Gross pay: ${Number(run.totalGrossPay).toFixed(2)}</div>
            <div style={{ fontSize: 13, color: "#73726c" }}>{run.status}</div>
          </div>
          {run.lineItems.map((li) => (
            <div key={li.employeeId} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderTop: "1px solid #e4e2d8" }}>
              <span>{li.employee.name}</span>
              <span>{li.regularHours} reg</span>
              <span>{li.overtimeHours} OT</span>
              <span>${Number(li.grossPay).toFixed(2)}</span>
            </div>
          ))}
          {run.status !== "submitted" && (
            <button onClick={handleSubmit} disabled={busy} style={{ marginTop: 16, padding: "8px 14px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
              {busy ? "Submitting…" : "Submit to QuickBooks"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
