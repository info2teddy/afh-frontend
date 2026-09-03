// src/pages/Onboarding.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatusPill } from "../components/StatusPill";
import { Button } from "../components/Button";
import { Select } from "../components/Select";

const STATUS_CONFIG = {
  done: { tone: "success", label: "Done" },
  overdue: { tone: "danger", label: "Overdue" },
  blocked: { tone: "neutral", label: "Blocked" },
  pending: { tone: "warning", label: "Pending" },
};

const CONDITIONAL_OPTIONS = [
  "NAR application",
  "Dementia Certificate",
  "Mental Health Certificate",
  "Developmental Disabilities Certificate",
];

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function Onboarding() {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [checklist, setChecklist] = useState(null);
  const [error, setError] = useState(null);
  const [busyItemId, setBusyItemId] = useState(null);
  const [addingConditional, setAddingConditional] = useState(false);

  useEffect(() => {
    api.employees.list().then(setEmployees).catch((err) => setError(err.message));
  }, []);

  function loadChecklist(id) {
    api.onboarding
      .checklist(id)
      .then(setChecklist)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (employeeId) loadChecklist(employeeId);
  }, [employeeId]);

  async function handleInstantiate() {
    setError(null);
    try {
      await api.onboarding.instantiate(employeeId);
      loadChecklist(employeeId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleComplete(itemId) {
    setBusyItemId(itemId);
    setError(null);
    try {
      await api.onboarding.complete(itemId);
      loadChecklist(employeeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleAddConditional(templateName) {
    setError(null);
    try {
      await api.onboarding.addConditional(employeeId, templateName);
      loadChecklist(employeeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingConditional(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-stone-900">Onboarding</h1>
        <p className="mt-1 text-sm text-stone-500">Track new-hire requirements to completion</p>
      </div>

      <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mb-6 w-64">
        <option value="">Select an employee…</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </Select>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {employeeId && checklist === null && (
        <div className="animate-pulse rounded-2xl border border-stone-200 bg-white p-6">
          <div className="h-4 w-1/3 rounded bg-stone-100" />
        </div>
      )}

      {employeeId && checklist && checklist.length === 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="mb-4 text-sm text-stone-500">No onboarding checklist yet for this employee.</p>
          <Button variant="primary" onClick={handleInstantiate}>
            Start checklist
          </Button>
        </div>
      )}

      {employeeId && checklist && checklist.length > 0 && (
        <div>
          <div className="mb-4 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {checklist.map((item) => {
              const config = STATUS_CONFIG[item.status];
              const isBlocked = item.status === "blocked";
              const isDone = item.status === "done";
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-5 py-4 ${isBlocked ? "opacity-50" : ""}`}
                >
                  <div>
                    <div className="text-sm font-medium text-stone-900">{item.name}</div>
                    {item.dueDate && (
                      <div className="mt-0.5 text-xs text-stone-500">Due {formatDate(item.dueDate)}</div>
                    )}
                    {item.gateName && !item.dueDate && (
                      <div className="mt-0.5 text-xs text-stone-500">
                        Required {item.gateName.replaceAll("_", " ")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={config.tone}>{config.label}</StatusPill>
                    {!isDone && !isBlocked && (
                      <Button
                        size="sm"
                        onClick={() => handleComplete(item.id)}
                        disabled={busyItemId === item.id}
                      >
                        {busyItemId === item.id ? "…" : "Mark done"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative inline-block">
            <Button onClick={() => setAddingConditional((v) => !v)}>+ Add conditional requirement</Button>
            {addingConditional && (
              <div className="absolute left-0 top-full z-10 mt-2 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white py-1.5 shadow-lg">
                {CONDITIONAL_OPTIONS.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleAddConditional(name)}
                    className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
