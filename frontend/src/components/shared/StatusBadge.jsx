const defaultColorMap = {
  active: {
    dot: "bg-[var(--color-success)]",
    text: "text-[var(--color-success)]",
  },
  pending: {
    dot: "bg-[var(--color-warning)]",
    text: "text-[var(--color-warning)]",
  },
  inactive: { dot: "bg-slate-400", text: "text-slate-600" },
  error: {
    dot: "bg-[var(--color-danger)]",
    text: "text-[var(--color-danger)]",
  },
  default: { dot: "bg-slate-400", text: "text-slate-600" },
};

export function StatusBadge({ status, colorMap = {}, className = "" }) {
  const normalized = (status || "unknown").toLowerCase();
  const colors =
    colorMap[normalized] ||
    defaultColorMap[normalized] ||
    defaultColorMap.default;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium ${colors.text} ${className}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
      <span>{status}</span>
    </span>
  );
}
