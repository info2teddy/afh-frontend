// src/components/PlacementTasks.jsx
// Auto-generated to-dos (spec §17 move-in checklist, §19 follow-ups, §21
// general tasks) — grouped by type for the visual distinction the spec
// wants, even though they're all one PlacementTask model underneath.
// Checking a box completes the task; completing a follow-up auto-creates
// the next one server-side (see PATCH /placements/tasks/:id).
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { StatusPill } from "./StatusPill";
import { CardSkeleton } from "./CardSkeleton";

function TaskRow({ task, onToggle, busy }) {
  const tone = task.status === "overdue" ? "danger" : task.status === "done" ? "success" : "neutral";
  return (
    <div className="flex items-start gap-3 py-2">
      <input
        type="checkbox"
        checked={task.status === "done"}
        disabled={busy}
        onChange={(e) => onToggle(task, e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500/40"
      />
      <div className="flex-1">
        <span className={task.status === "done" ? "text-sm text-stone-400 line-through" : "text-sm text-stone-800"}>{task.title}</span>
        {task.dueDate && task.status !== "done" && (
          <span className={`ml-2 text-xs ${task.status === "overdue" ? "text-rose-600" : "text-stone-400"}`}>
            due {formatDateTime(task.dueDate)}
          </span>
        )}
      </div>
      {task.status === "overdue" && <StatusPill tone={tone}>Overdue</StatusPill>}
    </div>
  );
}

export function PlacementTasks({ placementId, onChanged }) {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  function load() {
    api.placements.inquiries.tasks.list(placementId).then(setTasks).catch((err) => setError(err.message));
  }
  useEffect(load, [placementId]);

  async function handleToggle(task, checked) {
    setBusyId(task.id);
    setError(null);
    try {
      await api.placements.inquiries.tasks.update(task.id, { completedAt: checked ? new Date().toISOString() : null });
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!tasks) return <CardSkeleton lines={2} />;
  if (tasks.length === 0) return <p className="text-sm text-stone-500">No tasks yet.</p>;

  const checklist = tasks.filter((t) => t.type === "move_in_checklist");
  const followups = tasks.filter((t) => t.type.startsWith("followup_"));
  // Everything else, not a whitelist — so a new task type (e.g. escalation)
  // always shows up somewhere instead of silently disappearing.
  const general = tasks.filter((t) => t.type !== "move_in_checklist" && !t.type.startsWith("followup_"));
  const checklistDone = checklist.filter((t) => t.status === "done").length;

  return (
    <div className="flex flex-col gap-5">
      {general.length > 0 && (
        <div>
          <div className="divide-y divide-stone-100">
            {general.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={handleToggle} busy={busyId === t.id} />
            ))}
          </div>
        </div>
      )}

      {checklist.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">Move-In Checklist</h3>
            <span className="text-xs text-stone-500">{checklistDone} of {checklist.length} complete</span>
          </div>
          <div className="divide-y divide-stone-100">
            {checklist.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={handleToggle} busy={busyId === t.id} />
            ))}
          </div>
        </div>
      )}

      {followups.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">Follow-Up</h3>
          <div className="divide-y divide-stone-100">
            {followups.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={handleToggle} busy={busyId === t.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
