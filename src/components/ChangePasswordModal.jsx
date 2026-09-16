// src/components/ChangePasswordModal.jsx
// Self-service password change for the currently logged-in user (any role —
// admin, manager, or kiosk). See PATCH /auth/change-password: requires the
// current password, same as login itself.
import { useState } from "react";
import { auth } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await auth.changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Modal title="Change password" onClose={onClose}>
        <p className="text-sm text-stone-600">Your password has been changed.</p>
        <div className="mt-5 flex justify-end">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Change password" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="pw-current">Current password *</label>
          <input id="pw-current" type="password" autoComplete="current-password" className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pw-new">New password *</label>
          <input id="pw-new" type="password" autoComplete="new-password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
        </div>
        <div>
          <label className={labelClass} htmlFor="pw-confirm">Confirm new password *</label>
          <input id="pw-confirm" type="password" autoComplete="new-password" className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Change password"}</Button>
        </div>
      </form>
    </Modal>
  );
}
