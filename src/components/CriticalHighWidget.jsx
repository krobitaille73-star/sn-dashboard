const LEVELS = [
  {
    key: "1 - Critical",
    label: "Critical",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: "🔴",
  },
  {
    key: "2 - High",
    label: "High",
    color: "#f97316",
    bg: "#fff7ed",
    border: "#fed7aa",
    icon: "🟠",
  },
];

export default function CriticalHighWidget({ incidents }) {
  const total = incidents.length || 1;

  const counts = LEVELS.map((l) => ({
    ...l,
    count: incidents.filter((i) => i.priority === l.key).length,
  }));

  const combined = counts.reduce((s, l) => s + l.count, 0);
  const combinedPct = ((combined / total) * 100).toFixed(2);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,.08)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>
          Critical &amp; High Tickets
        </p>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: combined > 0 ? "#fef2f2" : "#f0fdf4",
            color: combined > 0 ? "#b91c1c" : "#15803d",
            border: `1px solid ${combined > 0 ? "#fecaca" : "#86efac"}`,
            borderRadius: 999,
            padding: "2px 10px",
          }}
        >
          {combined} total · {combinedPct}% of all tickets
        </span>
      </div>

      {counts.map((l) => {
        const pct = ((l.count / total) * 100).toFixed(2);
        const barWidth = total > 0 ? Math.max((l.count / total) * 100, l.count > 0 ? 4 : 0) : 0;

        return (
          <div
            key={l.key}
            style={{
              background: l.bg,
              border: `1px solid ${l.border}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: l.color }}>
                {l.icon} {l.label}
              </span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: l.color, lineHeight: 1 }}>
                  {l.count}
                </span>
                <span style={{ fontSize: 11, color: l.color, opacity: 0.7, marginLeft: 4 }}>
                  tickets
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: "rgba(0,0,0,.06)", borderRadius: 999, height: 6, overflow: "hidden" }}>
              <div
                style={{
                  width: `${barWidth}%`,
                  height: "100%",
                  background: l.color,
                  borderRadius: 999,
                  transition: "width .4s ease",
                }}
              />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 10, color: l.color, opacity: 0.7 }}>
              {pct}% of {total.toLocaleString()} total incidents
            </p>
          </div>
        );
      })}
    </div>
  );
}
