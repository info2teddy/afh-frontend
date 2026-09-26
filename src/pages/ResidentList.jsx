// src/pages/ResidentList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { careLevelShortLabel, payerLabel } from "../lib/format";
import { StatusPill } from "../components/StatusPill";
import { TableSkeleton } from "../components/TableSkeleton";
import { Button } from "../components/Button";
import { AddResidentModal } from "../components/AddResidentModal";
import { ScrollFade } from "../components/ScrollFade";
import { StatCard } from "../components/StatCard";
import { StatStrip } from "../components/StatStrip";
import { ResidentCard } from "../components/ResidentCard";
import { ResidentPhoto } from "../components/ResidentPhoto";
import { ResidentQuickView } from "../components/ResidentQuickView";
import { hasAllergy, needsAttention } from "../lib/residentFacts";

// Chips above the cards. "Current" (the default) leaves out discharged
// residents, who otherwise crowd the page as months go by.
const FILTERS = [
  { key: "current", label: "Current", test: (r) => r.status !== "discharged" },
  { key: "attention", label: "Needs attention", test: (r, cp) => r.status !== "discharged" && needsAttention(r, cp) },
  { key: "dnr", label: "DNR", test: (r) => r.status !== "discharged" && r.dnrStatus === "yes" },
  { key: "fall", label: "High fall risk", test: (r) => r.status !== "discharged" && r.fallRisk === "high" },
  { key: "discharged", label: "Discharged", test: (r) => r.status === "discharged" },
];
const LAYOUT_KEY = "afh_residents_layout";
const MAX_COMPARE = 3;

const STATUS_TONE = { active: "success", discharging: "warning", discharged: "neutral" };

