// src/components/ResidentQuickView.jsx
// The panel that slides in when a resident card is clicked: the details a
// caregiver or manager reaches for most (code status, allergies, diet,
// mobility, contacts) without leaving the Residents page. Loads the full
// record, so opening it counts as a view in the access history.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { careLevelShortLabel, payerLabel, formatFriendlyDate } from "../lib/format";
import { residentAge, hasAllergy, planDue, FALL_RISK_LABELS } from "../lib/residentFacts";
import { ResidentPhoto } from "./ResidentPhoto";
import { StatusPill } from "./StatusPill";
import { Button } from "./Button";
import { CardSkeleton } from "./CardSkeleton";

function Section({ title, children }) {
  return (
    <section className="px-5 pt-4">
      <h3 className="mb-2.5 text-xs font-semibold tracking-[0.06em] text-stone-500 uppercase">{title}</h3>
      <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">{children}</div>
    </section>
  );
}

function Row({ label, value, crit }) {
  return (
    <div className="grid gap-0.5 px-4 py-2.5">
      <span className="text-[11.5px] text-stone-500">{label}</span>
      <span className={`text-sm font-medium ${crit ? "text-rose-700" : "text-stone-900"}`}>
        {value || <span className="font-normal text-stone-400">Not recorded</span>}
      </span>
    </div>
  );
}

function contactLine(c) {
  if (!c?.name) return null;
  return [c.name, c.phone].filter(Boolean).join(" · ");
}

export function ResidentQuickView({ residentId, picked, onTogglePick, onClose }) {
  const [r, setR] = useState(null);
  const [error, setError] = useState(null);
  const closeRef = useRef(null);

  useEffect(() => {
    setR(null);
    setError(null);
    api.residents.get(residentId).then(setR).catch((err) => setError(err.message));
  }, [residentId]);

  // Focus the close button once on open; Escape always calls the latest onClose.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const contact = (role) => r?.contacts?.find((c) => c.role === role);
  const due = r && planDue(r);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-stone-900/25" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={r ? `${r.name} details` : "Resident details"}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto bg-stone-50 pb-[env(safe-area-inset-bottom)] shadow-[-12px_0_32px_rgba(0,0,0,0.12)]"
        style={{ animation: "panel-in 220ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-2xl leading-none text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        >
          ×
        </button>

        {error && <p className="m-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {!r && !error && (
          <div className="p-5">
            <CardSkeleton lines={5} />
          </div>
        )}

        {r && (
          <>
            <div className="grid grid-cols-[84px_1fr] items-center gap-4 border-b border-stone-200 bg-white p-5 sm:grid-cols-[112px_1fr]">
              <div className="h-[84px] w-[84px] overflow-hidden rounded-[20px] sm:h-28 sm:w-28">
                <ResidentPhoto resident={r} size="large" />
              </div>
              <div className="min-w-0 pr-8">
                <div className="font-display text-[26px] leading-tight font-medium text-stone-900">{r.name}</div>
                <div className="mt-0.5 text-[13px] text-stone-500">
                  {[r.room && `Room ${r.room}`, r.home?.name].filter(Boolean).join(" · ")}
                </div>
                {r.status !== "active" && (
                  <div className="mt-2">
                    <StatusPill tone={r.status === "discharging" ? "warning" : "neutral"}>{r.status}</StatusPill>
                  </div>
                )}
              </div>
            </div>

            <section className="px-5 pt-4">
              <h3 className="mb-2.5 text-xs font-semibold tracking-[0.06em] text-stone-500 uppercase">At a glance</h3>
              <dl className="grid grid-cols-2 rounded-2xl border border-stone-200 bg-white">
                {[
                  ["Age", residentAge(r.dateOfBirth)],
                  ["Care level", careLevelShortLabel(r.careLevel)],
                  ["Moved in", formatFriendlyDate(r.moveInDate)],
                  ["Next assessment", r.nextAssessmentDate ? formatFriendlyDate(r.nextAssessmentDate) : null],
                ].map(([label, value], i) => (
                  <div key={label} className={`px-4 py-2.5 ${i >= 2 ? "border-t border-stone-100" : ""} ${i % 2 ? "border-l border-stone-100" : ""}`}>
                    <dt className="text-[11.5px] text-stone-500">{label}</dt>
                    <dd className={`text-sm font-medium tabular-nums ${label === "Next assessment" && due ? "text-accent-700" : "text-stone-900"}`}>
                      {value ?? <span className="font-normal text-stone-400">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <Section title="Health & safety">
              <Row
                label="Code status"
                value={r.dnrStatus === "yes" ? "DNR — do not resuscitate" : r.dnrStatus === "no" ? "Full code" : null}
                crit={r.dnrStatus === "yes"}
              />
              <Row label="Allergies" value={r.allergies} crit={hasAllergy(r)} />
              <Row label="Diagnosis" value={r.diagnosis} />
              <Row label="Diet" value={r.diet} />
              <Row
                label="Mobility · fall risk"
                value={[r.mobility, r.fallRisk && `${FALL_RISK_LABELS[r.fallRisk]} fall risk`].filter(Boolean).join(" · ")}
                crit={r.fallRisk === "high" && !r.mobility}
              />
              <Row label="Cognition & communication" value={r.cognition} />
            </Section>

            <Section title="Contacts">
              <Row label="Emergency contact" value={contactLine(contact("emergency_contact_1"))} />
              <Row label="Primary doctor" value={contactLine(contact("primary_care_doctor"))} />
              <Row label="Pharmacy" value={contactLine(contact("pharmacy"))} />
            </Section>

            {r.payerType && (
              <Section title="Billing">
                <Row label="Payer" value={payerLabel(r)} />
              </Section>
            )}

            <div className="flex flex-wrap gap-2 px-5 pt-5 pb-6">
              <Link to={`/residents/${r.id}`}>
                <Button variant="primary">Open full profile</Button>
              </Link>
              <Button variant="secondary" onClick={() => window.open(`/residents/${r.id}/face-sheet`, "_blank", "noopener,noreferrer")}>
                Print face sheet
              </Button>
              <Button variant="secondary" onClick={() => onTogglePick(r)}>
                {picked ? "Remove from compare" : "Add to compare"}
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
