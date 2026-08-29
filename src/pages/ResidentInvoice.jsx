// src/pages/ResidentInvoice.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { StatusPill } from "../components/StatusPill";

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
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 24 }}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ padding: 8, fontSize: 14, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{ padding: "8px 14px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
        >
          {generating ? "Generating…" : "Generate invoice for this month"}
        </button>
      </div>

      {error && <p style={{ color: "#791f1f", fontSize: 14, marginBottom: 16 }}>{error}</p>}

      {!invoices && <p style={{ color: "#73726c" }}>Loading invoices…</p>}
      {invoices && invoices.length === 0 && (
        <p style={{ color: "#73726c" }}>No invoices generated yet for this resident.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {invoices?.map((inv) => (
          <div key={inv.id} style={{ border: "1px solid #e4e2d8", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>
                {new Date(inv.billingPeriodStart).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </div>
              <StatusPill tone={STATUS_TONE[inv.status]}>{inv.status}</StatusPill>
            </div>
            <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
              <tbody>
                {inv.lineItems.map((li) => (
                  <tr key={li.id} style={{ borderBottom: "1px solid #e4e2d8" }}>
                    <td style={{ padding: "8px 0", color: "#73726c" }}>{li.description}</td>
                    <td style={{ padding: "8px 0", textAlign: "right" }}>${Number(li.amount).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: "12px 0 0", fontWeight: 500 }}>Total</td>
                  <td style={{ padding: "12px 0 0", textAlign: "right", fontWeight: 500 }}>
                    ${Number(inv.totalAmount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            {inv.status === "draft" && (
              <button
                onClick={() => handlePush(inv.id)}
                disabled={pushing === inv.id}
                style={{ marginTop: 16, padding: "8px 14px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
              >
                {pushing === inv.id ? "Pushing…" : "Push to QuickBooks"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
