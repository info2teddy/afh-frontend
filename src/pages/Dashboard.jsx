// src/pages/Dashboard.jsx
// Landing page — a "what needs my attention today" view built entirely from
// real, existing conditions (residents, open shifts, and the /alerts
// endpoint, which itself is just credentials/care-plans/onboarding/
// assessments/shift-approvals queries gathered server-side). No fabricated
// task system: every alert here is something the app can already answer.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, auth } from "../lib/api";
import { CardSkeleton } from "../components/CardSkeleton";

export function Dashboard() {
  const tenant = auth.getTenant();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.residents.list(), api.shifts.open(), api.alerts.list()])
      .then(([residents, openShifts, alertsData]) => {
        const staffOnDuty = new Set(openShifts.map((s) => s.employeeId)).size;

        const credentialAlerts = alertsData.alerts.filter((a) => a.type === "credential_expiring");
        const totalExpiring = credentialAlerts.reduce((sum, a) => sum + a.count, 0);
        const criticalExpiring = credentialAlerts
          .filter((a) => a.tone === "danger")
          .reduce((sum, a) => sum + a.count, 0);
        const compliance = totalExpiring === 0 ? 100 : Math.round(((totalExpiring - criticalExpiring) / totalExpiring) * 100);
        const needsAttention = alertsData.alerts.reduce((sum, a) => sum + a.count, 0);

        setData({
          residentCount: residents.length,
          staffOnDuty,
          needsAttention,
          compliance,
          alerts: alertsData.alerts,
          summary: alertsData.summary,
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const user = auth.getUser();

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-stone-500">{tenant?.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {greeting}{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn't load dashboard data: {error}
        </p>
      )}

      {!error && !data && <CardSkeleton lines={3} />}

      {data && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Residents" value={data.residentCount} />
            <StatCard label="Staff On Duty" value={data.staffOnDuty} />
            <StatCard label="Needs Attention" value={data.needsAttention} tone={data.needsAttention > 0 ? "warning" : undefined} />
            <StatCard label="Compliance" value={`${data.compliance}%`} />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-stone-900">Today's priorities</h2>

            {data.summary && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                <span className="mt-0.5 shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  AI summary
                </span>
                <span>{data.summary}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {data.alerts.map((a, i) => (
                <PriorityRow key={i} tone={a.tone} to={a.link}>
                  {a.message}
                </PriorityRow>
              ))}
              {data.alerts.length === 0 && <PriorityRow tone="success">All caught up — nothing needs attention today</PriorityRow>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className={`text-2xl font-semibold ${tone === "warning" ? "text-amber-600" : "text-stone-900"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-stone-500">{label}</div>
    </div>
  );
}

const DOT = { danger: "bg-rose-500", warning: "bg-amber-500", success: "bg-emerald-500" };

function PriorityRow({ tone, to, children }) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50">
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]}`} />
      <span>{children}</span>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}
