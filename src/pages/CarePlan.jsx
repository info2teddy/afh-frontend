// src/pages/CarePlan.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { CardSkeleton } from "../components/CardSkeleton";

const today = () => new Date().toISOString().slice(0, 10);

const ACCEPTED_DOCUMENT_TYPES = "application/pdf,image/png,image/jpeg,image/webp";

export function CarePlan() {
  const [residents, setResidents] = useState([]);
  const [residentId, setResidentId] = useState("");
  const [planDate, setPlanDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.residents.list().then(setResidents).catch((err) => setError(err.message));
  }, []);

  function loadPlans(id) {
    api.carePlans
      .list(id)
      .then(setPlans)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (residentId) loadPlans(residentId);
    else setPlans(null);
  }, [residentId]);

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 10 * 1024 * 1024) {
      setDocumentError("File is too large — 10MB max.");
      setDocumentFile(null);
      e.target.value = "";
      return;
    }
    setDocumentError(null);
    setDocumentFile(file);
  }

  async function handleGenerate() {
    if (!residentId || !planDate) {
      setError("Pick a resident and a date first.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      await api.carePlans.generate(residentId, planDate, { notes, document: documentFile });
      setNotes("");
      setDocumentFile(null);
      loadPlans(residentId);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const inputClass =
    "rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Care plan</h1>
        <p className="mt-1 text-sm text-stone-500">
          AI-drafted, date-specific care plan — review and adjust before use
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={residentId} onChange={(e) => setResidentId(e.target.value)} className="w-56">
          <option value="">Select a resident…</option>
          {residents.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <input
          type="date"
          value={planDate}
          onChange={(e) => setPlanDate(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5">
        <p className="mb-3 text-sm font-medium text-stone-700">
          Optional: give the AI more to work with
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for this resident — e.g. recent fall risk, dietary restriction, mood changes…"
            rows={3}
            className={`${inputClass} flex-1 resize-none`}
          />
          <div className="flex flex-col gap-1 sm:w-64">
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-sm text-stone-500 hover:border-emerald-500 hover:text-emerald-700">
              {documentFile ? documentFile.name : "Upload a document (PDF or image)"}
              <input
                type="file"
                accept={ACCEPTED_DOCUMENT_TYPES}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {documentFile && (
              <button
                type="button"
                onClick={() => setDocumentFile(null)}
                className="self-start text-xs text-stone-400 hover:text-rose-600"
              >
                Remove file
              </button>
            )}
            {documentError && <p className="text-xs text-rose-600">{documentError}</p>}
          </div>
        </div>
        <p className="mt-2 text-xs text-stone-400">
          e.g. a physician's order, discharge summary, or assessment form — the AI will ground the plan in
          whatever you provide here instead of using generic placeholders.
        </p>
      </div>

      <div className="mb-6">
        <Button variant="primary" onClick={handleGenerate} disabled={generating || !residentId}>
          {generating ? "Generating…" : "Generate care plan"}
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {!residentId && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          Select a resident to view or generate care plans.
        </div>
      )}

      {residentId && generating && <CardSkeleton lines={4} />}

      {residentId && plans && plans.length === 0 && !generating && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          No care plans generated yet for this resident.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {plans?.map((p) => (
          <div key={p.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-stone-900">
                {new Date(p.planDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                {p.model}
              </span>
            </div>
            {(p.sourceNotes || p.sourceDocumentName) && (
              <div className="mb-3 flex flex-wrap gap-2">
                {p.sourceNotes && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Based on staff notes
                  </span>
                )}
                {p.sourceDocumentName && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Based on {p.sourceDocumentName}
                  </span>
                )}
              </div>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{p.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
