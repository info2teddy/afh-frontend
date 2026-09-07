// src/components/TenantSwitcher.jsx
// Admin-only. Lets an admin see and move between every AFH business they
// oversee, and onboard a new one, without logging out.
import { useEffect, useRef, useState } from "react";
import { api, auth } from "../lib/api";

export function TenantSwitcher() {
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState(null);
  const [error, setError] = useState(null);
  const [switching, setSwitching] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const currentTenant = auth.getTenant();
  const rootRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function openMenu() {
    setOpen((v) => !v);
    if (!tenants) {
      api.tenants.list().then(setTenants).catch((err) => setError(err.message));
    }
  }

  async function handleSwitch(tenantId) {
    if (tenantId === currentTenant?.id) {
      setOpen(false);
      return;
    }
    setSwitching(tenantId);
    setError(null);
    try {
      await auth.switchTenant(tenantId);
      window.location.reload(); // simplest way to refresh every page's already-fetched data
    } catch (err) {
      setError(err.message);
      setSwitching(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingNew(true);
    setError(null);
    try {
      const tenant = await api.tenants.create(newName.trim());
      await auth.switchTenant(tenant.id);
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setSavingNew(false);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={openMenu}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-stone-600 transition-colors hover:bg-stone-100"
      >
        <span className="max-w-[14rem] truncate font-medium text-stone-900">
          {currentTenant?.name || "Select a business"}
        </span>
        <svg className="h-3.5 w-3.5 text-stone-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          <div className="border-b border-stone-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-stone-400">
            Your businesses
          </div>

          {error && <p className="px-3 py-2 text-xs text-rose-700">{error}</p>}

          {!tenants && <div className="px-3 py-3 text-sm text-stone-400">Loading…</div>}

          <div className="max-h-64 overflow-y-auto py-1">
            {tenants?.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSwitch(t.id)}
                disabled={switching === t.id}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50 ${
                  t.id === currentTenant?.id ? "bg-brand-50/60" : ""
                }`}
              >
                <span>
                  <span className="block font-medium text-stone-900">{t.name}</span>
                  <span className="text-xs text-stone-400">
                    {t._count.residents} resident{t._count.residents === 1 ? "" : "s"} ·{" "}
                    {t._count.employees} staff
                  </span>
                </span>
                {t.id === currentTenant?.id && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                )}
                {switching === t.id && <span className="text-xs text-stone-400">Switching…</span>}
              </button>
            ))}
          </div>

          <div className="border-t border-stone-100 p-2">
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-brand-700 hover:bg-brand-50"
              >
                + Add a business
              </button>
            ) : (
              <form onSubmit={handleCreate} className="flex gap-1.5">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Business name"
                  className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="submit"
                  disabled={savingNew}
                  className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {savingNew ? "…" : "Add"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
