/**
 * SlowGroupsWidget
 * For each assignment group: average resolve time of tickets > 15 days,
 * the count of such tickets, and the worst (max) case.
 */

const THRESHOLD_DAYS = 15;

// Colour scale: green → yellow → orange → red based on avgDays
function accentColor(avgDays) {
  if (avgDays < 20) return { color: "#15803d", bg: "#f0fdf4", border: "#86efac" };
  if (avgDays < 30) return { color: "#b45309", bg: "#fffbeb", border: "#fde68a" };
  if (avgDays < 60) return { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" };
  return { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
}

export default function SlowGroupsWidget({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>
          Avg Resolve Time &gt; {THRESHOLD_DAYS} days — by Assignment Group
        </p>
        <p style={{ margin: "16px 0", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>
          No groups have tickets exceeding {THRESHOLD_DAYS} days.
        </p>
      </div>
    );
  }

  // Global max avgDays for relative bar width
  const maxAvg = data[0].avgDays;

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Avg Resolve Time &gt; {THRESHOLD_DAYS} days — by Assignment Group
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
            {data.length} group{data.length !== 1 ? "s" : ""} · SLA business-hours · sorted by avg days desc
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 10px",
          background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca",
        }}>
          {data.reduce((s, g) => s + g.count, 0).toLocaleString()} slow tickets total
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((g) => {
          const { color, bg, border } = accentColor(g.avgDays);
          const barPct = (g.avgDays / maxAvg) * 100;

          return (
            <div key={g.name} style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 8,
              padding: "10px 12px",
            }}>
              {/* Group name + counts */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}
                      title={g.name}>
                  {g.name}
                </span>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    <strong style={{ color }}>{g.count.toLocaleString()}</strong> tickets
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    max <strong style={{ color }}>{g.maxDays.toFixed(1)}d</strong>
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 800, color,
                    background: "rgba(255,255,255,.6)", borderRadius: 6,
                    padding: "1px 8px", border: `1px solid ${border}`,
                  }}>
                    {g.avgDays.toFixed(1)}d avg
                  </span>
                </div>
              </div>

              {/* Progress bar relative to worst group */}
              <div style={{ background: "rgba(0,0,0,.06)", borderRadius: 999, height: 5, overflow: "hidden" }}>
                <div style={{
                  width: `${barPct}%`,
                  height: "100%",
                  background: color,
                  borderRadius: 999,
                  transition: "width .4s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
