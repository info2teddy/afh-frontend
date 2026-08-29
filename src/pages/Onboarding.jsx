// src/pages/Onboarding.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatusPill } from "../components/StatusPill";

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
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Onboarding</h1>

      <select
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        style={{ padding: 8, fontSize: 14, marginBottom: 20, borderRadius: 6, border: "1px solid #ccc" }}
      >
        <option value="">Select an employee…</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {error && <p style={{ color: "#791f1f", fontSize: 14, marginBottom: 16 }}>{error}</p>}

      {employeeId && checklist && checklist.length === 0 && (
        <div style={{ border: "1px solid #e4e2d8", borderRadius: 12, padding: 20 }}>
          <p style={{ color: "#73726c", fontSize: 14, marginBottom: 12 }}>
            No onboarding checklist yet for this employee.
          </p>
          <button
            onClick={handleInstantiate}
            style={{ padding: "8px 14px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
          >
            Start checklist
          </button>
        </div>
      )}

      {employeeId && checklist && checklist.length > 0 && (
        <div>
          <div style={{ border: "1px solid #e4e2d8", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            {checklist.map((item) => {
              const config = STATUS_CONFIG[item.status];
              const isBlocked = item.status === "blocked";
              const isDone = item.status === "done";
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: "1px solid #e4e2d8",
                    fontSize: 14,
                    opacity: isBlocked ? 0.6 : 1,
                  }}
                >
                  <div>
                    <div>{item.name}</div>
                    {item.dueDate && (
                      <div style={{ fontSize: 12, color: "#73726c", marginTop: 2 }}>
                        Due {formatDate(item.dueDate)}
                      </div>
                    )}
                    {item.gateName && !item.dueDate && (
                      <div style={{ fontSize: 12, color: "#73726c", marginTop: 2 }}>
                        Required {item.gateName.replaceAll("_", " ")}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusPill tone={config.tone}>{config.label}</StatusPill>
                    {!isDone && !isBlocked && (
                      <button
                        onClick={() => handleComplete(item.id)}
                        disabled={busyItemId === item.id}
                        style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                      >
                        {busyItemId === item.id ? "…" : "Mark done"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setAddingConditional((v) => !v)}
              style={{ padding: "8px 14px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
            >
              + Add conditional requirement
            </button>
            {addingConditional && (
              <div style={{ marginTop: 8, border: "1px solid #e4e2d8", borderRadius: 8, background: "#fff", padding: 8 }}>
                {CONDITIONAL_OPTIONS.map((name) => (
                  <div
                    key={name}
                    onClick={() => handleAddConditional(name)}
                    style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer", borderRadius: 4 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1efe8")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
