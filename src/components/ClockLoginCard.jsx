// src/components/ClockLoginCard.jsx
// Lets an admin create/manage the restricted "kiosk" login used to lock a
// shared tablet to just the Clock page — see App.jsx (client-side) and
// kioskRestrict.js (server-side, the actual enforcement).
import { useEffect, useState } from "react";
import { auth } from "../lib/api";
import { Button } from "./Button";
import { CardSkeleton } from "./CardSkeleton";

function randomPassword() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

export function ClockLoginCard() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newLogin, setNewLogin] = useState(null); // { email, password } shown once after creating
  const [deletingId, setDeletingId] = useState(null);

  function load() {
    auth.listUsers().then(setUsers).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  const kioskLogins = (users || []).filter((u) => u.role === "kiosk");

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const tenant = auth.getTenant();
      const email = `clock-${tenant.id.slice(0, 8)}-${Date.now().toString(36)}@carefitconnect.example`;
      const password = randomPassword();
      await auth.createUser({ tenantId: tenant.id, email, password, role: "kiosk" });
      setNewLogin({ email, password });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError(null);
    try {
      await auth.deleteUser(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-stone-900">Clock-in tablet</h2>
          <p className="mt-1 text-sm text-stone-500">
            A restricted login that only shows the Clock page — safe to leave signed into a shared tablet.
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} disabled={creating}>
          {creating ? "Creating…" : "+ Create tablet login"}
        </Button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {newLogin && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">Log into this on the tablet's browser now — the password won't be shown again:</p>
          <p className="mt-2">
            Email: <span className="font-mono">{newLogin.email}</span>
            <br />
            Password: <span className="font-mono">{newLogin.password}</span>
          </p>
          <button
            onClick={() => setNewLogin(null)}
            className="mt-2 text-xs font-medium text-emerald-700 hover:underline"
          >
            Done, dismiss this
          </button>
        </div>
      )}

      {users === null && !error && <CardSkeleton lines={1} />}

      {users && kioskLogins.length === 0 && (
        <p className="mt-4 text-sm text-stone-500">No tablet login yet — create one above, then log into it on the tablet's browser.</p>
      )}

      {kioskLogins.length > 0 && (
        <div className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200">
          {kioskLogins.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-mono text-sm text-stone-700">{u.email}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDelete(u.id)}
                disabled={deletingId === u.id}
              >
                {deletingId === u.id ? "Removing…" : "Remove"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
