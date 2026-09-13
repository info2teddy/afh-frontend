// src/pages/PlacementDetail.jsx
// The actual staged-workflow view for one placement: header, stage stepper,
// next-best-action, overview, and the full timeline (PlacementEvent audit
// trail). The list page (PlacementInquiries.jsx) stays a compact table —
// stage changes and history live here. Phase 1 of the lifecycle build: no
// matching/tasks/documents yet (see the plan doc for the full roadmap).
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { careLevelLabel, titleCase, formatDateTime } from "../lib/format";
import { STEPPER_STAGES, STAGE_LABELS, STAGE_TONE, PLACEMENT_STAGES, CLOSURE_REASON_LABELS } from "../lib/placementStages";
import { StatusPill } from "../components/StatusPill";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { CardSkeleton } from "../components/CardSkeleton";
import { Icon } from "../components/icons";
import { PlaceInquiryModal } from "../components/PlaceInquiryModal";
import { ClosePlacementModal } from "../components/ClosePlacementModal";

const PAYER_LABELS = { private_pay: "Private Pay", medicaid: "Medicaid", split: "Split" };

export function PlacementDetail() {
  const { id } = useParams();
  const [placement, setPlacement] = useState(null);
  const [events, setEvents] = useState(null);
  const [facilities, setFacilities] = useState(null);
  const [staff, setStaff] = useState(null);
  const [error, setError] = useState(null);
  const [stageBusy, setStageBusy] = useState(false);
  const [assignBusy, setAssignBusy] = useState(false);
  const [showPlace, setShowPlace] = useState(false);
  const [showClose, setShowClose] = useState(false);

  function load() {
    api.placements.inquiries.get(id).then(setPlacement).catch((err) => setError(err.message));
    api.placements.inquiries.events(id).then(setEvents).catch((err) => setError(err.message));
  }
  useEffect(load, [id]);
  useEffect(() => {
    api.placements.facilities.list().then(setFacilities).catch(() => {});
    api.placements.staff.list().then(setStaff).catch(() => {});
  }, []);

  async function handleStageChange(stage) {
    if (stage === "CLOSED") {
      setShowClose(true);
      return;
    }
    setStageBusy(true);
    setError(null);
    try {
      const updated = await api.placements.inquiries.update(id, { stage });
      setPlacement(updated);
      api.placements.inquiries.events(id).then(setEvents);
    } catch (err) {
      setError(err.message);
    } finally {
      setStageBusy(false);
    }
  }

  async function handleAssign(assignedToId) {
    setAssignBusy(true);
    setError(null);
    try {
      const updated = await api.placements.inquiries.update(id, { assignedToId: assignedToId || null });
      setPlacement(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setAssignBusy(false);
    }
  }

  if (error && !placement) {
    return <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  }
  if (!placement) return <CardSkeleton lines={4} />;

  const placeableFacilities = facilities?.filter((f) => !f.pendingReview) || [];
  const currentIndex = STEPPER_STAGES.indexOf(placement.stage);
  const isClosed = placement.stage === "CLOSED";

  return (
    <div>
      <Link to="/placement/inquiries" className="mb-4 inline-block text-sm text-stone-500 hover:text-stone-700">
        ← Placements
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{placement.residentName}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {careLevelLabel(placement.careLevelNeeded)} · {PAYER_LABELS[placement.payerType] || titleCase(placement.payerType)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={STAGE_TONE[placement.stage]}>{STAGE_LABELS[placement.stage] || titleCase(placement.stage)}</StatusPill>
          {!placement.placedFacilityId && (
            <Button size="sm" onClick={() => setShowPlace(true)}>
              Place
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* Stepper */}
      {!isClosed ? (
        <div className="mb-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex min-w-max items-center">
            {STEPPER_STAGES.map((stage, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex;
              return (
                <div key={stage} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium ${
                        done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : current
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-stone-300 bg-white text-stone-400"
                      }`}
                    >
                      {done ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className={`w-20 text-center text-[11px] leading-tight ${current ? "font-medium text-stone-900" : "text-stone-500"}`}>
                      {STAGE_LABELS[stage]}
                    </span>
                  </div>
                  {i < STEPPER_STAGES.length - 1 && (
                    <div className={`mx-1 h-0.5 w-8 ${i < currentIndex ? "bg-emerald-500" : "bg-stone-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-600">
            Closed{placement.closureReason ? ` — ${CLOSURE_REASON_LABELS[placement.closureReason] || titleCase(placement.closureReason)}` : ""}.
            Pick a different stage below to reopen it.
          </p>
        </div>
      )}

      {/* Next best action */}
      {placement.nextAction?.message && (
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Next Step</div>
          <p className="mt-1 text-sm text-stone-800">{placement.nextAction.message}</p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Overview */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-stone-900">Overview</h2>
          <dl className="flex flex-col gap-2.5 text-sm">
            <Row label="Care Needs">
              {careLevelLabel(placement.careLevelNeeded)}
              {placement.specialtyCareNeeded ? ` — ${placement.specialtyCareNeeded}` : ""}
            </Row>
            <Row label="Cultural / Language">{placement.culturalPreferences || <span className="text-stone-400">—</span>}</Row>
            <Row label="Urgency">{placement.urgency === "urgent" ? <StatusPill tone="danger">Urgent</StatusPill> : "Normal"}</Row>
            <Row label="Facility">
              {placement.placedFacility ? placement.placedFacility.name : <span className="text-stone-400">Not yet placed</span>}
            </Row>
            <Row label="Assigned To">
              <Select
                className="text-xs"
                value={placement.assignedToId || ""}
                disabled={assignBusy || !staff}
                onChange={(e) => handleAssign(e.target.value)}
              >
                <option value="">Unassigned</option>
                {staff?.map((s) => (
                  <option key={s.id} value={s.id}>{s.email}</option>
                ))}
              </Select>
            </Row>
          </dl>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-stone-900">Contact</h2>
          <dl className="flex flex-col gap-2.5 text-sm">
            <Row label="Name">{placement.contactName || <span className="text-stone-400">—</span>}</Row>
            <Row label="Phone">{placement.contactPhone || <span className="text-stone-400">—</span>}</Row>
            <Row label="Email">{placement.contactEmail || <span className="text-stone-400">—</span>}</Row>
            <Row label="Referral">{placement.referralSource ? titleCase(placement.referralSource) : <span className="text-stone-400">—</span>}</Row>
          </dl>
        </div>
      </div>

      {/* Stage control */}
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-stone-900">Change stage</h2>
        <Select className="w-full sm:w-64" value={placement.stage} disabled={stageBusy} onChange={(e) => handleStageChange(e.target.value)}>
          {PLACEMENT_STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </Select>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-stone-900">Timeline</h2>
        {!events && <CardSkeleton lines={2} />}
        {events && events.length === 0 && <p className="text-sm text-stone-500">No history yet.</p>}
        <div className="flex flex-col gap-3">
          {events && [...events].reverse().map((ev) => (
            <div key={ev.id} className="border-l-2 border-stone-200 pl-3">
              <p className="text-sm text-stone-700">
                {ev.fromStage ? (
                  <>Moved from <strong>{STAGE_LABELS[ev.fromStage] || ev.fromStage}</strong> to <strong>{STAGE_LABELS[ev.toStage] || ev.toStage}</strong></>
                ) : (
                  <>Created as <strong>{STAGE_LABELS[ev.toStage] || ev.toStage}</strong></>
                )}
              </p>
              {ev.note && <p className="text-sm text-stone-500">{ev.note}</p>}
              <p className="mt-0.5 text-xs text-stone-400">
                {ev.changedBy?.email || "System"} · {formatDateTime(ev.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {showPlace && facilities && (
        <PlaceInquiryModal
          inquiry={placement}
          facilities={placeableFacilities}
          onClose={() => setShowPlace(false)}
          onPlaced={(updated) => {
            setShowPlace(false);
            setPlacement(updated);
            api.placements.inquiries.events(id).then(setEvents);
          }}
        />
      )}

      {showClose && (
        <ClosePlacementModal
          placement={placement}
          onClose={() => setShowClose(false)}
          onClosed={(updated) => {
            setShowClose(false);
            setPlacement(updated);
            api.placements.inquiries.events(id).then(setEvents);
          }}
        />
      )}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right text-stone-800">{children}</dd>
    </div>
  );
}
