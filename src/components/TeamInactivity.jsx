import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, avgDays, count } = payload[0].payload;
  return (
    <div style={{ background: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: "8px 12px", fontSize: 12, maxWidth: 260 }}>
      <strong style={{ display: "block", marginBottom: 4 }}>{name}</strong>
      Avg inactivity: <strong>{avgDays.toFixed(1)} days</strong><br />
      Tickets in group: {count}
    </div>
  );
}

function colorForDays(days) {
  if (days > 30) return "#ef4444";
  if (days > 14) return "#f97316";
  if (days > 7)  return "#eab308";
  return "#22c55e";
}

export default function TeamInactivity({ data }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#374151" }}>
        Teams — Avg Days Without Action
      </p>
      <p style={{ margin: "0 0 8px", fontSize: 11, color: "#9ca3af" }}>
        Avg days between last ticket update and the dataset end date, per assignment group (min. 5 tickets)
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        {[
          { label: "> 30 days", color: "#ef4444" },
          { label: "14–30 days", color: "#f97316" },
          { label: "7–14 days", color: "#eab308" },
          { label: "< 7 days", color: "#22c55e" },
        ].map((l) => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: "inline-block" }} />
            {l.label}
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" unit=" d" tick={{ fontSize: 11 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10 }}
            width={190}
            tickFormatter={(v) => v.length > 28 ? v.slice(0, 28) + "…" : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={colorForDays(entry.avgDays)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
