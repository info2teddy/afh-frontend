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
import { PlacementMatches } from "../components/PlacementMatches";
import { PlacementShortlist } from "../components/PlacementShortlist";
import { PlacementIntroductions } from "../components/PlacementIntroductions";
import { PlacementTasks } from "../components/PlacementTasks";
import { PlacementDocuments } from "../components/PlacementDocuments";
import { PlacementCommunications } from "../components/PlacementCommunications";
import { EscalatePlacementModal } from "../components/EscalatePlacementModal";
import { ChangeProviderModal } from "../components/ChangeProviderModal";

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
  const [showEscalate, setShowEscalate] = useState(false);
  const [showChangeProvider, setShowChangeProvider] = useState(false);
  const [shortlistEntries, setShortlistEntries] = useState(null);

  function load() {
    api.placements.inquiries.get(id).then(setPlacement).catch((err) => setError(err.message));
    api.placements.inquiries.events(id).then(setEvents).catch((err) => setError(err.message));
  }
  function loadShortlist() {
    api.placements.inquiries.shortlist.list(id).then(setShortlistEntries).catch(() => {});
  }
  useEffect(load, [id]);
  useEffect(loadShortlist, [id]);
  useEffect(() => {
    api.placements.facilities.list().then(setFacilities).catch(() => {});
    api.placements.staff.list().then(setStaff).catch(() => {});
  }, []);

  function refreshAfterWorkflowChange() {
    loadShortlist();
    api.placements.inquiries.get(id).then(setPlacement);
    api.placements.inquiries.events(id).then(setEvents);
  }

  async function handleStageChange(stage) {
    if (stage === "CLOSED") {
      setShowClose(true);
      return;
    }
    setStageBusy(true);
    setError(null);
    try {
      await api.placements.inquiries.update(id, { stage });
      refreshAfterWorkflowChange();
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
      await api.placements.inquiries.update(id, { assignedToId: assignedToId || null });
      refreshAfterWorkflowChange();
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
  const isPaused = placement.stage === "PAUSED";

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
          {!placement.placedAt && placement.placedFacilityId && (
            <Button size="sm" variant="secondary" onClick={() => setShowChangeProvider(true)}>
              Change Provider
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setShowEscalate(true)}>
            Escalate
          </Button>
          {!placement.placedAt && (
            <Button size="sm" onClick={() => setShowPlace(true)}>
              Place
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* Stepper — horizontal on tablet/desktop, a vertical journey on phone
          width (spec §28: "Mobile: vertical placement journey"). Same
          done/current/future logic, just laid out differently. */}
      {!isClosed && !isPaused ? (
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {/* Desktop/tablet: horizontal */}
          <div className="hidden overflow-x-auto sm:block">
            <div className="flex min-w-max items-center">
              {STEPPER_STAGES.map((stage, i) => {
                const done = i < currentIndex;
                const current = i === currentIndex;
                return (
                  <div key={stage} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <StepBadge done={done} current={current} index={i} />
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

          {/* Phone width: vertical */}
          <div className="flex flex-col sm:hidden">
            {STEPPER_STAGES.map((stage, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex;
              return (
                <div key={stage} className="flex items-start gap-3">
                  <div className="flex flex-col items-center self-stretch">
                    <StepBadge done={done} current={current} index={i} small />
                    {i < STEPPER_STAGES.length - 1 && (
                      <div className={`mt-1 w-0.5 flex-1 ${i < currentIndex ? "bg-emerald-500" : "bg-stone-200"}`} />
                    )}
                  </div>
                  <span className={`pb-4 text-sm ${current ? "font-medium text-stone-900" : "text-stone-500"}`}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-600">
            {isPaused
              ? "Paused. Pick a stage below to resume it."
              : `Closed${placement.closureReason ? ` — ${CLOSURE_REASON_LABELS[placement.closureReason] || titleCase(placement.closureReason)}` : ""}. Pick a different stage below to reopen it.`}
          </p>
        </div>
      )}

      {/* Next best action */}
      {placement.nextAction?.message && (
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Next Step</div>
            {placement.nextAction.overdue && <StatusPill tone="danger">Overdue</StatusPill>}
          </div>
          <p className="mt-1 text-sm text-stone-800">{placement.nextAction.message}</p>
        </div>
      )}

      {/* Tasks */}
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-stone-900">Tasks</h2>
        <PlacementTasks placementId={id} onChanged={refreshAfterWorkflowChange} />
      </div>

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

      {!placement.placedAt && (
        <>
          {/* Matches */}
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-stone-900">Matches</h2>
            <PlacementMatches
              placementId={id}
              shortlistedIds={new Set((shortlistEntries || []).map((e) => e.facilityId))}
              onShortlist={refreshAfterWorkflowChange}
            />
          </div>

          {/* Shortlist + Family Review */}
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-stone-900">Shortlist &amp; Family Review</h2>
            <PlacementShortlist placement={placement} entries={shortlistEntries} onChanged={refreshAfterWorkflowChange} />
          </div>

          {/* Introductions & decisions */}
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-stone-900">Introductions &amp; Decisions</h2>
            <PlacementIntroductions
              placementId={id}
              shortlistEntries={shortlistEntries}
              onChanged={refreshAfterWorkflowChange}
            />
          </div>
        </>
      )}

      {/* Documents */}
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-stone-900">Documents</h2>
        <PlacementDocuments placementId={id} />
      </div>

      {/* Communications */}
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-stone-900">Communications</h2>
        <PlacementCommunications placementId={id} />
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
          onPlaced={() => {
            setShowPlace(false);
            refreshAfterWorkflowChange();
          }}
        />
      )}

      {showClose && (
        <ClosePlacementModal
          placement={placement}
          onClose={() => setShowClose(false)}
          onClosed={() => {
            setShowClose(false);
            refreshAfterWorkflowChange();
          }}
        />
      )}

      {showEscalate && (
        <EscalatePlacementModal
          placement={placement}
          onClose={() => setShowEscalate(false)}
          onEscalated={() => {
            setShowEscalate(false);
            refreshAfterWorkflowChange();
          }}
        />
      )}

      {showChangeProvider && facilities && (
        <ChangeProviderModal
          placement={placement}
          facilities={placeableFacilities}
          onClose={() => setShowChangeProvider(false)}
          onChanged={() => {
            setShowChangeProvider(false);
            refreshAfterWorkflowChange();
          }}
        />
      )}
    </div>
  );
}

// Shared between the horizontal and vertical stepper layouts. A step that
// just became done gets a brief entrance pop (the same panel-in keyframe
// used for modals elsewhere in this app — automatically respects
// prefers-reduced-motion via the global override in index.css) so
// completing a stage reads as an event, not just a state flip.
function StepBadge({ done, current, index, small }) {
  const size = small ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-xs";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 font-medium ${size} ${
        done
          ? "border-emerald-500 bg-emerald-500 text-white"
          : current
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-stone-300 bg-white text-stone-400"
      }`}
      style={done ? { animation: "panel-in 220ms cubic-bezier(0.16, 1, 0.3, 1)" } : undefined}
    >
      {done ? <Icon name="check" className={small ? "h-3 w-3" : "h-3.5 w-3.5"} /> : index + 1}
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
