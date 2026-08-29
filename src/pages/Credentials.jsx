// src/pages/Credentials.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatusPill } from "../components/StatusPill";

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
}

function toneForDays(days) {
  if (days < 0) return "danger";
  if (days <= 30) return "danger";
  if (days <= 60) return "warning";
  return "success";
}

export function Credentials() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.employees
      .expiringCredentials(90) // show anything expiring within 90 days, plus already-expired
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "#791f1f" }}>{error}</p>;
  if (!items) return <p style={{ color: "#73726c" }}>Loading credentials…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Credentials</h1>
      <div style={{ border: "1px solid #e4e2d8", borderRadius: 12, overflow: "hidden" }}>
        {items.length === 0 && <p style={{ padding: 16, color: "#73726c", fontSize: 14 }}>Nothing expiring soon.</p>}
        {items.map((c) => {
          const days = daysUntil(c.expirationDate);
          return (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1.3fr 1fr 1fr",
                padding: "12px 16px",
                alignItems: "center",
                borderBottom: "1px solid #e4e2d8",
                fontSize: 14,
              }}
            >
              <div>{c.employee.name}</div>
              <div style={{ color: "#73726c" }}>{c.credentialType.replaceAll("_", " ")}</div>
              <div style={{ color: "#73726c" }}>{new Date(c.expirationDate).toLocaleDateString()}</div>
              <div>
                <StatusPill tone={toneForDays(days)}>
                  {days < 0 ? "Expired" : `${days} days`}
                </StatusPill>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
