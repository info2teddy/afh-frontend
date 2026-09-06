// src/components/TeamLoginsCard.jsx
// Self-service login management for a tenant's own staff: invite a teammate
// (a real person, so they choose/see the actual password) and create the
// restricted clock-in tablet login (see kioskRestrict.js on the backend —
// auto-generated credentials, since nobody but the tablet's browser ever
// types them). A manager can do all of this for their OWN business; the
// backend enforces that boundary independently (routes/auth.js), this is
// just the UI for it. Replaces the old admin-only ClockLoginCard.
import { useEffect, useState } from "react";
import { auth } from "../lib/api";
import { Button } from "./Button";
import { CardSkeleton } from "./CardSkeleton";

function randomPassword() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

export function TeamLoginsCard() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);
  const [creatingKiosk, setCreatingKiosk] = useState(false);
  const [newKioskLogin, setNewKioskLogin] = useState(null); // { email, password } shown once
  const [removingId, setRemovingId] = useState(null);

  function load() {
    auth.listUsers().then(setUsers).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  const teammates = (users || []).filter((u) => u.role === "manager");
  const kioskLogins = (users || []).filter((u) => u.role === "kiosk");

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim() || !invitePassword) {
      setError("Enter an email and password for the new login.");
      return;
    }
    setInviting(true);
    setError(null);
    try {
      const tenant = auth.getTenant();
      await auth.createUser({ tenantId: tenant.id, email: inviteEmail.trim(), password: invitePassword, role: "manager" });
      setInviteEmail("");
      setInvitePassword("");
      setInviteOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleCreateKiosk() {
    setCreatingKiosk(true);
    setError(null);
    try {
      const tenant = auth.getTenant();
      const email = `clock-${tenant.id.slice(0, 8)}-${Date.now().toString(36)}@carefitconnect.example`;
      const password = randomPassword();
      await auth.createUser({ tenantId: tenant.id, email, password, role: "kiosk" });
      setNewKioskLogin({ email, password });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingKiosk(false);
    }
  }

  async function handleRemove(id) {
    setRemovingId(id);
    setError(null);
    try {
      await auth.deleteUser(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-medium text-stone-900">Team &amp; tablet logins</h2>
      <p className="mt-1 text-sm text-stone-500">Invite a teammate, or set up a restricted login for a shared clock-in tablet.</p>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {users === null && !error && <CardSkeleton lines={2} />}

      {users && (
        <>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Team members</div>
              <Button size="sm" variant="secondary" onClick={() => setInviteOpen((o) => !o)}>
                {inviteOpen ? "Cancel" : "+ Invite teammate"}
              </Button>
            </div>

            {inviteOpen && (
              <form onSubmit={handleInvite} className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 p-3">
                <div className="flex-1 min-w-[10rem]">
                  <label className="mb-1 block text-xs font-medium text-stone-600">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <label className="mb-1 block text-xs font-medium text-stone-600">Temporary password</label>
                  <input
                    type="text"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Choose a password to share with them"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" disabled={inviting}>
                  {inviting ? "Creating…" : "Create login"}
                </Button>
              </form>
            )}

            {teammates.length === 0 ? (
              <p className="text-sm text-stone-500">Just you so far.</p>
            ) : (
              <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {teammates.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-sm text-stone-700">{u.email}</span>
                    <Button size="sm" variant="secondary" onClick={() => handleRemove(u.id)} disabled={removingId === u.id}>
                      {removingId === u.id ? "Removing…" : "Remove"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Clock-in tablets</div>
              <Button size="sm" variant="secondary" onClick={handleCreateKiosk} disabled={creatingKiosk}>
                {creatingKiosk ? "Creating…" : "+ Create tablet login"}
              </Button>
            </div>

            {newKioskLogin && (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-medium">Log into this on the tablet's browser now — the password won't be shown again:</p>
                <p className="mt-2">
                  Email: <span className="font-mono">{newKioskLogin.email}</span>
                  <br />
                  Password: <span className="font-mono">{newKioskLogin.password}</span>
                </p>
                <button
                  onClick={() => setNewKioskLogin(null)}
                  className="mt-2 text-xs font-medium text-emerald-700 hover:underline"
                >
                  Done, dismiss this
                </button>
              </div>
            )}

            {kioskLogins.length === 0 ? (
              <p className="text-sm text-stone-500">No tablet login yet — restricted to just the Clock page, safe to leave signed in.</p>
            ) : (
              <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {kioskLogins.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="font-mono text-sm text-stone-700">{u.email}</span>
                    <Button size="sm" variant="secondary" onClick={() => handleRemove(u.id)} disabled={removingId === u.id}>
                      {removingId === u.id ? "Removing…" : "Remove"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
