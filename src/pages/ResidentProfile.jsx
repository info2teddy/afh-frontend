// src/pages/ResidentProfile.jsx
// The resident "360" — replaces the old invoice-only page. Tabs cover what
// the app actually has real data for (Overview, Care Plan, Documents, Notes,
// Billing). Medication and Appointments were deliberately left out — this is
// a real, licensed AFH's data, and there's no medication-administration or
// scheduling system behind either yet.
import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { careLevelShortLabel, payerLabel, formatFriendlyDate } from "../lib/format";
import { StatusPill } from "../components/StatusPill";
import { Button } from "../components/Button";
import { CardSkeleton } from "../components/CardSkeleton";
import { ScrollFade } from "../components/ScrollFade";
import { ResidentStatusModal } from "../components/ResidentStatusModal";

const STATUS_TONE = { active: "success", discharging: "warning", discharged: "neutral" };
const AUTH_TONE = { approved: "success", pending: "warning", denied: "danger" };
const todayUTC = () => new Date().toISOString().slice(0, 10);

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "care-plan", label: "Care Plan" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "billing", label: "Billing" },
];

export function ResidentProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [resident, setResident] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(searchParams.get("tab") || "overview");
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    api.residents.get(id).then(setResident).catch((err) => setError(err.message));
  }, [id]);

  return (
    <div>
      <Link to="/residents" className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        ← Residents
      </Link>

      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {resident ? resident.name : "Resident"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {resident
              ? `${careLevelShortLabel(resident.careLevel)} · ${payerLabel(resident)} · ${resident.status}`
              : "Loading…"}
          </p>
        </div>
        {resident && (
          <Button variant="secondary" size="sm" onClick={() => setShowStatusModal(true)}>
            Update status
          </Button>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="mb-6 border-b border-stone-200">
        <ScrollFade innerClassName="no-scrollbar flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors ${
                tab === t.key
                  ? "border-brand-600 font-medium text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </ScrollFade>
      </div>

      {!resident && !error && <CardSkeleton lines={4} />}

      {resident && tab === "overview" && <OverviewTab resident={resident} onGoToTab={setTab} />}
      {resident && tab === "care-plan" && <CarePlanTab residentId={id} />}
      {resident && tab === "documents" && <DocumentsTab residentId={id} />}
      {resident && tab === "notes" && <NotesTab residentId={id} />}
      {resident && tab === "billing" && <BillingTab residentId={id} />}

      {showStatusModal && (
        <ResidentStatusModal
          resident={resident}
          onClose={() => setShowStatusModal(false)}
          onSaved={(updated) => {
            setResident((prev) => ({ ...prev, ...updated }));
            setShowStatusModal(false);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-1 text-sm text-stone-900">{children ?? <span className="text-stone-400">—</span>}</div>
    </div>
  );
}

function age(dateOfBirth) {
  if (!dateOfBirth) return null;
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function OverviewTab({ resident, onGoToTab }) {
  const [latestPlan, setLatestPlan] = useState(undefined); // undefined = loading, null = none on file, object = latest

  useEffect(() => {
    api.carePlans
      .list(resident.id)
      .then((plans) => setLatestPlan(plans[0] || null))
      .catch(() => setLatestPlan(null));
  }, [resident.id]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Field label="Room">{resident.room}</Field>
          <Field label="Age">{age(resident.dateOfBirth)}</Field>
          <Field label="Move-in date">{formatFriendlyDate(resident.moveInDate)}</Field>
          <Field label="Care level">{careLevelShortLabel(resident.careLevel)}</Field>
          <Field label="Payer">{payerLabel(resident)}</Field>
          <Field label="Status">
            <StatusPill tone={STATUS_TONE[resident.status] || "neutral"}>{resident.status}</StatusPill>
          </Field>
          <Field label="Next assessment">
            {resident.nextAssessmentDate ? formatFriendlyDate(resident.nextAssessmentDate) : null}
          </Field>
          <Field label="Authorization">
            {resident.authorizationStatus ? (
              <StatusPill tone={AUTH_TONE[resident.authorizationStatus] || "neutral"}>
                {resident.authorizationStatus}
              </StatusPill>
            ) : null}
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Negotiated Care Plan (NCP)</h2>
            {latestPlan && <p className="mt-1 text-sm text-stone-500">Last updated {formatFriendlyDate(latestPlan.planDate)}.</p>}
            {latestPlan === null && <p className="mt-1 text-sm text-stone-500">No care plan on file yet.</p>}
          </div>
          {latestPlan && <StatusPill tone="success">On file</StatusPill>}
          {latestPlan === null && <StatusPill tone="warning">Needs plan</StatusPill>}
        </div>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => onGoToTab("care-plan")}>
          Go to Care Plan →
        </Button>
      </div>
    </div>
  );
}

function PlaceholderTab({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
      {text}
    </div>
  );
}

// The AI writes plan content in a small markdown subset — "## " section
// headers, "- " bullets, "**bold**" inline — so it renders as a structured
// NCP document instead of a wall of text. See buildPrompt in the backend's
// carePlans.js for the exact contract.
const FIELD_LINE_RE = /^\*\*([^*]+):\*\*\s*(.*)$/;
const isTableRuleRow = (cells) => cells.every((c) => /^:?-+:?$/.test(c));
const splitTableRow = (line) =>
  line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

function CarePlanContent({ text }) {
  const lines = text.split("\n");
  const blocks = [];
  let currentList = null;
  let currentFields = null;

  function flushList() {
    if (currentList) {
      blocks.push({ type: "list", items: currentList });
      currentList = null;
    }
  }
  function flushFields() {
    if (currentFields) {
      blocks.push({ type: "fields", items: currentFields });
      currentFields = null;
    }
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      flushFields();
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      flushFields();
      blocks.push({ type: "heading", text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("|")) {
      flushList();
      flushFields();
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines.map(splitTableRow).filter((cells) => !isTableRuleRow(cells));
      if (rows.length > 0) {
        blocks.push({ type: "table", header: rows[0], rows: rows.slice(1) });
      }
      continue;
    }
    if (line.startsWith("- ")) {
      flushFields();
      (currentList ||= []).push(line.slice(2).trim());
      i++;
      continue;
    }
    const fieldMatch = line.match(FIELD_LINE_RE);
    if (fieldMatch) {
      flushList();
      (currentFields ||= []).push({ label: fieldMatch[1].trim(), value: fieldMatch[2].trim() });
      i++;
      continue;
    }
    flushList();
    flushFields();
    blocks.push({ type: "para", text: line });
    i++;
  }
  flushList();
  flushFields();

  function renderInline(str) {
    return str.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h3
              key={i}
              className="mt-2 border-b border-stone-200 pb-1.5 text-sm font-semibold uppercase tracking-wide text-brand-700 first:mt-0"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "fields") {
          return (
            <dl key={i} className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {block.items.map((f, j) => (
                <div key={j}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{f.label}</dt>
                  <dd className="mt-0.5 text-sm text-stone-900">{f.value ? renderInline(f.value) : "—"}</dd>
                </div>
              ))}
            </dl>
          );
        }
        if (block.type === "table") {
          return (
            <div key={i} className="overflow-hidden rounded-xl border border-stone-200">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-stone-50/80 text-xs font-medium uppercase tracking-wide text-stone-500">
                      {block.header.map((cell, j) => (
                        <th key={j} className="border-b border-stone-200 px-4 py-2.5 align-top">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {block.rows.map((row, r) => (
                      <tr key={r} className="align-top odd:bg-white even:bg-stone-50/40">
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={`px-4 py-2.5 leading-relaxed text-stone-700 ${c === 0 ? "font-medium text-stone-900" : ""}`}
                          >
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-stone-700">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-stone-700">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function CarePlanTab({ residentId }) {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  function load() {
    api.carePlans.list(residentId).then(setPlans).catch((err) => setError(err.message));
  }
  useEffect(load, [residentId]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await api.carePlans.generate(residentId, todayUTC(), { notes, document: documentFile });
      setNotes("");
      setDocumentFile(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const inputClass =
    "rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

  const current = plans?.[0] || null;
  const history = plans?.slice(1) || [];

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5">
        <p className="mb-1 text-sm font-medium text-stone-700">
          {current ? "Update the Negotiated Care Plan" : "Draft the Negotiated Care Plan"}
        </p>
        <p className="mb-3 text-xs text-stone-500">
          Describe what's changed — a new diagnosis, behavior, ADL need, medication, or discharge instructions — or
          attach a physician's order or assessment form.
          {current ? " The existing plan carries forward and is only updated where the new information applies." : ""}
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What's changed for this resident?"
          rows={3}
          className={`${inputClass} mb-3 w-full resize-none`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700">
            {documentFile ? documentFile.name : "Upload a document"}
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <Button variant="primary" onClick={handleGenerate} disabled={generating}>
            {generating ? "Drafting…" : current ? "Update care plan" : "Draft care plan"}
          </Button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {!plans && <CardSkeleton lines={3} />}
      {plans && plans.length === 0 && <PlaceholderTab text="No Negotiated Care Plan on file yet for this resident." />}

      {current && (
        <div
          className="mb-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          style={{ animation: "panel-in 220ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold text-stone-900">Current Negotiated Care Plan</div>
              <div className="text-xs text-stone-400">Last updated {formatFriendlyDate(current.planDate)}</div>
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">{current.model}</span>
          </div>
          <CarePlanContent text={current.content} />
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="rounded text-sm font-medium text-stone-500 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40"
          >
            {showHistory ? "Hide" : "Show"} revision history ({history.length})
          </button>
          {showHistory && (
            <div className="mt-4 flex flex-col gap-4">
              {history.map((p) => (
                <div key={p.id} className="rounded-2xl border border-stone-200 bg-stone-50/60 p-6">
                  <div className="mb-3 text-xs font-medium text-stone-400">{formatFriendlyDate(p.planDate)}</div>
                  <CarePlanContent text={p.content} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ residentId }) {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.carePlans.list(residentId).then(setPlans).catch((err) => setError(err.message));
  }, [residentId]);

  const docs = plans?.filter((p) => p.sourceDocumentName) || [];

  return (
    <div>
      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!plans && <CardSkeleton lines={3} />}
      {plans && docs.length === 0 && (
        <PlaceholderTab text="No documents yet — files uploaded when generating a care plan (physician's orders, assessments, etc.) show up here." />
      )}
      {docs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="divide-y divide-stone-100">
            {docs.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5 text-sm transition-colors hover:bg-stone-50">
                <div>
                  <div className="font-medium text-stone-900">{p.sourceDocumentName}</div>
                  <div className="text-xs text-stone-400">Attached {formatFriendlyDate(p.planDate)}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => api.carePlans.openDocument(p.id)}>
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotesTab({ residentId }) {
  const [notes, setNotes] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api.residents.notes.list(residentId).then(setNotes).catch((err) => setError(err.message));
  }
  useEffect(load, [residentId]);

  async function handleAdd() {
    if (!draft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.residents.notes.create(residentId, draft);
      setDraft("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note about this resident…"
          rows={3}
          className="mb-3 w-full resize-none rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <Button variant="primary" size="sm" onClick={handleAdd} disabled={saving || !draft.trim()}>
          {saving ? "Adding…" : "Add note"}
        </Button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!notes && <CardSkeleton lines={2} />}
      {notes && notes.length === 0 && <PlaceholderTab text="No notes yet." />}

      <div className="flex flex-col gap-3">
        {notes?.map((n) => (
          <div
            key={n.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            style={{ animation: "panel-in 220ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <p className="text-sm text-stone-700">{n.content}</p>
            <p className="mt-2 text-xs text-stone-400">
              {n.author?.email || "Unknown"} · {formatFriendlyDate(n.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_TONE_INVOICE = { draft: "warning", sent: "success", paid: "success", overdue: "danger" };

function BillingTab({ residentId }) {
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState(null);
  const [pushing, setPushing] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating] = useState(false);

  function firstAndLastOfMonth(monthStr) {
    const [year, mo] = monthStr.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year, mo, 0)).getUTCDate();
    const pad = (n) => String(n).padStart(2, "0");
    return { start: `${year}-${pad(mo)}-01`, end: `${year}-${pad(mo)}-${pad(lastDay)}` };
  }

  function load() {
    api.invoices
      .list(residentId)
      .then((data) => setInvoices(data.sort((a, b) => new Date(b.billingPeriodStart) - new Date(a.billingPeriodStart))))
      .catch((err) => setError(err.message));
  }
  useEffect(load, [residentId]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const { start, end } = firstAndLastOfMonth(month);
      await api.invoices.generate({ residentId, periodStart: start, periodEnd: end });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePush(invoiceId) {
    setPushing(invoiceId);
    setError(null);
    try {
      await api.invoices.pushToQuickBooks(invoiceId);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPushing(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <Button variant="primary" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating…" : "Generate invoice for this month"}
        </Button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!invoices && <CardSkeleton lines={3} />}
      {invoices && invoices.length === 0 && <PlaceholderTab text="No invoices generated yet for this resident." />}

      <div className="flex flex-col gap-4">
        {invoices?.map((inv) => (
          <div
            key={inv.id}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            style={{ animation: "panel-in 220ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-semibold text-stone-900">
                {new Date(inv.billingPeriodStart).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </div>
              <StatusPill tone={STATUS_TONE_INVOICE[inv.status]}>{inv.status}</StatusPill>
            </div>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {inv.lineItems.map((li) => (
                  <tr key={li.id} className="border-b border-stone-100">
                    <td className="py-2 text-stone-600">{li.description}</td>
                    <td className="py-2 text-right text-stone-900">${Number(li.amount).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3 font-medium text-stone-900">Total</td>
                  <td className="pt-3 text-right font-semibold text-stone-900">${Number(inv.totalAmount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            {inv.status === "draft" && (
              <Button
                variant="primary"
                className="mt-5"
                onClick={() => handlePush(inv.id)}
                disabled={pushing === inv.id}
              >
                {pushing === inv.id ? "Pushing…" : "Push to QuickBooks"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
