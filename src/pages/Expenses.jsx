// src/pages/Expenses.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatFriendlyDate, titleCase } from "../lib/format";
import { StatusPill } from "../components/StatusPill";
import { TableSkeleton } from "../components/TableSkeleton";
import { Button } from "../components/Button";
import { ScrollFade } from "../components/ScrollFade";
import { AddExpenseModal } from "../components/AddExpenseModal";

const thisMonth = () => new Date().toISOString().slice(0, 7);

export function Expenses() {
  const [month, setMonth] = useState(thisMonth());
  const [expenses, setExpenses] = useState(null);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [syncError, setSyncError] = useState(null);

  function load() {
    api.expenses.list({ month }).then(setExpenses).catch((err) => setError(err.message));
  }
  useEffect(load, [month]);

  async function handleSync(id) {
    setSyncingId(id);
    setSyncError(null);
    try {
      await api.expenses.sync(id);
      load();
    } catch (err) {
      setSyncError({ id, message: err.message });
    } finally {
      setSyncingId(null);
    }
  }

  const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Expenses</h1>
          <p className="mt-1 text-sm text-stone-500">Capture operating expenses and sync them to QuickBooks — not a replacement for it</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Add Expense
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-2.5">
          <span className="text-sm text-stone-500">Total: </span>
          <span className="text-sm font-semibold text-stone-900">${total.toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn't load expenses: {error}
        </p>
      )}

      {!error && !expenses && <TableSkeleton columns={5} rows={3} />}

      {expenses && expenses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No expenses recorded for this month.
        </div>
      )}

      {expenses && expenses.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <ScrollFade innerClassName="no-scrollbar overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Facility</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Synced</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-stone-50">
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{formatFriendlyDate(e.date)}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-900">{e.vendor || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{e.category}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{e.home?.name || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">
                      {e.paymentMethod ? titleCase(e.paymentMethod) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-medium text-stone-900">
                      ${Number(e.amount).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {e.qboSynced ? (
                        <StatusPill tone="success">Synced</StatusPill>
                      ) : (
                        <div>
                          <Button variant="secondary" size="sm" onClick={() => handleSync(e.id)} disabled={syncingId === e.id}>
                            {syncingId === e.id ? "Syncing…" : "Sync"}
                          </Button>
                          {syncError?.id === e.id && (
                            <p className="mt-1 max-w-xs text-xs text-rose-600">{syncError.message}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      {e.receiptName && (
                        <Button variant="secondary" size="sm" onClick={() => api.expenses.viewReceipt(e.id)}>
                          Receipt
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollFade>
        </div>
      )}

      {showAddModal && (
        <AddExpenseModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
