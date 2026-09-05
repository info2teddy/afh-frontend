// src/components/TrendChart.jsx
// Grouped monthly bar chart for Revenue / Expenses / Payroll — all in dollars,
// so one shared y-axis is correct (see the dataviz guidance against dual axes).
// Colors are the first three slots of the validated categorical palette.
import { useState } from "react";

const SERIES = [
  { key: "revenue", label: "Revenue", color: "#2a78d6" },
  { key: "expenses", label: "Expenses", color: "#eb6834" },
  { key: "payroll", label: "Payroll", color: "#1baf7a" },
];

function niceMax(value) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const residual = value / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return niceResidual * magnitude;
}

// A bar growing from the baseline with only its top corners rounded — a
// plain rect's rx would round the bottom corners too, floating the bar off
// its own baseline.
function topRoundedBarPath(x, y, w, h, r) {
  if (h <= 0) return "";
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

export function TrendChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const width = 720;
  const height = 260;
  const paddingLeft = 60;
  const paddingBottom = 26;
  const paddingTop = 12;
  const paddingRight = 12;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxValue = niceMax(Math.max(1, ...data.flatMap((d) => SERIES.map((s) => d[s.key]))));
  const ySteps = 4;
  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(20, (groupWidth - 10) / SERIES.length);
  const barGap = 2;

  const yFor = (value) => paddingTop + plotHeight - (value / maxValue) * plotHeight;

  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-4 text-xs text-stone-600">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Monthly revenue, expenses, and payroll trend"
      >
        {Array.from({ length: ySteps + 1 }, (_, i) => {
          const value = (maxValue / ySteps) * i;
          const y = yFor(value);
          return (
            <g key={i}>
              <line x1={paddingLeft} x2={width - paddingRight} y1={y} y2={y} stroke="#e1e0d9" strokeWidth={1} />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#898781" fontSize={10}>
                ${Math.round(value).toLocaleString()}
              </text>
            </g>
          );
        })}
        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={yFor(0)}
          y2={yFor(0)}
          stroke="#c3c2b7"
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const groupX = paddingLeft + i * groupWidth;
          const totalBarsWidth = barWidth * SERIES.length + barGap * (SERIES.length - 1);
          const startX = groupX + (groupWidth - totalBarsWidth) / 2;
          const dimmed = hoverIndex !== null && hoverIndex !== i;
          return (
            <g key={d.month}>
              <rect
                x={groupX}
                y={paddingTop}
                width={groupWidth}
                height={plotHeight}
                fill="transparent"
                tabIndex={0}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
              />
              {SERIES.map((s, si) => {
                const value = d[s.key];
                const barHeight = (value / maxValue) * plotHeight;
                const x = startX + si * (barWidth + barGap);
                return (
                  <path
                    key={s.key}
                    d={topRoundedBarPath(x, yFor(value), barWidth, barHeight, 3)}
                    fill={s.color}
                    opacity={dimmed ? 0.45 : 1}
                    style={{ pointerEvents: "none" }}
                  />
                );
              })}
              <text x={groupX + groupWidth / 2} y={height - 8} textAnchor="middle" fill="#898781" fontSize={10}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[9rem] rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{
            left: `${Math.min(88, Math.max(12, ((hoverIndex + 0.5) / data.length) * 100))}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="mb-1.5 font-medium text-stone-900">{data[hoverIndex].label}</div>
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-stone-500">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="font-medium text-stone-900">${data[hoverIndex][s.key].toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
