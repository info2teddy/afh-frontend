// src/pages/Clock.jsx
// Kiosk-style clock in/out — meant to live on a shared home tablet. A
// caregiver picks their own name and enters their PIN; no manager login is
// needed for this specific action, since the tablet itself is already
// signed in as a manager account and PIN-checks each individual action.
//
// Validated first as an interactive mockup the user reviewed and approved
// before this was wired up. Bigger touch targets and a custom numeric
// keypad instead of the OS keyboard, since this is operated by a thumb
// across a room on a shared device — a different context from the rest of
// the app's desktop-oriented forms.
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { ClockKioskHeader } from "../components/ClockKioskHeader";

const SHIFT_TYPES = [
  { value: "day", label: "Day" },
  { value: "overnight", label: "Overnight" },
  { value: "live_in", label: "Live-in" },
];

function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50";

function Keypad({ onDigit, onBackspace }) {
  const keyClass = `aspect-square rounded-2xl bg-stone-100 text-2xl font-semibold text-stone-900 transition-all duration-75 active:scale-[0.92] active:bg-stone-200 ${FOCUS_RING}`;
  return (
    <div className="mb-5 grid grid-cols-3 gap-2.5">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
        <button key={k} type="button" onClick={() => onDigit(k)} className={keyClass}>
          {k}
        </button>
      ))}
      <span />
      <button type="button" onClick={() => onDigit("0")} className={keyClass}>
        0
      </button>
      <button
        type="button"
        onClick={onBackspace}
        aria-label="Backspace"
        className={`aspect-square rounded-2xl bg-stone-100 text-sm font-medium text-stone-500 transition-all duration-75 active:scale-[0.92] active:bg-stone-200 ${FOCUS_RING}`}
      >
        ⌫
      </button>
    </div>
  );
}

