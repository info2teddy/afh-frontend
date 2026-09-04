// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { CardSkeleton } from "../components/CardSkeleton";

export function Settings() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [employees, setEmployees] = useState(null);
  const [pinDrafts, setPinDrafts] = useState({});
  const [savingPinFor, setSavingPinFor] = useState(null);
  const [pinMessage, setPinMessage] = useState(null);

  function loadStatus() {
    setError(null);
    api.quickbooks
      .status()
      .then(setStatus)
      .catch((err) => setError(err.message));
  }

  useEffect(loadStatus, []);
  useEffect(() => {
    api.employees.list().then(setEmployees).catch((err) => setError(err.message));
  }, []);

  async function handleSetPin(employeeId) {
    const pin = pinDrafts[employeeId] || "";
    if (!/^\d{4,6}$/.test(pin)) {
      setPinMessage({ employeeId, error: "PIN must be 4-6 digits." });
      return;
    }
    setSavingPinFor(employeeId);
    setPinMessage(null);
    try {
      await api.employees.setPin(employeeId, pin);
      setPinMessage({ employeeId, error: null });
      setPinDrafts((d) => ({ ...d, [employeeId]: "" }));
    } catch (err) {
      setPinMessage({ employeeId, error: err.message });
    } finally {
      setSavingPinFor(null);
    }
  }

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

      <div className="mt-8">
        <h2 className="mb-1 text-sm font-medium text-stone-900">Clock-in PINs</h2>
        <p className="mb-4 text-sm text-stone-500">
          Each caregiver uses this PIN to clock in/out on the shared home tablet — see{" "}
          <span className="font-medium">Clock</span> in the nav.
        </p>

        {employees === null && !error && <CardSkeleton lines={2} />}

        {employees && employees.length > 0 && (
          <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-sm">
            {employees.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1 text-sm font-medium text-stone-900">{e.name}</div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="New PIN"
                  value={pinDrafts[e.id] || ""}
                  onChange={(ev) =>
                    setPinDrafts((d) => ({ ...d, [e.id]: ev.target.value.replace(/\D/g, "") }))
                  }
                  className="w-28 rounded-lg border border-stone-300 px-3 py-2 text-sm tracking-widest focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Button
                  size="sm"
                  onClick={() => handleSetPin(e.id)}
                  disabled={savingPinFor === e.id}
                >
                  {savingPinFor === e.id ? "Saving…" : "Set PIN"}
                </Button>
                {pinMessage?.employeeId === e.id && (
                  <span className={`text-xs ${pinMessage.error ? "text-rose-600" : "text-emerald-700"}`}>
                    {pinMessage.error || "Saved"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
