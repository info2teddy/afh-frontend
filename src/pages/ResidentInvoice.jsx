// src/pages/ResidentInvoice.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { StatusPill } from "../components/StatusPill";
import { Button } from "../components/Button";

const STATUS_TONE = { draft: "warning", sent: "success", paid: "success", overdue: "danger" };

function firstAndLastOfMonth(monthStr) {
  // monthStr is "2026-08" from an <input type="month">
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // day 0 of next month = last day of this month
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function ResidentInvoice() {
  const { id } = useParams();
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState(null);
  const [pushing, setPushing] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating] = useState(false);

  function load() {
    api.invoices
      .list(id)
      .then((data) => setInvoices(data.sort((a, b) => new Date(b.billingPeriodStart) - new Date(a.billingPeriodStart))))
      .catch((err) => setError(err.message));
  }

  useEffect(load, [id]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const { start, end } = firstAndLastOfMonth(month);
      await api.invoices.generate({ residentId: id, periodStart: start, periodEnd: end });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePush(invoiceId) {
    setPushing(invoiceId);
    setError(null);
    try {
      await api.invoices.pushToQuickBooks(invoiceId);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPushing(null);
    }
  }

  return (
    <div>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        ← Residents
      </Link>

      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <Button variant="primary" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating…" : "Generate invoice for this month"}
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {!invoices && (
        <div className="animate-pulse rounded-2xl border border-stone-200 bg-white p-6">
          <div className="h-4 w-1/3 rounded bg-stone-100" />
        </div>
      )}

      {invoices && invoices.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No invoices generated yet for this resident.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {invoices?.map((inv) => (
          <div key={inv.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-semibold text-stone-900">
                {new Date(inv.billingPeriodStart).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </div>
              <StatusPill tone={STATUS_TONE[inv.status]}>{inv.status}</StatusPill>
            </div>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {inv.lineItems.map((li) => (
                  <tr key={li.id} className="border-b border-stone-100">
                    <td className="py-2 text-stone-600">{li.description}</td>
                    <td className="py-2 text-right text-stone-900">${Number(li.amount).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3 font-medium text-stone-900">Total</td>
                  <td className="pt-3 text-right font-semibold text-stone-900">
                    ${Number(inv.totalAmount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            {inv.status === "draft" && (
              <Button
                variant="primary"
                className="mt-5"
                onClick={() => handlePush(inv.id)}
                disabled={pushing === inv.id}
              >
                {pushing === inv.id ? "Pushing…" : "Push to QuickBooks"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
