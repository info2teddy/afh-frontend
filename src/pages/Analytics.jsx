// src/pages/Analytics.jsx
// Cross-facility trends built from this tenant's own real records — the same
// invoices/payroll/expenses finance.js aggregates for one month, extended
// across a trailing window, plus a current occupancy/census snapshot.
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { CardSkeleton } from "../components/CardSkeleton";
import { Select } from "../components/Select";
import { StatCard } from "../components/StatCard";
import { StatStrip } from "../components/StatStrip";
import { TrendChart } from "../components/TrendChart";
import { careLevelShortLabel } from "../lib/format";

const PAYER_TYPE_LABELS = { private_pay: "Private Pay", medicaid: "Medicaid", split: "Split (Medicaid + Private)" };

const RANGE_OPTIONS = [
  { value: 3, label: "Last 3 months" },
  { value: 6, label: "Last 6 months" },
  { value: 12, label: "Last 12 months" },
];

export function Analytics() {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    api.analytics.overview(months).then(setData).catch((err) => setError(err.message));
  }, [months]);

  const totals = useMemo(() => {
    if (!data) return null;
    const revenue = data.trend.reduce((sum, m) => sum + m.revenue, 0);
    const netIncome = data.trend.reduce((sum, m) => sum + m.netIncome, 0);
    const totalCapacity = data.occupancy.reduce((sum, h) => sum + h.capacity, 0);
    const totalOccupied = data.occupancy.reduce((sum, h) => sum + h.occupied, 0);
    const activeResidents = data.census.byCareLevel.reduce((sum, r) => sum + r.count, 0);
    return {
      revenue,
      netIncome,
      occupancyPct: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : null,
      activeResidents,
    };
  }, [data]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Analytics</h1>
          <p className="mt-1 text-sm text-stone-500">Trends across all facilities, built from your own records</p>
        </div>
        <Select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">Couldn't load analytics: {error}</p>
      )}

      {!error && !data && <CardSkeleton lines={4} />}

      {data && (
        <>
          <StatStrip>
            <StatCard label="Net income (range)" value={totals.netIncome} format="currency" emphasize icon="finance" />
            <StatCard label="Revenue (range)" value={totals.revenue} format="currency" icon="finance" />
            <StatCard
              label="Occupancy"
              value={totals.occupancyPct === null ? "—" : totals.occupancyPct}
              suffix={totals.occupancyPct === null ? "" : "%"}
              icon="home"
            />
            <StatCard label="Active residents" value={totals.activeResidents} icon="resident" />
          </StatStrip>

          <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-stone-900">Revenue, expenses & payroll</h2>
            <TrendChart data={data.trend} />

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-medium uppercase tracking-wide text-stone-500">
                    <th className="py-2 pr-4">Month</th>
                    <th className="px-4 py-2 text-right">Revenue</th>
                    <th className="px-4 py-2 text-right">Expenses</th>
                    <th className="px-4 py-2 text-right">Payroll</th>
                    <th className="py-2 pl-4 text-right">Net income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.trend.map((m) => (
                    <tr key={m.month}>
                      <td className="py-2.5 pr-4 text-stone-600">{m.label}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${m.revenue === 0 ? "text-stone-400" : "text-stone-900"}`}>
                        ${m.revenue.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${m.expenses === 0 ? "text-stone-400" : "text-stone-900"}`}>
                        ${m.expenses.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${m.payroll === 0 ? "text-stone-400" : "text-stone-900"}`}>
                        ${m.payroll.toFixed(2)}
                      </td>
                      <td
                        className={`py-2.5 pl-4 text-right tabular-nums font-medium ${
                          m.netIncome === 0 ? "text-stone-400" : m.netIncome < 0 ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {m.netIncome < 0 ? "-" : ""}${Math.abs(m.netIncome).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-stone-900">Occupancy</h2>
            {data.occupancy.length === 0 ? (
              <p className="text-sm text-stone-500">No facilities set up yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {data.occupancy.map((h) => (
                  <div key={h.homeId}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-stone-700">{h.homeName}</span>
                      <span className="tabular-nums text-stone-500">
                        <span className="font-medium text-stone-900">{h.occupied} / {h.capacity}</span> residents · {h.occupancyPct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${Math.min(100, h.occupancyPct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <CensusCard
              title="Residents by care level"
              rows={data.census.byCareLevel}
              field="careLevel"
              formatLabel={careLevelShortLabel}
            />
            <CensusCard
              title="Residents by payer type"
              rows={data.census.byPayerType}
              field="payerType"
              formatLabel={(v) => PAYER_TYPE_LABELS[v] || v}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CensusCard({ title, rows, field, formatLabel }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-stone-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">No active residents yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r[field]} className="flex items-center justify-between rounded-lg bg-stone-50/60 px-3 py-2 text-sm">
              <span className="text-stone-700">{formatLabel(r[field])}</span>
              <span className="font-medium tabular-nums text-stone-900">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
