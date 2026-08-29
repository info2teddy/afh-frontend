// src/pages/ResidentList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { StatusPill } from "../components/StatusPill";

const STATUS_TONE = { active: "success", discharging: "warning", discharged: "neutral" };

export function ResidentList() {
  const [residents, setResidents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.residents
      .list()
      .then(setResidents)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "#791f1f" }}>Couldn't load residents: {error}</p>;
  if (!residents) return <p style={{ color: "#73726c" }}>Loading residents…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Residents</h1>
      <div style={{ border: "1px solid #e4e2d8", borderRadius: 12, overflow: "hidden" }}>
        {residents.length === 0 && (
          <p style={{ padding: 16, color: "#73726c", fontSize: 14 }}>No residents yet.</p>
        )}
        {residents.map((r) => (
          <Link
            key={r.id}
            to={`/residents/${r.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              padding: "12px 16px",
              alignItems: "center",
              borderBottom: "1px solid #e4e2d8",
              fontSize: 14,
              textDecoration: "none",
              color: "#1a1a1a",
            }}
          >
            <div>{r.name}</div>
            <div>{r.careLevel}</div>
            <div style={{ color: "#73726c" }}>
              {r.payerType === "split" ? `${r.medicaidSplitPct}% Medicaid` : r.payerType.replace("_", " ")}
            </div>
            <div>
              <StatusPill tone={STATUS_TONE[r.status] || "neutral"}>{r.status}</StatusPill>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
