// src/pages/Clock.jsx
// Kiosk-style clock in/out — meant to live on a shared home tablet. A
// caregiver picks their own name and enters their PIN; no manager login is
// needed for this specific action, since the tablet itself is already
// signed in as a manager account and PIN-checks each individual action.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { CardSkeleton } from "../components/CardSkeleton";

const SHIFT_TYPES = [
  { value: "day", label: "Day" },
  { value: "overnight", label: "Overnight" },
  { value: "live_in", label: "Live-in" },
];

export function Clock() {
  const [employees, setEmployees] = useState(null);
  const [openShifts, setOpenShifts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [shiftType, setShiftType] = useState("day");
  const [pin, setPin] = useState("");
  const [sleepExcluded, setSleepExcluded] = useState(0);
  const [sleepInterrupted, setSleepInterrupted] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    Promise.all([api.employees.list(), api.shifts.open()])
      .then(([e, s]) => {
        setEmployees(e);
        setOpenShifts(s);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(reload, []);

  const selected = employees?.find((e) => e.id === selectedId) || null;
  const openShift = openShifts.find((s) => s.employeeId === selectedId) || null;

  function selectEmployee(id) {
    setSelectedId(id);
    setPin("");
    setError(null);
    setShiftType("day");
    setSleepExcluded(0);
    setSleepInterrupted(false);
  }

  async function handleClockIn() {
    setSubmitting(true);
    setError(null);
    try {
      await api.shifts.clockIn(selected.id, shiftType, pin);
      selectEmployee(null);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClockOut() {
    setSubmitting(true);
    setError(null);
    try {
      await api.shifts.clockOut(openShift.id, pin, {
        sleepTimeExcludedMinutes: Number(sleepExcluded) || 0,
        sleepInterrupted,
      });
      selectEmployee(null);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const showSleepFields = openShift && ["overnight", "live_in"].includes(openShift.shiftType);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Clock in / out</h1>
        <p className="mt-1 text-sm text-stone-500">Pick your name, then enter your PIN.</p>
      </div>

      {!employees && <CardSkeleton lines={3} />}

      {employees && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {employees.map((e) => {
            const isOpen = openShifts.some((s) => s.employeeId === e.id);
            const isSelected = selectedId === e.id;
            return (
              <button
                key={e.id}
                onClick={() => selectEmployee(e.id)}
                className={`rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <div className="font-medium text-stone-900">{e.name}</div>
                <div className={`mt-1 text-xs ${isOpen ? "text-emerald-700" : "text-stone-500"}`}>
                  {isOpen ? "Clocked in" : "Clocked out"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="mt-6 max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 font-medium text-stone-900">{selected.name}</div>

          {error && (
            <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          )}

          {!openShift && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Shift type</label>
              <Select value={shiftType} onChange={(e) => setShiftType(e.target.value)} className="w-full">
                {SHIFT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </div>
          )}

          {openShift && showSleepFields && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Sleep time excluded (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={sleepExcluded}
                  onChange={(e) => setSleepExcluded(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={sleepInterrupted}
                  onChange={(e) => setSleepInterrupted(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500/40"
                />
                Sleep was interrupted
              </label>
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-stone-700">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm tracking-widest focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
            />
          </div>

          <Button
            variant="primary"
            className="w-full"
            disabled={submitting || pin.length < 4}
            onClick={openShift ? handleClockOut : handleClockIn}
          >
            {submitting ? "Working…" : openShift ? "Clock out" : "Clock in"}
          </Button>
        </div>
      )}
    </div>
  );
}
