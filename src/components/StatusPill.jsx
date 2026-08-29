// src/components/StatusPill.jsx
const TONES = {
  success: { bg: "#eaf3de", text: "#27500a" },
  warning: { bg: "#faeeda", text: "#633806" },
  danger: { bg: "#fcebeb", text: "#791f1f" },
  neutral: { bg: "#f1efe8", text: "#444441" },
};

export function StatusPill({ tone = "neutral", children }) {
  const { bg, text } = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 6,
        background: bg,
        color: text,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
