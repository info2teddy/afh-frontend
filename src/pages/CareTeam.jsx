// src/pages/CareTeam.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { daysUntil, titleCase } from "../lib/format";
import { StatusPill } from "../components/StatusPill";
import { TableSkeleton } from "../components/TableSkeleton";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { ScrollFade } from "../components/ScrollFade";
import { AddEmployeeModal } from "../components/AddEmployeeModal";

const STATUS_TONE = { active: "success", inactive: "neutral", terminated: "neutral" };

function credentialStatus(employee) {
  if (!employee.credentials || employee.credentials.length === 0) return null;
  const needsAttention = employee.credentials.some((c) => daysUntil(c.expirationDate) <= 30);
  return needsAttention ? "needs_attention" : "up_to_date";
}

export function CareTeam() {
  const [employees, setEmployees] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  function load() {
    api.employees.list().then(setEmployees).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!employees) return null;
    return employees.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter && e.role !== roleFilter) return false;
      return true;
    });
  }, [employees, search, roleFilter]);

  const stats = useMemo(() => {
    if (!employees) return null;
    const active = employees.filter((e) => e.status === "active").length;
    const needsAttention = employees.filter((e) => credentialStatus(e) === "needs_attention").length;
    const liveIn = employees.filter((e) => e.liveIn).length;
    return { total: employees.length, active, needsAttention, liveIn };
  }, [employees]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Care Team</h1>
          <p className="mt-1 text-sm text-stone-500">Staff roster and credential status at a glance</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Add Team Member
        </Button>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Team Members" value={stats.total} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Needs Attention" value={stats.needsAttention} tone={stats.needsAttention > 0 ? "warning" : undefined} />
          <StatCard label="Live-in" value={stats.liveIn} />
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn't load the care team: {error}
        </p>
      )}

      {!error && !employees && <TableSkeleton columns={5} rows={3} />}

      {employees && employees.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team…"
            className="min-w-[200px] flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="caregiver">Caregiver</option>
            <option value="resident_manager">Resident Manager</option>
            <option value="rn_delegator">RN Delegator</option>
            <option value="other">Other</option>
          </Select>
        </div>
      )}

      {employees && employees.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No team members yet.
        </div>
      )}

      {employees && employees.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No team members match your search or filters.
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <ScrollFade innerClassName="no-scrollbar overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Live-in</th>
                  <th className="px-5 py-3">Credentials</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((e) => {
                  const cStatus = credentialStatus(e);
                  return (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/onboarding?employee=${e.id}`)}
                      className="cursor-pointer transition-colors hover:bg-stone-50"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-900">{e.name}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{titleCase(e.role)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{titleCase(e.employmentType)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{e.liveIn ? "Yes" : "No"}</td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {cStatus === "up_to_date" && <StatusPill tone="success">Up to date</StatusPill>}
                        {cStatus === "needs_attention" && <StatusPill tone="warning">Needs attention</StatusPill>}
                        {!cStatus && <span className="text-stone-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <StatusPill tone={STATUS_TONE[e.status] || "neutral"}>{e.status}</StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right text-stone-400">→</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollFade>
        </div>
      )}

      {showAddModal && (
        <AddEmployeeModal
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
