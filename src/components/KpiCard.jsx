const PALETTE = {
  blue:   { border: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8", muted: "#93c5fd" },
  red:    { border: "#ef4444", bg: "#fef2f2", text: "#b91c1c", muted: "#fca5a5" },
  green:  { border: "#22c55e", bg: "#f0fdf4", text: "#15803d", muted: "#86efac" },
  yellow: { border: "#eab308", bg: "#fefce8", text: "#a16207", muted: "#fde047" },
  purple: { border: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9", muted: "#c4b5fd" },
};

/**
 * Props:
 *   title   – label shown above the value
 *   value   – primary metric (string | number)
 *   sub     – secondary line below value (optional)
 *   badge   – small pill text top-right (optional)
 *   trend   – { label, up } — directional hint (optional)
 *   color   – blue | red | green | yellow | purple
 *   icon    – React node rendered left of value (optional)
 */
export default function KpiCard({
  title,
  value,
  sub,
  badge,
  trend,
  color = "blue",
  icon,
}) {
  const p = PALETTE[color] ?? PALETTE.blue;

  return (
    <div
      style={{
        borderLeft: `4px solid ${p.border}`,
        background: p.bg,
        borderRadius: 12,
        padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(0,0,0,.08)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        position: "relative",
        minWidth: 0,
      }}
    >
      {badge && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            fontSize: 10,
            fontWeight: 700,
            background: p.border,
            color: "#fff",
            borderRadius: 999,
            padding: "2px 8px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {badge}
        </span>
      )}

      <p style={{ fontSize: 12, fontWeight: 600, color: p.text, opacity: 0.75, margin: 0 }}>
        {title}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
        <p style={{ fontSize: 28, fontWeight: 800, color: p.text, margin: 0, lineHeight: 1.1 }}>
          {value}
        </p>
      </div>

      {sub && (
        <p style={{ fontSize: 11, color: p.text, opacity: 0.6, margin: 0 }}>{sub}</p>
      )}

      {trend && (
        <p style={{ fontSize: 11, fontWeight: 600, color: trend.up ? "#15803d" : "#b91c1c", margin: 0 }}>
          {trend.up ? "▲" : "▼"} {trend.label}
        </p>
      )}
    </div>
  );
}
