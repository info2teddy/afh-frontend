// src/pages/ResidentList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { careLevelShortLabel, payerLabel } from "../lib/format";
import { StatusPill } from "../components/StatusPill";
import { TableSkeleton } from "../components/TableSkeleton";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { AddResidentModal } from "../components/AddResidentModal";
import { ScrollFade } from "../components/ScrollFade";

const STATUS_TONE = { active: "success", discharging: "warning", discharged: "neutral" };
const todayUTC = () => new Date().toISOString().slice(0, 10);

function age(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function ResidentList() {
  const [residents, setResidents] = useState(null);
  const [carePlanStatus, setCarePlanStatus] = useState({}); // residentId -> "up_to_date" | "needs_plan"
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [careLevelFilter, setCareLevelFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  function load() {
    api.residents
      .list()
      .then((data) => {
        setResidents(data);
        // Best-effort — a resident whose care-plan lookup fails just doesn't
        // get a status badge rather than breaking the whole list.
        Promise.all(
          data.map((r) =>
            api.carePlans
              .list(r.id)
              .then((plans) => [r.id, plans.some((p) => p.planDate.slice(0, 10) === todayUTC())])
              .catch(() => [r.id, null])
          )
        ).then((pairs) => {
          const map = {};
          for (const [id, upToDate] of pairs) {
            if (upToDate !== null) map[id] = upToDate ? "up_to_date" : "needs_plan";
          }
          setCarePlanStatus(map);
        });
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!residents) return null;
    return residents.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (careLevelFilter && r.careLevel !== careLevelFilter) return false;
      return true;
    });
  }, [residents, search, statusFilter, careLevelFilter]);

  const stats = useMemo(() => {
    if (!residents) return null;
    const activeCare = residents.filter((r) => r.status === "active").length;
    const needsPlanCount = residents.filter((r) => carePlanStatus[r.id] === "needs_plan").length;
    const known = residents.filter((r) => carePlanStatus[r.id]).length;
    const upToDate = residents.filter((r) => carePlanStatus[r.id] === "up_to_date").length;
    const compliance = known > 0 ? Math.round((upToDate / known) * 100) : null;
    return { total: residents.length, activeCare, needsPlanCount, compliance };
  }, [residents, carePlanStatus]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Residents</h1>
          <p className="mt-1 text-sm text-stone-500">Manage residents, care plans, and eligibility</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Add Resident
        </Button>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Residents" value={stats.total} />
          <StatCard label="Active Care" value={stats.activeCare} />
          <StatCard label="Needs Care Plan" value={stats.needsPlanCount} tone={stats.needsPlanCount > 0 ? "warning" : undefined} />
          <StatCard label="Care Plan Compliance" value={stats.compliance === null ? "—" : `${stats.compliance}%`} />
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn't load residents: {error}
        </p>
      )}

      {!error && !residents && <TableSkeleton columns={5} rows={3} />}

      {residents && residents.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search residents…"
            className="min-w-[200px] flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="discharging">Discharging</option>
            <option value="discharged">Discharged</option>
          </Select>
          <Select value={careLevelFilter} onChange={(e) => setCareLevelFilter(e.target.value)}>
            <option value="">All care levels</option>
            <option value="level_1">Level 1</option>
            <option value="level_2">Level 2</option>
            <option value="level_3">Level 3</option>
          </Select>
        </div>
      )}

      {residents && residents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No residents yet.
        </div>
      )}

      {residents && residents.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No residents match your search or filters.
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <ScrollFade innerClassName="no-scrollbar overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Age</th>
                  <th className="px-5 py-3">Care Level</th>
                  <th className="px-5 py-3">Payer</th>
                  <th className="px-5 py-3">Care Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((r) => {
                  const residentAge = age(r.dateOfBirth);
                  const cpStatus = carePlanStatus[r.id];
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/residents/${r.id}`)}
                      className="cursor-pointer transition-colors hover:bg-stone-50"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-900">
                        <Link
                          to={`/residents/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{r.room || "—"}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{residentAge ?? "—"}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{careLevelShortLabel(r.careLevel)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-stone-600">{payerLabel(r)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {cpStatus === "up_to_date" && <StatusPill tone="success">Up to date</StatusPill>}
                        {cpStatus === "needs_plan" && <StatusPill tone="warning">Needs plan</StatusPill>}
                        {!cpStatus && <span className="text-stone-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <StatusPill tone={STATUS_TONE[r.status] || "neutral"}>{r.status}</StatusPill>
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
        <AddResidentModal
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
