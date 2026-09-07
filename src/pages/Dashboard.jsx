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
import { StatCard } from "../components/StatCard";

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
  const greetingIcon = hour < 12 ? "🌅" : hour < 18 ? "☀️" : "🌙";
  const user = auth.getUser();

  return (
    <div>
      <div
        className="mb-6 rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, rgba(61,90,128,0.08), rgba(224,122,95,0.08))" }}
      >
        <p className="text-sm text-stone-500">{tenant?.name}</p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-stone-900">
          <span aria-hidden="true">{greetingIcon}</span>
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
            <StatCard label="Residents" value={data.residentCount} icon="👤" iconClass="bg-[#2a78d6] text-white" />
            <StatCard label="Staff On Duty" value={data.staffOnDuty} icon="⏱️" iconClass="bg-[#1baf7a] text-white" />
            <StatCard
              label="Needs Attention"
              value={data.needsAttention}
              tone={data.needsAttention > 0 ? "warning" : undefined}
              icon="⚠️"
              iconClass="bg-accent-600 text-white"
            />
            <StatCard label="Compliance" value={data.compliance} suffix="%" icon="🛡️" iconClass="bg-emerald-600 text-white" />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
              <span aria-hidden="true">📋</span> Today's priorities
            </h2>

            {data.summary && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-900">
                <span className="mt-0.5 shrink-0 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                  ✨ AI summary
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

const DOT = { danger: "bg-rose-500", warning: "bg-accent-500", success: "bg-emerald-500" };
const ROW_TINT = { danger: "bg-rose-50/60 hover:bg-rose-50", warning: "bg-accent-50/60 hover:bg-accent-50", success: "bg-emerald-50/60 hover:bg-emerald-50" };

function PriorityRow({ tone, to, children }) {
  const content = (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-stone-700 transition-colors ${ROW_TINT[tone]}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]}`} />
      <span>{children}</span>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}
