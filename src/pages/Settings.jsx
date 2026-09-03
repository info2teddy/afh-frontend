// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { CardSkeleton } from "../components/CardSkeleton";

export function Settings() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

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
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Connected
              </span>
            ) : (
              <Button variant="primary" onClick={handleConnect} disabled={connecting}>
                {connecting ? "Opening…" : "Connect QuickBooks"}
              </Button>
            )}
          </div>

          {!status.connected && (
            <p className="mt-4 text-xs text-stone-500">
              This opens QuickBooks in a new tab. Once you approve access there, come back here and{" "}
              <button onClick={loadStatus} className="font-medium text-emerald-700 hover:underline">
                refresh
              </button>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
