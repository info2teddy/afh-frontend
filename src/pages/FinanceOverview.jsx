// src/pages/FinanceOverview.jsx
// "How is my AFH doing this month" — combines revenue (invoices), payroll,
// and expenses into one snapshot. Deliberately not a full P&L: no accruals,
// no balance sheet. QuickBooks remains the actual accounting system.
import { useEffect, useState } from "react";
import { api, auth } from "../lib/api";
import { CardSkeleton } from "../components/CardSkeleton";
import { StatCard } from "../components/StatCard";

const CATEGORY_ICON = {
  Rent: "🏠",
  "Food & Supplies": "🍎",
  Utilities: "💡",
  "Medical Supplies": "🩺",
  Insurance: "📋",
  Other: "🗂",
};

const thisMonth = () => new Date().toISOString().slice(0, 7);

function monthLabel(monthStr) {
  const [year, mo] = monthStr.split("-").map(Number);
  return new Date(Date.UTC(year, mo - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function FinanceOverview() {
  const tenant = auth.getTenant();
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    api.finance.overview(month).then(setData).catch((err) => setError(err.message));
  }, [month]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Finance Overview</h1>
          <p className="mt-1 text-sm text-stone-500">{tenant?.name} — {monthLabel(month)}</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn't load financial data: {error}
        </p>
      )}

      {!error && !data && <CardSkeleton lines={3} />}

      {data && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Revenue" value={data.revenue} format="currency" />
            <StatCard label="Expenses" value={data.expenses} format="currency" />
            <StatCard label="Payroll" value={data.payroll} format="currency" />
            <StatCard label="Net Income" value={data.netIncome} format="currency" emphasize />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-stone-900">Expenses by Category</h2>
            {data.expensesByCategory.length === 0 ? (
              <p className="text-sm text-stone-500">No expenses recorded for this month.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {data.expensesByCategory.map((c) => (
                  <div key={c.category} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                    <span className="text-stone-700">
                      <span className="mr-2" aria-hidden="true">{CATEGORY_ICON[c.category] || "🗂"}</span>
                      {c.category}
                    </span>
                    <span className="font-medium text-stone-900">${c.amount.toFixed(2)}</span>
                  </div>
                ))}
                {data.payroll > 0 && (
                  <div className="flex items-center justify-between border-t border-stone-100 px-3 py-2 pt-3 text-sm">
                    <span className="text-stone-700">
                      <span className="mr-2" aria-hidden="true">👩‍⚕️</span>
                      Payroll
                    </span>
                    <span className="font-medium text-stone-900">${data.payroll.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