export function Clock() {
  const [employees, setEmployees] = useState(null);
  const [openShifts, setOpenShifts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [shiftType, setShiftType] = useState("day");
  const [pin, setPin] = useState("");
  const [sleepExcluded, setSleepExcluded] = useState(0);
  const [sleepInterrupted, setSleepInterrupted] = useState(false);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(null); // { name, out } while the confirmation is showing
  const panelRef = useRef(null);

  function reload() {
    Promise.all([api.kiosk.employees(), api.shifts.open()])
      .then(([e, s]) => {
        setEmployees(e);
        setOpenShifts(s);
      })
      .catch((err) => setLoadError(err.message));
  }

  useEffect(reload, []);

  const selected = employees?.find((e) => e.id === selectedId) || null;
  const openShift = openShifts.find((s) => s.employeeId === selectedId) || null;
  const showSleepFields = openShift && ["overnight", "live_in"].includes(openShift.shiftType);

  function selectEmployee(id) {
    setSelectedId(id);
    setPin("");
    setError(null);
    setShiftType("day");
    setSleepExcluded(0);
    setSleepInterrupted(false);
  }

  function closePanel() {
    setSelectedId(null);
  }

  useEffect(() => {
    if (!selected) return;
    panelRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === "Escape") closePanel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  function addDigit(d) {
    setError(null);
    setPin((p) => (p.length < 6 ? p + d : p));
  }

  function backspace() {
    setError(null);
    setPin((p) => p.slice(0, -1));
  }

  function rejectPin(message) {
    setError(message);
    setPin("");
    setShake(true);
    setTimeout(() => setShake(false), 350);
  }

  function showSuccess(name, wasClockingOut) {
    setSuccess({ name, out: wasClockingOut });
    setTimeout(() => setSuccess(null), 1400);
  }

  async function handleClockIn() {
    setSubmitting(true);
    try {
      await api.shifts.clockIn(selected.id, shiftType, pin);
      const name = selected.name;
      closePanel();
      reload();
      showSuccess(name, false);
    } catch (err) {
      rejectPin(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClockOut() {
    setSubmitting(true);
    try {
      await api.shifts.clockOut(openShift.id, pin, {
        sleepTimeExcludedMinutes: Number(sleepExcluded) || 0,
        sleepInterrupted,
      });
      const name = selected.name;
      closePanel();
      reload();
      showSuccess(name, true);
    } catch (err) {
      rejectPin(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <ClockKioskHeader />

      {loadError && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p>
      )}

      {!employees && !loadError && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[132px] animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      )}

      {employees && (
        <>
          <p className="mb-3.5 ml-1 text-sm text-stone-600">Tap your name to clock in or out</p>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            {employees.map((e) => {
              const isOpen = openShifts.some((s) => s.employeeId === e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => selectEmployee(e.id)}
                  className={`flex flex-col items-center gap-2.5 rounded-2xl border-[1.5px] border-stone-200 bg-white p-5 shadow-sm transition-all duration-150 hover:border-brand-300 active:scale-[0.96] ${FOCUS_RING}`}
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
                      isOpen ? "bg-emerald-600 text-white" : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    {initials(e.name)}
                  </span>
                  <span className="text-center text-[15px] font-semibold text-stone-900">{e.name}</span>
                  <span className={`flex items-center gap-1.5 text-xs ${isOpen ? "font-medium text-emerald-700" : "text-stone-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-emerald-500" : "bg-stone-300"}`} />
                    {isOpen ? "Clocked in" : "Clocked out"}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/45 p-6"
          style={{ animation: "fade-in 150ms ease-out" }}
          onClick={(e) => e.target === e.currentTarget && closePanel()}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="w-full max-w-sm rounded-[28px] bg-white p-7 shadow-2xl focus:outline-none"
            style={{ animation: "panel-in 180ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {initials(selected.name)}
              </span>
              <div className="min-w-0">
                <div className="text-[17px] font-bold text-stone-900">{selected.name}</div>
                <div className="text-[13px] text-stone-500">{openShift ? "Clocking out" : "Clocking in"}</div>
              </div>
              <button
                onClick={closePanel}
                aria-label="Cancel"
                className={`ml-auto rounded-lg p-1.5 text-xl leading-none text-stone-400 hover:bg-stone-100 hover:text-stone-700 ${FOCUS_RING}`}
              >
                ✕
              </button>
            </div>

            {error && <p className="mb-3.5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-center text-sm text-rose-600">{error}</p>}

            {!openShift && (
              <div className="mb-4 grid grid-cols-3 gap-2">
                {SHIFT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setShiftType(t.value)}
                    className={`rounded-xl border-[1.5px] px-1.5 py-2.5 text-[13.5px] font-semibold transition-colors ${FOCUS_RING} ${
                      shiftType === t.value
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-stone-200 text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {openShift && showSleepFields && (
              <div className="mb-4 space-y-3 rounded-xl bg-stone-50 p-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-600" htmlFor="clock-sleep-excluded">
                    Sleep time excluded (minutes)
                  </label>
                  <input
                    id="clock-sleep-excluded"
                    type="number"
                    min="0"
                    value={sleepExcluded}
                    onChange={(e) => setSleepExcluded(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={sleepInterrupted}
                    onChange={(e) => setSleepInterrupted(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500/40"
                  />
                  Sleep was interrupted
                </label>
              </div>
            )}

            <div className="mb-5 flex justify-center gap-3" style={shake ? { animation: "shake 350ms ease" } : undefined}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 transition-all duration-100 ${
                    i < pin.length ? "scale-110 border-brand-600 bg-brand-600" : "border-stone-300"
                  }`}
                />
              ))}
            </div>

            <Keypad onDigit={addDigit} onBackspace={backspace} />

            <button
              type="button"
              disabled={submitting || pin.length < 4}
              onClick={openShift ? handleClockOut : handleClockIn}
              className={`w-full rounded-2xl py-4 text-base font-bold text-white transition-transform active:scale-[0.98] disabled:bg-stone-200 disabled:text-stone-400 ${FOCUS_RING} ${
                openShift ? "bg-accent-600" : "bg-brand-600"
              }`}
            >
              {submitting ? "Working…" : openShift ? "Clock out" : "Clock in"}
            </button>
          </div>
        </div>
      )}

      {success && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3.5 bg-emerald-600"
          style={{ animation: "fade-in 200ms ease-out" }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
            <svg viewBox="0 0 24 24" className="h-11 w-11" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">{success.out ? "Clocked out" : "Clocked in"}</div>
          <div className="text-sm text-white/85">
            {success.out ? `See you next time, ${success.name.split(" ")[0]}` : `Have a great shift, ${success.name.split(" ")[0]}`}
          </div>
        </div>
      )}
    </div>
  );
}
