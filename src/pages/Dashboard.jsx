// src/pages/Dashboard.jsx
// Landing page — a "what needs my attention today" view built entirely from
// real, existing endpoints (residents, open shifts, expiring credentials,
// today's care plans). No fabricated task system: every number here is
// something the app can already answer, just not previously surfaced together.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, auth } from "../lib/api";
import { daysUntil } from "../lib/format";
import { CardSkeleton } from "../components/CardSkeleton";

const todayUTC = () => new Date().toISOString().slice(0, 10);

export function Dashboard() {
  const tenant = auth.getTenant();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.residents.list(),
      api.shifts.open(),
      api.employees.expiringCredentials(90),
    ])
      .then(async ([residents, openShifts, expiring]) => {
        const carePlanChecks = await Promise.all(
          residents.map((r) =>
            api.carePlans
              .list(r.id)
              .then((plans) => plans.some((p) => p.planDate.slice(0, 10) === todayUTC()))
              .catch(() => true) // don't flag a resident just because the lookup failed
          )
        );
        const residentsNeedingPlan = residents.filter((_, i) => !carePlanChecks[i]);
        const criticalCredentials = expiring.filter((c) => daysUntil(c.expirationDate) <= 30);
        const staffOnDuty = new Set(openShifts.map((s) => s.employeeId)).size;
        const compliance =
          expiring.length === 0 ? 100 : Math.round(((expiring.length - criticalCredentials.length) / expiring.length) * 100);

        setData({
          residentCount: residents.length,
          staffOnDuty,
          criticalCredentials,
          residentsNeedingPlan,
          compliance,
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
            <StatCard
              label="Needs Attention"
              value={data.criticalCredentials.length + data.residentsNeedingPlan.length}
              tone={data.criticalCredentials.length + data.residentsNeedingPlan.length > 0 ? "warning" : undefined}
            />
            <StatCard label="Compliance" value={`${data.compliance}%`} />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-stone-900">Today's priorities</h2>
            <div className="flex flex-col gap-3">
              {data.criticalCredentials.length > 0 && (
                <PriorityRow tone="danger" to="/credentials">
                  {data.criticalCredentials.length} credential{data.criticalCredentials.length === 1 ? "" : "s"} expiring within 30 days
                </PriorityRow>
              )}
              {data.residentsNeedingPlan.length > 0 && (
                <PriorityRow tone="warning" to="/care-plan">
                  {data.residentsNeedingPlan.length} resident{data.residentsNeedingPlan.length === 1 ? "" : "s"} missing today's care plan
                </PriorityRow>
              )}
              {data.criticalCredentials.length === 0 && data.residentsNeedingPlan.length === 0 && (
                <PriorityRow tone="success">All caught up — nothing needs attention today</PriorityRow>
              )}
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
