// src/components/ResidentCard.jsx
// One resident on the Residents page: photo, name, three quick facts, the
// safety alerts staff need at a glance, and diet / assessment status. The
// compare checkbox shows on hover (always on touch screens).
import { Icon } from "./icons";
import { ResidentPhoto } from "./ResidentPhoto";
import { careLevelShortLabel } from "../lib/format";
import { residentAge, hasAllergy, planDue } from "../lib/residentFacts";

function shortPayer(r) {
  if (r.payerType === "private_pay") return "Private";
  if (r.payerType === "medicaid") return "Medicaid";
  return "Split";
}

function Alerts({ resident: r }) {
  const items = [];
  if (r.dnrStatus === "yes") items.push({ icon: "dnr", text: "DNR", crit: true });
  if (hasAllergy(r)) items.push({ icon: "warning", text: `Allergy: ${r.allergies}`, crit: true });
  if (r.fallRisk === "high") items.push({ icon: "fall", text: "High fall risk" });
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[12.5px] text-stone-400">
        <Icon name="check" className="h-3.5 w-3.5 shrink-0" />
        No alerts
      </div>
    );
  }
  return items.map((a) => (
    <div key={a.icon} className={`flex min-w-0 items-center gap-2 text-[12.5px] ${a.crit ? "font-medium text-rose-700" : "text-stone-600"}`}>
      <Icon name={a.icon} className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{a.text}</span>
    </div>
  ));
}

// carePlanStatus: "on_file" | "needs_plan" | undefined (still loading)
export function ResidentCard({ resident: r, carePlanStatus, picked, onOpen, onTogglePick }) {
  const due = planDue(r);
  const age = residentAge(r.dateOfBirth);
  const away = r.status !== "active";
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${r.name}`}
      onClick={() => onOpen(r)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(r);
        }
      }}
      className={`group relative flex cursor-pointer flex-col gap-3 rounded-[20px] border bg-white p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_10px_28px_-12px_rgba(28,25,23,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        picked ? "border-brand-600 ring-[3px] ring-brand-100" : "border-stone-200"
      } ${away ? "opacity-80" : ""}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden rounded-[14px]">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <ResidentPhoto resident={r} />
        </div>
        {r.status !== "active" && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-stone-900/55 py-0.5 pr-2.5 pl-2 text-[11.5px] font-medium text-white capitalize backdrop-blur-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${r.status === "discharging" ? "bg-amber-400" : "bg-stone-300"}`} />
            {r.status}
          </span>
        )}
        {r.room && (
          <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-white/90 px-2 py-0.5 text-xs font-semibold text-stone-900 backdrop-blur-sm">
            Room {r.room}
          </span>
        )}
        <button
          type="button"
          aria-pressed={picked}
          aria-label={`${picked ? "Remove" : "Add"} ${r.name} ${picked ? "from" : "to"} compare`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePick(r);
          }}
          className={`absolute top-2.5 right-2.5 grid h-7 w-7 place-items-center rounded-[9px] border-[1.5px] backdrop-blur-sm transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white [@media(hover:none)]:opacity-100 ${
            picked ? "border-brand-600 bg-brand-600 opacity-100" : "border-white/95 bg-stone-900/30 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          }`}
        >
          <Icon name="check" className={`h-3.5 w-3.5 text-white ${picked ? "" : "opacity-0"}`} />
        </button>
      </div>

      <div className="grid gap-2.5 px-1.5 pb-1.5">
        <div className="font-display text-[19px] leading-tight font-medium tracking-tight text-stone-900">{r.name}</div>
        <dl className="grid grid-cols-[1fr_1fr_1.45fr] border-y border-stone-100 py-2">
          {[
            ["Age", age ?? "—"],
            ["Level", careLevelShortLabel(r.careLevel).replace(/^Level\s*/, "")],
            ["Payer", shortPayer(r)],
          ].map(([label, value], i) => (
            <div key={label} className={`grid min-w-0 gap-px ${i > 0 ? "border-l border-stone-100 pl-2.5" : ""}`}>
              <dt className="text-[10.5px] font-semibold tracking-[0.07em] text-stone-400 uppercase">{label}</dt>
              <dd className="truncate font-medium text-stone-700 tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="grid min-h-[44px] content-start gap-1.5">
          <Alerts resident={r} />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
          <span className="truncate">{r.diet || <span className="text-stone-400">Diet not set</span>}</span>
          {due ? (
            <span className="shrink-0 font-medium text-accent-700">{due.label}</span>
          ) : carePlanStatus === "needs_plan" ? (
            <span className="shrink-0 font-medium text-accent-700">No care plan</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
