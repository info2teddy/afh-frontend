// src/components/TeamLoginsCard.jsx
// Login management for a tenant's staff: invite a teammate (a real person,
// so they choose/see the actual password) and create the restricted
// clock-in tablet login (see kioskRestrict.js on the backend —
// auto-generated credentials, since nobody but the tablet's browser ever
// types them). Admin-only (lives in Settings) — this briefly was a manager
// self-serve feature, but the backend (routes/auth.js) now requires admin
// for all three routes this card calls, so this is the UI for that.
import { useEffect, useState } from "react";
import { auth, api } from "../lib/api";
import { Button } from "./Button";
import { Select } from "./Select";
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
  const [employees, setEmployees] = useState(null);
  const [caregiverOpen, setCaregiverOpen] = useState(false);
  const [caregiverEmployeeId, setCaregiverEmployeeId] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [caregiverPassword, setCaregiverPassword] = useState("");
  const [creatingCaregiver, setCreatingCaregiver] = useState(false);

  function load() {
    auth.listUsers().then(setUsers).catch((err) => setError(err.message));
    api.employees.list().then(setEmployees).catch(() => {}); // just for name lookup + the picker below; a load failure here shouldn't block the rest of the card
  }
  useEffect(load, []);

  const teammates = (users || []).filter((u) => u.role === "manager");
  const kioskLogins = (users || []).filter((u) => u.role === "kiosk");
  const caregiverLogins = (users || []).filter((u) => u.role === "employee");
  const employeeName = (id) => employees?.find((e) => e.id === id)?.name || "(former staff member)";
  // Only active employees with no login yet can be given one — an employee
  // record is @unique on User.employeeId, so this list is also what keeps
  // the picker from ever offering someone who's already linked.
  const linkedEmployeeIds = new Set(caregiverLogins.map((u) => u.employeeId));
  const employeesWithoutLogin = (employees || []).filter((e) => e.status === "active" && !linkedEmployeeIds.has(e.id));

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

  async function handleCreateCaregiver(e) {
    e.preventDefault();
    if (!caregiverEmployeeId || !caregiverEmail.trim() || !caregiverPassword) {
      setError("Pick a staff member and enter an email and password.");
      return;
    }
    setCreatingCaregiver(true);
    setError(null);
    try {
      const tenant = auth.getTenant();
      await auth.createUser({
        tenantId: tenant.id,
        email: caregiverEmail.trim(),
        password: caregiverPassword,
        role: "employee",
        employeeId: caregiverEmployeeId,
      });
      setCaregiverEmployeeId("");
      setCaregiverEmail("");
      setCaregiverPassword("");
      setCaregiverOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingCaregiver(false);
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
    <div className="mt-8">
      <h2 className="text-sm font-medium text-stone-900">Team &amp; tablet logins</h2>
      <p className="mb-4 mt-1 text-sm text-stone-500">Invite a teammate, or set up a restricted login for a shared clock-in tablet.</p>

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
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="invite-email">Email</label>
                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="invite-password">Temporary password</label>
                  <input
                    id="invite-password"
                    type="text"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Choose a password to share with them"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                  <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-stone-50">
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
                  <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-stone-50">
                    <span className="font-mono text-sm text-stone-700">{u.email}</span>
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
              <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Caregiver logins</div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCaregiverOpen((o) => !o)}
                disabled={employeesWithoutLogin.length === 0 && !caregiverOpen}
              >
                {caregiverOpen ? "Cancel" : "+ Give a caregiver a login"}
              </Button>
            </div>
            <p className="mb-2 text-xs text-stone-500">
              A caregiver's own login — on their own phone, not the shared tablet. They see only their assigned residents: log ADL tasks, add notes, view the care plan, clock in/out.
            </p>

            {employeesWithoutLogin.length === 0 && !caregiverOpen && caregiverLogins.length === 0 && (
              <p className="text-sm text-stone-500">No active staff without a login yet — add staff under Care Team → Roster first.</p>
            )}

            {caregiverOpen && (
              <form onSubmit={handleCreateCaregiver} className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 p-3">
                <div className="min-w-[11rem]">
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="caregiver-employee">Staff member</label>
                  <Select id="caregiver-employee" className="w-full" value={caregiverEmployeeId} onChange={(e) => setCaregiverEmployeeId(e.target.value)}>
                    <option value="">Select…</option>
                    {employeesWithoutLogin.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="caregiver-email">Email</label>
                  <input
                    id="caregiver-email"
                    type="email"
                    value={caregiverEmail}
                    onChange={(e) => setCaregiverEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="caregiver-password">Temporary password</label>
                  <input
                    id="caregiver-password"
                    type="text"
                    value={caregiverPassword}
                    onChange={(e) => setCaregiverPassword(e.target.value)}
                    placeholder="Choose a password to share with them"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" disabled={creatingCaregiver}>
                  {creatingCaregiver ? "Creating…" : "Create login"}
                </Button>
              </form>
            )}

            {caregiverLogins.length > 0 && (
              <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {caregiverLogins.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-stone-50">
                    <span className="text-sm text-stone-700">
                      <span className="font-medium text-stone-900">{employeeName(u.employeeId)}</span>
                      <span className="text-stone-400"> — {u.email}</span>
                    </span>
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
