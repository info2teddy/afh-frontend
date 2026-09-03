// src/pages/Payroll.jsx
import { useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/Button";

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

  const inputClass =
    "rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-stone-900">Payroll</h1>
        <p className="mt-1 text-sm text-stone-500">Calculate and submit a payroll run</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          className={inputClass}
        />
        <span className="text-sm text-stone-400">to</span>
        <input
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          className={inputClass}
        />
        <Button variant="primary" onClick={handleCreateRun} disabled={busy}>
          {busy && !run ? "Calculating…" : "Calculate payroll"}
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {run && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-semibold text-stone-900">
              ${Number(run.totalGrossPay).toFixed(2)}
              <span className="ml-1.5 text-sm font-normal text-stone-500">gross pay</span>
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium capitalize text-stone-600">
              {run.status}
            </span>
          </div>

          <div className="divide-y divide-stone-100 border-t border-stone-100 text-sm">
            {run.lineItems.map((li) => (
              <div key={li.employeeId} className="grid grid-cols-4 items-center gap-2 py-2.5">
                <span className="font-medium text-stone-900">{li.employee.name}</span>
                <span className="text-stone-500">{li.regularHours} reg</span>
                <span className="text-stone-500">{li.overtimeHours} OT</span>
                <span className="text-right font-medium text-stone-900">
                  ${Number(li.grossPay).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {run.status !== "submitted" && (
            <Button variant="primary" className="mt-5" onClick={handleSubmit} disabled={busy}>
              {busy ? "Submitting…" : "Submit to QuickBooks"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