function age(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function ResidentList() {
  const [residents, setResidents] = useState(null);
  const [carePlanStatus, setCarePlanStatus] = useState({}); // residentId -> "on_file" | "needs_plan"
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("current");
  const [layout, setLayoutState] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) === "list" ? "list" : "cards";
    } catch {
      return "cards";
    }
  });
  const [openId, setOpenId] = useState(null);
  const [picked, setPicked] = useState([]);
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
              .then((plans) => [r.id, plans.length > 0])
              .catch(() => [r.id, null])
          )
        ).then((pairs) => {
          const map = {};
          for (const [id, onFile] of pairs) {
            if (onFile !== null) map[id] = onFile ? "on_file" : "needs_plan";
          }
          setCarePlanStatus(map);
        });
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  function setLayout(next) {
    setLayoutState(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      // a remembered layout is only a convenience
    }
  }

  function togglePick(r) {
    setPicked((prev) =>
      prev.some((p) => p.id === r.id) ? prev.filter((p) => p.id !== r.id) : prev.length >= MAX_COMPARE ? prev : [...prev, r]
    );
  }

  const counts = useMemo(() => {
    if (!residents) return {};
    return Object.fromEntries(FILTERS.map((f) => [f.key, residents.filter((r) => f.test(r, carePlanStatus[r.id])).length]));
  }, [residents, carePlanStatus]);

  const filtered = useMemo(() => {
    if (!residents) return null;
    const test = FILTERS.find((f) => f.key === filter).test;
    const q = search.trim().toLowerCase();
    return residents.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !(r.room || "").toLowerCase().includes(q)) return false;
      return test(r, carePlanStatus[r.id]);
    });
  }, [residents, search, filter, carePlanStatus]);

  // Group by home only when there's more than one.
  const groups = useMemo(() => {
    if (!filtered) return [];
    const byHome = new Map();
    for (const r of filtered) {
      const key = r.home?.name || "";
      if (!byHome.has(key)) byHome.set(key, []);
      byHome.get(key).push(r);
    }
    return [...byHome.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const stats = useMemo(() => {
    if (!residents) return null;
    const activeCare = residents.filter((r) => r.status === "active").length;
    const needsPlanCount = residents.filter((r) => carePlanStatus[r.id] === "needs_plan").length;
    const known = residents.filter((r) => carePlanStatus[r.id]).length;
    const upToDate = residents.filter((r) => carePlanStatus[r.id] === "on_file").length;
    const compliance = known > 0 ? Math.round((upToDate / known) * 100) : null;
    return { total: residents.length, activeCare, needsPlanCount, compliance };
  }, [residents, carePlanStatus]);

  const isPicked = (r) => picked.some((p) => p.id === r.id);

  return (
    <div className={picked.length > 0 ? "pb-24" : ""}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Residents</h1>
          <p className="mt-1 text-sm text-stone-500">Click a resident for details, or tick two or three to compare</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Add Resident
        </Button>
      </div>

      {stats && (
        <StatStrip>
          <StatCard label="Residents" value={stats.total} />
          <StatCard label="Active Care" value={stats.activeCare} />
          <StatCard label="Needs Care Plan" value={stats.needsPlanCount} tone={stats.needsPlanCount > 0 ? "warning" : undefined} />
          <StatCard label="Care Plan Compliance" value={stats.compliance === null ? "—" : stats.compliance} suffix="%" />
        </StatStrip>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Couldn't load residents: {error}
        </p>
      )}

      {!error && !residents && <TableSkeleton columns={5} rows={3} />}

      {residents && residents.length > 0 && (
        <div className="mb-5 grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or room…"
              aria-label="Search residents"
              className="min-w-[200px] flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <div role="group" aria-label="Layout" className="inline-flex overflow-hidden rounded-lg border border-stone-300 bg-white">
              {[
                ["cards", "Photo cards"],
                ["list", "List"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={layout === key}
                  onClick={() => setLayout(key)}
                  className={`px-3 py-2 text-sm ${layout === key ? "bg-brand-50 font-medium text-brand-700" : "text-stone-600 hover:text-stone-900"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div role="group" aria-label="Filter residents" className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] transition-colors ${
                  filter === f.key ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                }`}
              >
                {f.label}
                <span className={`tabular-nums ${filter === f.key ? "text-stone-300" : "text-stone-400"}`}>{counts[f.key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {residents && residents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No residents yet.
        </div>
      )}

      {residents && residents.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No residents match your search or filter.
        </div>
      )}

      {groups.map(([home, rs]) => (
        <section key={home} className="mb-7">
          {groups.length > 1 && home && (
            <h2 className="mb-2.5 text-xs font-semibold tracking-[0.06em] text-stone-500 uppercase">{home}</h2>
          )}
          {layout === "cards" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-4">
              {rs.map((r) => (
                <ResidentCard
                  key={r.id}
                  resident={r}
                  carePlanStatus={carePlanStatus[r.id]}
                  picked={isPicked(r)}
                  onOpen={() => setOpenId(r.id)}
                  onTogglePick={togglePick}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <ScrollFade innerClassName="no-scrollbar overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/60 text-xs font-medium uppercase tracking-wide text-stone-500">
                      <th className="w-10 px-4 py-3">
                        <span className="sr-only">Compare</span>
                      </th>
                      <th className="px-3 py-3">Name</th>
                      <th className="px-5 py-3">Room</th>
                      <th className="px-5 py-3">Age</th>
                      <th className="px-5 py-3">Care Level</th>
                      <th className="px-5 py-3">Payer</th>
                      <th className="px-5 py-3">Alerts</th>
                      <th className="px-5 py-3">Care Plan</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rs.map((r) => {
                      const cpStatus = carePlanStatus[r.id];
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setOpenId(r.id)}
                          className={`cursor-pointer transition-colors ${isPicked(r) ? "bg-brand-50/60" : "hover:bg-stone-50"}`}
                        >
                          <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isPicked(r)}
                              onChange={() => togglePick(r)}
                              aria-label={`Compare ${r.name}`}
                              className="h-4 w-4 accent-brand-600"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-medium text-stone-900">
                            <span className="flex items-center gap-3">
                              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                                <ResidentPhoto resident={r} size="thumb" />
                              </span>
                              <Link
                                to={`/residents/${r.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40"
                              >
                                {r.name}
                              </Link>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-2.5 text-stone-600">{r.room || "—"}</td>
                          <td className="whitespace-nowrap px-5 py-2.5 text-stone-600">{age(r.dateOfBirth) ?? "—"}</td>
                          <td className="whitespace-nowrap px-5 py-2.5 text-stone-600">{careLevelShortLabel(r.careLevel)}</td>
                          <td className="whitespace-nowrap px-5 py-2.5 text-stone-600">{payerLabel(r)}</td>
                          <td className="whitespace-nowrap px-5 py-2.5 text-[12.5px]">
                            {[
                              r.dnrStatus === "yes" && <span key="d" className="font-medium text-rose-700">DNR</span>,
                              hasAllergy(r) && <span key="a" className="font-medium text-rose-700">Allergy</span>,
                              r.fallRisk === "high" && <span key="f" className="text-stone-600">Fall risk</span>,
                            ]
                              .filter(Boolean)
                              .reduce((acc, el, i) => (i ? [...acc, <span key={`s${i}`} className="text-stone-300"> · </span>, el] : [el]), [])}
                            {r.dnrStatus !== "yes" && !hasAllergy(r) && r.fallRisk !== "high" && <span className="text-stone-400">—</span>}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2.5">
                            {cpStatus === "on_file" && <StatusPill tone="success">On file</StatusPill>}
                            {cpStatus === "needs_plan" && <StatusPill tone="warning">Needs plan</StatusPill>}
                            {!cpStatus && <span className="text-stone-400">—</span>}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2.5">
                            <StatusPill tone={STATUS_TONE[r.status] || "neutral"}>{r.status}</StatusPill>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollFade>
            </div>
          )}
        </section>
      ))}

      {picked.length > 0 && (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-stone-900 py-2.5 pr-3 pl-4 text-sm text-white shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
          <span className="flex">
            {picked.map((r, i) => (
              <span key={r.id} className={`h-8 w-8 overflow-hidden rounded-full border-2 border-stone-900 ${i ? "-ml-2" : ""}`}>
                <ResidentPhoto resident={r} size="thumb" />
              </span>
            ))}
          </span>
          <span className="whitespace-nowrap">{picked.length === 1 ? "Pick 1–2 more" : `${picked.length} selected`}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={picked.length < 2}
            onClick={() => navigate(`/residents/compare?ids=${picked.map((r) => r.id).join(",")}`)}
          >
            Compare side by side
          </Button>
          <button onClick={() => setPicked([])} className="px-1 text-stone-400 hover:text-white">
            Clear
          </button>
        </div>
      )}

      {openId && (
        <ResidentQuickView
          residentId={openId}
          picked={picked.some((p) => p.id === openId)}
          onTogglePick={togglePick}
          onClose={() => setOpenId(null)}
        />
      )}

      {showAddModal && (
        <AddResidentModal
          onClose={() => setShowAddModal(false)}
          onCreated={(resident) => {
            setShowAddModal(false);
            // Straight to their Documents tab — the Face Sheet panel there
            // is the natural next step after adding someone, and easy to
            // forget if left to a separate click-in later.
            navigate(`/residents/${resident.id}?tab=documents`);
          }}
        />
      )}
    </div>
  );
}

