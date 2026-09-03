// src/pages/CarePlan.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { CardSkeleton } from "../components/CardSkeleton";

const today = () => new Date().toISOString().slice(0, 10);

export function CarePlan() {
  const [residents, setResidents] = useState([]);
  const [residentId, setResidentId] = useState("");
  const [planDate, setPlanDate] = useState(today());
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.residents.list().then(setResidents).catch((err) => setError(err.message));
  }, []);

  function loadPlans(id) {
    api.carePlans
      .list(id)
      .then(setPlans)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (residentId) loadPlans(residentId);
    else setPlans(null);
  }, [residentId]);

  async function handleGenerate() {
    if (!residentId || !planDate) {
      setError("Pick a resident and a date first.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      await api.carePlans.generate(residentId, planDate);
      loadPlans(residentId);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const inputClass =
    "rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Care plan</h1>
        <p className="mt-1 text-sm text-stone-500">
          AI-drafted, date-specific care plan — review and adjust before use
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={residentId} onChange={(e) => setResidentId(e.target.value)} className="w-56">
          <option value="">Select a resident…</option>
          {residents.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <input
          type="date"
          value={planDate}
          onChange={(e) => setPlanDate(e.target.value)}
          className={inputClass}
        />
        <Button variant="primary" onClick={handleGenerate} disabled={generating || !residentId}>
          {generating ? "Generating…" : "Generate care plan"}
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {!residentId && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          Select a resident to view or generate care plans.
        </div>
      )}

      {residentId && generating && <CardSkeleton lines={4} />}

      {residentId && plans && plans.length === 0 && !generating && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No care plans generated yet for this resident.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {plans?.map((p) => (
          <div key={p.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-stone-900">
                {new Date(p.planDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                {p.model}
              </span>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{p.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
