// src/pages/Settings.jsx
// Admin-only (see App.jsx's route guard and PageShell's nav filtering) —
// Facilities and QuickBooks are both flagged as too technical/risky for an
// AFH owner/manager to configure themselves. Clock-in PINs and the
// self-serve team/tablet-login invites used to live here too, but those
// are for managers, so they moved to Care Team instead.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { CardSkeleton } from "../components/CardSkeleton";
import { HomeFormModal } from "../components/HomeFormModal";
import { QuickBooksMappings } from "../components/QuickBooksMappings";
import { StatusPill } from "../components/StatusPill";

export function Settings() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [homes, setHomes] = useState(null);
  const [homeModal, setHomeModal] = useState(null); // null | "new" | a home object to edit

  function loadHomes() {
    api.homes.list().then(setHomes).catch((err) => setError(err.message));
  }
  useEffect(loadHomes, []);

  function loadStatus() {
    setError(null);
    api.quickbooks
      .status()
      .then(setStatus)
      .catch((err) => setError(err.message));
  }

  useEffect(loadStatus, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const { url } = await api.quickbooks.getConnectUrl();
      // Opens in a new tab rather than navigating this one — the callback
      // page is served by the backend, not this app, and tells the user to
      // close it and come back here once QuickBooks confirms the connection.
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Settings</h1>
        <p className="mt-1 text-sm text-stone-500">Integrations for this business</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-stone-900">Facilities</h2>
            <p className="text-sm text-stone-500">The physical homes this business operates.</p>
          </div>
          <Button size="sm" variant="primary" onClick={() => setHomeModal("new")}>
            + Add Facility
          </Button>
        </div>

        {homes === null && <CardSkeleton lines={2} />}

        {homes && homes.length > 0 && (
          <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-sm">
            {homes.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-stone-50">
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-900">{h.name}</div>
                  <div className="text-xs text-stone-500">
                    License {h.licenseNumber} · Capacity {h.capacity} · {h._count.residents} resident
                    {h._count.residents === 1 ? "" : "s"}
                    {h.address ? ` · ${h.address}` : ""}
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setHomeModal(h)}>
                  Edit
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {status === null && !error && <CardSkeleton lines={2} />}

      {status && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-stone-900">QuickBooks Online</div>
              <p className="mt-1 text-sm text-stone-500">
                {status.connected
                  ? "Connected — invoices can be pushed to QuickBooks."
                  : "Not connected — invoices can't be pushed to QuickBooks yet."}
              </p>
            </div>
            {status.connected ? (
              <StatusPill tone="success">Connected</StatusPill>
            ) : (
              <Button variant="primary" onClick={handleConnect} disabled={connecting}>
                {connecting ? "Opening…" : "Connect QuickBooks"}
              </Button>
            )}
          </div>

          {!status.connected && (
            <p className="mt-4 text-xs text-stone-500">
              This opens QuickBooks in a new tab. Once you approve access there, come back here and{" "}
              <button onClick={loadStatus} className="font-medium text-stone-700 underline hover:text-stone-900">
                refresh
              </button>
              .
            </p>
          )}
        </div>
      )}

      {status?.connected && <QuickBooksMappings />}

      {homeModal && (
        <HomeFormModal
          home={homeModal === "new" ? null : homeModal}
          onClose={() => setHomeModal(null)}
          onSaved={() => {
            setHomeModal(null);
            loadHomes();
          }}
        />
      )}
    </div>
  );
}
